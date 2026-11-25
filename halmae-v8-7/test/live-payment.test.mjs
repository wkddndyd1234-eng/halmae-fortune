import assert from 'node:assert/strict';
import test from 'node:test';
import order from '../netlify/functions/order.mjs';
import payment from '../netlify/functions/payment.mjs';
import access from '../netlify/functions/access.mjs';
import recovery from '../netlify/functions/recovery.mjs';
import report from '../netlify/functions/report.mjs';
import webhook from '../netlify/functions/payment-webhook.mjs';
import operations from '../netlify/functions/payment-operations.mjs';
import admin from '../netlify/functions/admin.mjs';
import {createSession} from '../netlify/lib/admin-auth.mjs';
import {adminStore} from '../netlify/functions/shared.mjs';
import {policyArchive} from '../netlify/lib/contract-archive.mjs';
import {sign} from '../netlify/functions/shared.mjs';

const origin='https://commerce.example.test';
const testOrigin='https://test-v87--halmae-fortune-v87-preview.netlify.app';
const operator='operator-local-fixture-32-or-more-characters';
const hookKey='webhook-local-fixture-32-or-more-characters';
const secret='production-local-test-fixture-signing-key';
const request=(body,{url=origin,token,cookie}={})=>new Request(url,{
 method:body?'POST':'GET',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(cookie?{Cookie:cookie}:{})},
 ...(body?{body:JSON.stringify(body)}:{}),
});
const birth={channel:'toss-live',policyVersion:'2026.11-fixture',immediateDelivery:true,termsAccepted:true,gender:'male',birthDate:'1988-10-08',consent:true,
 email:'buyer@example.test',recoveryConsent:true,checkoutAttempt:'12345678-abcd-4123-9123-0123456789ab'};

test('운영 판매 승인·호스트·키·정책·운영 인증 정보가 모두 필요하다',async()=>{
 configure();
 for(const [key,value] of [
  ['PAYMENT_RUNTIME_TIER','deploy-preview'],['PAYMENT_LIVE_SITE_ID','wrong-site'],['URL',testOrigin],['PAYMENT_LIVE_APPROVED','false'],
  ['PAYMENT_LIVE_SALES_ENABLED','false'],['TOSS_LIVE_SECRET_KEY','test_sk_dummy'],['LIVE_POLICY_ARCHIVE_JSON','{}'],
  ['LIVE_REPORT_TOKEN_SECRET','short'],['LIVE_PRIVACY_URL','javascript:alert(0)'],
  ['PAYMENT_LIVE_WEBHOOK_KEY',operator],['LIVE_POLICY_APPROVED','false'],['LIVE_MAIL_ORDER_NUMBER','주소 변경 중'],['LIVE_SUPPORT_PHONE',''],['LIVE_PRIVACY_OFFICER','지정 대기'],
 ]){
  const original=process.env[key];
  process.env[key]=value;
  assert.equal((await (await payment(request())).json()).enabled,false,key);
  assert.equal((await order(request(birth))).status,503,key);
  process.env[key]=original;
 }
 assert.equal((await (await payment(request(null,{url:testOrigin}))).json()).enabled,false);
 assert.equal((await (await payment(request())).json()).enabled,true);
});

function configure(){
 Object.assign(process.env,{
  OPS_LIVE_ALLOWED_IPS:'192.0.2.7',PAYMENT_REFUNDS_APPROVED:'true',LIVE_MERCHANT_DISCLOSURES_APPROVED:'true',LIVE_SUPPORT_PHONE:'02-0000-0000',
  LIVE_MAIL_ORDER_NUMBER:'2026-가상시-0000',LIVE_PRIVACY_OFFICER:'가상 검증',LIVE_POLICY_APPROVED:'true',LIVE_POLICY_VERSION:'2026.11-fixture',PAYMENT_MODE:'live',PAYMENT_RUNTIME_TIER:'production',SITE_ID:'fixture-site',PAYMENT_LIVE_SITE_ID:'fixture-site',TOSS_LIVE_MERCHANT_ID:'merchant-fixture',URL:origin,PAYMENT_LIVE_ORIGIN:origin,
  PAYMENT_LIVE_APPROVED:'true',PAYMENT_LIVE_SALES_ENABLED:'true',
  TOSS_LIVE_CLIENT_KEY:'live_ck_dummy',TOSS_LIVE_SECRET_KEY:'live_sk_dummy',
  LIVE_RECOVERY_RESEND_API_KEY:'mock-live-mail',LIVE_RECOVERY_FROM_EMAIL:'sender@example.test',
  LIVE_REPORT_TOKEN_SECRET:secret,REPORT_TOKEN_SECRET:'test-local-fixture-separate-signing-key',
  PAYMENT_LIVE_WEBHOOK_KEY:hookKey,PAYMENT_LIVE_OPERATOR_TOKEN:operator,
  LIVE_TERMS_URL:origin+'/legal/terms',LIVE_PRIVACY_URL:origin+'/legal/privacy',LIVE_REFUND_URL:origin+'/legal/refund',
  LIVE_POLICY_ARCHIVE_JSON:JSON.stringify({version:'2026.11-fixture',...Object.fromEntries(
   ['terms','privacy','refund'].map(key=>[key,{url:origin+'/legal/'+key,text:'검수용 '+key+' 원문'}]))}),
  NETLIFY_BLOBS_CONTEXT:Buffer.from(JSON.stringify({siteID:'local',edgeURL:'https://blob.example.test',uncachedEdgeURL:'https://blob.example.test',token:'fixture'})).toString('base64'),
 });
 birth.policyDigest=policyArchive(process.env.LIVE_POLICY_ARCHIVE_JSON,birth.policyVersion,{
  terms:process.env.LIVE_TERMS_URL,privacy:process.env.LIVE_PRIVACY_URL,refund:process.env.LIVE_REFUND_URL,
 }).digest;
}

test('운영 주문 재시도, 승인 응답 유실, 정산 기록, 결제 취소와 365일 열람을 격리한다',async t=>{
 configure();
 const previousCampaignSetting=process.env.CAMPAIGN_MEASUREMENT_ENABLED;
 process.env.CAMPAIGN_MEASUREMENT_ENABLED='true';
 t.after(()=>{
  if(previousCampaignSetting===undefined) delete process.env.CAMPAIGN_MEASUREMENT_ENABLED;
  else process.env.CAMPAIGN_MEASUREMENT_ENABLED=previousCampaignSetting;
 });
 const records=new Map(),approvals=[],refunds=[],mails=[];
 let provider;
 let failApproval=true;
 t.mock.method(globalThis,'fetch',async (url,options)=>{
  const endpoint=new URL(url);
  if(endpoint.hostname==='blob.example.test'){
   const key=decodeURIComponent(endpoint.pathname);
   assert.match(key,/halmae-(live-(orders|finance|campaigns)|admin-live)/);
   const verb=options.method;
   if(verb==='delete'){records.delete(key);return new Response(null,{status:200});}
   if(verb==='put'){
    if(new Headers(options.headers).get('if-none-match')==='*' && records.has(key)) return new Response(null,{status:412});
    records.set(key,JSON.parse(options.body));return new Response(null,{status:200});
   }
   return records.has(key)?Response.json(records.get(key)):new Response(null,{status:404});
  }
  if(endpoint.hostname==='api.resend.com'){
   assert.equal(options.headers.Authorization,'Bearer mock-live-mail');
   mails.push({key:options.headers['Idempotency-Key'],...JSON.parse(options.body)});
   if(mails.length===1) return new Response(null,{status:503});
   return Response.json({id:'fixture-mail'});
  }
  assert.equal(endpoint.hostname,'api.tosspayments.com');
  assert.equal(options.headers.Authorization,'Basic '+Buffer.from('live_sk_dummy:').toString('base64'));
  if(endpoint.pathname.endsWith('/confirm')){
   approvals.push(options.headers['Idempotency-Key']);
   const {orderId,paymentKey,amount}=JSON.parse(options.body);
   assert.equal(amount,39900);
   provider={mId:'merchant-fixture',orderId,paymentKey,totalAmount:amount,balanceAmount:amount,currency:'KRW',method:'카드',
    approvedAt:new Date().toISOString(),status:'DONE',lastTransactionKey:'approval-transaction'};
   if(failApproval){failApproval=false;throw Error('local simulated lost response');}
  }
  if(endpoint.pathname.endsWith('/cancel')){
   refunds.push(options.headers['Idempotency-Key']);
   assert.equal(JSON.parse(options.body).cancelReason,'고객 요청');
   provider={...provider,status:'CANCELED',balanceAmount:0,lastTransactionKey:'cancel-transaction',
    cancels:[{transactionKey:'cancel-transaction',cancelAmount:39900,cancelStatus:'DONE'}]};
  }
  return provider?Response.json(provider):new Response(null,{status:404});
 });
 assert.equal((await order(request({...birth,immediateDelivery:false}))).status,400);
 assert.equal((await order(request({...birth,termsAccepted:false}))).status,400);
 assert.equal((await order(request({...birth,policyVersion:'old-version'}))).status,400);
 assert.equal((await order(request({...birth,policyDigest:'old-digest'}))).status,400);
 const attribution={source:'naver',medium:'cpc',campaign:'newyear_2027'};
 const tagged={...birth,attribution:{...attribution,email:birth.email}};
 const attempts=await Promise.all([order(request(tagged)),order(request(tagged))]);
 assert.ok(attempts.every(response=>response.ok));
 const cookie=attempts[0].headers.get('set-cookie').split(';')[0];
 const [first,second]=await Promise.all(attempts.map(response=>response.json()));
 const tags=[...records].filter(([key])=>key.includes('/halmae-live-campaigns/order/'));
 assert.equal(tags.length,1);
 assert.deepEqual(tags[0][1],{attribution});
 const contractInput={action:'contract',orderId:first.orderId};
 assert.equal((await access(request(contractInput,{cookie}))).status,404);
 assert.equal(first.orderId,second.orderId);
 assert.equal(first.checkoutToken,second.checkoutToken);
 assert.equal((await order(request({...birth,birthDate:'1992-01-21'}))).status,409);
 assert.equal((await order(request({...birth,channel:'toss-test'}))).status,503);
 assert.equal((await order(request({...birth,channel:'admin-demo'}))).status,403);
 assert.equal((await order(request({...birth,email:undefined,recoveryConsent:false},{cookie}))).status,200);
 assert.equal((await order(request({...birth,email:'different@example.test'},{cookie}))).status,409);
 const call={orderId:first.orderId,paymentKey:'live-fixture-payment',amount:39900};
 assert.equal((await payment(request({...call,amount:1},{token:first.checkoutToken}))).status,400);
 const cross=sign({orderId:first.orderId,scope:'toss-live-checkout',exp:Date.now()+30_000});
 assert.equal((await payment(request(call,{token:cross}))).status,403);
 assert.equal((await payment(request(call,{token:first.checkoutToken}))).status,500);
 const resume=await order(request(birth,{cookie}));
 assert.equal((await resume.json()).paymentAlreadyApproved,true);
 const paid=await (await payment(request(call,{token:first.checkoutToken}))).json();
 assert.equal(paid.paymentMode,'live');
 assert.equal(paid.contractAvailable,true);
 assert.equal((await access(request(contractInput))).status,403);
 const contractResponse=await access(request(contractInput,{cookie}));
 assert.equal(contractResponse.headers.get('cache-control'),'no-store');
 const contract=await contractResponse.json();
 assert.equal(contract.policyVersion,birth.policyVersion);
 assert.equal(contract.amount,39900);
 assert.equal(contract.purchaseExpiresAt,paid.purchaseExpiresAt);
 assert.doesNotMatch(JSON.stringify(contract),/1988-10-08|live-fixture-payment|recoveryEmailHash|browserHash|checkoutToken/);
 const originalTermsUrl=process.env.LIVE_TERMS_URL;
 process.env.LIVE_TERMS_URL='https://policy.example.test/next-terms';
 assert.equal((await (await access(request(contractInput,{cookie}))).json()).policies.terms,originalTermsUrl);
 process.env.LIVE_TERMS_URL=originalTermsUrl;
 assert.equal(paid.purchaseExpiresAt,Date.parse(provider.approvedAt)+365*86400000);
 assert.equal(approvals.length,1);
 assert.equal((await report(request(null,{token:paid.token,url:testOrigin}))).status,403);

 process.env.PAYMENT_LIVE_SALES_ENABLED='false';
 assert.equal((await order(request(birth))).status,503);
 assert.equal((await access(request({orderId:first.orderId},{cookie}))).status,200);
 const open=await report(request(null,{token:paid.token}));
 assert.equal(open.status,200);
 assert.equal((await open.json()).chapters.length,26);
 const archiveConfig=process.env.LIVE_POLICY_ARCHIVE_JSON;
 delete process.env.LIVE_POLICY_ARCHIVE_JSON;
 assert.equal((await report(request(null,{token:paid.token}))).status,200);
 assert.equal((await access(request(contractInput,{cookie}))).status,200);
 process.env.LIVE_POLICY_ARCHIVE_JSON=archiveConfig;
 const disclosure=process.env.LIVE_MAIL_ORDER_NUMBER;
 delete process.env.LIVE_MAIL_ORDER_NUMBER;
 assert.equal((await report(request(null,{token:paid.token}))).status,200);
 process.env.LIVE_MAIL_ORDER_NUMBER=disclosure;
 const original=provider;
 provider={...original,mId:'other-merchant'};
 assert.equal((await report(request(null,{token:paid.token}))).status,403);
 provider=original;
 const recoveryInput={action:'request',orderId:first.orderId,email:birth.email};
 assert.equal((await recovery(request(recoveryInput))).status,202);
 assert.equal(mails.length,2);
 assert.deepEqual(mails[0],mails[1]);
 assert.deepEqual(mails[0].to,[birth.email]);
 const recoveryToken=mails[0].text.split('#').at(-1);
 const exchange=()=>recovery(request({action:'exchange',token:recoveryToken}));
 const exchanged=await exchange();
 assert.equal(exchanged.status,200);
 assert.equal((await exchanged.json()).paymentMode,'live');
 assert.equal((await exchange()).status,403);
 const event={eventType:'PAYMENT_STATUS_CHANGED',data:{orderId:first.orderId,paymentKey:call.paymentKey,status:'CANCELED'}};
 const hookUrl=origin+'/?key='+hookKey;
 assert.equal((await webhook(request(event))).status,403);
 assert.equal((await webhook(request(event,{url:hookUrl}))).status,200);
 assert.equal((await report(request(null,{token:paid.token}))).status,200); // body cannot revoke
 assert.equal((await webhook(request({...event,data:{...event.data,paymentKey:'different'}},{url:hookUrl}))).status,503);
 const refund={action:'refund',orderId:first.orderId,reason:'고객 요청'};
 assert.equal((await operations(request(refund))).status,403);
 delete process.env.PAYMENT_REFUNDS_APPROVED;
 assert.equal((await operations(request(refund,{token:operator}),{ip:'192.0.2.7'})).status,403);
 assert.equal(refunds.length,0);
 process.env.PAYMENT_REFUNDS_APPROVED='true';
 assert.equal((await operations(request(refund,{token:operator}),{ip:'192.0.2.7'})).status,200);
 assert.equal((await operations(request(refund,{token:operator}),{ip:'192.0.2.7'})).status,200);
 assert.equal(refunds.length,1);
 assert.equal((await webhook(request(event,{url:hookUrl}))).status,200);
 process.env.PAYMENT_WEBHOOK_PUBLIC='true';
 process.env.PAYMENT_WEBHOOK_ALLOWED_IPS='192.0.2.12';
 assert.equal((await webhook(request(event),{ip:'192.0.2.111'})).status,403);
 assert.equal((await webhook(request(event,{url:hookUrl}),{ip:'192.0.2.12'})).status,400);
 assert.equal((await webhook(request(event),{ip:'192.0.2.12'})).status,200);
 delete process.env.PAYMENT_WEBHOOK_PUBLIC;
 assert.equal((await report(request(null,{token:paid.token}))).status,403);
 assert.equal((await access(request({orderId:first.orderId},{cookie}))).status,403);
 assert.deepEqual(await (await access(request(contractInput,{cookie}))).json(),contract);
 const finance=[...records].filter(([key])=>key.includes('/finance/')).map(([,value])=>value);
 assert.deepEqual(finance.map(row=>row.status),['DONE','CANCELED']);
 assert.equal(finance[0].policyAcceptance.version,birth.policyVersion);
 assert.equal(finance.at(-1).transactionKey,'cancel-transaction');
 assert.doesNotMatch(JSON.stringify(finance),/1988-10-08|고객 요청/);
 const hash='a'.repeat(32)+':'+'b'.repeat(128);
 const mfa='cd'.repeat(20);
 Object.assign(process.env,{OPS_ADMIN_ENABLED:'true',OPS_LIVE_PASSWORD_HASH:hash,OPS_LIVE_TOTP_SECRET_HEX:mfa});
 const ip='192.0.2.7';
 const {id,session}=await createSession({store:adminStore('live'),hash,ip,mfa});
 const reissue={action:'contract-reissue',orderId:first.orderId,confirmation:first.orderId,identityVerified:true,reference:'CASE-test01'};
 const sendReissue=(body,csrf=session.csrf)=>admin(new Request(origin,{method:'POST',headers:{
  Cookie:'__Host-halmae-operator='+id,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf
 },body:JSON.stringify(body)}),{ip});
 assert.equal((await sendReissue(reissue,'invalid')).status,403);
 assert.equal((await sendReissue({...reissue,identityVerified:false})).status,403);
 assert.equal((await sendReissue({...reissue,confirmation:'different'})).status,403);
 records.delete('/halmae-live-orders/'+first.orderId);
 assert.equal((await access(request(contractInput,{cookie}))).status,403);
 assert.deepEqual(await (await sendReissue(reissue)).json(),contract);
 assert.equal(contract.policyOriginals.terms.text,'검수용 terms 원문');
 const reissueAudit=[...records.values()].find(record=>record.action==='contract-reissue');
 assert.equal(reissueAudit.reference,reissue.reference);
 assert.doesNotMatch(JSON.stringify(reissueAudit),/buyer@example|live-fixture-payment/);
});

test('운영 모의 부분 취소는 별도 거래에서 잔액과 무관하게 장부 권한을 차단한다',async t=>{
 configure();
 const records=new Map();
 let provider;
 t.mock.method(globalThis,'fetch',async (url,options)=>{
  const target=new URL(url);
  if(target.hostname==='blob.example.test'){
   const path=decodeURIComponent(target.pathname);
   if(options.method==='put'){
    if(new Headers(options.headers).get('if-none-match')==='*'&&records.has(path)) return new Response(null,{status:412});
    records.set(path,JSON.parse(options.body));return new Response(null,{status:200});
   }
   return records.has(path)?Response.json(records.get(path)):new Response(null,{status:404});
  }
  assert.equal(target.hostname,'api.tosspayments.com');
  if(target.pathname.endsWith('/confirm')){
   provider={...JSON.parse(options.body),mId:'merchant-fixture',currency:'KRW',method:'카드',status:'DONE',
    approvedAt:new Date().toISOString(),totalAmount:39900,balanceAmount:39900};
  }
  return provider?Response.json(provider):new Response(null,{status:404});
 });
 const ordered=await order(request({...birth,recoveryConsent:false}));
 assert.equal(ordered.status,200);
 const cookie=ordered.headers.get('set-cookie').split(';')[0];
 const {orderId,checkoutToken}=await ordered.json();
 const result=await payment(request({orderId,paymentKey:'mock-partial',amount:39900},{token:checkoutToken}));
 assert.equal(result.status,200);
 const {token}=await result.json();
 assert.equal((await report(request(null,{token}))).status,200);
 provider={...provider,status:'PARTIAL_CANCELED',balanceAmount:29900};
 assert.equal((await report(request(null,{token}))).status,403);
 assert.equal((await access(request({orderId},{cookie}))).status,403);
 assert.equal((await access(request({orderId,action:'contract'},{cookie}))).status,200);
});
