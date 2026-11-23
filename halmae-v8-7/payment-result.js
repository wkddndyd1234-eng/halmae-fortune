import {checkoutKey,post,recordConversion,reportKey} from '/purchase.js';

const status = document.querySelector('#status');
const retry = document.querySelector('#retry');
const params = new URLSearchParams(location.search);
const failure = params.get('failed') === '1';
const callback = {
  orderId:params.get('orderId'),paymentKey:params.get('paymentKey'),amount:Number(params.get('amount')),
};
const callbackKey = 'halmae-test-payment-callback';
history.replaceState(null,'',location.pathname);

function read(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); }
  catch { return null; }
}
function showReport(token) {
  const link = document.querySelector('#report');
  link.href = '/report.html#'+encodeURIComponent(token);
  link.hidden = document.querySelector('#access').hidden = false;
  status.textContent = '테스트 결제가 승인되었습니다. 실제 청구는 발생하지 않았습니다.';
}

const checkout = read(checkoutKey);
const saved = read(reportKey);
let pending = read(callbackKey);
if (failure) {
  sessionStorage.removeItem(callbackKey);
  const cancelled = ['USER_CANCEL','PAY_PROCESS_CANCELED'].includes(params.get('code'));
  status.textContent = cancelled ? '테스트 결제를 취소했습니다.' : '테스트 결제가 완료되지 않았습니다. 주문 화면에서 다시 시도해 주세요.';
  recordConversion(cancelled?'test_payment_cancel':'test_payment_failure');
} else {
  if (callback.orderId && callback.orderId === checkout?.orderId) {
    pending = callback;
    sessionStorage.setItem(callbackKey,JSON.stringify(pending));
  }
  if (pending?.orderId && pending.orderId === checkout?.orderId) {
    retry.addEventListener('click',confirm);
    await confirm();
  } else if (saved?.expiresAt > Date.now()) {
    showReport(saved.token);
  } else {
    status.textContent = '이 탭에서 시작한 테스트 주문을 찾지 못했습니다.';
  }
}

async function confirm() {
  retry.hidden = true;
  status.textContent = '테스트 승인 상태를 확인하고 있습니다…';
  try {
    const result = await post('payment',pending,checkout.token);
    sessionStorage.setItem(reportKey,JSON.stringify(result));
    sessionStorage.removeItem(callbackKey);
    sessionStorage.removeItem(checkoutKey);
    recordConversion('test_payment_success');
    showReport(result.token);
  } catch (error) {
    status.textContent = error.message;
    retry.hidden = false;
  }
}
