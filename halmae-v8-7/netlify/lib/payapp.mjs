import {createHash,timingSafeEqual} from 'node:crypto';
import {validOrderAmount,ORDER_NAME} from '../functions/payment-config.mjs';

const endpoint='https://api.payapp.kr/oapi/v2';
const numericId=/^[1-9]\d{0,19}$/;
const terminal=new Set(['request-canceled','canceled','partial']);
const matches=(actual,expected)=>{
 if(typeof actual!=='string'||typeof expected!=='string'||!expected) return false;
 const a=Buffer.from(actual), b=Buffer.from(expected);
 return a.length===b.length && timingSafeEqual(a,b);
};
const digest=(userid,date,key)=>createHash('sha256').update(userid+date+key).digest('hex');
const kst=now=>new Date(now+9*3600000).toISOString().slice(0,19).replace(/\D/g,'');
function signedFields(config,now){
 const requestdate=kst(now);
 return {linkkey:config.linkkey,requestdate,hash:digest(config.userid,requestdate,config.requestkey)};
}

// The caller supplies transport. This module is not registered as a Netlify function.
async function call(config,fields,transport){
 const response=await transport(endpoint,{
  method:'POST',body:new URLSearchParams({...fields,userid:config.userid}),
  redirect:'error',signal:AbortSignal.timeout(5000),
 });
 if(!response.ok) throw Error('PayApp response unavailable');
 const body=new URLSearchParams(await response.text());
 if(body.get('state')!=='1') throw Error('PayApp rejected the request');
 return body;
}

export async function requestPayapp(config,order,phone,transport){
 if(!validOrderAmount(order.amount) || !/^010\d{8}$/.test(phone)) throw Error('Invalid PayApp order');
 const callback=new URL('/.netlify/functions/payapp-feedback',config.origin);
 const returnUrl=new URL('/payment-result.html',config.origin);
 returnUrl.searchParams.set('payapp','1');
 returnUrl.searchParams.set('orderId',order.orderId);
 const result=await call(config,{
  cmd:'payrequest',goodname:ORDER_NAME,price:String(order.amount),recvphone:phone,
  smsuse:'n',feedbackurl:callback.href,returnurl:returnUrl.href,
  var1:order.orderId,var2:order.reference,checkretry:'y',openpaytype:'card',
 },transport);
 const transactionId=result.get('mul_no');
 const url=new URL(result.get('payurl'));
 if(!numericId.test(transactionId??'')||url.protocol!=='https:'||url.username||url.password||url.port||
    !(url.hostname==='payapp.kr'||url.hostname.endsWith('.payapp.kr'))) throw Error('Invalid PayApp checkout response');
 return {transactionId,checkoutUrl:url.href};
}

export async function cancelPayapp(config,order,reason,transport,now=Date.now()){
 if(!validOrderAmount(order.amount) || !numericId.test(order.transactionId??'')||order.status!=='approved'||
    typeof reason!=='string'||!reason.trim()||reason.length>100) throw Error('Invalid PayApp cancellation');
 await call(config,{cmd:'paycancel',...signedFields(config,now),mul_no:order.transactionId,cancelmemo:reason,partcancel:'0'},transport);
 // Refund completion is confirmed through the provider notification.
}

export function reconcilePayapp(config,order,fields,now=Date.now()){
 const get=name=>{
  const values=fields.getAll(name);
  return values.length===1?values[0]:null;
 };
 const time=get('responsedate'), hash=get('hash');
 if(!/^\d{14}$/.test(time??'')||!matches(get('userid'),config.userid)||
    !matches(get('linkkey'),config.linkkey)||!matches(get('linkval'),config.linkval)||
    !matches(hash?.toLowerCase(),digest(config.userid,time,config.requestkey))||
    !validOrderAmount(order.amount)||get('var1')!==order.orderId||!matches(get('var2'),order.reference)) return null;
 const state=get('pay_state');
 const partial=['70','71'].includes(state);
 const amount=get('price');
 const transactionId=get('mul_no');
 if(!numericId.test(transactionId??'')||!numericId.test(amount??'')||
    order.transactionId!==(partial?get('orig_mul_no'):transactionId)||
    (partial?(get('orig_price')!==String(order.amount)||Number(amount)>=order.amount):amount!==String(order.amount))) return null;
 if(partial && ['approved','partial'].includes(order.status)){
  if(transactionId===order.transactionId) return null;
  const previous=order.partialCancellations??(order.partialCancellation?[order.partialCancellation]:[]);
  const value=Number(amount);
  const duplicate=previous.find(item=>item.transactionId===transactionId);
  if(duplicate) return duplicate.amount===value?order:null;
  const total=previous.reduce((sum,item)=>sum+item.amount,value);
  if(total>order.amount) return null;
  return {...order,status:total===order.amount?'canceled':'partial',cancellationObservedAt:now,
   partialCancellations:[...previous,{transactionId,amount:value}]};
 }
 if(terminal.has(order.status)){
  if(order.status==='partial' && ['9','64'].includes(state)) return {...order,status:'canceled',cancellationObservedAt:now};
  return order;
 }
 if(['9','64'].includes(state)) return {...order,status:'canceled',cancellationObservedAt:now};
 if(partial) return {...order,status:'partial',cancellationObservedAt:now,partialCancellation:{transactionId,amount:Number(amount)}};
 if(['8','32'].includes(state)) return order.status==='pending'?{...order,status:'request-canceled'}:order;
 if(['1','10'].includes(state)) return order;
 if(state!=='4'||get('pay_type')!=='1') return null;
 if(order.status==='approved') return order;
 const date=get('pay_date')?.replace(' ','T');
 const approved= /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date??'')?Date.parse(date+'+09:00'):NaN;
 if(!Number.isFinite(approved)||approved>now+5*60_000||approved<order.createdAt-5*60_000) return null;
 return {...order,status:'approved',approvedAt:new Date(approved).toISOString(),purchaseExpiresAt:approved+365*86400000};
}

export function payappEntitled(order,now=Date.now()){
 return ['approved','partial'].includes(order?.status) && Number.isFinite(Date.parse(order.approvedAt)) &&
  Number.isSafeInteger(order.purchaseExpiresAt) && order.purchaseExpiresAt>now;
}

// Persist a single checkout attempt before calling the provider. An ambiguous
// timeout requires reconciliation, because payrequest has no documented idempotency key.
export async function startPayappOrder(store,config,order,phone,transport){
 const key='payapp/order/'+order.orderId;
 const pending={...order,status:'requesting'};
 const inserted=await store.setJSON(key,pending,{onlyIfNew:true});
 if(!inserted.modified){
  const current=await store.get(key,{type:'json'});
  if(current?.status==='pending'&&current.reference===order.reference) return current;
  throw Error('PayApp order requires reconciliation');
 }
 const checkout=await requestPayapp(config,pending,phone,transport);
 const result={...pending,...checkout,status:'pending'};
 await store.setJSON(key,result);
 return result;
}

export async function acceptPayappFeedback(store,config,fields,now=Date.now()){
 const id=fields.get('var1');
 if(!/^HM-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id??'')) return false;
 const key='payapp/order/'+id;
 const current=await store.getWithMetadata(key,{type:'json'});
 if(!current||current.data.status==='requesting') return false;
 const updated=reconcilePayapp(config,current.data,fields,now);
 if(!updated) return false;
 if(updated===current.data) return true;
 return (await store.setJSON(key,updated,{onlyIfMatch:current.etag})).modified;
}
