import test from 'node:test';
import assert from 'node:assert/strict';
import order from '../netlify/functions/order.mjs';
import recovery from '../netlify/functions/recovery.mjs';
import payment from '../netlify/functions/payment.mjs';
import report from '../netlify/functions/report.mjs';
import {sign} from '../netlify/functions/shared.mjs';
import {DAY} from '../netlify/functions/payment-config.mjs';
import {checkoutKey,callbackKey,reportKey,clearPurchaseStorage} from '../purchase.js';

const preview = 'https://test-v87--halmae-fortune-v87-preview.netlify.app';
const request = (body,token,origin=preview) => new Request(origin,{
  method:body?'POST':'GET',
  headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
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
    const key=pathname.split('/').at(-1);
    if(hostname==='blob.example.test'){
      if(opts.method==='put'){ records.set(key,JSON.parse(opts.body)); return new Response(null,{status:200}); }
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

  const birth={channel:'toss-test',consent:true,birthDate:'2000-01-01'};
  const email='buyer@example.test';
  const noConfig=await (await order(request({...birth,email,recoveryConsent:true}))).json();
  assert.equal(records.get(noConfig.orderId).recoveryEmail,undefined);
  process.env.RECOVERY_RESEND_API_KEY='mail-local';
  assert.deepEqual(await (await payment(request())).json(),{enabled:true,recoveryEnabled:true});
  assert.equal((await recovery(request(null,null,'https://example.test'))).status,200);
  const notOptedIn=await (await order(request({...birth,email}))).json();
  assert.equal(records.get(notOptedIn.orderId).recoveryEmail,undefined);
  assert.equal((await order(request({...birth,email:'invalid',recoveryConsent:true}))).status,400);

  const checkout=await (await order(request({...birth,email,recoveryConsent:true}))).json();
  const {orderId}=checkout;
  const recoveryRequest=(address)=>recovery(request({action:'request',orderId,email:address}));
  assert.deepEqual(await (await recoveryRequest('other@example.test')).json(),{accepted:true});
  assert.equal(mails.length,0);
  assert.equal((await recoveryRequest(email)).status,202);
  assert.equal((await recoveryRequest(email)).status,202);
  assert.equal(mails.length,2);
  assert.equal(mails[0].id,mails[1].id);
  assert.deepEqual(mails[0].to,[email]);
  assert.doesNotMatch(mails[0].text,/2000-01-01|paymentKey/);
  const token=mails[0].text.split('#').at(-1);
  const exchange=value=>recovery(request({action:'exchange',token:value}));
  assert.equal((await exchange(token)).status,403);
  assert.equal((await exchange(checkout.checkoutToken)).status,403);
  assert.equal((await report(request(null,token))).status,403);
  const expired=sign({orderId,scope:'toss-test-recovery',exp:Date.now()-1});
  assert.equal((await exchange(expired)).status,403);

  const paid={orderId,paymentKey:'key-local',status:'DONE',currency:'KRW',method:'카드',
    totalAmount:39900,balanceAmount:39900,approvedAt:new Date().toISOString()};
  provider.set(orderId,paid);
  const recovered=await exchange(token);
  assert.equal(recovered.status,200);
  const access=await recovered.json();
  assert.equal(access.orderId,orderId);
  assert.equal(records.get(orderId).status,'test-paid');
  assert.equal((await report(request(null,access.token))).status,200);
  provider.set(orderId,{...paid,status:'PARTIAL_CANCELED',balanceAmount:100});
  assert.equal((await exchange(token)).status,403);
  assert.equal((await report(request(null,access.token))).status,403);
  provider.set(orderId,{...paid,approvedAt:new Date(Date.now()-8*DAY).toISOString()});
  assert.equal((await exchange(token)).status,403);
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
