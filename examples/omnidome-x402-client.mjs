const ROOT = 'https://humanmirror.fr';
const PATHS = Object.freeze({
  safePreflight: '/api/x402/safe-preflight/',
  cleanJson: '/api/x402/clean-json/',
  recover: '/api/payment-rescue/',
});
export async function callOmniDome({operation, body, paymentSignature, timeoutMs = 15000, fetchImpl = globalThis.fetch} = {}) {
  if (!Object.hasOwn(PATHS, operation)) throw new TypeError('Unsupported operation');
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new TypeError('body must be a JSON object');
  if (operation === 'recover' && paymentSignature !== undefined) throw new TypeError('Free advisory cannot receive payment authorization');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 30000) throw new RangeError('invalid timeoutMs');
  const endpoint = ROOT + PATHS[operation];
  const headers = {'content-type':'application/json',accept:'application/json'};
  if (paymentSignature !== undefined) {
    if (typeof paymentSignature !== 'string' || !paymentSignature.trim()) throw new TypeError('invalid paymentSignature');
    headers['PAYMENT-SIGNATURE'] = paymentSignature;
  }
  const response = await fetchImpl(endpoint, {method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(timeoutMs),redirect:'error'});
  const raw = await response.text();
  let payload;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = {raw:raw.slice(0,500)}; }
  const result = {operation,endpoint,status:response.status,response:payload,paid:false,verifiedSettlement:false,verifiedDelivery:false};
  if (response.status === 402) return {...result,ok:false,paymentRequired:true,challenge:response.headers.get('PAYMENT-REQUIRED'),nextAction:'Review the live payment terms and independently authorize the exact purchase'};
  if (!response.ok) return {...result,ok:false,paymentRequired:false,nextAction:'Investigate before any retry or new payment'};
  return {...result,ok:true,paymentRequired:false,advisoryOnly:operation === 'recover'};
}
export { PATHS };
