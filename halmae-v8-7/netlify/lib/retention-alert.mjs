import {mailConfig,recoveryEmail} from '../functions/recovery-mail.mjs';

export async function notifyRetention(provider,counts,now=Date.now()){
 const mail=mailConfig(provider);
 const recipient=recoveryEmail(process.env.OPS_RETENTION_ALERT_EMAIL);
 if(!mail||!recipient||counts.failed===0) return false;
 const result=await fetch('https://api.resend.com/emails',{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(4000),
  headers:{Authorization:'Bearer '+mail.key,'Content-Type':'application/json',
   'Idempotency-Key':'retention-'+new Date(now).toISOString().slice(0,10)},
  body:JSON.stringify({from:mail.from,to:[recipient],subject:'할매의 운명방 삭제 작업 점검',
   text:'삭제 작업에서 재확인이 필요한 항목이 발견됐습니다. 운영 화면에서 요약을 확인해 주세요.'}),
 });
 return result.ok;
}
