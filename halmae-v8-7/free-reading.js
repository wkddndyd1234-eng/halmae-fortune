import {lunarMonthLength} from './lunar-conversion.mjs';
import {ledgerPreview} from './ledger-preview.mjs';
import {renderLedgerPreview} from './ledger-preview-view.js';
import {renderReadingChart} from './reading-chart.js';
import {calculateSaju} from './saju.mjs';
import {fromFreeForm,saveBirthDraft,todayInKorea} from './birth-handoff.js';
import {readFreeInsights} from './free-insights.js';
import {readingVariant,recordConversion} from './purchase.js';

const byId = id=>document.getElementById(id);
const form = byId('fortune');
const [year,month,day,hour,minute] = ['year','month','day','time','minute'].map(byId);
const result = byId('result');
const calendarType=byId('calendarType');
const isLeapMonth=byId('isLeapMonth');
calendarType.addEventListener('change',()=>{byId('leapField').hidden=calendarType.value!=='lunar';if(calendarType.value!=='lunar')isLeapMonth.value='false';});
const offer = byId('offer');
result.dataset.variant=readingVariant(result.dataset.variant);
const error = byId('error');
const name = byId('name');
let draft = null;
let readingText = '';

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
}
form.addEventListener('input',recordStart);
form.addEventListener('submit',event=>{
 recordStart();
 event.preventDefault();
 const input=fromFreeForm({name:name.value,gender:byId('gender').value,calendarType:calendarType.value,isLeapMonth:isLeapMonth.value==='true',year:year.value,month:month.value,day:day.value,hour:hour.value,minute:minute.value});
 error.textContent='';
 if (!input) {
  error.textContent='성별과 생년월일을 확인해 주세요. 미래 날짜는 입력할 수 없어요.';
  return;
 }
 let saju;
 try { saju=calculateSaju(input); }
 catch (e) { error.textContent=e.message||'생년월일과 출생 시각을 다시 확인해 주세요.'; return; }

 draft=input;
 const reading=readFreeInsights(saju.pillars[2],saju.elements,relationshipNotes[byId('relation').value],saju.pillars[1][1]);
 byId('greeting').textContent=input.name?input.name+', 이리 와 앉아 보렴.':'네 이야기를 들려주마.';
 byId('resultMeta').textContent=`${input.gender==='male'?'남성':'여성'} · ${input.birthDate} ${input.calendarType==='lunar'?(input.isLeapMonth?'음력 윤달':'음력 평달'):'양력'} · ${input.birthTime||'출생 시각 미상'}`;
 for (const [id,value] of Object.entries({
  resultHeading:reading.headline,compassDetail:reading.introduction,
  personality:reading.temperament,balanceQuestion:reading.balance,career:reading.work,love:reading.relationships,
 })) byId(id).textContent=value;
 const artwork=byId('day-symbol-art');
 artwork.alt=reading.symbol+'의 상징, '+reading.headline;
 artwork.src='/art/'+reading.imageId+'.webp';
 const preview=ledgerPreview(saju);
 byId('season-context').textContent=preview.context;
 byId('ledgerQuestion').textContent=preview.hook;
 byId('luck-preview').textContent=preview.luck;
 renderLedgerPreview(byId('reportSample'),saju);
 const notices = [];
 if (!input.birthTime) notices.push('태어난 시간을 모르니 시주는 비워 두었어요.');
 if (saju.warnings.some(w=>w.startsWith('절기'))) notices.push('절기 가까이 태어나 연주나 월주가 출생 시각에 따라 달라질 수 있어요.');
 if (input.birthTime.startsWith('23:')) notices.push('밤 11시대는 하루의 경계를 잡는 방식에 따라 일주와 시주가 달라질 수 있어요.');
 byId('calcNotice').textContent=notices.join(' ');
 byId('calcNotice').hidden=!notices.length;
 renderReadingChart(byId('pillars'),byId('fiveElements'),saju);
 readingText=[byId('greeting').textContent,byId('resultMeta').textContent,
  saju.pillars.map(pillar=>pillar??'미상').join(' · '),reading.headline,reading.introduction,reading.temperament,preview.context,reading.work,reading.balance,reading.relationships,
  ...notices,'전통 사주 상징을 바탕으로 한 자기 성찰용 풀이입니다.'].join('\n\n');
 result.hidden=false;
 offer.hidden=false;
 recordConversion('free_reading_success');
 focusHeading('resultHeading');
});

byId('editBirth').addEventListener('click',()=>{
 name.focus({preventScroll:true});
 form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
let offerStatusRequested=false;
for(const [id,event] of [['conversionMid','ledger_preview_mid'],['conversionNext','ledger_preview_end']]){
 byId(id).addEventListener('click',()=>{
  recordConversion(event);
  focusHeading('offerHeading');
  if(offerStatusRequested) return;
  offerStatusRequested=true;
  fetch('/.netlify/functions/payment',{cache:'no-store'}).then(response=>response.ok?response.json():{})
   .then(({enabled})=>{
    if(enabled===true) byId('offerAvailability').textContent='토스 테스트 결제 · 실제 청구 없음';
    if(enabled===false) byId('offerAvailability').textContent='현재 결제를 받을 수 없어요.';
   }).catch(()=>{});

 });
}
byId('returnReading').addEventListener('click',()=>focusHeading('resultHeading'));
for(const link of offer.querySelectorAll('[data-order-link]')) link.addEventListener('click',event=>{
 if (event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 saveBirthDraft(draft);
 recordConversion('checkout_click');
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
