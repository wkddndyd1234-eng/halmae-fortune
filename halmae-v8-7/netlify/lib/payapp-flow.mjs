import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {startPayappOrder,payappEntitled} from './payapp.mjs';
import {sendContractCopy} from './contract-delivery.mjs';
import {contractDocument} from './commerce-contract.mjs';
import {withPolicyOriginals} from './contract-archive.mjs';

export function encryptContractEmail(email,key){
 const nonce=randomBytes(12);
 const cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),nonce);
 const data=Buffer.concat([cipher.update(email,'utf8'),cipher.final()]);
 return [nonce,cipher.getAuthTag(),data].map(item=>item.toString('base64url')).join('.');
}

function decryptContractEmail(envelope,key){
 const [nonce,tag,data]=envelope.split('.').map(item=>Buffer.from(item,'base64url'));
 const cipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),nonce);
 cipher.setAuthTag(tag);
 return Buffer.concat([cipher.update(data),cipher.final()]).toString('utf8');
}

export async function preparePayappCheckout(store,config,order,phone,email,transport=fetch){
 const previous=await store.get('payapp/order/'+order.orderId,{type:'json'});
 const result=(body,status=200)=>({body:{orderId:order.orderId,...body},status});
 if(previous?.status==='request-canceled') return result({error:'이전 결제 요청이 취소됐어요. 다시 눌러 새 주문을 시작해 주세요.',restartCheckout:true},409);
 if(payappEntitled(previous)) return result({orderId:order.orderId,paymentAlreadyApproved:true});
 if(previous && previous.status!=='pending') return result({error:'기존 결제를 확인 중이에요. 주문번호로 고객센터에 문의해 주세요.'},409);
 const mailKey='payapp/contract-mail/'+order.orderId;
 await store.setJSON(mailKey,{state:'queued',recipient:encryptContractEmail(email,process.env.PAYAPP_CONTRACT_EMAIL_KEY)},{onlyIfNew:true});
 try{
  const checkout=await startPayappOrder(store,config.payapp,{
   orderId:order.orderId,amount:order.amount,
   reference:previous?.reference??randomBytes(24).toString('hex'),createdAt:order.createdAt,
  },phone,transport);
  return result({orderId:order.orderId,amount:order.amount,provider:'payapp',checkoutUrl:checkout.checkoutUrl});
 }catch{
  return result({error:'결제창 생성 결과를 확인 중이에요. 다시 청구하지 않도록 주문번호 '+order.orderId+'로 고객센터에 문의해 주세요.'},503);
 }
}

export async function deliverPayappContract(store,archive,order,transport=fetch,now=Date.now()){
 const key='payapp/contract-mail/'+order.orderId;
 const current=await store.getWithMetadata(key,{type:'json'});
 const row=current?.data;
 if(!row?.recipient || row.state==='api-accepted' || row.state==='customer-support' || row.leaseUntil>now) return row?.state;
 const document=await withPolicyOriginals(archive,contractDocument(order));
 if(!document) return 'queued';
 if(!(await store.setJSON(key,{...row,leaseUntil:now+60_000,firstAttemptAt:row.firstAttemptAt??now},{onlyIfMatch:current.etag})).modified) return 'queued';
 // Resend's idempotency window is limited. An older ambiguous send requires manual reissue.
 let state='customer-support';
 try{
  if(!row.firstAttemptAt || now-row.firstAttemptAt<23*3600_000){
   const result=await sendContractCopy({key:process.env.LIVE_RECOVERY_RESEND_API_KEY,from:process.env.LIVE_RECOVERY_FROM_EMAIL,
    to:decryptContractEmail(row.recipient,process.env.PAYAPP_CONTRACT_EMAIL_KEY),document},transport);
   if(result.state==='accepted') state='api-accepted';
  }
 }finally{
  await store.setJSON(key,{state,receipt:'unverified',at:now});
 }
 return state;
}
