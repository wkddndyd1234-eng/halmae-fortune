import {createHmac,randomBytes} from 'node:crypto';
import {financeStore,secret,sign} from './shared.mjs';
import {DAY,PRICE} from './payment-config.mjs';
import {liveRevoked,saveLiveSnapshot} from './live-ledger.mjs';
import {approvedPayment,findPayment} from './toss.mjs';

export const orderPattern = /^HM-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const PURCHASE_DURATION = 365*DAY;
export const REPORT_SCOPE = 'toss-test-report-v2';
export const reportScope=config=>config?.mode==='live'?'toss-live-report-v1':REPORT_SCOPE;
export const paidStatus=config=>config?.mode==='live'?'live-paid':'test-paid';
const browserCookie = '__Host-halmae-preview';
const browserPattern = /^[a-f0-9]{64}$/;

export function fingerprint(purpose,value,config) {
  return createHmac('sha256',config?.identitySecret??config?.tokenSecret??secret()).update(purpose+'\0'+value).digest('hex');
}

export function browserKey(req) {
  const value = (req.headers.get('cookie') ?? '').split(';').map(part=>part.trim())
    .find(part=>part.startsWith(browserCookie+'='))?.slice(browserCookie.length+1);
  return browserPattern.test(value ?? '') ? value : null;
}

export function browserCredential(req,fallback) {
  return browserKey(req) ?? fallback ?? randomBytes(32).toString('hex');
}

export function browserHeader(value) {
  const maxAge = value ? (PURCHASE_DURATION+DAY)/1000 : 0;
  return `${browserCookie}=${value ?? ''}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

export function eligibleOrder(order,id,config) {
  return order?.orderId === id && order.channel === (config?.mode==='live'?'toss-live':'toss-test') && order.amount === PRICE &&
    ['pending',paidStatus(config)].includes(order.status);
}

export function storedExpiry(order) {
  if (Number.isSafeInteger(order.purchaseExpiresAt)) return order.purchaseExpiresAt;
  return Date.parse(order.approvedAt)+PURCHASE_DURATION;
}

export async function recordApproval(store,order,payment,now=Date.now(),config) {
  if(config?.mode==='live' && await financeStore().get('erased/'+order.orderId,{type:'json'})) return null;
  const approvedAt = Date.parse(payment.approvedAt);
  const expiry = approvedAt+PURCHASE_DURATION;
  if (!Number.isFinite(expiry) || expiry<=now || approvedAt>now+5*60_000 ||
      (order.approvedAt && Date.parse(order.approvedAt)!==approvedAt) ||
      (order.purchaseExpiresAt !== undefined && order.purchaseExpiresAt!==expiry)) return null;
  if (order.status === paidStatus(config) && order.purchaseExpiresAt === expiry && !order.recoveryEmail) return order;
  const {recoveryEmail,...fields} = order;
  const updated = {...fields,status:paidStatus(config),paymentKey:payment.paymentKey,approvedAt:payment.approvedAt,purchaseExpiresAt:expiry};
  if (recoveryEmail && !fields.recoveryEmailHash) updated.recoveryEmailHash = fingerprint('email',recoveryEmail,config);
  if(config?.mode==='live'){
    const current=await store.getWithMetadata(order.orderId,{type:'json'});
    if(!current || await financeStore().get('erased/'+order.orderId,{type:'json'})) return null;
    for(const key of ['recoveryEmail','recoveryEmailHash']){
      if(current.data[key]===undefined && !current.data.recoveryEmail) delete updated[key];
    }
    if(!(await store.setJSON(order.orderId,updated,{onlyIfMatch:current.etag})).modified){
      const latest=await store.get(order.orderId,{type:'json'});
      if(latest?.status===paidStatus(config) && latest.paymentKey===payment.paymentKey &&
        latest.purchaseExpiresAt===expiry && !await financeStore().get('erased/'+order.orderId,{type:'json'})) return latest;
      return null;
    }
  }else await store.setJSON(order.orderId,updated);
  return updated;
}

export async function verifiedPurchase(config,store,order) {
  if (!eligibleOrder(order,order.orderId,config) || storedExpiry(order)<=Date.now()) return null;
  const payment = await findPayment(config,order.orderId);
  if(config.mode==='live'){
    if(!await saveLiveSnapshot(config,store,order,payment) || await liveRevoked(store,order)) return null;
  }
  if (!approvedPayment(payment,order.orderId,order.paymentKey ?? payment?.paymentKey,config)) return null;
  return recordApproval(store,order,payment,Date.now(),config);
}

export function reportLink(order,now=Date.now(),config) {
  const expiresAt = Math.min(order.purchaseExpiresAt,Math.floor(now/300_000)*300_000+30*60_000);
  if (expiresAt<=now) return null;
  return {orderId:order.orderId,token:sign({orderId:order.orderId,scope:reportScope(config),exp:expiresAt},config?.tokenSecret),
    expiresAt,purchaseExpiresAt:order.purchaseExpiresAt,...(order.contractTerms?{contractAvailable:true}:{}),...(config?.mode==='live'?{paymentMode:'live'}:{})};
}
