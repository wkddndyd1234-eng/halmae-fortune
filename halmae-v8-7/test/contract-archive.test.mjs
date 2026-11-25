import assert from 'node:assert/strict';
import test from 'node:test';
import {policyArchive,savePolicy,saveContract,withPolicyOriginals} from '../netlify/lib/contract-archive.mjs';
import {previewContractEmail} from '../netlify/lib/contract-mail-preview.mjs';
import {purgeArchive} from '../netlify/lib/legal-records.mjs';

const urls={terms:'https://example.test/terms',privacy:'https://example.test/privacy',refund:'https://example.test/refund'};
const raw={version:'v1',...Object.fromEntries(Object.entries(urls).map(([key,url])=>[key,{url,text:key+' original'}]))};
const id='HM-12345678-abcd-4123-9123-0123456789ab';
const archiveStore=()=>{
 const rows=new Map();
 return {async get(key){return rows.get(key)??null;},
  async setJSON(key,value,{onlyIfNew}={}){if(onlyIfNew&&rows.has(key)) return {modified:false};rows.set(key,value);return {modified:true};},
  async delete(key){rows.delete(key);},
  async *list({prefix}){yield {blobs:[...rows.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};}};
};

test('같은 버전 원문 변경을 거절하고 계약 사본은 구매 당시 원문을 검증한다',async()=>{
 const store=archiveStore();
 assert.equal(policyArchive(JSON.stringify(raw),'different',urls),null);
 const policy=policyArchive(JSON.stringify(raw),'v1',urls);
 assert.ok(await savePolicy(store,policy));
 assert.ok(await savePolicy(store,policy));
 const altered=policyArchive(JSON.stringify({...raw,terms:{...raw.terms,text:'changed'}}),'v1',urls);
 assert.equal(await savePolicy(store,altered),false);
 const order={orderId:id,approvedAt:'2026-11-25T12:00:00Z',purchaseExpiresAt:1827144000000,amount:39900,
  birthDate:'private',paymentKey:'private',contractTerms:{policyVersion:'v1',policyDigest:policy.digest}};
 assert.ok(await saveContract(store,order));
 assert.ok(await saveContract(store,order));
 const recorded=await store.get('contract/'+id);
 assert.doesNotMatch(JSON.stringify(recorded),/private/);
 assert.equal((await withPolicyOriginals(store,recorded)).policyOriginals.terms.text,'terms original');
 await store.setJSON('policy/v1',altered);
 assert.equal(await withPolicyOriginals(store,recorded),null);
 await store.setJSON('hold/'+id,{});
 assert.equal((await purgeArchive(store,Date.UTC(2032,0,1))).deleted,0);
 await store.delete('hold/'+id);
 assert.equal((await purgeArchive(store,Date.UTC(2032,0,1))).deleted,1);
 assert.equal(await store.get('contract/'+id),null);
});

test('계약서면 메일 검수는 합성 문서와 Resend 테스트 수신자만 사용한다',async()=>{
 let calls=0;
 const transport=async(url,request)=>{
  calls++;
  assert.equal(url,'https://api.resend.com/emails');
  const payload=JSON.parse(request.body);
  assert.deepEqual(payload.to,['delivered@resend.dev']);
  assert.match(payload.text,/테스트 계약서면.*실제 청구 없음/);
  return Response.json({id:'fixture'});
 };
 await assert.rejects(previewContractEmail({document:{test:false}},transport));
 await previewContractEmail({key:'fixture',from:'sender@example.test',document:{test:true,orderId:id}},transport);
 assert.equal(calls,1);
 await assert.rejects(previewContractEmail({document:{test:true}},async()=>new Response(null,{status:503})));
});
