import {buildFortuneReport} from '../functions/fortune-report.mjs';

export async function materializeReport(store,order,build=buildFortuneReport){
 const key='delivery/'+order.orderId;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const report=build(order);
   await store.setJSON(key,{state:'generated',at:Date.now()});
   return report;
  }catch(error){
   if(attempt===1){
    await store.setJSON(key,{state:'retry-needed',at:Date.now()});
    throw error;
   }
  }
 }
}
