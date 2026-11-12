# HumanMirror × Wever Pay — zero-wallet benchmark protocol

**Status:** proposed to David Wever on 12 November 2026; no claim of joint execution or partnership. This is a public, vendor-neutral, synthetic test protocol. It requires neither a wallet nor customer information.

## Candidate flow and contract

| Boundary | Synthetic input | Observable output |
| --- | --- | --- |
| Buyer intent | `{ "intent_id": "wever-demo-001", "action": "purchase_api_result", "amount_atomic": "50000", "network": "eip155:84532" }` | A stable intent ID and explicit seller quote. This is an example payload, not Wever Pay's actual schema. |
| Safety preflight | A proposed tool call, its side effects, recipient and budget envelope | Advisory risk signal only; do not interpret `ALLOW` as payment approval or actual settlement. |
| Buyer-approved payment | Two **simulated** transfers: provider 50,000 atomic units; fee 10,000 | Synthetic recorded settlement identities; **zero** live transfers |
| Business-result commit | Deterministic verdict, request digest, buyer Ed25519 fingerprint | Persisted result and hash, no acknowledged delivery |
| Network fault | Drop the HTTP response **after** storing the result | Buyer sees a timeout but no second authorization |
| Authenticated recovery | Original buyer signs a fresh nonce and intent-bound challenge | Original verdict with byte-identical SHA-256; another buyer denied |
| Buyer acknowledgement | Signed acknowledgement of result digest | Final `SETTLED_AND_DELIVERED` state and verifiable Ed25519 receipt |

## Run the reproducible HTTP fixture

Requires Node.js 22+:

```sh
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-http-demo.mjs | node --input-type=module
```

This runs an HTTP server on loopback and performs the synthetic steps without external blockchain requests. Review the [source code](../examples/ghost-clearing-http-demo.mjs) first.

## Operational boundaries

- Free live advisory: `POST https://humanmirror.fr/api/payment-rescue/` with `{"stage":"response_lost"}`. It does not recover paid output or certify blockchain settlement.
- Optional paid pre-action check: `POST https://humanmirror.fr/api/x402/safe-preflight/` with operator approval; live HTTP 402 challenge controls current price. **Do not call or fund it during this first synthetic benchmark.**
- Ghost-Clearing signed-payment recovery remains an isolated staging prototype. This fixture does not assert that any partner has implemented its interfaces.
- Wever Pay's actual field mappings, callbacks and authorization semantics are **unknown** until supplied by its maintainers.
- Acceptance: single simulated provider settlement, single simulated fee, one business execution, original result unchanged after recovery, no duplicate debit, no cross-buyer access, signed buyer receipt acknowledgement.
- Do not create a test wallet, replay an existing signed authorization, publish private keys, or treat any demonstration output as revenue.

## Compatibility response sought from partner

A redacted or synthetic checkout request/response schema with: buyer intent ID, authorization/settlement identifier, stable order ID, callback or polling model, failure states, and any signature binding. HumanMirror can then produce a field-by-field compatibility matrix with no funding.
