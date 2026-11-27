import {adminStore,financeStore,json,orders} from './shared.mjs';
import {DAY,paymentConfig} from './payment-config.mjs';
import {orderPattern,storedExpiry} from './entitlement.mjs';
import {findPayment} from './toss.mjs';
import {matchesLivePayment,saveLiveSnapshot} from './live-ledger.mjs';
import {purgeArchive} from '../lib/legal-records.mjs';
import {notifyRetention} from '../lib/retention-alert.mjs';
import {eraseCustomerOrder} from '../lib/live-privacy.mjs';

export const config={schedule:'@daily'};
export async function sweepLive(provider,customer,ops,now=Date.now()){
 const counts={erased:0,failed:0};
 for await(const page of customer.list({prefix:'HM-',paginate:true})){
  for(const {key} of page.blobs){
   if(!orderPattern.test(key)) continue;
   try{
    const order=await customer.get(key,{type:'json'});
    if(!order||!['toss-live','payapp-live'].includes(order.channel)) continue;
    const erased=await financeStore().get('erased/'+key,{type:'json'});
    if(!erased){
     const expiry=storedExpiry(order);
     if(Number.isFinite(expiry) && expiry>now ||
        !Number.isFinite(expiry) && !(order.createdAt+30*DAY<=now)) continue;
     if(order.channel==='payapp-live'){
      const payment=await customer.get('payapp/order/'+key,{type:'json'});
      if(payment && ['requesting','pending'].includes(payment.status)) throw Error('PayApp reconciliation required');
      if(payment?.purchaseExpiresAt>now) continue;
     }else{
     const payment=await findPayment(provider,key);
     if(payment){
      if(!matchesLivePayment(provider,order,payment)) throw Error('provider mismatch');
      await saveLiveSnapshot(provider,customer,order,payment);
      if(!Number.isFinite(expiry) && (payment.status==='DONE'||payment.status.endsWith('CANCELED'))) continue;
      if(!['DONE','ABORTED','EXPIRED','CANCELED','PARTIAL_CANCELED'].includes(payment.status)) continue;
     }else if(Number.isFinite(expiry)) throw Error('approved transaction missing');
     }
    }
    await eraseCustomerOrder(customer,key,'erase');
    counts.erased++;
   }catch{
    counts.failed++;
    await ops.setJSON('retention/issue/'+key,{state:'retry-needed',at:now});
   }
  }
 }
 for(const [store,prefix] of [[ops,'session/'],[ops,'rate/'],[customer,'recovery/rate/'],[customer,'recovery/used/']]){
  for await(const page of store.list({prefix,paginate:true})){
   for(const {key} of page.blobs){
    const entry=await store.get(key,{type:'json'});
    if(entry?.expiresAt+DAY<=now) await store.delete(key);
   }
  }
 }
 if(process.env.LIVE_FINANCE_PURGE_APPROVED==='true'){
  const result=await purgeArchive(financeStore(),now);
  counts.archivedRecordsDeleted=result.deleted;
  counts.failed+=result.failed;
 }
 await ops.setJSON('retention/latest',{...counts,at:now});
 return counts;
}
export default async()=>{
 const {PAYMENT_LIVE_ORIGIN,LIVE_RETENTION_ENABLED}=process.env;
 if(LIVE_RETENTION_ENABLED!=='true'||!PAYMENT_LIVE_ORIGIN) return json({enabled:false});
 const provider=paymentConfig(new Request(PAYMENT_LIVE_ORIGIN));
 if(provider?.mode!=='live') return json({enabled:false});
 try{
  const result=await sweepLive(provider,orders(provider),adminStore('live'));
  if(result.failed) await notifyRetention(provider,result).catch(()=>false);
  return json(result,result.failed?503:200);
 }catch{
  await adminStore('live').setJSON('retention/latest',{failed:1,at:Date.now()});
  await notifyRetention(provider,{failed:1}).catch(()=>false);
  return json({error:'Retention retry needed'},503);
 }
};
