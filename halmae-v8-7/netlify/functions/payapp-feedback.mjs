import {paymentConfig} from './payment-config.mjs';
import {financeStore,orders} from './shared.mjs';
import {acceptPayappFeedback} from '../lib/payapp.mjs';
import {verifiedPurchase} from './entitlement.mjs';
import {deliverPayappContract} from '../lib/payapp-flow.mjs';

export default async (req,context)=>{
 if(req.method!=='POST') return new Response(null,{status:405});
 const config=paymentConfig(req,'payapp');
 if(!config?.payapp) return new Response(null,{status:503});
 if(!req.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new Response(null,{status:415});
 try{
  let body='';
  const reader=req.body?.pipeThrough(new TextDecoderStream()).getReader();
  if(!reader) return new Response(null,{status:400});
  while(true){
   const {value,done}=await reader.read();
   if(done) break;
   body+=value;
   if(body.length>16_384){await reader.cancel();return new Response(null,{status:413});}
  }
  const fields=new URLSearchParams(body);
  const store=orders(config);
  if(!await acceptPayappFeedback(store,config.payapp,fields)) return new Response(null,{status:409});
  const order=await store.get(fields.get('var1'),{type:'json'});
  const approved=order&&await verifiedPurchase(config,store,order);
  if(fields.get('pay_state')==='4'&&!approved){
   const state=await store.get('payapp/order/'+fields.get('var1'),{type:'json'});
   if(state?.status==='approved') return new Response(null,{status:503});
  }
  if(approved){
   const delivery=deliverPayappContract(store,financeStore(),approved).catch(()=>{});
   if(typeof context?.waitUntil==='function') context.waitUntil(delivery);
   else await delivery;
  }
  return new Response('SUCCESS',{headers:{'content-type':'text/plain','cache-control':'no-store'}});
 }catch{return new Response(null,{status:503});}
};
