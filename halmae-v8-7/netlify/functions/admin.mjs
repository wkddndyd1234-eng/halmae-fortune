import {consumeTotp} from '../lib/ops-access.mjs';
import {adminConfig,audit,cookie,createSession,passwordMatches,rateAllowed,sessionFor} from '../lib/admin-auth.mjs';
import {compareFullRange,compareSettlements,dashboard,safeOrder,scan} from '../lib/admin-ledger.mjs';
import {orderPattern,verifiedPurchase} from './entitlement.mjs';
import {matchesCredential} from './live-ledger.mjs';
import {executeOperation} from './payment-operations.mjs';
import recovery from './recovery.mjs';
import {financeStore,json,orders,parse} from './shared.mjs';
import {migrateFinance,putLegalIndex} from '../lib/legal-records.mjs';
import {eraseCustomerOrder} from '../lib/live-privacy.mjs';
import {withPolicyOriginals} from '../lib/contract-archive.mjs';
import {campaign, campaignStore, loadCampaignReport, setSpend} from '../lib/campaigns.mjs';

const denied=()=>json({error:'인증 또는 요청 정보를 확인해 주세요.'},403);
export default async (req,context)=>{
 let config;
 try{
  config=adminConfig(req,context);
  if(!config) return json({error:'운영 화면이 비활성화되어 있습니다.'},503);
  const {provider,store}=config;
  if(req.method==='GET'){
   const session=await sessionFor(req,config);
   return session?json({csrf:session.csrf,mode:provider.mode,
    campaignsEnabled:provider.mode==='live'&&process.env.CAMPAIGN_MEASUREMENT_ENABLED==='true',
    refundsEnabled:provider.mode==='live'&&process.env.PAYMENT_REFUNDS_APPROVED==='true'}):json({loginRequired:true,mfaRequired:Boolean(config.mfa)},403);
  }
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  if(req.headers.get('origin')!==provider.origin ||
   !req.headers.get('content-type')?.startsWith('application/json')) return denied();
  const input=await parse(req);
  if(!input||typeof input!=='object') return denied();
  const {action,orderId}=input;
  if(action==='login'){
   if(!await rateAllowed(store,'login/'+config.ip,8,15*60_000)){
    return json({error:'로그인 시도 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.'},429);
   }
   if(!await passwordMatches(input.password,config.hash) || config.mfa && !await consumeTotp(store,config.mfa,input.code)){
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
  if(action==='dashboard'){
   const data=await dashboard(provider);
   const hooks=await scan(store,'webhook/issue/',150);
   for(const {key} of hooks.records){
    data.issues.push({orderId:key.split('/').at(-1),issuance:'웹훅 재대조 필요'});
   }
   return json({...data,retention:await store.get('retention/latest',{type:'json'})});
  }
  if(action==='campaign-export'||action==='campaign-spend'){
   if(provider.mode!=='live'||process.env.CAMPAIGN_MEASUREMENT_ENABLED!=='true') return denied();
   const campaigns=campaignStore();
   if(action==='campaign-export') return json(await loadCampaignReport(provider,campaigns));
   if(!await setSpend(campaigns,campaign(input.attribution),input.spend)) return json({error:'캠페인 항목과 광고비를 확인해 주세요.'},400);
   await audit(store,action,'ok');
   return json({ok:true});
  }
  if(action==='compare'){
   if(!Array.isArray(input.rows)||input.rows.length>500) return json({error:'최대 500개 거래를 입력해 주세요.'},400);
   try{
    if(input.scope){
     if(provider.mode!=='live') return denied();
     return json({issues:await compareFullRange(provider,input.rows,input.scope),truncated:false});
    }
    const data=await dashboard(provider);
    return json({issues:compareSettlements(data.finance,input.rows),truncated:data.truncated});
   }catch{return json({error:'대조 자료 형식과 저장소 상태를 확인해 주세요.'},400);}
  }
  if(['migrate-finance','legal-index','legal-hold'].includes(action)){
   if(provider.mode!=='live') return denied();
   await audit(store,action,'requested');
   const archive=financeStore();
   if(action==='migrate-finance'){
    const result=await migrateFinance(orders(provider),archive);
    await audit(store,action,result.mismatch?'needs-review':'ok');
    return json(result);
   }
   if(action==='legal-index'){
    if(!await putLegalIndex(archive,input)) return json({error:'기록 유형, 참조 번호와 종료일을 확인해 주세요.'},400);
   }else{
    if(!/^[A-Za-z0-9_-]{1,80}$/.test(input.reference??'')||typeof input.hold!=='boolean') return denied();
    if(input.hold) await archive.setJSON('hold/'+input.reference,{at:new Date().toISOString()});
    else await archive.delete('hold/'+input.reference);
   }
   await audit(store,action,'ok');
   return json({ok:true});
  }
  if(action==='retry-retention'){
   if(provider.mode!=='live'||process.env.LIVE_RETENTION_ENABLED!=='true') return denied();
   await audit(store,'retry-retention','requested');
   const {sweepLive}=await import('./live-retention.mjs');
   return json(await sweepLive(provider,orders(provider),store));
  }
  if(!orderPattern.test(typeof orderId==='string'?orderId:'')) return json({error:'주문 번호를 확인해 주세요.'},400);
  if(action==='contract-reissue'){
   if(provider.mode!=='live' || input.confirmation!==orderId || input.identityVerified!==true ||
      typeof input.reference!=='string' || !/^CASE-[A-Za-z0-9_-]{6,60}$/.test(input.reference)) return denied();
   const archive=financeStore();
   const document=await withPolicyOriginals(archive,await archive.get('contract/'+orderId,{type:'json'}));
   if(!document) return json({error:'보존된 계약 원문을 찾지 못했습니다. 거래기록과 구매 당시 정책 원문을 별도로 확인해 주세요.'},404);
   await audit(store,action,'download-prepared',orderId,input.reference);
   return json(document);
  }
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
  if(action==='reconcile'||action==='refund'||action==='contract-delivery'){
   if(provider.mode!=='live'||action!=='reconcile'&&input.confirmation!==orderId) return denied();
   await audit(store,action,'requested',orderId);
   const result=await executeOperation(provider,{action,orderId,reason:input.reason});
   if(result.ok && action==='reconcile') await store.delete('webhook/issue/'+orderId);
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
