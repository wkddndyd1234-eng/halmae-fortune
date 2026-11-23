import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{purgePreviewRecords} from '../netlify/functions/preview-retention.mjs';
import {DAY} from '../netlify/functions/payment-config.mjs';

const id = n => 'HM-00000000-0000-0000-0000-'+String(n).padStart(12,'0');

test('보존 작업은 만료된 프리뷰 기록만 지우고 복구 가능한 승인 건은 보존한다',async t=>{
  process.env.REPORT_TOKEN_SECRET='local-retention-test-secret-with-32-characters';
  const now=Date.now();
  const old=now-31*DAY;
  const approved=id(4);
  const pending={channel:'toss-test',status:'pending',amount:39900,createdAt:old};
  const records=new Map([
    [id(1),{channel:'admin-demo',status:'demo',createdAt:old}],
    [id(2),{channel:'toss-test',status:'test-paid',purchaseExpiresAt:now}],
    [id(3),{channel:'toss-test',status:'test-paid',purchaseExpiresAt:now+1}],
    [approved,{...pending,orderId:approved}],
    [id(5),{...pending,orderId:id(5)}],
    [id(6),{channel:'live',status:'pending',createdAt:old}],
    ['recovery/rate/old',{expiresAt:now-DAY-1}],
    ['recovery/used/recent',{expiresAt:now-1}],
    [id(7),{...pending,orderId:id(7)}],
  ]);
  const store={
    async *list(){yield {blobs:[...records.keys()].map(key=>({key}))};},
    get:key=>records.get(key),
    setJSON:(key,value)=>records.set(key,value),
    delete:key=>records.delete(key),
  };
  t.mock.method(globalThis,'fetch',async url=>{
    const orderId=new URL(url).pathname.split('/').at(-1);
    if(orderId===id(7)) return new Response(null,{status:503});
    if(orderId!==approved) return new Response(null,{status:404});
    return Response.json({orderId,paymentKey:'local-paid',status:'DONE',currency:'KRW',method:'카드',
      totalAmount:39900,balanceAmount:39900,approvedAt:new Date(old).toISOString()});
  });
  assert.deepEqual(await purgePreviewRecords(store,{secretKey:'test-local'},now),{deleted:4,failed:1});
  assert.deepEqual([...records.keys()],[id(3),approved,id(6),'recovery/used/recent',id(7)]);
  assert.equal(records.get(approved).status,'test-paid');
});

test('예약 작업은 다른 프로젝트나 브랜치에서 실행되지 않는다',async()=>{
  Object.assign(process.env,{PREVIEW_RETENTION_ENABLED:'true',BRANCH:'main',URL:'https://halmae-fortune-v87-preview.netlify.app'});
  assert.deepEqual(await (await handler()).json(),{enabled:false});
  process.env.BRANCH='test-v87';
  process.env.URL='https://example.test';
  assert.deepEqual(await (await handler()).json(),{enabled:false});
});
