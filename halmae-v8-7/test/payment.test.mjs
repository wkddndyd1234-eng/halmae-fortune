import test from 'node:test';
import assert from 'node:assert/strict';
import order from '../netlify/functions/order.mjs';
import payment from '../netlify/functions/payment.mjs';
import demo from '../netlify/functions/demo-issue.mjs';
import report from '../netlify/functions/report.mjs';

const preview = 'https://test-v87--halmae-fortune-v87-preview.netlify.app';
const request = (body, token, origin=preview,extraHeaders={}) => new Request(origin+'/api',{
  method:body ? 'POST':'GET',
  headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...extraHeaders},
  body:body ? JSON.stringify(body):undefined,
});
const birth = {channel:'toss-test',birthDate:'2000-01-01',consent:true,gender:'male'};
const paymentKey = 'local-payment-key';

test('테스트 결제는 프리뷰, 명시적 테스트 모드, 테스트 키에서만 시작',async () => {
  Object.assign(process.env,{PAYMENT_MODE:'live',TOSS_TEST_CLIENT_KEY:'test_ck_local',
    TOSS_TEST_SECRET_KEY:'test_sk_local',REPORT_TOKEN_SECRET:'local-report-token-secret-with-32-characters'});
  assert.deepEqual(await (await payment(request())).json(),{enabled:false});
  process.env.PAYMENT_MODE = 'test';
  assert.deepEqual(await (await payment(request(null,null,'https://example.test'))).json(),{enabled:false});
  process.env.TOSS_TEST_SECRET_KEY = 'live_sk_local';
  assert.equal((await order(request(birth))).status,503);
  delete process.env.TOSS_TEST_SECRET_KEY;
  assert.equal((await order(request(birth))).status,503);
});

test('서버 승인과 현재 상태가 확인된 주문만 보고서를 발급하고 재열람',async t => {
  Object.assign(process.env,{
    PAYMENT_MODE:'test',TOSS_TEST_CLIENT_KEY:'test_ck_local',TOSS_TEST_SECRET_KEY:'test_sk_local',
    REPORT_TOKEN_SECRET:'local-report-token-secret-with-32-characters',DEMO_ACCESS_CODE:'local-demo-code',
    NETLIFY_BLOBS_CONTEXT:Buffer.from(JSON.stringify({
      siteID:'local',edgeURL:'https://blob.example.test',token:'local',
    })).toString('base64'),
  });
  const orders = new Map();
  let tossPayment;
  let nextApproval;
  let approvals = 0;
  const idempotency = [];
  const approvedAt = new Date().toISOString();
  t.mock.method(globalThis,'fetch',async (url,opts) => {
    const target = new URL(url);
    if (target.hostname === 'blob.example.test') {
      const key = target.pathname.split('/').at(-1);
      if (opts.method === 'put') {
        orders.set(key,JSON.parse(opts.body));
        return new Response(null,{status:200});
      }
      return orders.has(key) ? Response.json(orders.get(key)) : new Response(null,{status:404});
    }
    assert.equal(target.origin,'https://api.tosspayments.com');
    assert.equal(opts.headers.Authorization,'Basic '+Buffer.from('test_sk_local:').toString('base64'));
    if (target.pathname.endsWith('/confirm')) {
      approvals++;
      idempotency.push(opts.headers['Idempotency-Key']);
      assert.deepEqual(JSON.parse(opts.body),{orderId:o.orderId,paymentKey,amount:39900});
      if (!nextApproval) return new Response(null,{status:400});
      tossPayment = nextApproval;
      return Response.json(tossPayment);
    }
    assert.equal(target.pathname,'/v1/payments/orders/'+o.orderId);
    return tossPayment ? Response.json(tossPayment) : new Response(null,{status:404});
  });

  assert.deepEqual(await (await payment(request())).json(),{enabled:true,adminPreview:true});
  assert.deepEqual(await (await payment(request(null,null,'https://example.test'))).json(),{enabled:false});
  assert.equal((await order(request({...birth,consent:false}))).status,400);
  assert.equal((await order(request({...birth,calendarType:'lunar',isLeapMonth:true}))).status,400);
  const created = await order(request(birth));
  assert.equal(created.status,200);
  const o = await created.json();
  assert.equal(o.amount,39900);
  assert.equal(o.successUrl,preview+'/payment-result.html');
  assert.equal(orders.get(o.orderId).name,'손님');
  assert.equal(orders.get(o.orderId).gender,'male');
  assert.equal((await order(request({...birth,gender:''}))).status,400);
  assert.equal((await demo(request({orderId:o.orderId,code:process.env.DEMO_ACCESS_CODE}))).status,409);
  const payload = {orderId:o.orderId,paymentKey,amount:39900};

  assert.equal((await payment(request(payload))).status,403);
  assert.equal((await payment(request({...payload,orderId:'other'},o.checkoutToken))).status,403);
  assert.equal((await payment(request({...payload,amount:1},o.checkoutToken))).status,400);
  assert.equal((await report(request(null,o.checkoutToken))).status,403);
  assert.equal(approvals,0);
  assert.equal((await payment(request(payload,o.checkoutToken))).status,409);
  assert.equal(orders.get(o.orderId).status,'pending');

  nextApproval = {orderId:o.orderId,paymentKey,currency:'KRW',method:'카드',status:'DONE',
    totalAmount:39900,balanceAmount:39900,approvedAt};
  const approved = await Promise.all([
    payment(request(payload,o.checkoutToken)),payment(request(payload,o.checkoutToken)),
  ]);
  assert.ok(approved.every(response=>response.status===200));
  const [access,concurrentAccess] = await Promise.all(approved.map(response=>response.json()));
  assert.deepEqual(concurrentAccess,access);
  assert.equal(orders.get(o.orderId).status,'test-paid');
  assert.equal(orders.get(o.orderId).purchaseExpiresAt,Date.parse(approvedAt)+365*24*60*60*1000);
  assert.ok(approvals>=2 && approvals<=3);
  assert.equal(new Set(idempotency).size,1);
  const approvedAttempts = approvals;
  const retry = await payment(request(payload,o.checkoutToken));
  assert.deepEqual(await retry.json(),access);
  const cookie=created.headers.get('set-cookie').split(';')[0];
  const browserRequest=extra=>request(payload,null,preview,{Cookie:cookie,Origin:preview,...extra});
  assert.equal((await payment(browserRequest())).status,200);
  assert.equal((await payment(browserRequest({Origin:'https://example.test'}))).status,403);
  const saved=orders.get(o.orderId);
  orders.set(o.orderId,{...saved,createdAt:Date.now()-24*60*60*1000});
  assert.equal((await payment(browserRequest())).status,403);
  orders.set(o.orderId,saved);
  assert.equal(approvals,approvedAttempts);
  const book = await report(request(null,access.token));
  assert.equal(book.status,200);
  assert.equal((await book.json()).demo,false);
  assert.equal((await report(request(null,access.token,'https://example.test'))).status,403);
  for (const mismatch of [{status:'CANCELED'},{balanceAmount:29900},{currency:'USD'},
     {totalAmount:1},{method:'가상계좌'},{orderId:'other'},{paymentKey:'other'}]) {
    tossPayment = {...nextApproval,...mismatch};
    assert.equal((await report(request(null,access.token))).status,403);
  }
  assert.equal((await payment(request({...payload,paymentKey:'other'},o.checkoutToken))).status,409);
});
