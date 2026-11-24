import {error,json,orders,parse} from './shared.mjs';
import {paymentConfig} from './payment-config.mjs';
import {browserHeader,browserKey,eligibleOrder,fingerprint,orderPattern,reportLink,verifiedPurchase} from './entitlement.mjs';

export default async req => {
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return json({error:'요청 출처를 확인해 주세요.'},403);
  try {
    const input = await parse(req);
    if (input?.action === 'forget') {
      const response = json({cleared:true});
      response.headers.set('Set-Cookie',browserHeader(null));
      return response;
    }
    const config = paymentConfig(req);
    if (!config) return json({error:'테스트 보고서 열람은 현재 준비 중입니다.'},503);
    const key = browserKey(req);
    const orderId = input?.orderId;
    const denied = () => json({error:'이 브라우저에서 유효한 구매를 확인하지 못했습니다. 동의한 이메일이 있다면 복구를 이용해 주세요.'},403);
    if (!key || !orderPattern.test(typeof orderId === 'string'?orderId:'')) return denied();
    const store = orders(config);
    const order = await store.get(orderId,{type:'json'});
    if (!eligibleOrder(order,orderId,config) || order.browserHash !== fingerprint('browser',key,config)) return denied();
    const purchase = await verifiedPurchase(config,store,order);
    const link = purchase && reportLink(purchase,Date.now(),config);
    return link ? json(link) : denied();
  } catch(e) {
    return error(e);
  }
};
