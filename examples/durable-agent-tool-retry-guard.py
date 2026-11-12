#!/usr/bin/env python3
"""No-wallet durable tool-call replay guard for CrewAI/LangGraph-style wrappers.

Uses SQLite (Python stdlib) to persist logical operation state before side effects.
Demonstration only. In production, the external provider must also support
idempotency or read-only reconciliation: this guard cannot enforce exactly-once
across disconnected services or prove an x402 settlement.
"""
import hashlib
import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


class UncertainOutcome(RuntimeError):
    pass


class DurableToolGuard:
    def __init__(self, db_path):
        self.db_path = str(db_path)
        with self._connect() as db:
            db.execute("""CREATE TABLE IF NOT EXISTS tool_operations (
                operation_id TEXT PRIMARY KEY,
                request_sha256 TEXT NOT NULL,
                state TEXT NOT NULL CHECK(state IN ('CLAIMED','COMMITTED','UNKNOWN')),
                response_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""")

    def _connect(self):
        connection = sqlite3.connect(self.db_path, isolation_level=None, timeout=5)
        connection.execute("PRAGMA busy_timeout=5000")
        return connection

    def execute(self, operation_id, input_payload, external_action):
        if not isinstance(operation_id, str) or not 8 <= len(operation_id) <= 120:
            raise ValueError("A stable, nonsecret logical operation ID is required")
        request_sha = digest(input_payload)
        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT request_sha256,state,response_json FROM tool_operations WHERE operation_id=?",
                (operation_id,),
            ).fetchone()
            if row:
                old_sha, state, response_json = row
                if old_sha != request_sha:
                    db.execute("ROLLBACK")
                    raise ValueError("Operation ID reused with different arguments")
                if state == "COMMITTED":
                    db.execute("COMMIT")
                    return json.loads(response_json)
                db.execute("COMMIT")
                raise UncertainOutcome("Original operation unresolved: reconcile with provider; never charge again blindly")
            db.execute(
                "INSERT INTO tool_operations(operation_id,request_sha256,state) VALUES(?,?,'CLAIMED')",
                (operation_id,request_sha),
            )
            db.execute("COMMIT")

        try:
            result = external_action(operation_id, input_payload)
        except Exception as exc:
            with self._connect() as db:
                db.execute("UPDATE tool_operations SET state='UNKNOWN' WHERE operation_id=? AND state='CLAIMED'",
                           (operation_id,))
            raise UncertainOutcome("External action may have committed; do not retry automatically") from exc

        with self._connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                "UPDATE tool_operations SET state='COMMITTED',response_json=? WHERE operation_id=? AND state='CLAIMED'",
                (canonical(result),operation_id),
            )
            db.execute("COMMIT")
        return result


def exercise():
    with tempfile.TemporaryDirectory(prefix="humanmirror-no-funds-") as temp:
        guard = DurableToolGuard(Path(temp) / "operations.sqlite")
        counters = {"simulated_external_calls": 0}
        def provider(operation_id, payload):
            counters["simulated_external_calls"] += 1
            return {"operation_id": operation_id, "result": "SIMULATED_OK", "input_sha256": digest(payload)}
        args = {"tool": "synthetic_agent_purchase", "amount": "0.010", "currency": "USDC"}
        first = guard.execute("logical-tool-call-001", args, provider)
        restarted = DurableToolGuard(Path(temp) / "operations.sqlite")
        replayed = restarted.execute("logical-tool-call-001", args, provider)
        assert replayed == first and counters["simulated_external_calls"] == 1
        mismatch_blocked = False
        try:
            restarted.execute("logical-tool-call-001", {**args,"amount": "2.00"}, provider)
        except ValueError:
            mismatch_blocked = True
        assert mismatch_blocked
        def lost_response(_operation_id, _payload):
            counters["simulated_external_calls"] += 1
            raise TimeoutError("Response disappeared after unknown external state")
        unknown_blocked = False
        try:
            restarted.execute("logical-tool-call-002", args, lost_response)
        except UncertainOutcome:
            try:
                restarted.execute("logical-tool-call-002", args, provider)
            except UncertainOutcome:
                unknown_blocked = True
        assert unknown_blocked
        assert counters["simulated_external_calls"] == 2
        return {"mode": "NO_FUNDS_SQLITE", "sqlite_durable_guard": "PASS",
                "cached_result_on_restart": "PASS", "mismatched_arguments_rejected": "PASS",
                "unknown_after_timeout_stops_retry": "PASS", "simulated_external_calls": 2,
                "real_payments": 0, "caveat": "Requires provider-side idempotency/reconciliation for real exactly-once settlement"}


if __name__ == "__main__":
    print(json.dumps(exercise(), indent=2))
