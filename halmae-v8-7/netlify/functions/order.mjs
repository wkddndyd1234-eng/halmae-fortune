import crypto from 'node:crypto';
import {orders,json,parse,sign,error} from './shared.mjs';
import {mailConfig,recoveryEmail} from './recovery-mail.mjs';
import {browserCredential,browserHeader,fingerprint} from './entitlement.mjs';
import {normalizeBirth} from './saju.mjs';
import {DAY,ORDER_NAME,PRICE,paymentConfig} from './payment-config.mjs';

export default async req => {
 if (req.method !== 'POST') return json({error:'Method not allowed'},405);
 try {
  const x = await parse(req);
  if (!x || typeof x !== 'object') return json({error:'출생 정보를 확인해 주세요.'},400);
  const name = typeof x.name === 'string' ? x.name.trim() : '';
  if (name.length > 30) return json({error:'별칭은 30자 이하로 입력해 주세요.'},400);
  const channel = x.channel ?? 'admin-demo';
  if (!['admin-demo','toss-test'].includes(channel)) return json({error:'주문 유형을 확인해 주세요.'},400);
  const config = channel === 'toss-test' ? paymentConfig(req) : null;
  if (channel === 'toss-test' && !config) return json({error:'테스트 결제는 현재 준비 중입니다.'},503);
  if (x.consent !== true) return json({error:'테스트 정보 처리에 동의해 주세요.'},400);
  const optedIn = Boolean(mailConfig(config)) && x.recoveryConsent === true;
  const email = optedIn ? recoveryEmail(x.email) : '';
  if (optedIn && !email) {
    return json({error:'복구 이메일 주소를 확인해 주세요.'},400);
  }
  let birth;
  try { birth = normalizeBirth(x); }
  catch (e) { return json({error:e.message},400); }
  if (!['male','female'].includes(birth.gender)) return json({error:'성별을 선택해 주세요.'},400);
  const {birthDate,birthTime,gender,calendarType,isLeapMonth} = birth;
  const orderId = 'HM-'+crypto.randomUUID();
  const createdAt = Date.now();
  const result = {orderId,amount:PRICE,status:'pending',paymentEnabled:Boolean(config)};
  const credential = config ? browserCredential(req) : null;
  if (config) {
    result.clientKey = config.clientKey;
    result.orderName = ORDER_NAME;
    result.checkoutToken = sign({orderId,scope:'toss-test-checkout',exp:createdAt+DAY});
    result.successUrl = config.origin+'/payment-result.html';
    result.failUrl = config.origin+'/payment-result.html?failed=1';
  }
  await orders().setJSON(orderId,{orderId,name:name||'손님',birthDate,gender,calendarType,isLeapMonth,...(birthTime?{birthTime}:{}),amount:PRICE,channel,status:'pending',createdAt,...(email?{recoveryEmailHash:fingerprint('email',email)}:{}),...(credential?{browserHash:fingerprint('browser',credential)}:{})});
  const response = json(result);
  if (credential) response.headers.set('Set-Cookie',browserHeader(credential));
  return response;
 } catch (e) { return error(e); }
};
