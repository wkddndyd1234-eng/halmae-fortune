import {buildFortuneReport} from './fortune-report.mjs';
import {orders,json,verify,error} from './shared.mjs';
import {paymentConfig} from './payment-config.mjs';
import {eligibleOrder,REPORT_SCOPE,verifiedPurchase} from './entitlement.mjs';
export const buildReport = buildFortuneReport;
export default async req => {
 if (req.method !== 'GET') return json({error:'Method not allowed'},405);
 try {
  const claim = verify((req.headers.get('authorization') ?? '').replace(/^Bearer /,''));
  const demo = claim?.scope === 'report' && claim.demo === true;
  const config = claim?.scope === REPORT_SCOPE ? paymentConfig(req) : null;
  if (!demo && !config) return json({error:'유효한 보고서 접근 권한이 없습니다.'},403);
  const store = orders();
  const o = await store.get(claim.orderId,{type:'json'});
  if (!o || o.orderId !== claim.orderId) return json({error:'발급 권한이 확인되지 않았습니다.'},403);
  let purchase;
  if (demo) {
   if (o.status !== 'demo' || (o.channel && o.channel !== 'admin-demo')) {
    return json({error:'관리자 테스트 발급 권한이 확인되지 않았습니다.'},403);
   }
  } else {
   if (eligibleOrder(o,o.orderId) && o.status === 'test-paid') {
    purchase = await verifiedPurchase(config,store,o);
   }
   if (!purchase || claim.exp<=Date.now()) {
    return json({error:'완료된 테스트 카드 결제를 확인하지 못했습니다.'},403);
   }
  }
  return json({...buildReport(o),demo,...(!demo?{purchaseExpiresAt:purchase.purchaseExpiresAt}:{})});
 } catch (e) { return error(e); }
};
