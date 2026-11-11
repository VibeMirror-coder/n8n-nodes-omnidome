# x402 payment response-loss: synthetic, buyer-readable evidence

This public, **fully synthetic** test case models a buyer that signs an EIP-3009 USDC authorization on Base and waits 30 seconds for an x402 paid tool result. The network request times out and no transaction hash, response headers or seller receipt are available. It is designed for independent agent integrations and does not contain a real wallet or signature.

- Fixture: [x402-buyer-timeout.synthetic.json](x402-buyer-timeout.synthetic.json)
- Scenario: a buyer only knows **payer, nonce, network, asset, amount, payTo, validity window, URL and HTTP method**.
- Status: `settlement = UNKNOWN`; `delivery = UNKNOWN`; no retry is automatically authorized.
- An authorization nonce being used can help establish that the authorization was consumed; it is not independent evidence that the intended result was delivered.
- **HumanMirror's free Payment Rescue is advisory only.** HumanMirror does not currently guarantee result retrieval by payer + nonce, nor an idempotent replay of a used payment. Do not advertise either behavior as deployed.
- For a pre-execution risk advisory, the distinct Safe Preflight x402 route is `POST https://humanmirror.fr/api/x402/safe-preflight/`, advertised at **0.010 USDC** on Base. The buyer must separately authorize any purchase.

This example can be used by builders of n8n, LangChain, CrewAI, Base/USDC or x402 routers to compare their own recovery contracts without requiring a paid test or access to a private HumanMirror issue.

[HumanMirror integration options](https://humanmirror.fr/agent-reliability/) · [Public machine catalog](https://humanmirror.fr/.well-known/omnidome-integrations.json)
