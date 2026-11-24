import {materializeReport} from '../lib/report-delivery.mjs';
import {buildFortuneReport} from './fortune-report.mjs';
import {orders,json,verifyProvider,error} from './shared.mjs';
import {paymentConfig} from './payment-config.mjs';
import {eligibleOrder,paidStatus,reportScope,verifiedPurchase} from './entitlement.mjs';
export const buildReport = buildFortuneReport;
export default async req => {
 if (req.method !== 'GET') return json({error:'Method not allowed'},405);
 try {
  const provider=paymentConfig(req);
  const claim = verifyProvider((req.headers.get('authorization') ?? '').replace(/^Bearer /,''),provider);
  const demo = provider?.mode!=='live' && claim?.scope === 'report' && claim.demo === true;
  const config = claim?.scope === reportScope(provider) ? provider : null;
  if (!demo && !config) return json({error:'유효한 보고서 접근 권한이 없습니다.'},403);
  const store = orders(config);
  const o = await store.get(claim.orderId,{type:'json'});
  if (!o || o.orderId !== claim.orderId) return json({error:'발급 권한이 확인되지 않았습니다.'},403);
  let purchase;
  if (demo) {
   if (o.status !== 'demo' || (o.channel && o.channel !== 'admin-demo')) {
    return json({error:'관리자 테스트 발급 권한이 확인되지 않았습니다.'},403);
   }
  } else {
   if (eligibleOrder(o,o.orderId,config) && o.status === paidStatus(config)) {
    purchase = await verifiedPurchase(config,store,o);
   }
   if (!purchase || claim.exp<=Date.now()) {
    return json({error:'완료된 카드 결제를 확인하지 못했습니다.'},403);
   }
  }
  const result=config?.mode==='live'?await materializeReport(store,purchase):buildReport(o);
  return json({...result,demo,...(!demo?{purchaseExpiresAt:purchase.purchaseExpiresAt,...(config.mode==='live'?{paymentMode:'live'}:{})}:{})});
 } catch (e) { return error(e); }
};
