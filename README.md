# @humanmirror/n8n-nodes-omnidome

Community node for **OmniDome by HumanMirror**, operating on the existing public production routes. Version **0.1.0 is published on npm**. Version 0.1.1 is prepared for release; check the npm registry for the current published version. The proprietary HumanMirror/OmniDome services remain private.

## Operations

| Node action | Production endpoint | Payment |
| --- | --- | --- |
| Clean JSON | `POST https://humanmirror.fr/api/x402/clean-json/` | Canonical 0.010 USDC on Base; inspect live HTTP 402 |
| Safe Preflight | `POST https://humanmirror.fr/api/x402/safe-preflight/` | Canonical 0.010 USDC on Base; inspect live HTTP 402 |
| Recover | `POST https://humanmirror.fr/api/payment-rescue/` | Free advisory diagnosis, NOT recovery of a settled payment or delivered result |

**Quick start:** Select an operation, supply JSON, run. For paid operations, the first call without an authorization returns the live 402 challenge as an item (without spending). After a human or policy wallet explicitly authorizes that precise request, a one-time `PAYMENT-SIGNATURE` header can be supplied by a trusted expression, without embedding wallet seeds. Never reuse a signature for an unrelated request. The n8n workflow must not interpret a 402 response as a completed action.

Example Safe Preflight intent: `{"action":{"text":"Synthetic agent proposes to change a payment beneficiary."}}`. Recover advisory input: `{"stage":"response_lost"}`. If settlement/delivery is uncertain, **do not re-sign** or automatically retry a paid action. Clean JSON accepts a JSON object body; use the live OpenAPI definition to match any resource-specific schema.

Install in self-hosted n8n by entering `@humanmirror/n8n-nodes-omnidome` in Settings → Community Nodes. n8n Cloud availability requires separate n8n community-node verification; publication to npm alone does not grant Cloud access.

## Development

```sh
npm install
npm run check
```

No runtime dependencies. Release versions are published via GitHub Actions using npm OIDC Trusted Publisher, with provenance. This MIT-licensed package contains only the client-side connector; backend, APIs and payment infrastructure are proprietary and not part of this repository. No existing HumanMirror pricing, Stripe checkout or x402 settlement integration is replaced by this package.

## Support

https://humanmirror.fr/omnidome/start/ · contact.humanmirror@gmail.com
