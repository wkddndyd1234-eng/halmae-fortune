import {createHash} from 'node:crypto';
import {PRICE} from './payment-config.mjs';

const base = 'https://api.tosspayments.com/v1/payments';
const validKey = /^[!-~]{1,200}$/;

async function toss(config, path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      Authorization: 'Basic ' + Buffer.from(config.secretKey + ':').toString('base64'),
      ...options.headers,
    },
    signal: AbortSignal.timeout(8000),
    redirect: 'error',
  });
  if (response.ok) return response.json();
  if (response.status === 404 || (options.method === 'POST' && response.status < 500)) return null;
  throw Error('테스트 결제 상태 조회 실패');
}

export const supportedPaymentMethod=(config,method)=>method==='카드' || (config?.mode==='live' && method==='간편결제');

export function approvedPayment(payment, orderId, paymentKey,config,amount=PRICE) {
  return typeof paymentKey === 'string' && validKey.test(paymentKey) && payment?.orderId === orderId && payment.paymentKey === paymentKey &&
    payment.status === 'DONE' && payment.currency === 'KRW' &&
    payment.totalAmount === amount && payment.balanceAmount === amount &&
    supportedPaymentMethod(config,payment.method) && Number.isFinite(Date.parse(payment.approvedAt));
}

export async function findPayment(config, orderId) {
  return toss(config, '/orders/' + encodeURIComponent(orderId));
}

export function cancelPayment(config,paymentKey,reason,requestId) {
  if (!validKey.test(paymentKey??'')) throw Error('Invalid provider payment key');
  return toss(config,'/'+encodeURIComponent(paymentKey)+'/cancel',{
    method:'POST',
    headers:{'Content-Type':'application/json','Idempotency-Key':requestId},
    body:JSON.stringify({cancelReason:reason}),
  });
}

export async function confirmPayment(config, orderId, paymentKey,amount=PRICE) {
  if (typeof paymentKey !== 'string' || !validKey.test(paymentKey)) return null;
  // A retry first checks Toss for an already approved payment for this order.
  const current = await findPayment(config, orderId);
  if (approvedPayment(current, orderId, paymentKey,config,amount)) return current;
  if (current && (current.paymentKey !== paymentKey ||
      !['READY','IN_PROGRESS'].includes(current.status))) return null;

  const idempotencyKey = createHash('sha256').update(JSON.stringify(config.mode==='live'?[orderId]:[orderId,paymentKey])).digest('hex');
  const confirmed = await toss(config, '/confirm', {
    method: 'POST',
    headers: {'Content-Type':'application/json', 'Idempotency-Key':idempotencyKey},
    body: JSON.stringify({orderId,paymentKey,amount}),
  });
  return confirmed ?? findPayment(config, orderId);
}
