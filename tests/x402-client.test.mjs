import test from 'node:test';
import assert from 'node:assert/strict';
import {callOmniDome} from '../examples/omnidome-x402-client.mjs';
const response=(body,status,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json',...headers}});
test('402 is a challenge, never a payment',async()=>{
 let sent;
 const r=await callOmniDome({operation:'safePreflight',body:{action:{text:'Synthetic'}},fetchImpl:async (url,opts)=>{sent={url,opts};return response({x402Version:2},402,{'PAYMENT-REQUIRED':'synthetic'});}});
 assert.equal(r.paymentRequired,true);assert.equal(r.paid,false);assert.equal(r.challenge,'synthetic');assert.equal(sent.opts.headers['PAYMENT-SIGNATURE'],undefined);
});
test('free recovery does not send authorization',async()=>{
 let headers;
 const r=await callOmniDome({operation:'recover',body:{stage:'response_lost'},fetchImpl:async (_url,opts)=>{headers=opts.headers;return response({status:'ADVISORY_ONLY'},200);}});
 assert.equal(r.advisoryOnly,true);assert.equal(r.verifiedSettlement,false);assert.equal(headers['PAYMENT-SIGNATURE'],undefined);
});
test('paid authorization only when explicitly supplied',async()=>{
 let value;
 const r=await callOmniDome({operation:'cleanJson',body:{input:'{"ok":true}'},paymentSignature:'synthetic-authorization',fetchImpl:async (_url,opts)=>{value=opts.headers['PAYMENT-SIGNATURE'];return response({ok:true},200);}});
 assert.equal(value,'synthetic-authorization');assert.equal(r.ok,true);assert.equal(r.paid,false);
});
test('invalid arguments do not call network',async()=>{
 const fetchImpl=()=>{throw Error('network called')};
 await assert.rejects(callOmniDome({operation:'unknown',body:{},fetchImpl}),/Unsupported/);
 await assert.rejects(callOmniDome({operation:'cleanJson',body:[],fetchImpl}),/JSON object/);
 await assert.rejects(callOmniDome({operation:'recover',body:{},paymentSignature:'x',fetchImpl}),/cannot receive/);
});
