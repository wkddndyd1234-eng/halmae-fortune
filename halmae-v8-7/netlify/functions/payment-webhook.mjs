import {paidStatus,eligibleOrder,orderPattern,recordApproval} from './entitlement.mjs';
import {matchesCredential,matchesLivePayment,saveLiveSnapshot,liveRevoked} from './live-ledger.mjs';
import {paymentConfig} from './payment-config.mjs';
import {json,orders,parse} from './shared.mjs';
import {approvedPayment,findPayment} from './toss.mjs';

export default async req=>{
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 const config=paymentConfig(req);
 // The card event is only a trigger. All financial data comes from the authenticated order lookup.
 if(config?.mode!=='live' || !matchesCredential(new URL(req.url).searchParams.get('key'),process.env.PAYMENT_LIVE_WEBHOOK_KEY)){
  return json({error:'Webhook unavailable'},403);
 }
 const event=await parse(req);
 if(event?.eventType!=='PAYMENT_STATUS_CHANGED') return json({received:true});
 const {orderId,paymentKey}=event.data??{};
 if(typeof orderId!=='string' || !orderPattern.test(orderId) || typeof paymentKey!=='string' ||
    !paymentKey || paymentKey.length>200) return json({error:'Invalid payment event'},400);
 try{
  const store=orders(config);
  const order=await store.get(orderId,{type:'json'});
  if(!eligibleOrder(order,orderId,config)) return json({received:true});
  const payment=await findPayment(config,orderId);
  if(!matchesLivePayment(config,order,payment) || payment.paymentKey!==paymentKey){
   return json({error:'Payment verification pending'},503);
  }
  await saveLiveSnapshot(config,store,order,payment);
  if(order.status!==paidStatus(config) && approvedPayment(payment,orderId,paymentKey,config) && !await liveRevoked(store,order)){
   await recordApproval(store,order,payment,Date.now(),config);
  }
  return json({received:true});
 }catch{
  return json({error:'Payment synchronization pending'},503);
 }
};
