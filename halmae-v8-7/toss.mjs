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

export function approvedPayment(payment, orderId, paymentKey) {
  return typeof paymentKey === 'string' && validKey.test(paymentKey) && payment?.orderId === orderId && payment.paymentKey === paymentKey &&
    payment.status === 'DONE' && payment.currency === 'KRW' &&
    payment.totalAmount === PRICE && payment.balanceAmount === PRICE &&
    payment.method === '카드' && Number.isFinite(Date.parse(payment.approvedAt));
}

export async function findPayment(config, orderId) {
  return toss(config, '/orders/' + encodeURIComponent(orderId));
}

export async function confirmPayment(config, orderId, paymentKey) {
  if (typeof paymentKey !== 'string' || !validKey.test(paymentKey)) return null;
  // A retry first checks Toss for an already approved payment for this order.
  const current = await findPayment(config, orderId);
  if (approvedPayment(current, orderId, paymentKey)) return current;
  if (current && (current.paymentKey !== paymentKey ||
      !['READY','IN_PROGRESS'].includes(current.status))) return null;

  const idempotencyKey = createHash('sha256').update(JSON.stringify([orderId,paymentKey])).digest('hex');
  const confirmed = await toss(config, '/confirm', {
    method: 'POST',
    headers: {'Content-Type':'application/json', 'Idempotency-Key':idempotencyKey},
    body: JSON.stringify({orderId,paymentKey,amount:PRICE}),
  });
  return confirmed ?? findPayment(config, orderId);
}
