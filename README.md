# @humanmirror/n8n-nodes-omnidome

Community node for **OmniDome by HumanMirror**, operating on the existing public production routes. Version **0.1.3** is published on npm with GitHub Actions provenance and has passed the @n8n/scan-community-package security checks. Formal n8n Cloud verification is still pending. The proprietary HumanMirror/OmniDome services remain private.

## Operations

| Node action | Production endpoint | Payment |
| --- | --- | --- |
| Clean JSON | `POST https://humanmirror.fr/api/x402/clean-json/` | Canonical 0.010 USDC on Base; inspect live HTTP 402 |
| Safe Preflight | `POST https://humanmirror.fr/api/x402/safe-preflight/` | Canonical 0.010 USDC on Base; inspect live HTTP 402 |
| Recover | `POST https://humanmirror.fr/api/payment-rescue/` | Free advisory diagnosis, NOT recovery of a settled payment or delivered result |

**Quick start:** Select an operation, supply JSON, run. For paid operations, the first call without an authorization returns the live 402 challenge as an item (without spending). After a human or policy wallet explicitly authorizes that precise request, a one-time `PAYMENT-SIGNATURE` header can be supplied by a trusted expression, without embedding wallet seeds. Never reuse a signature for an unrelated request. The n8n workflow must not interpret a 402 response as a completed action.

Example Safe Preflight intent: `{"action":{"text":"Synthetic agent proposes to change a payment beneficiary."}}`. Recover advisory input: `{"stage":"response_lost"}`. If settlement/delivery is uncertain, **do not re-sign** or automatically retry a paid action. Clean JSON accepts a JSON object body; use the live OpenAPI definition to match any resource-specific schema.

Install in self-hosted n8n by entering `@humanmirror/n8n-nodes-omnidome` in Settings → Community Nodes. n8n Cloud availability requires separate n8n community-node verification; publication to npm alone does not grant Cloud access.

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
