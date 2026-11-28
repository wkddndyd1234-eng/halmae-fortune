import {forgetReport,post,recentPaidOrder,recordConversion,rememberReport,reportKey} from './purchase.js';

const hash=location.hash.slice(1);
const anchorPattern=/^(?:chapter-(?:[1-9]|1[0-9]|2[0-6])|toc-heading)$/;
let incoming=hash && !anchorPattern.test(hash)?hash:'';
let loadVersion=0;
if(incoming || location.search) history.replaceState(null,'',location.pathname+(incoming?'':location.hash));

function cachedReport(){
 try{
  return JSON.parse(sessionStorage.getItem(reportKey));
 }catch {return null;}
}

const byId=id=>document.getElementById(id);
function element(tag,className,text){
 const node=document.createElement(tag);
 if(className) node.className=className;
 if(text!==undefined) node.textContent=text;
 return node;
}

function renderChapter(chapter,index,total){
 const id='chapter-'+(index+1);
 const title=chapter.story?.title??chapter.displayTitle??chapter.title;
 const link=element('a','',title);
 link.href='#'+id;
 const entry=element('li');
 entry.append(link);
 byId('toc').append(entry);
 byId('chapter-jump').add(new Option((index+1)+'장 · '+title,id));

 const section=element('section','chapter');
 section.id=id;
 section.append(
  element('p','eyebrow',(index+1)+'편'),
  element('h2','chapter-title',title),
  ...(!chapter.story&&chapter.opening?[element('p','chapter-opening',chapter.opening)]:[]),
  ...(!chapter.story?[element('p','chapter-lead',chapter.displayLead??chapter.lead)]:[]),
 );
 section.querySelector('h2').tabIndex=-1;
 if(chapter.story){
  const story=chapter.story;
  if(story.illustration){
   const image=element('img','chapter-story-art');
   image.src='/art/'+story.illustration+'.webp';
   image.alt='';
   image.loading='lazy';
   image.width=480;
   image.height=200;
   section.append(image);
  }
  for(const text of story.intro) section.append(element('p','chapter-text',text));
  for(const {title,paragraphs} of story.sections){
   const block=element('div','chapter-group');
   block.append(element('h3','chapter-subtitle',title));
   for(const text of paragraphs) block.append(element('p','chapter-text',text));
   section.append(block);
  }
 }
 const evidence=chapter.story?element('details','chapter-reading-notes'):section;
 if(chapter.story){
  evidence.append(element('summary','','내 사주 풀이 근거 보기'));
  evidence.append(element('p','small',[chapter.kicker,chapter.basis].filter(Boolean).join(' · ')));
  section.append(evidence);
 }
 const groups=chapter.groups??[{paragraphs:chapter.paragraphs}];
 for(const group of groups){
  const block=element(group.detail?'details':'div','chapter-group');
  if(group.title) block.append(element(group.detail?'summary':'h3','chapter-subtitle',group.title));
  const detailFrom=group.detailFrom??group.paragraphs.length;
  for(const text of group.paragraphs.slice(0,detailFrom)){
   if(text!==chapter.lead) block.append(element('p','chapter-text',text));
  }
  if(detailFrom<group.paragraphs.length){
   const notes=element('details','chapter-reading-notes');
   notes.append(element('summary','', '풀이에 쓴 사주 근거'));
   for(const text of group.paragraphs.slice(detailFrom)) notes.append(element('p','chapter-text',text));
   block.append(notes);
  }
  evidence.append(block);
 }
 if(chapter.bullets?.length){
  const list=element('ul','chapter-points');
  for(const bullet of chapter.bullets) list.append(element('li','',bullet));
  evidence.append(list);
 }
 if(chapter.quote&&!chapter.story) section.append(element('blockquote','chapter-quote',chapter.quote));
 const navigation=element('nav','chapter-navigation');
 navigation.setAttribute('aria-label',(index+1)+'장 이동');
 for(const [target,label] of [
  ...(index>0?[['chapter-'+index,'이전 장']]:[]),['toc-heading','차례'],
  ...(index+1<total?[['chapter-'+(index+2),'다음 장']]:[]),
 ]){
  const control=element('a','chapter-back',label);
  control.href='#'+target;
  navigation.append(control);
 }
 section.append(navigation);
 byId('chapters').append(section);
}

async function fetchReport(token){
 let response;
 for(let attempt=0;attempt<3;attempt++){
  try { response=await fetch('/.netlify/functions/report',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  }catch(error){if(attempt===2) throw error;}
  if(response && response.status<500) break;
  if(attempt<2) await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
 }
 if(!response || response.status>=500) throw Error('Report unavailable');
 return response;
}

async function readReport(version){
 const saved=cachedReport();
 let token=incoming || (saved?.expiresAt>Date.now()?saved.token:'');
 let response=token?await fetchReport(token):null;
 const orderId=saved?saved.orderId:recentPaidOrder();
 if(!incoming && orderId && (!response || response.status===403)){
  try { ({token}=await post('access',{orderId})); }
  catch(error){
   if(version!==loadVersion) return;
   if(error.status===403) forgetReport();
   return showIssue(error.message,error.status!==403);
  }
  response=await fetchReport(token);
 }
 if(version!==loadVersion) return;
 if(!response) return showIssue('열람 링크가 필요합니다. 아래에서 새 링크를 받아 주세요.');
 const report=await response.json();
 if(version!==loadVersion) return;
 if(!response.ok){
  if(!incoming && response.status===403) forgetReport();
  return showIssue(report.error||'유효한 열람 링크를 확인해 주세요.');
 }
 rememberReport({token,orderId:report.orderId,expiresAt:report.expiresAt,
  purchaseExpiresAt:report.purchaseExpiresAt,paymentMode:report.paymentMode});
 incoming='';
 byId('toc').replaceChildren();
 byId('chapters').replaceChildren();
 byId('calculation-notes').replaceChildren();
 byId('chapter-jump').options.length=1;
 byId('cover-name').textContent=report.meta.name+'님의 인생 장부';
 byId('cover-date').textContent=report.meta.solarDate+' 양력 · '+report.meta.weekday;
 report.chapters.forEach((chapter,index)=>renderChapter(chapter,index,report.chapters.length));
 for(const note of report.meta.calculationNotes??[]) byId('calculation-notes').append(element('li','',note));
 byId('status').textContent=report.demo?'관리자 테스트 발급 · 실제 결제 없음':report.paymentMode==='live'?'승인 시각부터 365일 웹 열람':'카드 결제 테스트 · 승인 시각부터 365일 웹 열람';
 byId('test-footer').hidden=report.paymentMode==='live';
 byId('book').hidden=false;
 const readingAnchor=location.hash.slice(1);
 if(anchorPattern.test(readingAnchor)){
  byId(readingAnchor)?.scrollIntoView();
  focusHeading(readingAnchor);
 }
 if(!report.demo) recordConversion('test_report_view');
}
function showIssue(message,retry=false){
 byId('status').textContent=message;
 byId('report-help').hidden=false;
 byId('report-retry').hidden=!retry;
}
async function load(){
 const version=++loadVersion;
 byId('book').hidden=true;
 byId('report-help').hidden=true;
 byId('status').textContent='발급 권한을 확인하고 있습니다…';
 try {await readReport(version);}
 catch {
  if(version===loadVersion) showIssue('보고서를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',true);
 }
}
function focusHeading(id){
 const destination=byId(id);
 (destination?.querySelector('.chapter-title')??destination)?.focus({preventScroll:true});
}
byId('chapter-jump').addEventListener('change',event=>{
 const id=event.target.value;
 if(id){location.hash=id;focusHeading(id);}
});
byId('book').addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');
 if(link) focusHeading(link.hash.slice(1));
});
byId('report-retry').addEventListener('click',load);
window.addEventListener('pagehide',()=>{
 loadVersion++;
 byId('book').hidden=true;
});
window.addEventListener('pageshow',event=>{if(event.persisted) load();});
window.addEventListener('hashchange',()=>{
 const value=location.hash.slice(1);
 if(value && !anchorPattern.test(value)) location.reload();
});
load();
