import {lunarMonthLength} from './lunar-conversion.mjs';
import {ledgerPreview} from './ledger-preview.mjs';
import {renderLedgerPreview} from './ledger-preview-view.js';
import {renderReadingChart,renderElementSummary} from './reading-chart.js';
import {calculateSaju,pillarElements} from './saju.mjs';
import {fromFreeForm,saveBirthDraft,todayInKorea} from './birth-handoff.js';
import {readPersonalReading} from './free-insights.js';
import {cyclesForSaju} from './fortune-cycles.mjs';
import {readingName} from './reading-name.mjs';
import {readingVariant,recordConversion,recordFunnel} from './purchase.js';
recordFunnel('home_view');

const byId = id=>document.getElementById(id);
const form = byId('fortune');
const [year,month,day,hour,minute] = ['year','month','day','time','minute'].map(byId);
const result = byId('result');
const calendarType=byId('calendarType');
const isLeapMonth=byId('isLeapMonth');
calendarType.addEventListener('change',()=>{byId('leapField').hidden=calendarType.value!=='lunar';if(calendarType.value!=='lunar')isLeapMonth.value='false';});
const offer = byId('offer');
const checkoutLink = byId('checkoutLink');
result.dataset.variant=readingVariant(result.dataset.variant);
const error = byId('error');
const name = byId('name');
let draft = null;
let readingText = '';
let paymentEnabled = false;

function invalidateReading(){
 if(draft) saveBirthDraft(null);
 draft=null;
 readingText='';
 result.hidden=offer.hidden=true;
 checkoutLink.disabled=true;
}
form.addEventListener('input',invalidateReading);
form.addEventListener('change',invalidateReading);
window.addEventListener('pageshow',event=>{
 if(event.persisted && draft){
  invalidateReading();
  error.textContent='주문하려면 출생 정보를 확인한 뒤 무료 풀이를 다시 봐 주세요.';
 }
});

const relationshipNotes = {
 '솔로':'편안하게 느낀 관계의 장면을 떠올려도 좋아.',
 '연애 중':'서로 기대하는 일을 구체적인 말로 나눠 보렴.',
 '기혼':'익숙한 사이에서 당연하게 여긴 마음도 한 번 물어 보렴.',
 '이혼':'지금의 너에게 중요한 관계의 기준부터 골라 보렴.',
 '사별':'그리움을 서둘러 정리할 필요는 없단다.',
};
const fill = (select,values,format)=>{
 for (const value of values) select.add(new Option(format(value),value));
};
const numbers = (start,count)=>Array.from({length:count},(_,index)=>index+start);
const pad = value=>String(value).padStart(2,'0');
const currentYear = Number(todayInKorea().slice(0,4));
fill(year,numbers(1900,currentYear-1899).reverse(),value=>value+'년');
fill(month,numbers(1,12),value=>value+'월');
fill(hour,numbers(0,24),value=>pad(value)+'시');
fill(minute,numbers(1,59),value=>pad(value)+'분');

function updateDays() {
 const previous=day.value;
 day.replaceChildren(new Option('일',''));
 if (!year.value || !month.value) return;
 let limit;
 try{
  limit=calendarType.value==='lunar'?lunarMonthLength(year.value,month.value,isLeapMonth.value==='true'):
   new Date(Date.UTC(Number(year.value),Number(month.value),0)).getUTCDate();
 }catch{
  error.textContent='선택한 음력 월이나 윤달은 달력에 없어요.';
  return;
 }
 error.textContent='';
 fill(day,numbers(1,limit),value=>value+'일');
 if ([...day.options].some(option=>option.value===previous)) day.value=previous;
}
calendarType.addEventListener('change',updateDays);
isLeapMonth.addEventListener('change',updateDays);
year.addEventListener('change',updateDays);
month.addEventListener('change',updateDays);
hour.addEventListener('change',()=>{
 minute.disabled=hour.value==='';
 if (minute.disabled) minute.value='0';
});

function focusHeading(id) {
 const heading=byId(id);
 heading.focus({preventScroll:true});
 (id==='resultHeading'?result:heading).scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}

let started=false;
function recordStart(){
 if (started) return;
 started=true;
 recordConversion('free_reading_start');
 recordFunnel('reading_start');
}
form.addEventListener('input',recordStart);
form.addEventListener('submit',event=>{
 recordStart();
 event.preventDefault();
 invalidateReading();
 saveBirthDraft(null);
 const input=fromFreeForm({name:name.value,gender:byId('gender').value,calendarType:calendarType.value,isLeapMonth:isLeapMonth.value==='true',year:year.value,month:month.value,day:day.value,hour:hour.value,minute:minute.value});
 error.textContent='';
 if (!input) {
  error.textContent='성별과 생년월일을 확인해 주세요. 미래 날짜는 입력할 수 없어요.';
  return;
 }
 let saju;
 try { saju=calculateSaju(input); }
 catch (e) { error.textContent=e.message||'생년월일과 출생 시각을 다시 확인해 주세요.'; return; }

 const chart=saju.dateBoundaryUncertain?{
  ...saju,
  pillars:[null,null,saju.pillars[2],null],
  elements:Object.fromEntries(Object.keys(saju.elements).map(element=>
   [element,pillarElements(saju.pillars[2]).filter(value=>value===element).length])),
 }:saju;
 const reading=readPersonalReading(cyclesForSaju(saju),chart,relationshipNotes[byId('relation').value]);
 const {call,possessive}=readingName(input.name);
 byId('greeting').textContent=call+', 네 장부를 펴 볼까.';
 byId('ledger-bridge-heading').textContent=call+', 이제부터가 중요한 이야기란다.';
 const purchaseCopy=possessive+' 2027년 운명 장부 펼치기';
 byId('conversionNext').textContent=purchaseCopy;
 if(paymentEnabled) checkoutLink.textContent=purchaseCopy;
 byId('resultMeta').textContent=`${input.gender==='male'?'남성':'여성'} · ${input.birthDate} ${input.calendarType==='lunar'?(input.isLeapMonth?'음력 윤달':'음력 평달'):'양력'} · ${input.birthTime||'출생 시각 미상'}`;
 for (const [id,value] of Object.entries({
  resultHeading:reading.headline,compassDetail:reading.introduction,
  personality:reading.temperament,balanceQuestion:reading.balance,career:reading.work,love:reading.relationships,
  'elements-story':reading.elementsStory,'money-reading':reading.money,
 })) byId(id).textContent=value;
 const artwork=byId('day-symbol-art');
 artwork.alt=reading.symbol+'의 상징, '+reading.headline;
 artwork.src='/art/'+reading.imageId+'.webp';
 const preview=ledgerPreview(saju);
 byId('season-context').textContent=preview.story;
 byId('ledgerQuestion').textContent=reading.bridge;
 byId('luck-preview').textContent=preview.luck;
 renderLedgerPreview(byId('reportSample'),saju);
 const notices = [];
 if (!input.birthTime) notices.push('태어난 시간을 모르니 시주는 비워 두었어요.');
 if (saju.warnings.some(w=>w.startsWith('절기'))) notices.push('절기 가까이 태어나 연주나 월주가 출생 시각에 따라 달라질 수 있어요.');
 if (input.birthTime.startsWith('23:')) notices.push('밤 11시대는 하루의 경계를 잡는 방식에 따라 일주와 시주가 달라질 수 있어요.');
 byId('calcNotice').textContent=notices.join(' ');
 byId('calcNotice').hidden=!notices.length;
 renderElementSummary(byId('element-summary-values'),chart.elements);
 renderReadingChart(byId('pillars'),byId('fiveElements'),chart);
 readingText=[byId('greeting').textContent,byId('resultMeta').textContent,
  chart.pillars.map(pillar=>pillar??'미상').join(' · '),reading.headline,reading.introduction,reading.temperament,preview.story,reading.elementsStory,reading.work,reading.money,reading.balance,reading.relationships,
  ...notices,'전통 사주 상징을 바탕으로 한 자기 성찰용 풀이입니다.'].join('\n\n');
 result.hidden=false;
 offer.hidden=false;
 draft=input;
 checkoutLink.disabled=!paymentEnabled;
 recordConversion('free_reading_success');
 recordFunnel('reading_complete');
 focusHeading('resultHeading');
});

byId('editBirth').addEventListener('click',()=>{
 invalidateReading();
 year.focus({preventScroll:true});
 form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
fetch('/.netlify/functions/payment',{cache:'no-store'})
 .then(response=>{
  if(!response.ok) throw Error('Payment status unavailable');
  return response.json();
 })
 .then(({enabled,paymentMode,legal,merchant})=>{
  paymentEnabled=enabled===true;
  checkoutLink.disabled=!paymentEnabled || !draft;
  checkoutLink.textContent=paymentEnabled?readingName(draft?.name).possessive+' 2027년 운명 장부 펼치기':'현재 주문할 수 없어요';
  if(enabled===true){
   byId('offerAvailability').textContent=paymentMode==='live'?'토스페이먼츠 카드 결제':'토스 테스트 결제 · 실제 청구 없음';
   if(paymentMode==='live'){
    document.querySelector('.deploy-preview-ribbon').hidden=true;
    document.querySelector('.preview-footer').hidden=true;
    for(const [name,url] of Object.entries(legal)) document.querySelector('a[href="/'+name+'.html"]').href=url;
    if(merchant?.phone && merchant.mailOrderNumber){
     const disclosure=byId('footer-merchant-disclosures');
     disclosure.textContent='통신판매업 신고번호 '+merchant.mailOrderNumber+' · 전화 '+merchant.phone;
     disclosure.hidden=false;
    }
   }
  }
  if(!paymentEnabled) byId('offerAvailability').textContent='현재 결제를 받을 수 없어요.';
 }).catch(()=>{
  checkoutLink.textContent='현재 주문할 수 없어요';
  byId('offerAvailability').textContent='결제 상태를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.';
 });
byId('conversionNext').addEventListener('click',()=>{
 recordConversion('ledger_preview_end');
 focusHeading('offerHeading');
});
byId('returnReading').addEventListener('click',()=>focusHeading('resultHeading'));
checkoutLink.addEventListener('click',()=>{
 if(!draft || !paymentEnabled) return;
 saveBirthDraft(draft);
 recordConversion('checkout_click');
 recordFunnel('purchase_click');
 location.assign('/checkout.html');
});
if('IntersectionObserver' in window){
 const sampleObserver=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting)) return;
  recordConversion('report_sample_view');
  sampleObserver.disconnect();
 });
 sampleObserver.observe(byId('reportSample'));
}
byId('saveReading').addEventListener('click',()=>{
 if (!readingText) return;
 const url=URL.createObjectURL(new Blob([readingText],{type:'text/plain;charset=utf-8'}));
 const link=document.createElement('a');
 link.href=url;
 link.download='할매의-운명방-사주이야기.txt';
 link.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
});
byId('copyReading').addEventListener('click',async()=>{
 try {
  await navigator.clipboard.writeText(readingText);
  byId('copyStatus').textContent='풀이를 복사했어요.';
 } catch {
  byId('copyStatus').textContent='복사가 어려운 브라우저예요. 글로 저장하기를 이용해 주세요.';
 }
});

if ('IntersectionObserver' in window) {
 const observer=new IntersectionObserver(items=>{
  for (const item of items) if (item.isIntersecting) {
   item.target.classList.add('visible');
   observer.unobserve(item.target);
  }
 },{threshold:.08});
 document.querySelectorAll('.reveal').forEach(item=>observer.observe(item));
}
