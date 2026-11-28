import {createHash,timingSafeEqual} from 'node:crypto';
import {supportedPaymentMethod} from './toss.mjs';
import {financeStore} from './shared.mjs';

const statusValues=new Set(['READY','IN_PROGRESS','WAITING_FOR_DEPOSIT','DONE','CANCELED','PARTIAL_CANCELED','ABORTED','EXPIRED']);
export const isCancelled=payment=>['CANCELED','PARTIAL_CANCELED'].includes(payment?.status);
export function matchesLivePayment(config,order,payment){
 return payment?.orderId===order.orderId && payment.mId===config.merchantId && payment.currency==='KRW' && payment.totalAmount===order.amount &&
  supportedPaymentMethod(config,payment.method) && typeof payment.paymentKey==='string' && payment.paymentKey.length<=200 &&
  (!order.paymentKey || order.paymentKey===payment.paymentKey) && statusValues.has(payment.status) &&
  Number.isInteger(payment.balanceAmount) && payment.balanceAmount>=0 && payment.balanceAmount<=order.amount;
}

export async function saveLiveSnapshot(config,store,order,payment){
 if(!matchesLivePayment(config,order,payment)) return false;
 const record={
  orderId:order.orderId,merchantId:payment.mId,paymentKey:payment.paymentKey,status:payment.status,currency:payment.currency,method:payment.method,
  amount:payment.totalAmount,balanceAmount:payment.balanceAmount,approvedAt:payment.approvedAt??null,policyAcceptance:order.policyAcceptance??null,
  ...(order.contractTerms?{contractTerms:order.contractTerms}:{}),
  transactionKey:payment.lastTransactionKey??null,
  cancellations:(Array.isArray(payment.cancels)?payment.cancels:[]).map(item=>({
   transactionKey:item.transactionKey,cancelAmount:item.cancelAmount,canceledAt:item.canceledAt,cancelStatus:item.cancelStatus,
  })),
 };
 const hash=createHash('sha256').update(JSON.stringify(record)).digest('hex');
 if(isCancelled(payment)){
  await financeStore().setJSON('revoked/'+order.orderId,{status:payment.status},{onlyIfNew:true});
 }
 await financeStore().setJSON('finance/'+order.orderId+'/'+hash,{...record,observedAt:new Date().toISOString()},{onlyIfNew:true});
 return true;
}

export const liveRevoked=async(store,order)=>
 await financeStore().get('revoked/'+order.orderId,{type:'json'}) ??
 await store.get('revoked/'+order.orderId,{type:'json'});

export function matchesCredential(input,configured){
 if(typeof input!=='string' || typeof configured!=='string' || configured.length<32) return false;
 const a=Buffer.from(input),b=Buffer.from(configured);
 return a.length===b.length && timingSafeEqual(a,b);
}
