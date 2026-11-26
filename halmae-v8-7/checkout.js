import {calculateSaju,normalizeBirth} from './saju.mjs';
import {renderLedgerPreview} from './ledger-preview-view.js';
import {readBirthDraft,saveBirthDraft,todayInKorea} from './birth-handoff.js';
import {recordConversion,recordFunnel,post,checkoutKey,forgetCheckout,clearPurchaseStorage,rememberOrder,checkoutAttempt,forgetCheckoutAttempt,visitCampaign} from '/purchase.js';

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
let live = false;
let approvedPolicyVersion;
let approvedPolicyDigest;

form.elements.birthDate.max = todayInKorea();
const calendarType=form.elements.calendarType;
const leapMonth=form.elements.isLeapMonth;
const birthConfirmed=form.elements.birthConfirmed;
const birthSummary=document.querySelector('#birth-summary');
document.querySelector('#open-checkout-sample').addEventListener('click',()=>{
  const sample=document.querySelector('#checkout-sample');
  sample.open=true;
  sample.querySelector('summary').focus({preventScroll:true});
});
let confirmedBirth;
function currentBirth(){
  const {name,birthDate,birthTime,gender}=form.elements;
  if(!gender.value || ![name,birthDate,birthTime].every(field=>field.validity.valid)) return null;
  return {name:name.value.trim(),...normalizeBirth({birthDate:birthDate.value,birthTime:birthTime.value,
    gender:gender.value,calendarType:calendarType.value,isLeapMonth:leapMonth.value==='true'})};
}
function updateBirthConfirmation(){
  let birth, message;
  try {birth=currentBirth();}
  catch(error){message=error.message;}
  const snapshot=birth?JSON.stringify(birth):undefined;
  if(snapshot!==confirmedBirth){
    birthConfirmed.checked=false;
    if(confirmedBirth) forgetCheckoutAttempt();
    confirmedBirth=undefined;
  }
  birthConfirmed.disabled=!birth;
  if(!birth){
    birthSummary.textContent=message||'생년월일과 성별을 선택하면 확인할 정보를 표시해요.';
    return snapshot;
  }
  const calendar=birth.calendarType==='solar'?'양력':birth.isLeapMonth?'음력 윤달':'음력 평달';
  const converted=birth.calendarType==='lunar'? ' · 양력 환산 '+birth.solarDate:'';
  birthSummary.textContent=`${birth.name||'손님'} · ${birth.gender==='male'?'남성':'여성'} · ${calendar} ${birth.birthDate}${converted} · ${birth.birthTime?birth.birthTime+' (한국 시간)':'출생 시각 미상'}`;
  return snapshot;
}
birthConfirmed.addEventListener('change',()=>{
  if(!birthConfirmed.checked){confirmedBirth=undefined;return;}
  const snapshot=updateBirthConfirmation();
  confirmedBirth=snapshot;
  birthConfirmed.checked=Boolean(snapshot);
});
function updateCalendar(){
  const lunar=calendarType.value==='lunar';
  const date=form.elements.birthDate;
  date.type=lunar?'text':'date';
  if(lunar){
    date.placeholder='YYYY-MM-DD';
    date.pattern='[0-9]{4}-[0-9]{2}-[0-9]{2}';
  }else{
    date.removeAttribute('placeholder');
    date.removeAttribute('pattern');
    leapMonth.value='false';
  }
  document.querySelector('#checkout-leap').hidden=!lunar;
  updatePreview();
  updateBirthConfirmation();
}
calendarType.addEventListener('change',updateCalendar);
leapMonth.addEventListener('change',updatePreview);
const draft = window.opener ? null : readBirthDraft();
const prefill = document.querySelector('#prefill');
const birthFields = document.querySelector('#checkout-birth-fields');
birthFields.addEventListener('invalid',()=>{birthFields.open=true;},true);
if (draft) {
  calendarType.value=draft.calendarType;updateCalendar();
  for (const [key,value] of Object.entries(draft)) if(form.elements[key])form.elements[key].value = value;
  prefill.hidden = false;
  birthFields.open = false;
}
updateCalendar();

function updatePreview() {
  const {birthDate,birthTime,gender} = form.elements;
  let saju;
  if(birthDate.validity.valid && birthTime.validity.valid){
    try { saju=calculateSaju({birthDate:birthDate.value,birthTime:birthTime.value,gender:gender.value,calendarType:calendarType.value,isLeapMonth:leapMonth.value==='true'}); }
    catch { /* Incomplete or unsupported input shows the example. */ }
  }
  renderLedgerPreview(document.querySelector('#checkout-preview'),saju);
}
form.elements.birthDate.addEventListener('input',updatePreview);
form.elements.birthTime.addEventListener('input',updatePreview);
form.elements.gender.addEventListener('change',updatePreview);
for(const name of ['name','birthDate','birthTime','gender','isLeapMonth']){
  form.elements[name].addEventListener('input',()=>{
    forgetCheckoutAttempt();
    updateBirthConfirmation();
  });
  form.elements[name].addEventListener('change',updateBirthConfirmation);
}
calendarType.addEventListener('input',forgetCheckoutAttempt);
updatePreview();

resetBirth.addEventListener('click',()=>{
  saveBirthDraft(null);
  forgetCheckoutAttempt();
  for (const field of ['name','birthDate','birthTime','gender']) form.elements[field].value = '';
  prefill.hidden = true;
  birthFields.open = true;
  calendarType.value='solar';updateCalendar();
  form.elements.name.focus();
  msg.textContent = '출생 입력을 지웠어요.';
});

recordConversion('checkout_view');
recordFunnel('checkout_view');
clearStorage.addEventListener('click',async()=>{
  clearPurchaseStorage();
  form.reset();
  birthFields.open = true;
  updateCalendar();
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
  .then(({enabled,recoveryEnabled,adminPreview,paymentMode,legal,policyVersion,policyDigest}) => {
    live=paymentMode==='live';
    if(live && enabled){
      approvedPolicyVersion=policyVersion;
      approvedPolicyDigest=policyDigest;
      document.querySelector('#immediate-delivery').hidden=false;
      form.elements.immediateDelivery.disabled=false;
      form.elements.immediateDelivery.required=true;
      document.querySelector('#terms-acceptance').hidden=false;
      form.elements.termsAccepted.disabled=false;
      form.elements.termsAccepted.required=true;
      for(const [id,url] of Object.entries(legal)) document.querySelector('a[href="/'+id+'.html"]').href=url;
      document.querySelector('#consent-copy').textContent='을 읽었고 보고서 발급을 위한 정보 처리에 동의합니다.';
      buy.textContent='내 운명 장부 펼치기';
    }
    if(live){
      document.querySelector('#recent-preview').hidden=false;
      document.querySelector('#recent-preview').textContent='주문 확인 및 보고서 다시 보기';
      document.querySelector('#recover').textContent='이메일로 보고서 복구';
      clearStorage.textContent='브라우저의 열람 정보 지우기';
    }
    if (adminPreview) {
      adminPanel.hidden = false;
      admin.disabled = false;
    }
    if ((enabled || live) && recoveryEnabled) {
      document.querySelector('#recovery-options').hidden = false;
      document.querySelector('#recover').hidden = false;
    }
    if (enabled) {
      buy.hidden = false;
      buy.disabled = false;
      document.querySelector('#test-guide').hidden = live;
      document.querySelector('#recent-preview').hidden = false;
      clearStorage.hidden = false;
      document.querySelector('#availability').textContent = live?'토스페이먼츠 카드 결제':'토스 테스트 결제 · 실제 청구 없음';
    }
  }).catch(() => {
    document.querySelector('#availability').textContent = '결제 가능 여부를 확인하지 못했어요. 잠시 후 새로고침해 주세요.';
  });

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
  const snapshot=updateBirthConfirmation();
  if(!snapshot || !birthConfirmed.checked || snapshot!==confirmedBirth){
    msg.textContent='위 출생 정보를 확인한 뒤 확인란에 체크해 주세요.';
    (birthConfirmed.disabled?form.elements.birthDate:birthConfirmed).focus();
    return;
  }
  const customer = event.submitter === buy;
  busy = true;
  buy.disabled = admin.disabled = clearStorage.disabled = resetBirth.disabled = true;
  next.hidden = true;
  msg.textContent = live?'주문을 준비하고 있습니다…':'테스트 주문을 준비하고 있습니다…';
  try {
    const data = Object.fromEntries(new FormData(form));
    const birth=JSON.parse(snapshot);
    const order = await post('order',{
      name:birth.name,birthDate:birth.birthDate,birthTime:birth.birthTime,gender:birth.gender,calendarType:birth.calendarType,isLeapMonth:birth.isLeapMonth,
      consent:form.elements.consent.checked,channel:customer?(live?'toss-live':'toss-test'):'admin-demo',
      ...(customer&&live?{attribution:visitCampaign()?.attribution,checkoutAttempt:checkoutAttempt(),policyVersion:approvedPolicyVersion,policyDigest:approvedPolicyDigest,
        immediateDelivery:form.elements.immediateDelivery.checked,termsAccepted:form.elements.termsAccepted.checked}:{}),
      ...(customer && form.elements.recoveryConsent.checked ?
        {email:data.email,recoveryConsent:true} : {}),
    });
    if (!customer) {
      saveBirthDraft(null);
      prefill.hidden = true;
      adminOrderId = order.orderId;
      next.hidden = false;
      msg.textContent = '관리자 테스트 주문을 준비했습니다.';
      return;
    }
    saveBirthDraft(birth);
    recordConversion('test_order_created');
    forgetCheckout();
    rememberOrder(order.orderId);
    if(order.paymentAlreadyApproved){
      location.href='/payment-result.html?restore=1';
      return;
    }
    msg.textContent = (live?'주문 번호: ':'테스트 주문 번호: ')+order.orderId+' · 결제창을 엽니다.';
    try {
      sessionStorage.setItem(checkoutKey,JSON.stringify({orderId:order.orderId,token:order.checkoutToken,paymentMode:order.paymentMode}));
    } catch { /* The server can also use the browser credential set at checkout. */ }
    const TossPayments = await loadToss();
    const payment = TossPayments(order.clientKey).payment({customerKey:TossPayments.ANONYMOUS});
    recordConversion('test_payment_open');
    await payment.requestPayment({
      method:'CARD',amount:{currency:'KRW',value:order.amount},orderId:order.orderId,
      orderName:order.orderName,successUrl:order.successUrl,failUrl:order.failUrl,
    });
  } catch (error) {
    if(error.restartCheckout) forgetCheckoutAttempt();
    const cancelled = ['USER_CANCEL','PAY_PROCESS_CANCELED'].includes(error.code);
    if (customer) recordConversion(cancelled?'test_payment_cancel':'test_payment_failure');
    msg.textContent = cancelled ? (live?'결제를 취소했습니다.':'테스트 결제를 취소했습니다.') : error.message;
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
