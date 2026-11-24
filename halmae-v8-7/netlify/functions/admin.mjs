import {adminConfig,audit,cookie,createSession,passwordMatches,rateAllowed,sessionFor} from '../lib/admin-auth.mjs';
import {compareSettlements,dashboard,safeOrder} from '../lib/admin-ledger.mjs';
import {orderPattern,verifiedPurchase} from './entitlement.mjs';
import {matchesCredential} from './live-ledger.mjs';
import {executeOperation} from './payment-operations.mjs';
import recovery from './recovery.mjs';
import {json,orders,parse} from './shared.mjs';
import {eraseCustomerOrder} from '../lib/live-privacy.mjs';

const denied=()=>json({error:'인증 또는 요청 정보를 확인해 주세요.'},403);
export default async req=>{
 let config;
 try{
  config=adminConfig(req);
  if(!config) return json({error:'운영 화면이 비활성화되어 있습니다.'},503);
  const {provider,store}=config;
  if(req.method==='GET'){
   const session=await sessionFor(req,config);
   return session?json({csrf:session.csrf,mode:provider.mode,
    refundsEnabled:provider.mode==='live'&&process.env.PAYMENT_REFUNDS_APPROVED==='true'}):denied();
  }
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  if(req.headers.get('origin')!==provider.origin ||
   !req.headers.get('content-type')?.startsWith('application/json')) return denied();
  const input=await parse(req);
  if(!input||typeof input!=='object') return denied();
  const {action,orderId}=input;
  if(action==='login'){
   if(!await rateAllowed(store,'login',8,15*60_000)){
    return json({error:'로그인 시도 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.'},429);
   }
   if(!await passwordMatches(input.password,config.hash)){
    await audit(store,'login','denied');
    return denied();
   }
   const old=await sessionFor(req,config);
   if(old) await store.delete(old.key);
   const {id}=await createSession(config);
   await audit(store,'login','ok');
   const response=json({ok:true});
   response.headers.set('Set-Cookie',cookie(id));
   return response;
  }
  const session=await sessionFor(req,config);
  if(!session||!matchesCredential(req.headers.get('x-csrf-token'),session.csrf)) return denied();
  if(!await rateAllowed(store,session.key,24)) return json({error:'요청이 많습니다. 잠시 후 다시 시도해 주세요.'},429);
  if(action==='logout'){
   await store.delete(session.key);
   await audit(store,'logout','ok');
   const response=json({ok:true});
   response.headers.set('Set-Cookie',cookie());
   return response;
  }
  if(action==='dashboard'||action==='compare'){
   const data=await dashboard(provider);
   if(action==='dashboard') return json({...data,retention:await store.get('retention/latest',{type:'json'})});
   if(!Array.isArray(input.rows)||input.rows.length>500) return json({error:'최대 500개 거래를 입력해 주세요.'},400);
   try {return json({issues:compareSettlements(data.finance,input.rows),truncated:data.truncated});}
   catch {return json({error:'대조 데이터 형식을 확인해 주세요.'},400);}
  }
  if(action==='retry-retention'){
   if(provider.mode!=='live'||process.env.LIVE_RETENTION_ENABLED!=='true') return denied();
   await audit(store,'retry-retention','requested');
   const {sweepLive}=await import('./live-retention.mjs');
   return json(await sweepLive(provider,orders(provider),store));
  }
  if(!orderPattern.test(typeof orderId==='string'?orderId:'')) return json({error:'주문 번호를 확인해 주세요.'},400);
  const customerStore=orders(provider);
  const order=await customerStore.get(orderId,{type:'json'});
  if(!order) return json({error:'주문을 찾지 못했습니다.'},404);
  if(action==='lookup') return json(safeOrder(order));
  if(action==='resend'){
   await audit(store,'resend','requested',orderId);
   // Public recovery validates the original address. The console never receives the token.
   return recovery(new Request(provider.origin,{method:'POST',
    body:JSON.stringify({action:'request',orderId,email:input.email})}));
  }
  if(action==='reconcile'||action==='refund'){
   if(provider.mode!=='live'||action==='refund'&&input.confirmation!==orderId) return denied();
   await audit(store,action,'requested',orderId);
   const result=await executeOperation(provider,{action,orderId,reason:input.reason});
   await audit(store,action,result.ok?'ok':'needs-review',orderId);
   return result;
  }
  if(action==='withdraw-recovery'||action==='erase'){
   if(provider.mode!=='live'||input.confirmation!==orderId) return denied();
   await audit(store,action,'requested',orderId);
   if(action==='withdraw-recovery'){
    await eraseCustomerOrder(customerStore,orderId,'withdraw');
   }else{
    // Query before deletion to retain the current verified financial state.
    if(order.channel==='toss-live'){
     const result=await executeOperation(provider,{action:'reconcile',orderId});
     if(!result.ok) return json({error:'거래 대조를 완료한 뒤 삭제해 주세요.'},409);
    }
    await eraseCustomerOrder(customerStore,orderId,'erase');
   }
   await audit(store,action,'ok',orderId);
   return json({ok:true});
  }
  if(action==='repair-issuance'){
   await audit(store,action,'requested',orderId);
   const purchase=await verifiedPurchase(provider,customerStore,order);
   if(!purchase) return denied();
   const {materializeReport}=await import('../lib/report-delivery.mjs');
   await materializeReport(customerStore,purchase);
   await audit(store,action,'ok',orderId);
   return json({ok:true});
  }
  return json({error:'지원하지 않는 작업입니다.'},400);
 }catch{
  return json({error:'작업이 중단됐습니다. 상태를 확인한 뒤 다시 시도해 주세요.'},503);
 }
};
