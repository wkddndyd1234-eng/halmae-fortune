import {recordConversion,post,checkoutKey,forgetCheckout,clearPurchaseStorage} from '/purchase.js';

const form = document.querySelector('#form');
const msg = document.querySelector('#msg');
const buy = document.querySelector('#buy');
const admin = document.querySelector('#admin');
const next = document.querySelector('#next');
const issue = document.querySelector('#issue');
const endpoint = '/.netlify/functions/';
let adminOrderId;
let busy = false;

recordConversion('checkout_view');
document.querySelector('#clear-storage').addEventListener('click',()=>{
  clearPurchaseStorage();
  form.reset();
  form.elements.email.disabled = true;
  document.querySelector('#code').value = '';
  adminOrderId = undefined;
  next.hidden = true;
  msg.textContent = '이 탭의 테스트 정보를 지웠습니다.';
});
fetch(endpoint+'payment',{cache:'no-store'})
  .then(response => response.ok ? response.json() : {enabled:false})
  .then(({enabled,recoveryEnabled}) => {
    if (recoveryEnabled) {
      document.querySelector('#recovery-options').hidden = false;
      document.querySelector('#recover').hidden = false;
    }
    if (enabled) {
      buy.hidden = false;
      document.querySelector('#availability').textContent = '테스트 카드로 주문과 보고서 열람을 체험할 수 있습니다. 실제 청구는 발생하지 않습니다.';
    }
  }).catch(() => {});

form.elements.recoveryConsent.addEventListener('change',()=>{
  const {email,recoveryConsent} = form.elements;
  email.disabled = !recoveryConsent.checked;
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
  if (busy) return;
  const customer = event.submitter === buy;
  busy = true;
  buy.disabled = admin.disabled = document.querySelector('#clear-storage').disabled = true;
  next.hidden = true;
  msg.textContent = '테스트 주문을 준비하고 있습니다…';
  try {
    const data = Object.fromEntries(new FormData(form));
    const order = await post('order',{
      name:data.name,birthDate:data.birthDate,birthTime:data.birthTime,
      consent:form.elements.consent.checked,channel:customer?'toss-test':'admin-demo',
      ...(customer && form.elements.recoveryConsent.checked ?
        {email:data.email,recoveryConsent:true} : {}),
    });
    if (!customer) {
      adminOrderId = order.orderId;
      next.hidden = false;
      msg.textContent = '관리자 테스트 주문을 준비했습니다.';
      return;
    }
    recordConversion('test_order_created');
    forgetCheckout();
    msg.textContent = '테스트 주문 번호: '+order.orderId+' · 결제창을 엽니다.';
    sessionStorage.setItem(checkoutKey,JSON.stringify({orderId:order.orderId,token:order.checkoutToken}));
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
    buy.disabled = admin.disabled = document.querySelector('#clear-storage').disabled = false;
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
