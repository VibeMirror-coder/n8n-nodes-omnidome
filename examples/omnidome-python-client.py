"""OmniDome discovery, free recovery, and inspect-only x402 adapter.

Standard-library Python 3.9+. No package installation, wallet, payment signing,
telemetry, or network traffic until the caller invokes a function.
"""
import json
import urllib.error
import urllib.request
from urllib.parse import urlparse

CATALOG_URL = "https://humanmirror.fr/.well-known/omnidome-integrations.json"
ALLOWED_HOST = "humanmirror.fr"


def _request(url, method="GET", data=None, timeout=15):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != ALLOWED_HOST:
        raise ValueError("Unsupported or untrusted OmniDome endpoint")
    headers = {"Accept": "application/json", "User-Agent": "OmniDome-Python-Example/1"}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data, separators=(",", ":")).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return {"status": response.status, "headers": dict(response.headers), "body": response.read(65536).decode("utf-8", "replace")}
    except urllib.error.HTTPError as error:
        return {"status": error.code, "headers": dict(error.headers), "body": error.read(65536).decode("utf-8", "replace")}


def discover():
    result = _request(CATALOG_URL)
    if result["status"] != 200:
        raise RuntimeError("OmniDome catalog unavailable")
    catalog = json.loads(result["body"])
    if catalog.get("publisher") != "HumanMirror" or not isinstance(catalog.get("capabilities"), list):
        raise ValueError("Invalid capability catalog")
    return catalog


def inspect(capability_id="safe_preflight", payload=None):
    catalog = discover()
    cap = next((item for item in catalog["capabilities"] if item.get("id") == capability_id), None)
    if not cap or cap.get("kind") != "x402" or cap.get("method") != "POST":
        raise ValueError("Unknown or non-x402 capability")
    result = _request(cap["endpoint"], method="POST", data=payload or {})
    return {"http_status": result["status"],
            "payment_required": result["status"] == 402,
            "payment_required_header": result["headers"].get("Payment-Required"),
            "price_hint": cap.get("price"),
            "settlement": "NOT_VERIFIED",
            "delivery": "NOT_DELIVERED" if result["status"] == 402 else "UNKNOWN",
            "purchase_authorized": False,
            "response": result["body"][:2500]}


def recover(stage="response_lost"):
    catalog = discover()
    cap = next((item for item in catalog["capabilities"] if item.get("id") == "recover"), None)
    if not cap or cap.get("kind") != "free_advisory":
        raise ValueError("Free advisory endpoint not listed")
    result = _request(cap["endpoint"], method="POST", data={"stage": stage})
    return {"http_status": result["status"], "body": result["body"][:10000],
            "settlement": "NOT_VERIFIED", "delivery": "NOT_VERIFIED"}


if __name__ == "__main__":
    print(json.dumps({"catalog": CATALOG_URL, "message": "Import and invoke discover(), inspect() or recover() explicitly; no network calls made."}))
