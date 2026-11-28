import assert from 'node:assert/strict';
import test from 'node:test';
import {scryptSync} from 'node:crypto';
import admin from '../netlify/functions/admin.mjs';
import {compareSettlements,summarize} from '../netlify/lib/admin-ledger.mjs';
import {materializeReport} from '../netlify/lib/report-delivery.mjs';
import {verifyProvider,sign} from '../netlify/functions/shared.mjs';

test('운영 콘솔은 올바른 출처와 서버 세션 및 CSRF를 요구한다',async t=>{
 const origin='https://test-v87--halmae-fortune-v87-preview.netlify.app';
 const password='local-fixture-password';
 const salt=Buffer.alloc(16);
 Object.assign(process.env,{
  PAYMENT_MODE:'test',TOSS_TEST_CLIENT_KEY:'test_ck_fixture',TOSS_TEST_SECRET_KEY:'test_sk_fixture',
  REPORT_TOKEN_SECRET:'preview-fixture-signing-secret-example',
  OPS_ADMIN_ENABLED:'true',OPS_PREVIEW_PASSWORD_HASH:salt.toString('hex')+':'+scryptSync(password,salt,64).toString('hex'),
  NETLIFY_BLOBS_CONTEXT:Buffer.from(JSON.stringify({siteID:'test',edgeURL:'https://blob.example.test',
   uncachedEdgeURL:'https://blob.example.test',token:'mock'})).toString('base64'),
 });
 const records=new Map();
 t.mock.method(globalThis,'fetch',async (url,opts)=>{
  const key=decodeURIComponent(new URL(url).pathname);
  assert.match(key,/halmae-admin-test/);
  if(opts.method==='put'){
   if(new Headers(opts.headers).get('if-none-match')==='*'&&records.has(key)) return new Response(null,{status:412});
   records.set(key,JSON.parse(opts.body));return new Response(null,{status:200});
  }
  if(opts.method==='delete'){records.delete(key);return new Response(null,{status:200});}
  return records.has(key)?Response.json(records.get(key)):new Response(null,{status:404});
 });
 const send=(body,headers={})=>admin(new Request(origin,{
  method:body?'POST':'GET',headers:{'Content-Type':'application/json',origin,...headers},
  ...(body?{body:JSON.stringify(body)}:{}),
 }));
 assert.equal((await send()).status,403);
 assert.equal((await send({action:'login',password},{origin:'https://unrelated.example.test'})).status,403);
 const login=await send({action:'login',password});
 assert.equal(login.status,200);
 assert.match(login.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Strict/);
 assert.deepEqual(await login.json(),{ok:true});
 const cookie=login.headers.get('Set-Cookie').split(';')[0];
 const {csrf,mode,refundsEnabled}=await (await send(null,{cookie})).json();
 assert.equal(mode,'test');
 assert.equal(refundsEnabled,false);
 assert.equal((await send({action:'logout'},{cookie})).status,403);
 assert.equal((await send({action:'logout'},{cookie,'x-csrf-token':csrf})).status,200);
 assert.equal((await send(null,{cookie})).status,403);
 assert.doesNotMatch(JSON.stringify([...records]),new RegExp(password));
});

test('보고서 재생성은 한 번 더 시도하고 원문을 상태 레코드에 넣지 않는다',async()=>{
 const rows=[];
 const store={setJSON:async(key,value)=>rows.push({key,value})};
 let sequence=0;
 const result=await materializeReport(store,{orderId:'fixture'},()=>{
  if(++sequence===1) throw Error('transient');
  return {chapters:['private report']};
 });
 assert.equal(result.chapters[0],'private report');
 assert.equal(sequence,2);
 assert.equal(rows[0].value.state,'generated');
 await assert.rejects(materializeReport(store,{orderId:'fixture'},()=>{throw Error('failure');}));
 assert.equal(rows.at(-1).value.state,'retry-needed');
 assert.doesNotMatch(JSON.stringify(rows),/private report|transient|failure/);
});

test('정산 집계는 중복 거래를 제외하고 한국 날짜와 거래 키로 대조한다',()=>{
 const orderId='HM-12345678-abcd-4123-9123-0123456789ab';
 const paid={orderId,amount:29900,balanceAmount:29900,approvedAt:'2026-11-23T15:00:00Z',transactionKey:'paid'};
 const cancel={cancelStatus:'DONE',transactionKey:'refund',canceledAt:'2026-11-25T14:59:59Z',cancelAmount:1000};
 const partial={...paid,balanceAmount:28900,transactionKey:'refund',cancellations:[cancel,cancel]};
 const {daily,monthly,newest}=summarize([paid,paid,partial].map(value=>({value})));
 assert.equal(daily['2026-11-24'].gross,29900);
 assert.equal(daily['2026-11-25'].refund,1000);
 assert.deepEqual(monthly['2026-11'],{gross:29900,refund:1000});
 assert.equal(compareSettlements([...newest.values()],[{...partial,balanceAmount:0}]).length,1);
});

test('운영 서명 키 교체 시 제한된 기간에만 이전 토큰을 허용한다',()=>{
 const previous='old-live-fixture-key-with-32-characters';
 const config={mode:'live',tokenSecret:'new-live-fixture-key-with-32-characters'};
 process.env.LIVE_PREVIOUS_REPORT_TOKEN_SECRET=previous;
 const token=sign({scope:'toss-live-report-v1',exp:Date.now()+60_000},previous);
 process.env.LIVE_PREVIOUS_SIGNING_UNTIL=new Date(Date.now()+60_000).toISOString();
 assert.equal(verifyProvider(token,config)?.scope,'toss-live-report-v1');
 process.env.LIVE_PREVIOUS_SIGNING_UNTIL=new Date(Date.now()-1000).toISOString();
 assert.equal(verifyProvider(token,config),null);
});

test('열람이 끝난 주문은 금융 스냅샷을 남긴 뒤 고객 데이터를 삭제한다',async t=>{
 const {sweepLive}=await import('../netlify/functions/live-retention.mjs');
 const orderId='HM-12345678-abcd-4123-9123-0123456789ab';
 const now=Date.parse('2026-11-24T00:00:00Z');
 const order={orderId,channel:'toss-live',status:'live-paid',purchaseExpiresAt:now,amount:29900,
  birthDate:'1988-10-08',paymentKey:'mock-retention-key'};
 const ops=new Map();
 const archive=new Map();
 const customerData=new Map([[orderId,order],['delivery/'+orderId,{state:'generated'}]]);
 const store=data=>({
  async *list({prefix}){yield {blobs:[...data.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};},
  get:async key=>data.get(key)??null,
  delete:async key=>data.delete(key),
  setJSON:async(key,value)=>data.set(key,value),
 });
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const endpoint=new URL(url);
  if(endpoint.hostname==='api.tosspayments.com'){
   return Response.json({orderId,mId:'merchant',method:'카드',currency:'KRW',totalAmount:29900,balanceAmount:29900,
    status:'DONE',paymentKey:order.paymentKey,approvedAt:'2025-11-24T00:00:00Z'});
  }
  assert.equal(endpoint.hostname,'blob.example.test');
  const key=decodeURIComponent(endpoint.pathname);
  if(options.method==='put'){archive.set(key,JSON.parse(options.body));return new Response(null,{status:200});}
  return archive.has(key)?Response.json(archive.get(key)):new Response(null,{status:404});
 });
 const counts=await sweepLive({mode:'live',merchantId:'merchant',secretKey:'live_sk_fixture'},store(customerData),store(ops),now);
 assert.deepEqual(counts,{erased:1,failed:0});
 assert.equal(customerData.has(orderId),false);
 assert.ok([...archive.keys()].some(key=>key.includes('/finance/')));
 assert.doesNotMatch(JSON.stringify([...archive.values()]),/1988-10-08/);
 assert.equal(ops.get('retention/latest').erased,1);
});
