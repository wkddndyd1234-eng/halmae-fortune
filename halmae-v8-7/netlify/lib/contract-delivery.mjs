import {merchantIdentity} from './commerce-contract.mjs';
const endpoint='https://api.resend.com/emails';

export async function sendContractCopy({key,from,to,document},transport){
 if(!document?.orderId||!document.policyOriginals||!to) throw Error('Contract delivery data incomplete');
 const text=[
  '할매의 운명방 계약서면',
  '주문번호 '+document.orderId,
  document.product,
  document.amount.toLocaleString('ko-KR')+'원 · 승인 '+document.approvedAt,
  '열람 만료 '+new Date(document.purchaseExpiresAt).toISOString(),
  Object.values(document.seller).join(' · '),
  document.delivery,document.withdrawal,
  '구매 당시 약관·개인정보처리방침·환불 기준',
  ...['terms','privacy','refund'].map(name=>document.policyOriginals[name].text),
  '장부와 계약서면은 구매 확인 화면에서 다시 확인할 수 있어요. 복구 이메일을 등록했다면 주문번호로 장부 복구를 요청할 수 있어요.',
 ].join('\n\n');
 for(let attempt=1;attempt<=2;attempt++){
  try {
   const response=await transport(endpoint,{
    method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',
     'Idempotency-Key':'contract/'+document.orderId},
    redirect:'error',signal:AbortSignal.timeout(4000),
    body:JSON.stringify({from:'할매의 운명방 <'+from+'>',reply_to:merchantIdentity.email,to:[to],subject:'할매의 운명방 구매 계약서면',text}),
   });
   if(response.ok) return {state:'accepted',attempt};
   if(response.status<500&&response.status!==429) return {state:'customer-support',attempt};
  }catch { /* An identical idempotency key prevents duplicate delivery on retry. */ }
 }
 return {state:'customer-support',attempt:2};
}
