# Ghost-Clearing — 3 targeted interoperability contacts (12 Nov 2026)

The purpose of each contact is an **optional, no-wallet, no-cost technical compatibility check**, not unsolicited commercial saturation or a claim of verified production clearing. Do not create fake transactions or paid tests.

## 1. LangGraph: yifanxiong272 — SENT

- Source: https://github.com/langchain-ai/langgraph/issues/9397
- Published contribution: https://github.com/langchain-ai/langgraph/issues/9397#issuecomment-6824378199
- Specific problem: with `durability="exit"`, a completed sibling node can be run again after a later resume.
- Proposed comparison: wrap a paid-side-effect boundary with persisted-result replay and verify that the original business result is retrieved instead of triggering another paid action. No claim that Ghost-Clearing fixes LangGraph upstream durability.

## 2. x402: igor-vii — READY, GitHub integration permission denied

- Source: https://github.com/x402-foundation/x402/issues/4198
- Specific problem: two simultaneous identical offers sign twice before either attempt completes, even if ordinary post-timeout reconciliation is implemented.
- Status: **NOT POSTED** — direct GitHub comment attempt returned HTTP 403 Resource not accessible by integration.

### Message ready to post

The simultaneous-identical-offer race is an important distinction from HTTP retry-after-timeout. We reproduced a related *post-settlement response loss* with an external buyer and built a **no-wallet HTTP fixture** for buyer-bound original-result recovery.

One extra case for your A10a/A10b battery: after a single intent is successfully paid but its business response is lost, can the same buyer recover the identical stored verdict without another EIP-3009 authorization? The final receipt should claim delivery only after buyer acknowledgement. This is complementary to caller-supplied idempotency keys; it does not replace the pre-signer lock you propose.

Run Node.js 22+ (local simulation; zero funds):
```sh
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-http-demo.mjs | node --input-type=module
```

Would your existing A10a/A10b fixture accept one more application-level test for exact result recovery? Happy to compare redacted request contracts without paid calls. This demo is **not** a live x402 settlement guarantee.

## 3. x402: nirajvora — READY, GitHub integration permission denied

- Source: https://github.com/x402-foundation/x402/pull/4094
- Specific problem: wrapped fetch should hold the signed authorization and reconcile before another signature after timeout, 5xx, or 402.
- Status: **NOT POSTED** — direct GitHub comment attempt returned HTTP 403 Resource not accessible by integration.

### Message ready to post

Your `@x402/fetch` hold/reconcile patch addresses an ambiguous **payment retry**. An orthogonal problem is the business response lost *after* settlement.

We published a standalone HTTP fixture that persists a synthetic business result, drops the response, authenticates the original buyer by Ed25519 and a fresh nonce, returns the identical result, then signs a delivery receipt only after buyer acknowledgement. It cannot replace the client-side EIP-3009 nonce reconciliation you implemented.

Run Node.js 22+ with no wallet or funds:
```sh
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-http-demo.mjs | node --input-type=module
```

Would a read-only compatibility matrix mapping your `PaymentOutcomeUnknownError` to application-level `RESULT_PERSISTED` / `NEEDS_REMEDY` be useful? No production charging or buyer credentials required.

---

Production Safe Preflight: https://humanmirror.fr/api/x402/safe-preflight/ (explicitly authorized 0.010 USDC on Base). Free Payment Rescue: https://humanmirror.fr/api/payment-rescue/ (`POST {"stage":"response_lost"}`; advisory only). The Ghost-Clearing fixture uses **zero** real blockchain transactions, and PR #871 remains draft.
