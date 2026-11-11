# Use OmniDome in your existing agent framework

**These are HTTP integrations and examples, not claims of official marketplace approval.** The same stable HTTPS endpoints can be invoked from Python, Node.js, Flowise HTTP tools, LangChain tools, CrewAI tools, Make HTTP modules and Zapier Webhooks.

## Local test, no payment required

From the root of this repository, run:

    node --test tests/x402-client.test.mjs

Then run the free, live advisory:

    node --input-type=module -e "import {callOmniDome} from './examples/omnidome-x402-client.mjs'; console.log(await callOmniDome({operation:'recover',body:{stage:'response_lost'}}))"

This second command does **not** make a payment and returns advisory data only.

## Python / LangChain / CrewAI / Flowise

A framework HTTP client can call Payment Rescue directly:

    import requests
    response = requests.post(
        "https://humanmirror.fr/api/payment-rescue/",
        json={"stage": "response_lost"},
        timeout=15,
    )
    response.raise_for_status()
    result = response.json()
    assert result["status"] == "ADVISORY_ONLY"

For a paid check, POST a JSON object to https://humanmirror.fr/api/x402/safe-preflight/ (Safe Preflight) or https://humanmirror.fr/api/x402/clean-json/ (Clean JSON). The first request without payment authorization returns HTTP 402 and live payment terms. A buyer must approve and authorize the exact transaction; never insert an unapproved wallet signature or repeat an uncertain settlement.

## Make and Zapier

In an HTTP request or Webhooks module, configure:

- Method: POST
- URL: https://humanmirror.fr/api/payment-rescue/
- Content-Type: application/json
- Body: {"stage":"response_lost"}
- Expect: 200 with status ADVISORY_ONLY, not a proof of settlement

These instructions do **not** constitute a native Make or Zapier integration.

## Self-hosted n8n

Install the published npm package `@humanmirror/n8n-nodes-omnidome` under Settings → Community Nodes. Cloud installation requires independent n8n verification, not merely npm provenance.

## Pricing and conversion

**Free first:** https://humanmirror.fr/api/payment-rescue/ provides payment-failure triage without authorizing another payment.

**Machine payments:** Safe Preflight and Clean JSON each advertise **0.010 USDC per call on Base**. Read the real HTTP 402 challenge before authorizing a purchase. The client helper deliberately does not sign or transfer funds itself.

**B2B purchase:** €299 Agent Safety Audit: https://buy.stripe.com/aFafZabHu2p52TM6SI6J20e ; €990 14-day Production Pilot: https://buy.stripe.com/00wfZa5j64xd65Y7WM6J20g . Both were verified as active live Stripe Payment Links. The buyer must agree scope, outputs and acceptance criteria before purchase.

**API schema:** https://humanmirror.fr/x402/openapi.json

**Source code and troubleshooting:** https://github.com/VibeMirror-coder/n8n-nodes-omnidome/blob/main/docs/INCIDENT_PLAYBOOK.md

Never count a challenge, HTTP 200 response, synthetic fixture or site visit as a paying customer. Count real settlement and delivery separately.
