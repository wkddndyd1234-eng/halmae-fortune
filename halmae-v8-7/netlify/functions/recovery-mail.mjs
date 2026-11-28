import {merchantIdentity} from '../lib/commerce-contract.mjs';
import {recoveryScope} from './payment-config.mjs';
import {createHmac,randomBytes} from 'node:crypto';
import {sign} from './shared.mjs';

const lifetime = 15*60_000;

export function recoveryEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@<>;,"]{1,64}@(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(email)) return '';
  const at = email.lastIndexOf('@');
  return email.slice(0,at+1)+email.slice(at+1).toLowerCase();
}

export function mailConfig(config) {
  const {RECOVERY_RESEND_API_KEY,RECOVERY_FROM_EMAIL} = process.env;
  const live=config?.mode==='live';
  const from = recoveryEmail(live?process.env.LIVE_RECOVERY_FROM_EMAIL:RECOVERY_FROM_EMAIL);
  const key=live?process.env.LIVE_RECOVERY_RESEND_API_KEY:RECOVERY_RESEND_API_KEY;
  if (!config || !key || !from) return null;
  return {origin:config.origin,from,key,mode:config.mode,tokenSecret:config.tokenSecret};
}

export async function sendRecovery(config,order,email,rateKey,now=Date.now()) {
  const expires = Math.min(order.purchaseExpiresAt,now+lifetime);
  if (expires<=now) return;
  const token = sign({orderId:order.orderId,scope:recoveryScope(config),exp:expires,nonce:config.mode==='live'?createHmac('sha256',config.tokenSecret).update(rateKey).digest('hex'):randomBytes(16).toString('hex')},config.tokenSecret);
  const url = config.origin+'/recovery.html#'+token;
  const response = await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      'Authorization':'Bearer '+config.key,
      'Content-Type':'application/json',
      'Idempotency-Key':rateKey,
    },
    body:JSON.stringify({
      from:config.mode==='live'?'할매의 운명방 <'+config.from+'>':config.from,
      ...(config.mode==='live'?{reply_to:merchantIdentity.email}:{}),to:[email],subject:'할매의 운명방 보고서 복구',
      text:'주문 번호 '+order.orderId+'\n\n아래 링크에서 보고서를 복구할 수 있습니다. 링크는 최대 15분 동안 한 번만 유효합니다. 요청한 적이 없으면 이 메일을 무시해 주세요.\n'+url,
    }),
    signal:AbortSignal.timeout(4000),redirect:'error',
  });
  if (!response.ok) throw Object.assign(Error('Recovery email unavailable'),{status:response.status});
}
