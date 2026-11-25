import {saveBirthDraft} from './birth-handoff.js';
import {checkoutKey,callbackKey,post,recordConversion,reportKey,rememberReport,forgetCheckout,forgetReport,recentOrder,forgetCheckoutAttempt} from '/purchase.js';

const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const renew = document.querySelector('#renew');
const contract = document.querySelector('#contract');
const contractBody = document.querySelector('#contract-body');
const documentTime=new Intl.DateTimeFormat('ko-KR',{dateStyle:'long',timeStyle:'long',timeZone:'Asia/Seoul'});
let contractText='';
async function showContract(orderId) {
  contract.hidden=true;
  contractBody.replaceChildren();
  contractText='';
  const record=await post('access',{action:'contract',orderId});
  const seller=record.seller;
  const lines=[
    ...(record.test?['테스트용 거래 기록 · 실제 청구 없음']:[]),
    '주문번호 '+record.orderId,
    '판매자 '+seller.name+' · 대표 '+seller.representative,
    '사업자등록번호 '+seller.registration,
    ...(seller.mailOrderNumber?['통신판매업 신고번호 '+seller.mailOrderNumber]:[]),
    '사업장 주소 '+seller.address,
    '고객 문의 '+[seller.email,seller.phone].filter(Boolean).join(' · '),
    '상품 '+record.product,
    '결제수단 카드 · 승인 금액 '+record.amount.toLocaleString('ko-KR')+'원',
    '승인 시각 '+documentTime.format(new Date(record.approvedAt)),
    '열람 만료 '+documentTime.format(record.purchaseExpiresAt),
    record.delivery,record.withdrawal,'적용 정책 버전 '+record.policyVersion,
  ];
  for(const line of lines){
    const p=document.createElement('p');
    p.textContent=line;
    contractBody.append(p);
  }
  const links=document.createElement('ul');
  for(const [key,label] of [['terms','이용약관'],['privacy','개인정보처리방침'],['refund','취소·환불 안내']]){
    const li=document.createElement('li');
    const link=document.createElement('a');
    link.href=record.policies[key];
    link.textContent=label;
    li.append(link);links.append(li);
    lines.push(label+' '+record.policies[key]);
  }
  contractBody.append(links);
  if(record.policyOriginals){
    const labels={terms:'이용약관',privacy:'개인정보처리방침',refund:'취소·환불 안내'};
    lines.push('', '구매 당시 정책 원문');
    for(const key of ['terms','privacy','refund']) lines.push('',labels[key],record.policyOriginals[key].text);
  }
  contractText=lines.join('\n');
  contract.hidden=false;
}
document.querySelector('#save-contract').addEventListener('click',()=>{
  if(!contractText) return;
  const url=URL.createObjectURL(new Blob([contractText],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;link.download='halmae-contract.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.querySelector('#read-contract').addEventListener('click',async event=>{
  if(!renew.elements.orderId.reportValidity()) return;
  event.currentTarget.disabled=true;
  const button=event.currentTarget;
  try {
    await showContract(renew.elements.orderId.value.trim());
    contract.scrollIntoView();
    status.textContent='보관된 구매 계약내용을 불러왔어요.';
  }catch(error){status.textContent=error.message;}
  finally{button.disabled=false;}
});
renew.elements.orderId.value = recentOrder() ?? '';
renew.addEventListener('submit',async event=>{
  event.preventDefault();
  event.submitter.disabled = true;
  try {
    const result = await post('access',{orderId:renew.elements.orderId.value.trim()});
    rememberReport(result);
    await showReport(result);
  } catch(error) {
    status.textContent = error.message;
  } finally {
    event.submitter.disabled = false;
  }
});
const params = new URLSearchParams(location.search);
const failure = params.get('failed') === '1';
const callback = {
  orderId:params.get('orderId'),paymentKey:params.get('paymentKey'),amount:Number(params.get('amount')),
};
history.replaceState(null,'',location.pathname);

function read(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); }
  catch { return null; }
}
fetch('/.netlify/functions/recovery',{cache:'no-store'}).then(r=>r.json()).then(({enabled})=>{
  document.querySelector('#recover').hidden = !enabled;
}).catch(()=>{});

async function showReport({token,orderId,purchaseExpiresAt,paymentMode,contractAvailable},{fresh=false}={}) {
  document.querySelector('#opened-ledger').hidden=true;
  if(contractAvailable) await showContract(orderId);
  const live=paymentMode==='live';
  if(live) document.querySelector('h1').textContent='결제 결과';
  const order = document.querySelector('#order-number');
  order.hidden = !orderId;
  if (orderId) {
    order.textContent = (live?'주문 번호: ':'테스트 주문 번호: ')+orderId;
    renew.elements.orderId.value = orderId;
  }
  const expiry = document.querySelector('#purchase-expiry');
  expiry.hidden = !Number.isFinite(purchaseExpiresAt);
  if (!expiry.hidden) {
    const formatted = new Intl.DateTimeFormat('ko-KR',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Seoul'});
    expiry.textContent = '구매 열람 만료 '+formatted.format(purchaseExpiresAt)+' (한국 시간)';
  }
  const link = document.querySelector('#report');
  link.href = '/report.html#'+encodeURIComponent(token);
  const ledger = document.querySelector('#opened-ledger');
  ledger.hidden = link.hidden = false;
  if (fresh) ledger.classList.add('ledger-unseal');
  status.textContent = live?'결제가 완료됐어요. 지금 보고서를 열 수 있어요.':'테스트 결제가 완료됐어요. 지금 보고서를 열 수 있어요. 실제로 청구된 금액은 없어요.';
}

const checkout = read(checkoutKey);
const saved = read(reportKey);
let pending = read(callbackKey);
if(checkout?.paymentMode==='live') document.querySelector('h1').textContent='결제 결과';
if(params.get('restore')==='1' && recentOrder()){
  try{
    const result=await post('access',{orderId:recentOrder()});
    rememberReport(result);
    saveBirthDraft(null);
    forgetCheckoutAttempt();
    await showReport(result);
  }catch(error){status.textContent=error.message;}
} else if (failure) {
  forgetCheckout();
  const cancelled = ['USER_CANCEL','PAY_PROCESS_CANCELED'].includes(params.get('code'));
  const label=checkout?.paymentMode==='live'?'결제':'테스트 결제';
  status.textContent = cancelled ? label+'를 취소했습니다.' : label+'가 완료되지 않았습니다. 주문 화면에서 다시 시도해 주세요.';
  recordConversion(cancelled?'test_payment_cancel':'test_payment_failure');
} else {
  if (callback.orderId && callback.paymentKey && (!checkout || callback.orderId === checkout.orderId)) {
    pending = callback;
    try { sessionStorage.setItem(callbackKey,JSON.stringify(pending)); }
    catch { /* The current callback can still be confirmed with the browser cookie. */ }
  }
  if (pending?.orderId && (!checkout || pending.orderId === checkout.orderId)) {
    retry.addEventListener('click',confirm);
    await confirm();
  } else if (saved?.expiresAt > Date.now()) {
    try { await showReport(saved); }
    catch(error){status.textContent=error.message;}
  } else {
    forgetReport();
    status.textContent = '결제 완료일부터 365일 동안 웹 열람할 수 있습니다. 같은 브라우저에서 새 링크를 받거나 동의한 이메일로 복구해 주세요.';
  }
}

async function confirm() {
  retry.hidden = true;
  status.textContent = '결제가 완료됐는지 확인하고 있어요…';
  try {
    const result = await post('payment',pending,checkout?.token);
    rememberReport(result);
    saveBirthDraft(null);
    forgetCheckoutAttempt();
    forgetCheckout();
    recordConversion('test_payment_success');
    await showReport(result,{fresh:true});
  } catch (error) {
    status.textContent = error.message;
    recordConversion('test_payment_failure');
    retry.hidden = false;
  }
}
