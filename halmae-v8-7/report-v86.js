import {reportKey} from './purchase.js';

const hash=location.hash.slice(1);
const readingAnchor=/^(?:chapter-(?:[1-9]|1[0-9]|2[0-6])|toc-heading)$/.test(hash)?hash:'';
const token=readingAnchor?cachedToken():hash;
if(!readingAnchor) history.replaceState(null,'',location.pathname);

function cachedToken(){
 try{
  const saved=JSON.parse(sessionStorage.getItem(reportKey));
  return saved?.expiresAt>Date.now()&&typeof saved.token==='string'?saved.token:'';
 }catch {return '';}
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
 const link=element('a','',chapter.title);
 link.href='#'+id;
 const entry=element('li');
 entry.append(link);
 byId('toc').append(entry);
 byId('chapter-jump').add(new Option((index+1)+'장 · '+chapter.title,id));

 const section=element('section','chapter');
 section.id=id;
 section.append(
  element('p','eyebrow',[chapter.kicker,chapter.basis].filter(Boolean).join(' · ')),
  element('h2','chapter-title',chapter.title),
  element('p','chapter-lead',chapter.lead),
 );
 section.querySelector('h2').tabIndex=-1;
 const groups=chapter.groups??[{paragraphs:chapter.paragraphs}];
 for(const group of groups){
  const block=element('div','chapter-group');
  if(group.title) block.append(element('h3','chapter-subtitle',group.title));
  for(const text of group.paragraphs) block.append(element('p','chapter-text',text));
  section.append(block);
 }
 if(chapter.bullets?.length){
  const list=element('ul','chapter-points');
  for(const bullet of chapter.bullets) list.append(element('li','',bullet));
  section.append(list);
 }
 if(chapter.quote) section.append(element('blockquote','chapter-quote',chapter.quote));
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

async function readReport(){
 if(!token) return showIssue('열람 링크가 필요합니다. 아래에서 새 링크를 받아 주세요.');
 let response;
 for(let attempt=0;attempt<3;attempt++){
  try { response=await fetch('/.netlify/functions/report',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  }catch(error){if(attempt===2) throw error;}
  if(response && response.status<500) break;
  if(attempt<2) await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
 }
 if(!response || response.status>=500) return showIssue('보고서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',true);
 const report=await response.json();
 if(!response.ok) return showIssue(report.error||'유효한 열람 링크를 확인해 주세요.');
 byId('cover-name').textContent=report.meta.name+'님의 인생 장부';
 byId('cover-date').textContent=report.meta.solarDate+' 양력 · '+report.meta.weekday;
 report.chapters.forEach((chapter,index)=>renderChapter(chapter,index,report.chapters.length));
 for(const note of report.meta.calculationNotes??[]) byId('calculation-notes').append(element('li','',note));
 byId('status').textContent=report.demo?'관리자 테스트 발급 · 실제 결제 없음':report.paymentMode==='live'?'승인 시각부터 365일 웹 열람':'카드 결제 테스트 · 승인 시각부터 365일 웹 열람';
 if(report.paymentMode==='live') byId('test-footer').hidden=true;
 byId('book').hidden=false;
 if(readingAnchor){
  byId(readingAnchor)?.scrollIntoView();
  focusHeading(readingAnchor);
 }
 if(!report.demo) import('/purchase.js').then(({recordConversion})=>recordConversion('test_report_view')).catch(()=>{});
}
function showIssue(message,retry=false){
 byId('status').textContent=message;
 byId('report-help').hidden=false;
 byId('report-retry').hidden=!retry;
}
async function load(){
 byId('report-help').hidden=true;
 byId('status').textContent='발급 권한을 확인하고 있습니다…';
 try {await readReport();}
 catch {showIssue('보고서를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',true);}
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
load();
