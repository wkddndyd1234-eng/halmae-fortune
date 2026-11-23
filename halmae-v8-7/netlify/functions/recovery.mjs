import {error,json,orders,parse,sign,verify} from './shared.mjs';
import {DAY,PRICE,paymentConfig} from './payment-config.mjs';
import {approvedPayment,findPayment} from './toss.mjs';
import {mailConfig,recoveryEmail,sendRecovery} from './recovery-mail.mjs';

const accepted = () => json({accepted:true},202);
const orderPattern = /^HM-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

export default async req => {
  const config = paymentConfig(req);
  const mail = mailConfig(config);
  if (req.method === 'GET') return json({enabled:Boolean(mail)});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  if (!mail) return json({error:'이메일 복구는 현재 제공되지 않습니다.'},503);
  try {
    const input = await parse(req);
    const exchange = input?.action === 'exchange';
    if (!exchange && input?.action !== 'request') return json({error:'복구 요청을 확인해 주세요.'},400);
    const claim = exchange ? verify(input.token) : null;
    const orderId = exchange ? claim?.orderId : input.orderId;
    if (exchange && claim?.scope !== 'toss-test-recovery') {
      return json({error:'유효한 복구 링크가 필요합니다.'},403);
    }
    if (typeof orderId !== 'string' || !orderPattern.test(orderId)) return accepted();
    const store = orders();
    const order = await store.get(orderId,{type:'json'});
    if (!order?.recoveryEmail || order.orderId !== orderId || order.channel !== 'toss-test' ||
        order.amount !== PRICE || !['pending','test-paid'].includes(order.status)) {
      return exchange ? json({error:'복구 가능한 테스트 주문이 없습니다.'},403) : accepted();
    }
    if (!exchange) {
      if (recoveryEmail(input.email) === order.recoveryEmail && order.createdAt + 8*DAY > Date.now()) {
        // Uniform response avoids disclosing whether an address matches a stored order.
        try { await sendRecovery(mail,order); } catch { /* Mail failure is not a payment failure. */ }
      }
      return accepted();
    }
    const paid = await findPayment(config,orderId);
    const paymentKey = order.paymentKey ?? paid?.paymentKey;
    const expiresAt = Date.parse(paid?.approvedAt) + 7*DAY;
    if (!approvedPayment(paid,orderId,paymentKey) || expiresAt <= Date.now()) {
      return json({error:'열람 가능한 카드 승인을 확인하지 못했습니다. 미승인 주문은 주문 화면에서 다시 시도해 주세요.'},403);
    }
    if (order.status === 'pending') {
      await store.setJSON(orderId,{...order,status:'test-paid',paymentKey,approvedAt:paid.approvedAt});
    }
    return json({orderId,token:sign({orderId,scope:'toss-test-report',exp:expiresAt}),expiresAt});
  } catch(e) {
    return error(e);
  }
};
