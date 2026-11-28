import {cancelPayapp} from '../lib/payapp.mjs';
import {deliverPayappContract} from '../lib/payapp-flow.mjs';
import {allowedOperatorIp} from '../lib/ops-access.mjs';
import {createHash} from 'node:crypto';
import {eligibleOrder,orderPattern,recordApproval} from './entitlement.mjs';
import {matchesCredential,isCancelled,liveRevoked,matchesLivePayment,saveLiveSnapshot} from './live-ledger.mjs';
import {paymentConfig} from './payment-config.mjs';
import {financeStore,json,orders,parse} from './shared.mjs';
import {approvedPayment,cancelPayment,findPayment} from './toss.mjs';

export default async (req,context)=>{
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 const config=paymentConfig(req);
 if(config?.mode!=='live' || !allowedOperatorIp(context?.ip) || !matchesCredential(req.headers.get('authorization')?.replace(/^Bearer /,''),
    process.env.PAYMENT_LIVE_OPERATOR_TOKEN)) return json({error:'Operations unavailable'},403);
 const {action,orderId,reason}=await parse(req)??{};
 if(!['reconcile','refund','contract-delivery'].includes(action) || typeof orderId!=='string' || !orderPattern.test(orderId) ||
    (action==='refund' && (typeof reason!=='string' || !reason.trim() || reason.length>200))){
  return json({error:'Invalid operations request'},400);
 }
 return executeOperation(config,{action,orderId,reason});
};

export async function executeOperation(config,{action,orderId,reason}){
 if(action==='refund' && (typeof reason!=='string'||!reason.trim()||reason.length>200)) return json({error:'환불 사유를 확인해 주세요.'},400);
 if(action==='refund' && process.env.PAYMENT_REFUNDS_APPROVED!=='true') return json({error:'운영 환불 승인이 필요합니다.'},403);
 try{
  const store=orders(config);
  const order=await store.get(orderId,{type:'json'});
  if(!eligibleOrder(order,orderId,config)) return json({error:'Order not found'},404);
  if(order.channel==='payapp-live'){
   const payment=await store.get('payapp/order/'+orderId,{type:'json'});
   if(action==='contract-delivery'){
    const status=await deliverPayappContract(store,financeStore(),order);
    return json({orderId,status:status??'unavailable'});
   }
   if(action==='reconcile') return json({orderId,status:payment?.status??'request-not-recorded',
    transactionId:payment?.transactionId??null,manualReconciliation:!payment||payment.status==='requesting'||payment.status==='pending'});
   if(!config.payapp || payment?.status!=='approved') return json({error:'승인된 페이앱 주문을 확인해 주세요.'},409);
   const refund=await store.setJSON('payapp/refund/'+orderId,{state:'requested',at:Date.now()},{onlyIfNew:true});
   if(!refund.modified) return json({orderId,status:'refund-confirmation-pending'},202);
   await cancelPayapp(config.payapp,payment,reason.trim(),fetch);
   return json({orderId,status:'refund-confirmation-pending'},202);
  }
  if(action==='contract-delivery') return json({error:'Unsupported operation'},400);
  if(config.provider==='payapp'){
   config=paymentConfig({url:config.origin},'toss');
   if(!config) return json({error:'기존 토스 운영 설정을 확인해 주세요.'},503);
  }
  let payment=await findPayment(config,orderId);
  if(!matchesLivePayment(config,order,payment)) return json({error:'Payment verification pending'},409);
  if(action==='refund' && !isCancelled(payment)){
   if(!approvedPayment(payment,orderId,payment.paymentKey,config,order.amount)) return json({error:'Payment not refundable'},409);
   const key=createHash('sha256').update('full-refund:'+orderId).digest('hex');
   payment=await cancelPayment(config,payment.paymentKey,reason.trim(),key)??await findPayment(config,orderId);
  }
  if(!await saveLiveSnapshot(config,store,order,payment)) return json({error:'Payment verification pending'},503);
  if(action==='refund' && payment.status!=='CANCELED') return json({error:'Full refund not confirmed'},409);
  if(await liveRevoked(store,order)===null && approvedPayment(payment,orderId,payment.paymentKey,config,order.amount)){
   await recordApproval(store,order,payment,Date.now(),config);
  }
  return json({orderId,status:payment.status,approvedAt:payment.approvedAt,amount:payment.totalAmount,
   balanceAmount:payment.balanceAmount,transactionKey:payment.lastTransactionKey});
 }catch{
  return json({error:'Operations confirmation pending'},503);
 }
}
