import {calculateSaju} from './saju.mjs';
import {renderLedgerPreview} from './ledger-preview-view.js';
import {readBirthDraft,saveBirthDraft,todayInKorea} from './birth-handoff.js';
import {recordConversion,post,checkoutKey,forgetCheckout,clearPurchaseStorage,rememberOrder} from '/purchase.js';

const form = document.querySelector('#form');
const msg = document.querySelector('#msg');
const buy = document.querySelector('#buy');
const admin = document.querySelector('#admin');
const adminPanel = document.querySelector('#preview-admin');
const next = document.querySelector('#next');
const issue = document.querySelector('#issue');
const resetBirth = document.querySelector('#reset-birth');
const clearStorage = document.querySelector('#clear-storage');
const endpoint = '/.netlify/functions/';
let adminOrderId;
let busy = false;

form.elements.birthDate.max = todayInKorea();
const draft = window.opener ? null : readBirthDraft();
const prefill = document.querySelector('#prefill');
if (draft) {
  for (const [key,value] of Object.entries(draft)) form.elements[key].value = value;
  prefill.hidden = false;
}

function updatePreview() {
  const {birthDate,birthTime,gender} = form.elements;
  let saju;
  if(birthDate.validity.valid && birthTime.validity.valid){
    try { saju=calculateSaju({birthDate:birthDate.value,birthTime:birthTime.value,gender:gender.value}); }
    catch { /* Incomplete or unsupported input shows the example. */ }
  }
  renderLedgerPreview(document.querySelector('#checkout-preview'),saju);
}
form.elements.birthDate.addEventListener('input',updatePreview);
form.elements.birthTime.addEventListener('input',updatePreview);
updatePreview();

resetBirth.addEventListener('click',()=>{
  saveBirthDraft(null);
  for (const field of ['name','birthDate','birthTime','gender']) form.elements[field].value = '';
  prefill.hidden = true;
  updatePreview();
  form.elements.name.focus();
  msg.textContent = '출생 입력을 지웠어요.';
});

recordConversion('checkout_view');
clearStorage.addEventListener('click',async()=>{
  clearPurchaseStorage();
  form.reset();
  updatePreview();
  prefill.hidden = true;
  form.elements.email.disabled = true;
  form.elements.email.required = false;
  document.querySelector('#code').value = '';
  adminOrderId = undefined;
  next.hidden = true;
  try {
    await post('access',{action:'forget'});
    msg.textContent = '이 브라우저의 테스트 열람 정보를 지웠습니다.';
  } catch {
    msg.textContent = '저장 정보를 지웠습니다. 열람 쿠키는 브라우저의 사이트 데이터 설정에서 삭제해 주세요.';
  }
});
fetch(endpoint+'payment',{cache:'no-store'})
  .then(response => response.ok ? response.json() : {enabled:false})
  .then(({enabled,recoveryEnabled,adminPreview}) => {
    if (adminPreview) {
      adminPanel.hidden = false;
      admin.disabled = false;
    }
    if (enabled && recoveryEnabled) {
      document.querySelector('#recovery-options').hidden = false;
      document.querySelector('#recover').hidden = false;
    }
    if (enabled) {
      buy.hidden = false;
      buy.disabled = false;
      document.querySelector('#test-guide').hidden = false;
      document.querySelector('#recent-preview').hidden = false;
      clearStorage.hidden = false;
      document.querySelector('#availability').textContent = '토스 테스트 결제 · 실제 청구 없음';
    }
  }).catch(() => {});

form.elements.recoveryConsent.addEventListener('change',()=>{
  const {email,recoveryConsent} = form.elements;
  email.disabled = !recoveryConsent.checked;
  email.required = recoveryConsent.checked;
  if (email.disabled) email.value = '';
});

function loadToss() {
  return new Promise((resolve,reject) => {
    if (window.TossPayments) return resolve(window.TossPayments);
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.onload = () => window.TossPayments ? resolve(window.TossPayments) : reject(Error('결제창을 불러오지 못했습니다.'));
    script.onerror = () => {
      script.remove();
      reject(Error('결제창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    };
    document.head.append(script);
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || ![buy,admin].includes(event.submitter) || event.submitter.disabled) return;
  const customer = event.submitter === buy;
  busy = true;
  buy.disabled = admin.disabled = clearStorage.disabled = resetBirth.disabled = true;
  next.hidden = true;
  msg.textContent = '테스트 주문을 준비하고 있습니다…';
  try {
    const data = Object.fromEntries(new FormData(form));
    const order = await post('order',{
      name:data.name,birthDate:data.birthDate,birthTime:data.birthTime,gender:data.gender,
      consent:form.elements.consent.checked,channel:customer?'toss-test':'admin-demo',
      ...(customer && form.elements.recoveryConsent.checked ?
        {email:data.email,recoveryConsent:true} : {}),
    });
    saveBirthDraft(null);
    prefill.hidden = true;
    if (!customer) {
      adminOrderId = order.orderId;
      next.hidden = false;
      msg.textContent = '관리자 테스트 주문을 준비했습니다.';
      return;
    }
    recordConversion('test_order_created');
    forgetCheckout();
    rememberOrder(order.orderId);
    msg.textContent = '테스트 주문 번호: '+order.orderId+' · 결제창을 엽니다.';
    try {
      sessionStorage.setItem(checkoutKey,JSON.stringify({orderId:order.orderId,token:order.checkoutToken}));
    } catch { /* The server can also use the browser credential set at checkout. */ }
    const TossPayments = await loadToss();
    const payment = TossPayments(order.clientKey).payment({customerKey:TossPayments.ANONYMOUS});
    recordConversion('test_payment_open');
    await payment.requestPayment({
      method:'CARD',amount:{currency:'KRW',value:order.amount},orderId:order.orderId,
      orderName:order.orderName,successUrl:order.successUrl,failUrl:order.failUrl,
    });
  } catch (error) {
    const cancelled = ['USER_CANCEL','PAY_PROCESS_CANCELED'].includes(error.code);
    if (customer) recordConversion(cancelled?'test_payment_cancel':'test_payment_failure');
    msg.textContent = cancelled ? '테스트 결제를 취소했습니다.' : error.message;
  } finally {
    busy = false;
    buy.disabled = buy.hidden;
    admin.disabled = adminPanel.hidden;
    clearStorage.disabled = resetBirth.disabled = false;
  }
});

issue.addEventListener('click',async () => {
  issue.disabled = true;
  const code = document.querySelector('#code');
  try {
    const {token} = await post('demo-issue',{orderId:adminOrderId,code:code.value});
    location.href = '/report.html#'+encodeURIComponent(token);
  } catch (error) {
    msg.textContent = error.message;
  } finally {
    code.value = '';
    issue.disabled = false;
  }
});
