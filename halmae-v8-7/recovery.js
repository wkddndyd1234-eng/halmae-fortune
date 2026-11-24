import {post,rememberReport} from '/purchase.js';

const form = document.querySelector('#recovery');
const exchange = document.querySelector('#exchange');
const status = document.querySelector('#status');
const token = location.hash.slice(1);
history.replaceState(null,'',location.pathname);
window.addEventListener('hashchange',()=>{
  if (location.hash) location.reload();
});

try {
  const response = await fetch('/.netlify/functions/recovery',{cache:'no-store'});
  const {enabled,paymentMode} = response.ok ? await response.json() : {};
  if (enabled) {
    if(paymentMode==='live') document.querySelector('h1').textContent='보고서 복구';
    form.hidden = Boolean(token);
    exchange.hidden = !token;
    status.textContent = token ? '결제 상태를 확인한 후 보고서를 열 수 있습니다.' :
      '이메일을 등록한 주문은 승인 시각부터 365일 동안 다른 기기에서도 복구할 수 있습니다.';
  } else {
    status.textContent = '이 프리뷰에서는 이메일 복구가 제공되지 않습니다.';
  }
} catch {
  status.textContent = '이메일 복구 가능 여부를 확인하지 못했습니다.';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  event.submitter.disabled = true;
  try {
    await post('recovery',{action:'request',...Object.fromEntries(new FormData(form))});
    status.textContent = '입력이 일치하고 발송 제한 내라면 복구 메일이 도착합니다. 링크는 최대 15분 동안 한 번만 사용할 수 있습니다.';
    form.reset();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    event.submitter.disabled = false;
  }
});

exchange.addEventListener('click',async ()=>{
  exchange.disabled = true;
  try {
    const result = await post('recovery',{action:'exchange',token});
    rememberReport(result);
    location.replace('/report.html#'+encodeURIComponent(result.token));
  } catch(error) {
    status.textContent = error.message;
    exchange.disabled = false;
  }
});
