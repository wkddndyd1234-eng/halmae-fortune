import {sign} from './shared.mjs';

const interval = 15 * 60 * 1000;

export function recoveryEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@<>;,"]{1,64}@(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(email)) return '';
  const at = email.lastIndexOf('@');
  return email.slice(0,at+1)+email.slice(at+1).toLowerCase();
}

export function mailConfig(config) {
  const {RECOVERY_RESEND_API_KEY,RECOVERY_FROM_EMAIL} = process.env;
  const from = recoveryEmail(RECOVERY_FROM_EMAIL);
  if (!config || !RECOVERY_RESEND_API_KEY || !from) return null;
  return {origin:config.origin,from,key:RECOVERY_RESEND_API_KEY};
}

export async function sendRecovery(config,order,now=Date.now()) {
  const expires = (Math.floor(now/interval)+2)*interval;
  const token = sign({orderId:order.orderId,scope:'toss-test-recovery',exp:expires});
  const url = config.origin+'/recovery.html#'+token;
  const response = await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      'Authorization':'Bearer '+config.key,
      'Content-Type':'application/json',
      'Idempotency-Key':'halmae-recovery/'+order.orderId+'/'+expires+'/'+new URL(config.origin).hostname,
    },
    body:JSON.stringify({
      from:config.from,to:[order.recoveryEmail],subject:'할매의 운명방 테스트 보고서 복구',
      text:'테스트 주문 번호 '+order.orderId+'\n\n아래 링크에서 보고서를 복구할 수 있습니다. 링크는 최대 30분 동안 유효합니다. 요청한 적이 없으면 이 메일을 무시해 주세요.\n'+url,
    }),
    signal:AbortSignal.timeout(4000),redirect:'error',
  });
  if (!response.ok) throw Error('Recovery email unavailable');
}
