import {isIP} from 'node:net';
export const PRICE = 39900;
export const ORDER_NAME = '할매의 깊은 장부';
export const DAY = 24 * 60 * 60 * 1000;

const previewOrigins = new Set([
  'https://halmae-fortune-v87-preview.netlify.app',
  'https://test-v87--halmae-fortune-v87-preview.netlify.app',
]);

export function isPreview(req) {
  return previewOrigins.has(new URL(req.url).origin);
}

function legalUrl(value){
  try {
    const url=new URL(value);
    return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;
  } catch { return null; }
}

export function merchantReady(env=process.env){
  const phone=env.LIVE_SUPPORT_PHONE??'';
  const mailOrder=env.LIVE_MAIL_ORDER_NUMBER??'';
  const officer=env.LIVE_PRIVACY_OFFICER??'';
  return env.LIVE_MERCHANT_DISCLOSURES_APPROVED==='true' &&
    /^0\d{1,2}-\d{3,4}-\d{4}$/.test(phone) &&
    /^\d{4}-[가-힣]{2,20}-\d{4,8}$/.test(mailOrder) &&
    /^[가-힣A-Za-z][가-힣A-Za-z .'-]{1,59}$/.test(officer) &&
    !/미정|대기|미확정|담당자|추후|TBD|placeholder/i.test(officer);
}

export function paymentConfig(req) {
  const {PAYMENT_MODE, TOSS_TEST_CLIENT_KEY, TOSS_TEST_SECRET_KEY, REPORT_TOKEN_SECRET} = process.env;
  const origin = new URL(req.url).origin;
  if (PAYMENT_MODE === 'live') {
    const {PAYMENT_LIVE_ORIGIN,TOSS_LIVE_CLIENT_KEY,TOSS_LIVE_SECRET_KEY,LIVE_REPORT_TOKEN_SECRET,
      PAYMENT_LIVE_APPROVED,PAYMENT_LIVE_SALES_ENABLED,PAYMENT_RUNTIME_TIER,URL,SITE_ID,PAYMENT_LIVE_SITE_ID,TOSS_LIVE_MERCHANT_ID,
      PAYMENT_LIVE_WEBHOOK_KEY,PAYMENT_LIVE_OPERATOR_TOKEN,LIVE_TERMS_URL,LIVE_PRIVACY_URL,LIVE_REFUND_URL}=process.env;
    if (isPreview(req) || PAYMENT_RUNTIME_TIER!=='production' || !SITE_ID || SITE_ID!==PAYMENT_LIVE_SITE_ID || URL?.replace(/\/$/,'')!==origin ||
        PAYMENT_LIVE_ORIGIN!==origin || !origin.startsWith('https://') ||
        PAYMENT_LIVE_APPROVED!=='true' || !TOSS_LIVE_MERCHANT_ID || !/^live_(?:gck|ck)_[A-Za-z0-9_]+$/.test(TOSS_LIVE_CLIENT_KEY??'') ||
        !/^live_(?:gsk|sk)_[A-Za-z0-9_]+$/.test(TOSS_LIVE_SECRET_KEY??'') ||
        (LIVE_REPORT_TOKEN_SECRET?.length??0)<32 || LIVE_REPORT_TOKEN_SECRET===REPORT_TOKEN_SECRET) return null;
    const legal={terms:legalUrl(LIVE_TERMS_URL),privacy:legalUrl(LIVE_PRIVACY_URL),refund:legalUrl(LIVE_REFUND_URL)};
    const policyVersion=process.env.LIVE_POLICY_VERSION;
    const merchant=merchantReady()?{phone:process.env.LIVE_SUPPORT_PHONE,
      mailOrderNumber:process.env.LIVE_MAIL_ORDER_NUMBER,privacyOfficer:process.env.LIVE_PRIVACY_OFFICER}:null;
    const salesEnabled=Boolean(merchant) && process.env.LIVE_POLICY_APPROVED==='true' && /^[a-zA-Z0-9._-]{1,50}$/.test(policyVersion??'') &&PAYMENT_LIVE_SALES_ENABLED==='true' && Object.values(legal).every(Boolean) &&
      (process.env.PAYMENT_WEBHOOK_PUBLIC==='true'
        ? (process.env.PAYMENT_WEBHOOK_ALLOWED_IPS??'').split(',').every(ip=>Boolean(isIP(ip.trim())))
        : (PAYMENT_LIVE_WEBHOOK_KEY?.length??0)>=32) && (PAYMENT_LIVE_OPERATOR_TOKEN?.length??0)>=32 &&
      PAYMENT_LIVE_WEBHOOK_KEY!==PAYMENT_LIVE_OPERATOR_TOKEN;
    return {origin,mode:'live',salesEnabled,legal,policyVersion,merchant,
      clientKey:TOSS_LIVE_CLIENT_KEY,secretKey:TOSS_LIVE_SECRET_KEY,tokenSecret:LIVE_REPORT_TOKEN_SECRET,identitySecret:process.env.LIVE_IDENTITY_SECRET||LIVE_REPORT_TOKEN_SECRET,merchantId:TOSS_LIVE_MERCHANT_ID};
  }
  if (PAYMENT_MODE !== 'test' || !isPreview(req) ||
      !/^test_(?:gck|ck)_[A-Za-z0-9_]+$/.test(TOSS_TEST_CLIENT_KEY ?? '') ||
      !/^test_(?:gsk|sk)_[A-Za-z0-9_]+$/.test(TOSS_TEST_SECRET_KEY ?? '') ||
      (REPORT_TOKEN_SECRET?.length ?? 0) < 32) return null;
  return {origin, mode:'test', salesEnabled:true, clientKey: TOSS_TEST_CLIENT_KEY, secretKey: TOSS_TEST_SECRET_KEY};
}

export const checkoutScope=config=>config.mode==='live'?'toss-live-checkout':'toss-test-checkout';
export const recoveryScope=config=>config.mode==='live'?'toss-live-recovery-v1':'toss-test-recovery-v2';
