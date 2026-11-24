import {timingSafeEqual} from 'node:crypto';
import {orders,json,parse,sign,error} from './shared.mjs';
import {DAY,isPreview} from './payment-config.mjs';

export default async req=>{
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 if(!isPreview(req)) return json({error:'관리자 발급은 프리뷰에서만 사용할 수 있습니다.'},403);
 try {
  const expected=process.env.DEMO_ACCESS_CODE;
  if((expected?.length??0)<12) return json({error:'관리자 테스트 발급이 설정되지 않았습니다.'},503);
  const input=await parse(req);
  const code=typeof input?.code==='string'?input.code:'';
  const supplied=Buffer.from(code);
  const configured=Buffer.from(expected);
  if(supplied.length!==configured.length || !timingSafeEqual(supplied,configured)){
   return json({error:'관리자 코드가 올바르지 않습니다.'},403);
  }
  const store=orders();
  const order=typeof input.orderId==='string' && await store.get(input.orderId,{type:'json'});
  if(!order) return json({error:'주문을 찾을 수 없습니다.'},404);
  if((order.channel && order.channel!=='admin-demo') || !['pending','demo'].includes(order.status)){
   return json({error:'주문 상태를 확인해 주세요.'},409);
  }
  const token=sign({orderId:order.orderId,scope:'report',demo:true,exp:Date.now()+DAY});
  if(order.status!=='demo') await store.setJSON(order.orderId,{...order,status:'demo'});
  return json({token});
 }catch(e){return error(e);}
};
