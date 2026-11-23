import {orders,json,parse,verify,error} from './shared.mjs';
import {PRICE,paymentConfig} from './payment-config.mjs';
import {mailConfig} from './recovery-mail.mjs';
import {eligibleOrder,recordApproval,reportLink} from './entitlement.mjs';
import {approvedPayment,confirmPayment} from './toss.mjs';

export default async req => {
  const config = paymentConfig(req);
  if (req.method === 'GET') return json({enabled:Boolean(config),...(mailConfig(config)?{recoveryEnabled:true}:{})});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  if (!config) return json({error:'테스트 결제는 현재 준비 중입니다.'},503);
  try {
    const {orderId,paymentKey,amount} = await parse(req);
    const claim = verify((req.headers.get('authorization') ?? '').replace(/^Bearer /,''));
    if (claim?.scope !== 'toss-test-checkout' || claim.orderId !== orderId) {
      return json({error:'이 브라우저에서 시작한 유효한 테스트 주문이 필요합니다.'},403);
    }
    if (amount !== PRICE) return json({error:'주문 금액을 확인해 주세요.'},400);
    const store = orders();
    const order = await store.get(orderId,{type:'json'});
    if (!eligibleOrder(order,orderId)) {
      return json({error:'테스트 주문 상태를 확인해 주세요.'},409);
    }
    if (order.paymentKey && order.paymentKey !== paymentKey) {
      return json({error:'이미 다른 결제 정보가 기록된 주문입니다.'},409);
    }
    const payment = await confirmPayment(config, orderId, paymentKey);
    if (!approvedPayment(payment, orderId, paymentKey)) {
      return json({error:'완료된 테스트 카드 결제를 확인하지 못했습니다.'},409);
    }
    // Concurrent approvals of this order record the same provider timestamp and expiry.
    const purchase = await recordApproval(store,order,payment);
    const link = purchase && reportLink(purchase);
    return link ? json(link) : json({error:'테스트 보고서 열람 기간이 끝났습니다.'},410);
  } catch (e) {
    return error(e);
  }
};
