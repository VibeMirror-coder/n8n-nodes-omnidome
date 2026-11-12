import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';

// Local-only HTTP lab. No wallets, funds, external requests or production APIs.
const buyer=crypto.generateKeyPairSync('ed25519'), stranger=crypto.generateKeyPairSync('ed25519');
const receiptSigner=crypto.generateKeyPairSync('ed25519');
const buyerPem=buyer.publicKey.export({format:'pem',type:'spki'});
const strangerPem=stranger.publicKey.export({format:'pem',type:'spki'});
const txRef=crypto.randomUUID();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const fingerprint=pem=>hash(crypto.createPublicKey(pem).export({format:'der',type:'spki'}));
const sign=(key,text)=>crypto.sign(null,Buffer.from(text),key).toString('base64url');
const verify=(key,text,signature)=>crypto.verify(null,Buffer.from(text),key,Buffer.from(signature,'base64url'));
const counters={provider_simulations:0,fee_simulations:0,executions:0,recovery_reads:0,acknowledgements:0};
const nonces=new Set(),ledger=new Map();
function headers(method,path,body,key=buyer.privateKey,pem=buyerPem){
  const nonce=crypto.randomBytes(16).toString('hex'),expiresAt=Date.now()+30000;
  const msg=['ghost-clearing-http-demo-v1',method,path,hash(JSON.stringify(body??null)),nonce,expiresAt].join('\n');
  return {'Content-Type':'application/json','x-agent-key':Buffer.from(pem).toString('base64url'),
    'x-nonce':nonce,'x-exp':String(expiresAt),'x-signature':sign(key,msg)};
}
function authenticate(req,path,body){
  const pem=Buffer.from(String(req.headers['x-agent-key']||''),'base64url').toString();
  const nonce=String(req.headers['x-nonce']||''),exp=Number(req.headers['x-exp']);
  if(!/^[0-9a-f]{32}$/.test(nonce)||!Number.isSafeInteger(exp)||exp<Date.now()||exp>Date.now()+60000)throw Error('auth_expired');
  const msg=['ghost-clearing-http-demo-v1',req.method,path,hash(JSON.stringify(body??null)),nonce,exp].join('\n');
  if(!verify(pem,msg,String(req.headers['x-signature']||'')))throw Error('bad_signature');
  if(fingerprint(pem)!==fingerprint(buyerPem))throw Error('wrong_buyer');
  const key=fingerprint(pem)+':'+nonce;
  if(nonces.has(key))throw Error('replayed_nonce');
  nonces.add(key);
}
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function read(req){
  let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)throw Error('body_too_large');}
  return data?JSON.parse(data):null;
}
const server=http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  try{
    const body=req.method==='POST'?await read(req):null;
    authenticate(req,path,body);
    if(req.method==='POST'&&path==='/intent'){
      if(ledger.has(txRef))throw Error('duplicate_intent');
      ledger.set(txRef,{state:'QUOTED',amount_provider_atomic:50000,amount_fee_atomic:10000});
      return send(res,200,{tx_ref:txRef,network:'eip155:84532',...ledger.get(txRef),no_funds:true});
    }
    const row=ledger.get(txRef);
    if(!row)throw Error('missing_intent');
    if(req.method==='POST'&&path==='/settle'){
      if(row.state!=='QUOTED')throw Error('duplicate_payment_denied');
      counters.provider_simulations++;counters.fee_simulations++;row.state='SIMULATED_SETTLED';
      return send(res,200,{state:row.state,real_chain_transfers:0});
    }
    if(req.method==='POST'&&path==='/execute'){
      if(row.state!=='SIMULATED_SETTLED')throw Error('duplicate_execution_denied');
      counters.executions++;
      row.result={operation:'synthetic_safe_preflight',verdict:'ALLOW',tx_ref:txRef};
      row.result_sha256=hash(JSON.stringify(row.result));row.state='RESULT_PERSISTED';
      req.socket.destroy();return;
    }
    if(req.method==='GET'&&path==='/recover/'+txRef){
      counters.recovery_reads++;
      const delivered=row.state==='SETTLED_AND_DELIVERED';
      let signed_receipt=null;
      if(delivered){
        const record={tx_ref:txRef,state:row.state,result_sha256:row.result_sha256,
          provider_simulations:1,fee_simulations:1,real_chain_transfers:0};
        const raw=Buffer.from(JSON.stringify(record));
        signed_receipt={algorithm:'Ed25519',payload:raw.toString('base64url'),
          signature:sign(receiptSigner.privateKey,raw)};
      }
      return send(res,200,{state:row.state,result:row.result,result_sha256:row.result_sha256,
        buyer_acknowledged:delivered,signed_receipt,no_new_payment:true});
    }
    if(req.method==='POST'&&path==='/ack'){
      if(row.state!=='RESULT_PERSISTED'||body?.result_sha256!==row.result_sha256)throw Error('bad_ack');
      counters.acknowledgements++;row.state='SETTLED_AND_DELIVERED';
      return send(res,200,{state:row.state});
    }
    throw Error('unknown_operation');
  }catch(error){
    if(!res.destroyed)send(res,error.message==='wrong_buyer'?403:409,{ok:false,error:error.message});
  }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const request=(method,path,body,key,pem)=>fetch(base+path,{method,
  headers:headers(method,path,body,key,pem),
  ...(method==='POST'?{body:JSON.stringify(body)}:{})});
try{
  assert.equal((await request('POST','/intent',{tx_ref:txRef})).status,200);
  assert.equal((await request('POST','/settle',{tx_ref:txRef})).status,200);
  await assert.rejects(request('POST','/execute',{tx_ref:txRef}));
  const persisted=await (await request('GET','/recover/'+txRef,null)).json();
  assert.equal(persisted.state,'RESULT_PERSISTED');
  assert.equal(persisted.signed_receipt,null);
  assert.equal(hash(JSON.stringify(persisted.result)),persisted.result_sha256);
  assert.equal((await request('GET','/recover/'+txRef,null,stranger.privateKey,strangerPem)).status,403);
  assert.equal((await request('POST','/ack',{result_sha256:persisted.result_sha256})).status,200);
  const final=await (await request('GET','/recover/'+txRef,null)).json();
  assert.deepEqual(final.result,persisted.result);
  assert.equal(final.buyer_acknowledged,true);
  assert.equal(verify(receiptSigner.publicKey,Buffer.from(final.signed_receipt.payload,'base64url'),
    final.signed_receipt.signature),true);
  assert.equal((await request('POST','/settle',{tx_ref:txRef})).status,409);
  assert.deepEqual(counters,{provider_simulations:1,fee_simulations:1,executions:1,
    recovery_reads:2,acknowledgements:1});
  console.log(JSON.stringify({mode:'LOCAL_HTTP_NO_FUNDS',network_cut:'PASS',
    buyer_isolation:'PASS',original_bytes_recovered:'PASS',delivery_ack:'PASS',
    signed_receipt:'PASS',double_payment_denied:'PASS',real_chain_transfers:0,...counters},null,2));
}finally{await new Promise(resolve=>server.close(resolve));}
