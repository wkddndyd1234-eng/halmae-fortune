const token=location.hash.slice(1);
history.replaceState(null,'',location.pathname);

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

 const section=element('section','chapter');
 section.id=id;
 section.append(
  element('p','eyebrow',[chapter.kicker,chapter.basis].filter(Boolean).join(' · ')),
  element('h2','chapter-title',chapter.title),
  element('p','chapter-lead',chapter.lead),
 );
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
 section.append(element('a','chapter-back','차례로 돌아가기'));
 section.lastChild.href='#toc-heading';
 section.append(element('p','chapter-number',`${String(index+1).padStart(2,'0')} / ${total}`));
 byId('chapters').append(section);
}

async function readReport(){
 if(!token) throw Error('보고서 접근 토큰이 없습니다.');
 let response;
 for(let attempt=0;attempt<3;attempt++){
  try { response=await fetch('/.netlify/functions/report',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  }catch(error){if(attempt===2) throw error;}
  if(response && response.status<500) break;
  if(attempt<2) await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
 }
 const report=await response.json();
 if(!response.ok) throw Error(report.error||'열람 실패');
 byId('cover-name').textContent=report.meta.name+'님의 인생 장부';
 byId('cover-date').textContent=report.meta.solarDate+' 양력 · '+report.meta.weekday;
 report.chapters.forEach((chapter,index)=>renderChapter(chapter,index,report.chapters.length));
 for(const note of report.meta.calculationNotes??[]) byId('calculation-notes').append(element('li','',note));
 byId('status').textContent=report.demo?'관리자 테스트 발급 · 실제 결제 없음':report.paymentMode==='live'?'승인 시각부터 365일 웹 열람':'카드 결제 테스트 · 승인 시각부터 365일 웹 열람';
 if(report.paymentMode==='live') byId('test-footer').hidden=true;
 byId('book').hidden=false;
 if(!report.demo) import('/purchase.js').then(({recordConversion})=>recordConversion('test_report_view')).catch(()=>{});
}
readReport().catch(error=>{byId('status').textContent=error.message;});
