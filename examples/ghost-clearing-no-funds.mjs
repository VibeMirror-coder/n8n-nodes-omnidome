import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Synthetic local interoperability exercise. No network connections, wallets, or funds.
const txRef = crypto.randomUUID();
const buyer = crypto.generateKeyPairSync('ed25519');
const stranger = crypto.generateKeyPairSync('ed25519');
const fingerprint = key => crypto.createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex');
const authorizedBuyer = fingerprint(buyer.publicKey);
const ledger = new Map();
const counters = {simulatedSettlements: 0, executions: 0, replays: 0};
const requestDigest = crypto.createHash('sha256').update('POST\n/api/safe-preflight\n{"action":"synthetic-check"}').digest('hex');

function initialExecution() {
  const row = ledger.get(txRef);
  if (row) return row;
  counters.simulatedSettlements += 1;
  const created = {txRef, buyerFingerprint: authorizedBuyer, requestDigest,
    settlement: 'SIMULATED_SETTLED', delivery: 'PERSISTED_NOT_ACKNOWLEDGED',
    verdict: {decision:'ALLOW', testOnly:true}};
  ledger.set(txRef, created);
  counters.executions += 1;
  throw new Error('SYNTHETIC_NETWORK_DROPPED_AFTER_PERSIST');
}

let disconnected = false;
try { initialExecution(); } catch (error) {
  disconnected = error.message === 'SYNTHETIC_NETWORK_DROPPED_AFTER_PERSIST';
}
assert.equal(disconnected, true);
const nonce = crypto.randomBytes(16).toString('hex');
const expiry = Date.now() + 30000;
const message = Buffer.from(`HumanMirror synthetic recovery v1\n${txRef}\n${nonce}\n${expiry}`);
const signed = crypto.sign(null, message, buyer.privateKey);
const used = new Set();
function recover({publicKey, signature, nonceValue=nonce, expiresAt=expiry, digest=requestDigest}) {
  const now = Date.now();
  if (expiresAt < now || expiresAt > now + 60000) throw new Error('EXPIRED');
  if (fingerprint(publicKey) !== authorizedBuyer) throw new Error('WRONG_BUYER');
  if (digest !== ledger.get(txRef).requestDigest) throw new Error('WRONG_REQUEST');
  if (!crypto.verify(null, message, publicKey, signature)) throw new Error('BAD_SIGNATURE');
  const key = `${txRef}:${nonceValue}`;
  if (used.has(key)) throw new Error('REPLAY');
  used.add(key);
  counters.replays += 1;
  return ledger.get(txRef);
}
assert.throws(() => recover({publicKey:stranger.publicKey,signature:signed}), /WRONG_BUYER/);
assert.throws(() => recover({publicKey:buyer.publicKey,signature:signed,digest:'0'.repeat(64)}), /WRONG_REQUEST/);
const recovered = recover({publicKey:buyer.publicKey,signature:signed});
assert.deepEqual(recovered.verdict, {decision:'ALLOW',testOnly:true});
assert.throws(() => recover({publicKey:buyer.publicKey,signature:signed}), /REPLAY/);
assert.equal(counters.simulatedSettlements, 1);
assert.equal(counters.executions, 1);
console.log(JSON.stringify({
  protocol:'humanmirror-ghost-clearing-synthetic-v1', mode:'NO_FUNDS_NO_NETWORK',
  test:'post-settlement_response_loss_and_buyer_bound_recovery',
  simulatedDisconnect:'PASS', buyerIsolation:'PASS', requestIntegrity:'PASS',
  nonceReplayRejected:'PASS', recoveredResult:'PASS', noSecondDebit:'PASS',
  simulatedPayments:counters.simulatedSettlements, downstreamExecutions:counters.executions,
  recoveryReads:counters.replays, fundsTransferred:'0',
  warning:'Local simulation, not a live x402 payment, not a published clearing API.'
},null,2));
