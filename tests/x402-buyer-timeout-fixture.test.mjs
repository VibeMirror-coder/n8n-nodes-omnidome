import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync(new URL('../examples/fixtures/x402-buyer-timeout.synthetic.json',import.meta.url),'utf8'));
test('buyer-timeout fixture is synthetic, well formed and no-charge',()=>{
  assert.equal(fixture.synthetic,true);
  assert.equal(fixture.buyer_evidence.network,'eip155:8453');
  assert.match(fixture.buyer_evidence.authorizationNonce,/^0x[0-9a-f]{64}$/);
  assert.equal(fixture.buyer_evidence.signature_included,false);
  assert.equal(fixture.buyer_evidence.transaction_hash,null);
  assert.equal(fixture.buyer_evidence.seller_receipt_id,null);
  assert.equal(fixture.observation.settlement,'UNKNOWN');
  assert.equal(fixture.observation.delivery,'UNKNOWN');
  assert.equal(fixture.observation.automatic_retry_allowed,false);
  assert.equal(fixture.recovery_policy.result_retrieval_by_nonce_available,false);
});
