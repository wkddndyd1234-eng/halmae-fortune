import test from 'node:test';
import assert from 'node:assert/strict';
import order from '../netlify/functions/order.mjs';
import recovery from '../netlify/functions/recovery.mjs';
import payment from '../netlify/functions/payment.mjs';
import report from '../netlify/functions/report.mjs';
import {sign} from '../netlify/functions/shared.mjs';
import access from '../netlify/functions/access.mjs';
import {PURCHASE_DURATION,REPORT_SCOPE,reportLink} from '../netlify/functions/entitlement.mjs';
import {DAY} from '../netlify/functions/payment-config.mjs';
import {checkoutKey,callbackKey,reportKey,clearPurchaseStorage} from '../purchase.js';

const preview = 'https://test-v87--halmae-fortune-v87-preview.netlify.app';
const request = (body,token,origin=preview,cookie) => new Request(origin,{
  method:body?'POST':'GET',
  headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(cookie?{Cookie:cookie}:{})},
  body:body?JSON.stringify(body):undefined,
});

test('메일 복구는 주문 주소의 수신자만 사용하며 새 브라우저에서 토스 승인을 다시 확인한다',async t=>{
  Object.assign(process.env,{
    PAYMENT_MODE:'test',TOSS_TEST_CLIENT_KEY:'test_ck_local',TOSS_TEST_SECRET_KEY:'test_sk_local',
    REPORT_TOKEN_SECRET:'local-recovery-test-secret-with-32-characters',
    RECOVERY_FROM_EMAIL:'sender@example.test',
    NETLIFY_BLOBS_CONTEXT:Buffer.from(JSON.stringify({siteID:'test',edgeURL:'https://blob.example.test',token:'fake'})).toString('base64'),
  });
  delete process.env.RECOVERY_RESEND_API_KEY;
  assert.deepEqual(await (await recovery(request())).json(),{enabled:false});
  assert.equal((await recovery(request({action:'request'}))).status,503);
  const records = new Map();
  const mails = [];
  const provider = new Map();
  t.mock.method(globalThis,'fetch',async (url,opts)=>{
    const {hostname,pathname}=new URL(url);
    const key=decodeURIComponent(pathname.split('/').at(-1));
    if(hostname==='blob.example.test'){
      if(opts.method==='put'){
        if (new Headers(opts.headers).get('if-none-match')==='*' && records.has(key)) return new Response(null,{status:412});
        records.set(key,JSON.parse(opts.body)); return new Response(null,{status:200});
      }
      if(opts.method==='delete'){records.delete(key);return new Response(null,{status:200});}
      return records.has(key)?Response.json(records.get(key)):new Response(null,{status:404});
    }
    if(hostname==='api.resend.com'){
      assert.equal(opts.headers.Authorization,'Bearer mail-local');
      mails.push({id:opts.headers['Idempotency-Key'],...JSON.parse(opts.body)});
      return Response.json({id:'mock-mail'});
    }
    assert.equal(hostname,'api.tosspayments.com');
    assert.ok(pathname.startsWith('/v1/payments/orders/'));
    return provider.has(key)?Response.json(provider.get(key)):new Response(null,{status:404});
  });

  const birth={channel:'toss-test',consent:true,birthDate:'2000-01-01',gender:'female'};
  const email='buyer@example.test';
  const noConfig=await (await order(request({...birth,email,recoveryConsent:true}))).json();
  assert.equal(records.get(noConfig.orderId).recoveryEmailHash,undefined);
  process.env.RECOVERY_RESEND_API_KEY='mail-local';
  assert.deepEqual(await (await payment(request())).json(),{enabled:true,recoveryEnabled:true});
  assert.equal((await recovery(request(null,null,'https://example.test'))).status,200);
  const nonOptInResponse=await order(request({...birth,email}));
  const nonOptInCookie=nonOptInResponse.headers.get('set-cookie').split(';')[0];
  const notOptedIn=await nonOptInResponse.json();
  assert.equal(records.get(notOptedIn.orderId).recoveryEmailHash,undefined);
  assert.equal((await order(request({...birth,email:'invalid',recoveryConsent:true}))).status,400);

  const created=await order(request({...birth,email,recoveryConsent:true}));
  const cookie=created.headers.get('set-cookie').split(';')[0];
  assert.match(created.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict/);
  const checkout=await created.json();
  const {orderId}=checkout;
  assert.equal(records.get(orderId).recoveryEmail,undefined);
  assert.match(records.get(orderId).recoveryEmailHash,/^[a-f0-9]{64}$/);
  const recoveryRequest=(address,id=orderId)=>recovery(request({action:'request',orderId:id,email:address}));
  assert.deepEqual(await (await recoveryRequest('other@example.test')).json(),{accepted:true});
  assert.equal(mails.length,0);
  assert.equal((await recoveryRequest(email,notOptedIn.orderId)).status,202);
  assert.equal(mails.length,0);

  // An early recovery request can arrive before Toss finalizes approval.
  assert.equal((await recoveryRequest(email)).status,202);
  assert.equal(mails.length,0);
  assert.equal(records.size,3);

  const paid={orderId,paymentKey:'key-local',status:'DONE',currency:'KRW',method:'카드',
    totalAmount:39900,balanceAmount:39900,approvedAt:new Date(Date.now()-364*DAY).toISOString()};
  provider.set(orderId,paid);
  provider.set(notOptedIn.orderId,{...paid,orderId:notOptedIn.orderId,paymentKey:'other-order-key'});
  assert.equal((await access(request({orderId:notOptedIn.orderId},null,preview,nonOptInCookie))).status,200);
  assert.equal((await access(request({orderId:notOptedIn.orderId},null,preview,cookie))).status,403);
  assert.equal((await recoveryRequest(email,notOptedIn.orderId)).status,202);
  assert.equal(mails.length,0);
  const requests=await Promise.all([recoveryRequest(email),recoveryRequest(email)]);
  assert.ok(requests.every(r=>r.status===202));
  assert.equal(mails.length,1);
  assert.deepEqual(mails[0].to,[email]);
  assert.doesNotMatch(mails[0].text,/2000-01-01|paymentKey/);
  const token=mails[0].text.split('#').at(-1);
  const exchange=value=>recovery(request({action:'exchange',token:value}));
  assert.equal((await exchange(checkout.checkoutToken)).status,403);
  assert.equal((await report(request(null,token))).status,403);
  const expired=sign({orderId,scope:'toss-test-recovery-v2',exp:Date.now()-1});
  assert.equal((await exchange(expired)).status,403);
  const attempts=await Promise.all([exchange(token),exchange(token)]);
  assert.deepEqual(attempts.map(r=>r.status).sort(),[200,403]);
  const accessLink=await attempts.find(r=>r.ok).json();
  assert.equal(accessLink.purchaseExpiresAt,Date.parse(paid.approvedAt)+PURCHASE_DURATION);
  assert.equal(records.get(orderId).purchaseExpiresAt,accessLink.purchaseExpiresAt);
  assert.ok(accessLink.expiresAt<=Date.now()+30*60_000);
  assert.equal((await report(request(null,accessLink.token))).status,200);
  assert.equal((await exchange(token)).status,403);
  assert.equal((await access(request({orderId}))).status,403);
  assert.equal((await access(request({orderId},null,preview,cookie))).status,200);
  const logout=await access(request({action:'forget'},null,preview,cookie));
  assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
  for (const mismatch of [{status:'CANCELED'},{status:'PARTIAL_CANCELED',balanceAmount:100},{totalAmount:1}]){
    provider.set(orderId,{...paid,...mismatch});
    assert.equal((await access(request({orderId},null,preview,cookie))).status,403);
    assert.equal((await report(request(null,accessLink.token))).status,403);
  }
  provider.set(orderId,paid);
  const old=sign({orderId,scope:'toss-test-report',exp:Date.now()+DAY});
  assert.equal((await report(request(null,old))).status,403);
  provider.set(orderId,{...paid,approvedAt:new Date(Date.now()-PURCHASE_DURATION-1).toISOString()});
  records.get(orderId).approvedAt=provider.get(orderId).approvedAt;
  records.get(orderId).purchaseExpiresAt=Date.parse(provider.get(orderId).approvedAt)+PURCHASE_DURATION;
  assert.equal((await access(request({orderId},null,preview,cookie))).status,403);
  assert.equal((await report(request(null,accessLink.token))).status,403);
});

test('브라우저 삭제는 주문, 승인 재시도, 보고서, 카운터 키를 제거한다',t=>{
  const keys = [checkoutKey,callbackKey,reportKey,'halmae-conversion-counts'];
  const session = new Map([...keys,'unrelated'].map(key=>[key,'stored']));
  const original = Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{removeItem:key=>session.delete(key)}});
  t.after(()=>{
    if (original) Object.defineProperty(globalThis,'sessionStorage',original);
    else delete globalThis.sessionStorage;
  });
  clearPurchaseStorage();
  assert.deepEqual([...session.keys()],['unrelated']);
});


test('권한 만료 직전 링크는 권한 만료로 제한되며 정확한 시각부터 발급하지 않는다',()=>{
  process.env.REPORT_TOKEN_SECRET='local-boundary-test-secret-with-32-characters';
  const now=Date.now();
  const order={orderId:'HM-test',purchaseExpiresAt:now+1};
  const link=reportLink(order,now);
  assert.equal(link.expiresAt,now+1);
  assert.ok(link.token);
  assert.equal(reportLink(order,now+1),null);
  assert.equal(reportLink(order,now+2),null);
  assert.equal(REPORT_SCOPE,'toss-test-report-v2');
});
