import test from 'node:test';
import assert from 'node:assert/strict';
import createOrder from '../netlify/functions/order.mjs';
import issueDemo from '../netlify/functions/demo-issue.mjs';
import getReport from '../netlify/functions/report.mjs';
import {sign} from '../netlify/functions/shared.mjs';

const birth = {name:'테스트', consent:true, birthDate:'2000-01-01', gender:'female'};
const demoCode = 'local-demo-code';
const reportSecret = 'local-test-signing-secret-32-characters';
const post = body => new Request('https://example.test', {
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify(body),
});
const report = token => getReport(new Request('https://example.test', {
  headers:token ? {Authorization:'Bearer '+token} : {},
}));

test('양력 테스트 주문과 관리자 보고서 발급만 허용', async t => {
  const records = new Map();
  t.mock.method(globalThis,'fetch',async (url,options) => {
    const key = new URL(url).pathname.split('/').at(-1);
    if(options.method === 'put'){
      records.set(key,JSON.parse(options.body));
      return new Response(null,{status:200});
    }
    assert.equal(options.method,'get');
    return records.has(key) ? Response.json(records.get(key)) : new Response(null,{status:404});
  });
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({
    siteID:'local-test-site', edgeURL:'https://blobs.example.test', token:'local-token',
  })).toString('base64');
  delete process.env.DEMO_ACCESS_CODE;
  delete process.env.REPORT_TOKEN_SECRET;

  assert.equal((await createOrder(post({...birth,calendarType:'lunar',isLeapMonth:true}))).status,400);
  assert.equal((await createOrder(post({...birth,isLeapMonth:true}))).status,400);
  assert.equal(records.size,0);

  const created = await createOrder(post({...birth,amount:1,status:'paid'}));
  assert.equal(created.status,200);
  const {orderId,...summary} = await created.json();
  assert.deepEqual(summary,{amount:39900,status:'pending',paymentEnabled:false});
  assert.equal(records.get(orderId).amount,39900);
  assert.equal((await issueDemo(post({orderId,code:demoCode}))).status,503);

  process.env.DEMO_ACCESS_CODE = demoCode;
  assert.equal((await issueDemo(post({orderId,code:'wrong-code'}))).status,403);
  assert.equal((await issueDemo(post({orderId,code:demoCode}))).status,500);
  assert.equal(records.get(orderId).status,'pending');

  process.env.REPORT_TOKEN_SECRET = reportSecret;
  const payload = {scope:'report',exp:Date.now()+60_000};
  records.set('old-paid',{...birth,orderId:'old-paid',status:'paid'});
  assert.equal((await issueDemo(post({orderId:'old-paid',code:demoCode}))).status,409);
  assert.equal((await report()).status,403);
  assert.equal((await report(sign({...payload,orderId:'old-paid',demo:false}))).status,403);
  assert.equal((await report(sign({...payload,orderId:'old-paid',demo:true}))).status,403);

  const issued = await issueDemo(post({orderId,code:demoCode}));
  assert.equal(issued.status,200);
  const {token} = await issued.json();
  const result = await report(token);
  assert.equal(result.status,200);
  assert.equal(result.headers.get('cache-control'),'no-store');
  const book = await result.json();
  assert.equal(book.demo,true);
  assert.equal(book.meta.solarDate,birth.birthDate);
  assert.equal(book.chapters.length,26);
  assert.equal(book.meta.weekday,'토요일');

  const lunarOrder=await createOrder(post({...birth,birthDate:'2023-02-01',calendarType:'lunar',isLeapMonth:true}));
  assert.equal(lunarOrder.status,200);
  const lunarId=(await lunarOrder.json()).orderId;
  const tokenResponse=await issueDemo(post({orderId:lunarId,code:demoCode}));
  const lunarBook=await (await report((await tokenResponse.json()).token)).json();
  assert.equal(lunarBook.meta.solarDate,'2023-03-22');
  assert.equal(lunarBook.meta.isLeapMonth,true);

  records.set('old-demo',{...birth,birthDate:'2024-01-01',solarDate:'2024-02-10',
    calendarType:'lunar',orderId:'old-demo',status:'demo',gender:undefined});
  const legacy = await report(sign({...payload,orderId:'old-demo',demo:true}));
  assert.equal(legacy.status,200);
  const older=await legacy.json();
  assert.equal(older.meta.solarDate,'2024-02-10');
  assert.match(older.chapters[12].lead,/성별 기록이 없어요/);
});
