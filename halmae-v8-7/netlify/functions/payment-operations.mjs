import {createHash} from 'node:crypto';
import {eligibleOrder,orderPattern,recordApproval} from './entitlement.mjs';
import {matchesCredential,isCancelled,liveRevoked,matchesLivePayment,saveLiveSnapshot} from './live-ledger.mjs';
import {paymentConfig} from './payment-config.mjs';
import {json,orders,parse} from './shared.mjs';
import {approvedPayment,cancelPayment,findPayment} from './toss.mjs';

export default async req=>{
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 const config=paymentConfig(req);
 if(config?.mode!=='live' || !matchesCredential(req.headers.get('authorization')?.replace(/^Bearer /,''),
    process.env.PAYMENT_LIVE_OPERATOR_TOKEN)) return json({error:'Operations unavailable'},403);
 const {action,orderId,reason}=await parse(req)??{};
 if(!['reconcile','refund'].includes(action) || typeof orderId!=='string' || !orderPattern.test(orderId) ||
    (action==='refund' && (typeof reason!=='string' || !reason.trim() || reason.length>200))){
  return json({error:'Invalid operations request'},400);
 }
 try{
  const store=orders(config);
  const order=await store.get(orderId,{type:'json'});
  if(!eligibleOrder(order,orderId,config)) return json({error:'Order not found'},404);
  let payment=await findPayment(config,orderId);
  if(!matchesLivePayment(config,order,payment)) return json({error:'Payment verification pending'},409);
  if(action==='refund' && !isCancelled(payment)){
   if(!approvedPayment(payment,orderId,payment.paymentKey,config)) return json({error:'Payment not refundable'},409);
   const key=createHash('sha256').update('full-refund:'+orderId).digest('hex');
   payment=await cancelPayment(config,payment.paymentKey,reason.trim(),key)??await findPayment(config,orderId);
  }
  if(!await saveLiveSnapshot(config,store,order,payment)) return json({error:'Payment verification pending'},503);
  if(action==='refund' && payment.status!=='CANCELED') return json({error:'Full refund not confirmed'},409);
  if(await liveRevoked(store,order)===null && approvedPayment(payment,orderId,payment.paymentKey,config)){
   await recordApproval(store,order,payment,Date.now(),config);
  }
  return json({orderId,status:payment.status,approvedAt:payment.approvedAt,amount:payment.totalAmount,
   balanceAmount:payment.balanceAmount,transactionKey:payment.lastTransactionKey});
 }catch{
  return json({error:'Operations confirmation pending'},503);
 }
};
