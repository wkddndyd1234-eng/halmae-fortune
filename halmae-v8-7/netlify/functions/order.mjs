import crypto from 'node:crypto';
import {orders,json,parse,error} from './shared.mjs';
import {normalizeBirth} from './saju.mjs';
const PRICE=29900;
export default async req=>{
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const x=await parse(req),name=String(x.name||'').trim().slice(0,30),gender=String(x.gender||'');
  if(!name||!['male','female'].includes(gender))return json({error:'이름과 성별을 확인해 주세요.'},400);
  let birth;
  try{birth=normalizeBirth(x)}catch(e){return json({error:e.message},400)}
  const orderId='HM-'+crypto.randomUUID();
  await orders().setJSON(orderId,{orderId,name,gender,...birth,amount:PRICE,status:'pending',createdAt:Date.now()});
  return json({orderId,amount:PRICE,status:'pending',paymentEnabled:false});
 }catch(e){return error(e)}
};
