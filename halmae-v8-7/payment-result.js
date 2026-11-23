import {checkoutKey,callbackKey,post,recordConversion,reportKey,rememberReport,forgetCheckout,forgetReport,recentOrder} from '/purchase.js';

const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const renew = document.querySelector('#renew');
renew.elements.orderId.value = recentOrder() ?? '';
renew.addEventListener('submit',async event=>{
  event.preventDefault();
  event.submitter.disabled = true;
  try {
    const result = await post('access',{orderId:renew.elements.orderId.value.trim()});
    rememberReport(result);
    showReport(result);
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

function showReport({token,orderId,purchaseExpiresAt},{fresh=false}={}) {
  const order = document.querySelector('#order-number');
  order.hidden = !orderId;
  if (orderId) {
    order.textContent = '테스트 주문 번호: '+orderId;
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
  status.textContent = '테스트 결제가 완료됐어요. 지금 보고서를 열 수 있어요. 실제로 청구된 금액은 없어요.';
}

const checkout = read(checkoutKey);
const saved = read(reportKey);
let pending = read(callbackKey);
if (failure) {
  forgetCheckout();
  const cancelled = ['USER_CANCEL','PAY_PROCESS_CANCELED'].includes(params.get('code'));
  status.textContent = cancelled ? '테스트 결제를 취소했습니다.' : '테스트 결제가 완료되지 않았습니다. 주문 화면에서 다시 시도해 주세요.';
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
    showReport(saved);
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
    forgetCheckout();
    recordConversion('test_payment_success');
    showReport(result,{fresh:true});
  } catch (error) {
    status.textContent = error.message;
    retry.hidden = false;
  }
}
