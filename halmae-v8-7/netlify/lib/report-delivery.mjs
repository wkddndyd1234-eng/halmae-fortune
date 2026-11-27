import {buildFortuneReport} from '../functions/fortune-report.mjs';

import {retentionEnd} from './legal-records.mjs';

export async function materializeReport(store,order,build=buildFortuneReport,archive){
 const key='delivery/'+order.orderId;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const report=build(order);
   await store.setJSON(key,{state:'generated',at:Date.now()});
   const firstKey='first-delivery/'+order.orderId;
   await store.setJSON(firstKey,{at:Date.now()},{onlyIfNew:true});
   if(archive){
    const first=await store.get(firstKey,{type:'json'});
    const expiresAt=retentionEnd('payment',first?.at);
    if(!Number.isFinite(expiresAt)) throw Error('Missing supply evidence');
    await archive.setJSON('legal/payment/supply-'+order.orderId,{
     kind:'payment',reference:order.orderId,firstResponsePreparedAt:first.at,expiresAt,
    },{onlyIfNew:true});
   }
   return report;
  }catch(error){
   if(attempt===1){
    await store.setJSON(key,{state:'retry-needed',at:Date.now()});
    throw error;
   }
  }
 }
}
