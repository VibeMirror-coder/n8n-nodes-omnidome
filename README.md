# @humanmirror/n8n-nodes-omnidome

Community node for **OmniDome by HumanMirror**, operating on the existing public production routes. Version **0.1.3** is published on npm with GitHub Actions provenance and has passed the @n8n/scan-community-package security checks. Formal n8n Cloud verification is still pending. The proprietary HumanMirror/OmniDome services remain private.

## Start here — two free Ghost-Clearing tests, no wallet required

For developers building **CrewAI, LangGraph, n8n or x402 agents**: test what happens when a buyer's paid API response disappears. Both examples run locally with Node.js 22+ and simulate transactions. **Zero real funds, zero production access, no customer data.**

**1. Ed25519 recovery and duplicate-payment protection (local state machine)**

```bash
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-no-funds.mjs | node --input-type=module
```

**2. Real localhost HTTP cut-after-commit, recovery and signed delivery acknowledgement**

```bash
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-http-demo.mjs | node --input-type=module
```

**Production routes you can use today:** `Safe Preflight` — `POST https://humanmirror.fr/api/x402/safe-preflight/` (x402 0.010 USDC on Base; inspect 402, pay only with buyer authorization); `Payment Rescue` — `POST https://humanmirror.fr/api/payment-rescue/` with `{"stage":"response_lost"}` (free advice, **not** proof of settlement or paid-result delivery). The OmniDome n8n community node exposes Safe Preflight, Clean JSON and advisory Recover; the Ghost-Clearing examples are **separate synthetic tests**, not a deployed node operation.

Strict synthetic interoperability shape: [Ghost-Clearing HTTP lab JSON Schema and example](examples/ghost-clearing-http-lab-contract.schema.json). This documents the fixture; the current script takes no external request body.

**Integrating into a real agent?** Read [framework integration examples](examples/README.md), then [share a redacted timeout trace or request a no-cost interoperability pilot](https://github.com/VibeMirror-coder/n8n-nodes-omnidome/issues/1). No automatic payments, promotional claims of customer adoption, or surprise wallet operations.

## Operations

| Node action | Production endpoint | Payment |
| --- | --- | --- |
| Clean JSON | `POST https://humanmirror.fr/api/x402/clean-json/` | Canonical 0.010 USDC on Base; inspect live HTTP 402 |
| Safe Preflight | `POST https://humanmirror.fr/api/x402/safe-preflight/` | Canonical 0.010 USDC on Base; inspect live HTTP 402 |
| Recover | `POST https://humanmirror.fr/api/payment-rescue/` | Free advisory diagnosis, NOT recovery of a settled payment or delivered result |

**Quick start:** Select an operation, supply JSON, run. For paid operations, the first call without an authorization returns the live 402 challenge as an item (without spending). After a human or policy wallet explicitly authorizes that precise request, a one-time `PAYMENT-SIGNATURE` header can be supplied by a trusted expression, without embedding wallet seeds. Never reuse a signature for an unrelated request. The n8n workflow must not interpret a 402 response as a completed action.

Example Safe Preflight intent: `{"action":{"text":"Synthetic agent proposes to change a payment beneficiary."}}`. Recover advisory input: `{"stage":"response_lost"}`. If settlement/delivery is uncertain, **do not re-sign** or automatically retry a paid action. Clean JSON accepts a JSON object body; use the live OpenAPI definition to match any resource-specific schema.

Install in self-hosted n8n by entering `@humanmirror/n8n-nodes-omnidome` in Settings → Community Nodes. n8n Cloud availability requires separate n8n community-node verification; publication to npm alone does not grant Cloud access.

## Integrate a safe payment path into an agent workflow

1. **Before any consequential tool call:** use `Safe Preflight` in the published OmniDome n8n node or inspect its x402 HTTP 402 challenge first. A successful paid call gives an **advisory risk/confirmation signal only**; the operator must still approve the actual downstream action.
2. **If an API response disappears:** select the node's `Recover` operation, which calls the **free Payment Rescue advisory** with `{"stage":"response_lost"}`. Do **not** blindly repeat a signed payment or interpret the advisory as a recovered business result.
3. **To reproduce the failure safely:** execute the [Ghost-Clearing HTTP no-funds lab](examples/ghost-clearing-http-demo.mjs). It tests an Ed25519 buyer, interrupted response, recovered original verdict, signed delivery acknowledgement and rejection of duplicate synthetic settlement. It is a **standalone developer simulation**, not an additional n8n node operation or an active production clearing endpoint.

Machine-readable integration capabilities: https://humanmirror.fr/.well-known/omnidome-integrations.json · Scoped usage examples: [examples/README.md](examples/README.md) · [Live HTTP 402 challenge](https://humanmirror.fr/api/x402/safe-preflight/) (not a payment) · [Free Payment Rescue](https://humanmirror.fr/api/payment-rescue/) (POST).

## Universal machine and developer distribution pack

The public [OmniDome agent share pack](examples/omnidome-agent-share-pack.json) is a single JSON document containing live MCP and AgentBazaar entrypoints, optional x402 routes with current advertised pricing, Stripe B2B offers, free reproducible labs, and Python / JavaScript / n8n adapters. Agents may use it for opt-in integration and contextual developer support; it does not install hooks, post unsolicited messages or initiate payments.

## Ghost-Clearing: free, executable recovery self-test

The first public Ghost-Clearing exercise simulates a lost API response after a **synthetic** settlement, then verifies buyer-key-bound Ed25519 recovery, nonce replay protection and no second simulated debit. Requires Node.js 22+; **no wallet, funds, API key or live transaction**:

```bash
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-no-funds.mjs | node --input-type=module
```

Read the [source before executing](examples/ghost-clearing-no-funds.mjs); the script makes no network requests. It is a local interoperability demo rather than the production Ghost-Clearing API. The separate private-branch PostgreSQL and chaos CI evidence is [here](https://github.com/VibeMirror-coder/humanmirror/actions/runs/43210827286). [Report results or ask questions in the public lab](https://github.com/VibeMirror-coder/n8n-nodes-omnidome/issues/1).

## HTTP end-to-end recovery lab — no wallet needed

Run an actual loopback HTTP server and client using Node.js 22+, inject a network disconnect **after storing** a synthetic verdict, then recover the exact bytes using an Ed25519 buyer key. The test independently simulates a 0.050 USDC provider transfer and a 0.010 USDC service fee, signs a final receipt only after the buyer acknowledges delivery and rejects another buyer and duplicate payment. **No network blockchain transfers, no charge, no secrets, no API calls to HumanMirror**.

```bash
curl -fsSL https://raw.githubusercontent.com/VibeMirror-coder/n8n-nodes-omnidome/main/examples/ghost-clearing-http-demo.mjs | node --input-type=module
```

Review [the HTTP lab source](examples/ghost-clearing-http-demo.mjs) before running. For an external client, [post redacted results in the public interoperability thread](https://github.com/VibeMirror-coder/n8n-nodes-omnidome/issues/1). For a genuine paid workflow, use the existing published OmniDome x402 endpoints; **Ghost-Clearing remains an isolated staging prototype and is not an active payment recovery guarantee**.

## Live developer interoperability clinics

HumanMirror maintains two public, self-serve discussion threads with reproducible exercises and optional routes to the paid APIs:
- [x402 response-loss, payment challenge vs settlement/delivery lab](https://github.com/VibeMirror-coder/n8n-nodes-omnidome/issues/1) — free unsigned HTTP 402 probe, synthetic EIP-3009 timeout fixture and client interoperability reports.
- [JSONDecodeError in n8n / MCP / AI agents](https://github.com/VibeMirror-coder/n8n-nodes-omnidome/issues/2) — runnable local malformed-JSON examples and redacted debugging questions.

Both are free to participate in. A paid API call requires separate buyer-authorized x402 payment at the live challenge price.

## Incident troubleshooting

For opt-in examples of JSON parse errors, webhook timeouts, safe payment recovery, and preflight integration, see [Incident-to-fix playbook](docs/INCIDENT_PLAYBOOK.md). This is a self-serve troubleshooting reference, not a claim of verified execution in another project's production environment.

## Development

```sh
npm install
npm run check
```

No runtime dependencies. Release versions are published via GitHub Actions using npm OIDC Trusted Publisher, with provenance. This MIT-licensed package contains only the client-side connector; backend, APIs and payment infrastructure are proprietary and not part of this repository. No existing HumanMirror pricing, Stripe checkout or x402 settlement integration is replaced by this package.


## Start using OmniDome

- [Try free payment-recovery guidance](https://humanmirror.fr/api/payment-rescue/) (POST with a JSON body; advisory only)
- [Review the live Safe Preflight payment challenge](https://humanmirror.fr/api/x402/safe-preflight/) (POST, advertised 0.010 USDC on Base)
- [Book the €299 Agent Safety Audit](https://buy.stripe.com/aFafZabHu2p52TM6SI6J20e) (live Stripe Payment Link)
- [Purchase the €990 14-day Production Pilot](https://buy.stripe.com/00wfZa5j64xd65Y7WM6J20g) (live Stripe Payment Link)
- [Integrate with LangChain, CrewAI, Flowise, Make or Zapier using HTTP](examples/README.md)

Stripe orders are separate from x402 calls and must never cause duplicate charging for the same operation. No node automatically funds a wallet or authorizes a payment.

## Support

https://humanmirror.fr/omnidome/start/ · contact.humanmirror@gmail.com
