import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {requestPayapp,cancelPayapp,reconcilePayapp,payappEntitled,startPayappOrder,acceptPayappFeedback} from '../netlify/lib/payapp.mjs';
import {sendContractCopy} from '../netlify/lib/contract-delivery.mjs';

const config={origin:'https://example.test',userid:'fixture',linkkey:'link-fixture',linkval:'value-fixture',requestkey:'request-fixture'};
const now=Date.parse('2026-11-27T05:00:00Z');
const order={orderId:'HM-01234567-abcd-abcd-abcd-0123456789ab',reference:'fixture-reference',transactionId:'23',amount:39900,status:'pending',createdAt:now-1000};
const hash=(date)=>createHash('sha256').update(config.userid+date+config.requestkey).digest('hex');
function notification(changes={}){
 const responsedate='20261127140000';
 return new URLSearchParams({userid:config.userid,linkkey:config.linkkey,linkval:config.linkval,responsedate,
  hash:hash(responsedate),price:'39900',var1:order.orderId,var2:order.reference,mul_no:'23',pay_state:'4',pay_type:'1',
  pay_date:'2026-11-27 14:00:00',...changes});
}

test('PayApp requests fixed product price, explicit return and feedback paths, and complete cancellation',async()=>{
 const transport=async(url,{body})=>{
  assert.equal(url,'https://api.payapp.kr/oapi/v2');
  if(body.get('cmd')==='paycancel'){
   assert.equal(body.get('partcancel'),'0');
   assert.equal(body.get('mul_no'),'23');
   assert.equal(body.get('hash'),hash('20261127140000'));
   return new Response('state=1');
  }
  assert.equal(body.get('price'),'39900');
  assert.equal(body.get('smsuse'),'n');
  assert.match(body.get('returnurl'),/payapp=1/);
  assert.equal(body.get('var1'),order.orderId);
  return new Response('state=1&mul_no=23&payurl=https%3A%2F%2Fpayapp.kr%2Fmock');
 };
 const checkout=await requestPayapp(config,order,'01000000000',transport);
 assert.equal(checkout.transactionId,'23');
 await assert.rejects(requestPayapp(config,{...order,amount:1},'01000000000',transport));
 await cancelPayapp(config,{...order,status:'approved'},'모의 검수',transport,now);
});

test('PayApp validation checks the original transaction and suppresses duplicate approval and reactivation',()=>{
 for(const changes of [{hash:'incorrect'},{price:'39000'},{mul_no:'24'},{var1:'other'},{var2:'other'},{pay_type:'7'}]){
  assert.equal(reconcilePayapp(config,order,notification(changes),now),null);
 }
 const approved=reconcilePayapp(config,order,notification(),now);
 assert.ok(payappEntitled(approved,now));
 assert.equal(approved.purchaseExpiresAt,now+365*86400000);
 assert.equal(reconcilePayapp(config,approved,notification(),now),approved);
 assert.equal(payappEntitled(approved,approved.purchaseExpiresAt),false);
 const partial=reconcilePayapp(config,approved,notification({pay_state:'70',orig_mul_no:'23',orig_price:'39900',mul_no:'24',price:'1000'}),now);
 const canceled=reconcilePayapp(config,partial,notification({pay_state:'9'}),now);
 for(const terminal of [partial,canceled]){
  assert.equal(payappEntitled(terminal,now),false);
  assert.equal(reconcilePayapp(config,terminal,notification(),now),terminal);
 }
});

test('PayApp retries reuse a saved checkout and duplicate feedback leaves one approval',async()=>{
 let state,etag=0,requests=0;
 const store={
  get:async()=>state,getWithMetadata:async()=>({data:state,etag}),
  setJSON:async(key,data,options={})=>{
   if(options.onlyIfNew&&state || options.onlyIfMatch!==undefined&&options.onlyIfMatch!==etag) return {modified:false};
   state=data;etag++;return {modified:true};
  },
 };
 const transport=async()=>{
  requests++;
  return new Response('state=1&mul_no=23&payurl=https%3A%2F%2Fpayapp.kr%2Fmock');
 };
 await startPayappOrder(store,config,order,'01000000000',transport);
 await startPayappOrder(store,config,order,'01000000000',transport);
 assert.equal(requests,1);
 assert.equal(await acceptPayappFeedback(store,config,notification(),now),true);
 const revision=etag;
 assert.equal(await acceptPayappFeedback(store,config,notification(),now),true);
 assert.equal(etag,revision);
});

test('transactional contract retry uses the same delivery key and stops on permanent errors',async()=>{
 const document={...order,product:'운명 장부 26장',approvedAt:new Date(now).toISOString(),purchaseExpiresAt:now+365*86400000,
  seller:{name:'합성 판매자'},policyOriginals:{terms:{text:'가상 약관'},privacy:{text:'가상 방침'},refund:{text:'가상 환불'}},
  withdrawal:'가상 환불 안내',delivery:'365일'};
 const sent=[];
 const mail={key:'mock',from:'sender@example.test',to:'buyer@example.test',document};
 const result=await sendContractCopy(mail,async(url,options)=>{
  sent.push([options.headers['Idempotency-Key'],options.body]);
  return new Response(null,{status:sent.length===1?503:200});
 });
 assert.deepEqual(result,{state:'accepted',attempt:2});
 assert.deepEqual(sent[0],sent[1]);
 assert.match(JSON.parse(sent[0][1]).text,/가상 약관/);
 assert.deepEqual(await sendContractCopy(mail,async()=>new Response(null,{status:400})),{state:'customer-support',attempt:1});
});

test('contract sender uses the authenticated sending domain and routes replies to the business Naver inbox',async()=>{
 const document={...order,product:'운명 장부 26장',approvedAt:new Date(now).toISOString(),
  purchaseExpiresAt:now+365*86400000,seller:{name:'합성 판매자'},delivery:'365일',withdrawal:'가상 환불',
  policyOriginals:{terms:{text:'가상 약관'},privacy:{text:'가상 방침'},refund:{text:'가상 환불'}}};
 const result=await sendContractCopy({key:'mock',from:'orders@example.test',to:'buyer@example.test',document},async(_url,{body})=>{
  const payload=JSON.parse(body);
  assert.equal(payload.from,'할매의 운명방 <orders@example.test>');
  assert.equal(payload.reply_to,'valueseeker123@naver.com');
  assert.deepEqual(payload.to,['buyer@example.test']);
  return new Response(null,{status:200});
 });
 assert.deepEqual(result,{state:'accepted',attempt:1});
});
