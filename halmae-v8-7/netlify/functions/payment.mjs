import {financeStore,orders,json,parse,verifyProvider,error} from './shared.mjs';
import {DAY,PRICE,checkoutScope,isPreview,paymentConfig} from './payment-config.mjs';
import {mailConfig} from './recovery-mail.mjs';
import {browserKey,eligibleOrder,fingerprint,orderPattern,recordApproval,reportLink,verifiedPurchase} from './entitlement.mjs';
import {liveRevoked,saveLiveSnapshot} from './live-ledger.mjs';
import {approvedPayment,confirmPayment} from './toss.mjs';

export default async req => {
  const config = paymentConfig(req);
  if (req.method === 'GET') {
    const adminPreview = isPreview(req) && (process.env.DEMO_ACCESS_CODE?.length ?? 0)>=12;
    return json({enabled:Boolean(config?.salesEnabled),...(config?.mode==='live'?{paymentMode:'live',...(config.merchant?{merchant:config.merchant}:{}),...(config.salesEnabled?{legal:config.legal,policyVersion:config.policyVersion}:{})}:{}),...(mailConfig(config)?{recoveryEnabled:true}:{}),
      ...(adminPreview?{adminPreview:true}:{})});
  }
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  if (!config) return json({error:'테스트 결제는 현재 준비 중입니다.'},503);
  try {
    const {orderId,paymentKey,amount} = await parse(req);
    const claim = verifyProvider((req.headers.get('authorization') ?? '').replace(/^Bearer /,''),config);
    const denied = () => json({error:'이 브라우저에서 시작한 유효한 테스트 주문이 필요합니다.'},403);
    const signedCheckout = claim?.scope === checkoutScope(config) && claim.orderId === orderId;
    const key = browserKey(req);
    const origin = req.headers.get('origin');
    if (typeof orderId !== 'string' || !orderPattern.test(orderId) ||
        (!signedCheckout && (!key || (origin && origin !== config.origin)))) return denied();
    const store = orders(config);
    const order = await store.get(orderId,{type:'json'});
    if (!signedCheckout && (order?.browserHash !== fingerprint('browser',key,config) ||
        !Number.isFinite(order.createdAt) || order.createdAt+DAY<=Date.now())) return denied();
    if (amount !== PRICE) return json({error:'주문 금액을 확인해 주세요.'},400);
    if (!eligibleOrder(order,orderId,config)) {
      return json({error:'테스트 주문 상태를 확인해 주세요.'},409);
    }
    if (order.paymentKey && order.paymentKey !== paymentKey) {
      return json({error:'이미 다른 결제 정보가 기록된 주문입니다.'},409);
    }
    if(config.mode==='live' && !config.salesEnabled){
      const existing=await verifiedPurchase(config,store,order);
      const link=existing && reportLink(existing,Date.now(),config);
      return link?json(link):json({error:'새 결제 승인이 일시 중지되었습니다.'},503);
    }
    if(config.mode==='live' && (await liveRevoked(store,order)||await financeStore().get('erased/'+orderId,{type:'json'}))) return json({error:'취소된 주문입니다.'},409);
    if(config.mode==='live'){
      if(typeof paymentKey!=='string' || !/^[!-~]{1,200}$/.test(paymentKey)) return json({error:'결제 정보를 확인해 주세요.'},400);
      const binding='approval/'+orderId;
      const digest=fingerprint('approval-key',paymentKey,config);
      const first=await store.setJSON(binding,{digest},{onlyIfNew:true});
      if(!first.modified && (await store.get(binding,{type:'json'}))?.digest!==digest){
        return json({error:'이 주문은 이미 다른 결제 승인 요청에 연결됐어요.'},409);
      }
    }
    const payment = await confirmPayment(config, orderId, paymentKey);
    if (!approvedPayment(payment, orderId, paymentKey,config)) {
      return json({error:'완료된 테스트 카드 결제를 확인하지 못했습니다.'},409);
    }
    // Concurrent approvals of this order record the same provider timestamp and expiry.
    if(config.mode==='live' && (!await saveLiveSnapshot(config,store,order,payment) || await liveRevoked(store,order))){
      return json({error:'결제 상태를 확인해 주세요.'},409);
    }
    const purchase=await recordApproval(store,order,payment,Date.now(),config);
    const link = purchase && reportLink(purchase,Date.now(),config);
    return link ? json(link) : json({error:'테스트 보고서 열람 기간이 끝났습니다.'},410);
  } catch (e) {
    return error(e);
  }
};
