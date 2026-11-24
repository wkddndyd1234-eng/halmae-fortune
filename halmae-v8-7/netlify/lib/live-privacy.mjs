import {financeStore} from '../functions/shared.mjs';

export async function eraseCustomerOrder(store,orderId,kind){
 // Independent tombstones stop a concurrent payment or mail retry from restoring access.
 if(kind==='erase'){
  await financeStore().setJSON('erased/'+orderId,{at:new Date().toISOString()},{onlyIfNew:true});
  await store.delete(orderId);
  await store.delete('delivery/'+orderId);
  await store.delete('recovery/delivery/'+orderId);
  await store.delete('optout/'+orderId);
  await store.delete('approval/'+orderId);
  return;
 }
 await store.setJSON('optout/'+orderId,{at:new Date().toISOString()},{onlyIfNew:true});
 for(let attempt=0;attempt<3;attempt++){
  const current=await store.getWithMetadata(orderId,{type:'json'});
  if(!current) return;
  if(!current.data.recoveryEmail && !current.data.recoveryEmailHash) return;
  const updated={...current.data};
  delete updated.recoveryEmail;
  delete updated.recoveryEmailHash;
  if((await store.setJSON(orderId,updated,{onlyIfMatch:current.etag})).modified) return;
 }
 throw Error('Recovery consent update pending');
}
