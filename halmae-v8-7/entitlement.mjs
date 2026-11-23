import {createHmac,randomBytes} from 'node:crypto';
import {secret,sign} from './shared.mjs';
import {DAY,PRICE} from './payment-config.mjs';
import {approvedPayment,findPayment} from './toss.mjs';

export const orderPattern = /^HM-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const PURCHASE_DURATION = 365*DAY;
export const REPORT_SCOPE = 'toss-test-report-v2';
const browserCookie = '__Host-halmae-preview';
const browserPattern = /^[a-f0-9]{64}$/;

export function fingerprint(purpose,value) {
  return createHmac('sha256',secret()).update(purpose+'\0'+value).digest('hex');
}

export function browserKey(req) {
  const value = (req.headers.get('cookie') ?? '').split(';').map(part=>part.trim())
    .find(part=>part.startsWith(browserCookie+'='))?.slice(browserCookie.length+1);
  return browserPattern.test(value ?? '') ? value : null;
}

export function browserCredential(req) {
  return browserKey(req) ?? randomBytes(32).toString('hex');
}

export function browserHeader(value) {
  const maxAge = value ? (PURCHASE_DURATION+DAY)/1000 : 0;
  return `${browserCookie}=${value ?? ''}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

export function eligibleOrder(order,id) {
  return order?.orderId === id && order.channel === 'toss-test' && order.amount === PRICE &&
    ['pending','test-paid'].includes(order.status);
}

export function storedExpiry(order) {
  if (Number.isSafeInteger(order.purchaseExpiresAt)) return order.purchaseExpiresAt;
  return Date.parse(order.approvedAt)+PURCHASE_DURATION;
}

export async function recordApproval(store,order,payment,now=Date.now()) {
  const approvedAt = Date.parse(payment.approvedAt);
  const expiry = approvedAt+PURCHASE_DURATION;
  if (!Number.isFinite(expiry) || expiry<=now || approvedAt>now+5*60_000 ||
      (order.approvedAt && Date.parse(order.approvedAt)!==approvedAt) ||
      (order.purchaseExpiresAt !== undefined && order.purchaseExpiresAt!==expiry)) return null;
  if (order.status === 'test-paid' && order.purchaseExpiresAt === expiry && !order.recoveryEmail) return order;
  const {recoveryEmail,...fields} = order;
  const updated = {...fields,status:'test-paid',paymentKey:payment.paymentKey,approvedAt:payment.approvedAt,purchaseExpiresAt:expiry};
  if (recoveryEmail && !fields.recoveryEmailHash) updated.recoveryEmailHash = fingerprint('email',recoveryEmail);
  await store.setJSON(order.orderId,updated);
  return updated;
}

export async function verifiedPurchase(config,store,order) {
  if (storedExpiry(order)<=Date.now()) return null;
  const payment = await findPayment(config,order.orderId);
  if (!approvedPayment(payment,order.orderId,order.paymentKey ?? payment?.paymentKey)) return null;
  return recordApproval(store,order,payment);
}

export function reportLink(order,now=Date.now()) {
  const expiresAt = Math.min(order.purchaseExpiresAt,Math.floor(now/300_000)*300_000+30*60_000);
  if (expiresAt<=now) return null;
  return {orderId:order.orderId,token:sign({orderId:order.orderId,scope:REPORT_SCOPE,exp:expiresAt}),
    expiresAt,purchaseExpiresAt:order.purchaseExpiresAt};
}
