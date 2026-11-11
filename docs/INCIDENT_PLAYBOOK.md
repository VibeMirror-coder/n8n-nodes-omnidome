# OmniDome: incident-to-fix playbook

This public guide is available for **opt-in** help requests about failing AI-agent workflows. It is not permission to install packages into third-party repositories, contact strangers in bulk, or make payments without authorization.

## 1. JSONDecodeError / invalid agent JSON

First separate invalid JSON syntax from schema-validation failures. Avoid running model-produced strings through `eval`, `Function`, or unsafe code execution.

```js
function parseAgentOutput(raw) {
  if (typeof raw !== 'string') return { ok: false, reason: 'not_a_string' };
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, reason: 'expected_object' };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, reason: 'invalid_json_syntax', detail: String(error.message) };
  }
}
```

If deterministic parsing is insufficient, **Clean JSON** is an optional metered HumanMirror service. In n8n, install `@humanmirror/n8n-nodes-omnidome` (self-hosted Community Nodes) and select **Clean JSON**. The first unauthorized call returns the live HTTP 402 terms and does not pay. A trusted payer must authorize the exact request before a paid retry; do not paste private keys.

Endpoint: `POST https://humanmirror.fr/api/x402/clean-json/` — current advertised amount **0.010 USDC on Base**, verify the live 402 challenge.

## 2. Webhook timeout after an agent action

Use a stable idempotency key; record which stage completed; distinguish the HTTP request timing out from the downstream action failing. Do not immediately repeat an external side effect if payment or delivery might have succeeded.

```js
function shouldAutomaticallyRetry({ hasConfirmedDelivery, settlementUncertain, idempotentOperation }) {
  return !hasConfirmedDelivery && !settlementUncertain && idempotentOperation === true;
}
```

HumanMirror Payment Rescue offers a **free advisory** diagnosis; it does not verify settlement or recover money by itself:

```sh
curl -sS -X POST 'https://humanmirror.fr/api/payment-rescue/' \
  -H 'content-type: application/json' \
  --data '{"stage":"response_lost"}'
```

## 3. Preflight before an irreversible agent action

In n8n select **Safe Preflight** and supply a *synthetic or operator-approved* JSON action, for example:

```json
{"action":{"text":"An automation proposes changing a payment beneficiary."}}
```

Call `POST https://humanmirror.fr/api/x402/safe-preflight/`. The live 402 challenge gives the payment instructions (advertised **0.010 USDC Base**). HumanMirror gives an **advisory** risk signal; the caller remains responsible for its own authorization, budgets, policy enforcement and action execution.

## 4. Integration boundaries

- n8n self-hosted: install via Settings → Community Nodes → `@humanmirror/n8n-nodes-omnidome`. n8n Cloud needs separate official verification.
- Make, LangChain, MCP: use documented HTTPS/OpenAPI integration methods where supported. This n8n package is **not** a native dependency or extension for those products.
- No automatic funds transfer, self-funded metrics, hidden consent or unverifiable “successful payment” claims.
- Support and opt-in integration discussion: contact.humanmirror@gmail.com.

Official public interface: https://humanmirror.fr/x402/openapi.json.
