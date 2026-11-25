// This transport is limited to Resend's synthetic delivery address.
export async function previewContractEmail({key,from,document},transport=fetch){
 if(document?.test!==true) throw Error('Synthetic contract required');
 const response=await transport('https://api.resend.com/emails',{
  method:'POST',
  headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
  body:JSON.stringify({from,to:['delivered@resend.dev'],subject:'할매의 운명방 계약서면 발송 검수',
   text:'테스트 계약서면 · 실제 청구 없음\n'+JSON.stringify(document,null,2)}),
  redirect:'error',signal:AbortSignal.timeout(4000),
 });
 if(!response.ok) throw Error('Contract email preview unavailable');
}
