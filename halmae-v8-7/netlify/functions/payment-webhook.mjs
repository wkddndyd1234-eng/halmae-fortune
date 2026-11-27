import {fingerprint,paidStatus,eligibleOrder,orderPattern,recordApproval} from './entitlement.mjs';
import {matchesCredential,matchesLivePayment,saveLiveSnapshot,liveRevoked} from './live-ledger.mjs';
import {paymentConfig} from './payment-config.mjs';
import {adminStore,json,orders} from './shared.mjs';
import {allowedOperatorIp,boundedJson} from '../lib/ops-access.mjs';
import {rateAllowed} from '../lib/admin-auth.mjs';
import {approvedPayment,findPayment} from './toss.mjs';

export default async (req,context)=>{
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 const config=paymentConfig(req,'toss');
 // The card event is only a trigger. All financial data comes from the authenticated order lookup.
 const publicMode=process.env.PAYMENT_WEBHOOK_PUBLIC==='true';
 if(config?.mode!=='live' || !publicMode && !matchesCredential(new URL(req.url).searchParams.get('key'),process.env.PAYMENT_LIVE_WEBHOOK_KEY)){
  return json({error:'Webhook unavailable'},403);
 }
 if(publicMode&&!allowedOperatorIp(context?.ip,process.env.PAYMENT_WEBHOOK_ALLOWED_IPS)) return json({error:'Webhook unavailable'},403);
 if(publicMode&&new URL(req.url).search) return json({error:'Invalid webhook URL'},400);
 const event=await boundedJson(req);
 if(!event) return json({error:'Invalid webhook body'},400);
 if(event?.eventType!=='PAYMENT_STATUS_CHANGED') return json({received:true});
 const {orderId,paymentKey}=event.data??{};
 if(typeof orderId!=='string' || !orderPattern.test(orderId) || typeof paymentKey!=='string' ||
    !paymentKey || paymentKey.length>200) return json({error:'Invalid payment event'},400);
 const ops=publicMode?adminStore('live'):null;
 try{
  if(publicMode && !await rateAllowed(ops,'webhook-source/'+(context?.ip??'unavailable'),24,60_000)){
   return json({error:'Payment synchronization pending'},503);
  }
  const store=orders(config);
  const order=await store.get(orderId,{type:'json'});
  if(!eligibleOrder(order,orderId,config)) return json({received:true});
  const binding=publicMode?await store.get('approval/'+orderId,{type:'json'}):null;
  if(publicMode && (order.paymentKey && order.paymentKey!==paymentKey ||
    binding && binding.digest!==fingerprint('approval-key',paymentKey,config))) return json({received:true});
  if(publicMode && !await rateAllowed(ops,'webhook/'+orderId,6)){
   return json({error:'Payment synchronization pending'},503);
  }
  const payment=await findPayment(config,orderId);
  if(!matchesLivePayment(config,order,payment) || payment.paymentKey!==paymentKey){
   if(publicMode) await ops.setJSON('webhook/issue/'+orderId,{at:Date.now()});
   return json({error:'Payment verification pending'},503);
  }
  await saveLiveSnapshot(config,store,order,payment);
  if(order.status!==paidStatus(config) && approvedPayment(payment,orderId,paymentKey,config) && !await liveRevoked(store,order)){
   await recordApproval(store,order,payment,Date.now(),config);
  }
  if(publicMode) await ops.delete('webhook/issue/'+orderId);
  return json({received:true});
 }catch{
  if(publicMode) await ops.setJSON('webhook/issue/'+orderId,{at:Date.now()}).catch(()=>{});
  return json({error:'Payment synchronization pending'},503);
 }
};
