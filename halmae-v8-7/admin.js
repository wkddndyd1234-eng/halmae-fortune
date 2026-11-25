const byId=id=>document.getElementById(id);
const status=byId('status');
const pane=byId('console');
const login=byId('login');
const endpoint='/.netlify/functions/admin';
let session=null;
let data=null;
let selected=null;
const won=new Intl.NumberFormat('ko-KR');
const amount=value=>Number.isFinite(value)?won.format(value)+'원':'—';
const element=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});

async function api(body){
 const response=await fetch(endpoint,body?{method:'POST',headers:{'Content-Type':'application/json',
  ...(session?{'X-CSRF-Token':session.csrf}:{})},body:JSON.stringify(body),cache:'no-store'}:{cache:'no-store'});
 const result=await response.json();
 if(result.loginRequired){
  byId('mfa-field').hidden=!result.mfaRequired;
  login.elements.code.required=result.mfaRequired;
  throw Error('로그인이 필요합니다.');
 }
 if(!response.ok) throw Error(result.error);
 return result;
}
function fill(id,rows,empty){
 const parent=byId(id);
 parent.replaceChildren(...(rows.length?rows.map(cells=>{
  const div=element('div','');
  div.className='entry';
  div.append(...cells.map((cell,index)=>element(index===0?'strong':'span',String(cell??'—'))));
  return div;
 }):[element('p',empty)]));
}
async function refresh(){
 byId('export').disabled=true;
 data=null;
 try {
  data=await api({action:'dashboard'});
  fill('orders',data.list.map(row=>[row.orderId,row.financialStatus??row.status,amount(row.amount),row.issuance]),'표시할 주문이 없습니다.');
  fill('sales',[...Object.entries(data.daily),...Object.entries(data.monthly)].sort(([a],[b])=>b.localeCompare(a))
   .map(([day,row])=>[day,'승인 '+amount(row.gross),'환불 '+amount(row.refund)]),'집계할 운영 거래가 없습니다.');
  fill('issues',data.issues.map(row=>[row.orderId,row.financialStatus??row.issuance,row.mail]),'표시할 점검 주문이 없습니다.');
  byId('retention').textContent=data.retention?'최근 삭제 작업 '+(data.retention.erased??0)+'건 · 재시도 필요 '+data.retention.failed+'건':'아직 삭제 작업 기록이 없습니다.';
  if(data.truncated) status.textContent='일부 자료만 조회됐습니다. 이 화면의 집계를 전체 정산에 사용하지 마세요.';
 } finally { byId('export').disabled=false; }
}
async function start(){
 session=await api();
 pane.hidden=false;
 login.hidden=true;
 byId('mode').textContent=session.mode==='live'?'운영 환경':'프리뷰 환경';
 byId('support').elements.action.querySelector('[value="refund"]').disabled=!session.refundsEnabled;
 for(const action of ['reconcile','withdraw-recovery','erase']){
  byId('support').elements.action.querySelector('[value="'+action+'"]').disabled=session.mode!=='live';
 }
 byId('retry-retention').hidden=session.mode!=='live';
 byId('migrate').hidden=session.mode!=='live';
 byId('legal-tools').hidden=session.mode!=='live';
 await refresh();
}
async function run(control,work){
 control.disabled=true;
 status.textContent='';
 try {await work();}
 catch(error){status.textContent=error.message||'요청을 처리하지 못했습니다.';}
 finally {control.disabled=false;}
}
login.addEventListener('submit',event=>{
 event.preventDefault();
 run(event.submitter,async()=>{
  const password=login.elements.password.value;
  const code=login.elements.code.value;
  login.reset();
  await api({action:'login',password,code});
  await start();
 });
});
byId('refresh').addEventListener('click',event=>run(event.currentTarget,refresh));
byId('logout').addEventListener('click',event=>run(event.currentTarget,async()=>{
 await api({action:'logout'});
 location.reload();
}));
byId('lookup').addEventListener('submit',event=>{
 event.preventDefault();
 const form=event.currentTarget;
 run(event.submitter,async()=>{
  selected=null;
  byId('support').hidden=true;
  byId('order-result').textContent='';
  selected=await api({action:'lookup',orderId:form.elements.orderId.value.trim()});
  byId('order-result').textContent=selected.orderId+' · '+selected.status+' · '+amount(selected.amount)+
   (selected.recoveryAvailable?' · 복구 등록됨':' · 복구 등록 없음');
  byId('support').reset();
  syncFields();
  byId('support').hidden=false;
 });
});
function syncFields(){
 const action=byId('support').elements.action.value;
 for(const [name,visible] of [['email',action==='resend'],['reason',action==='refund'],
  ['confirmation',['refund','erase','withdraw-recovery'].includes(action)]]){
  byId(name==='confirmation'?'confirm-field':name+'-field').hidden=!visible;
  byId('support').elements[name].required=visible;
 }
}
byId('support').elements.action.addEventListener('change',syncFields);
byId('support').addEventListener('submit',event=>{
 event.preventDefault();
 const form=event.currentTarget;
 run(event.submitter,async()=>{
  const fields=Object.fromEntries(new FormData(form));
  const result=await api({...fields,orderId:selected.orderId});
  form.elements.email.value='';
  form.elements.reason.value='';
  form.elements.confirmation.value='';
  await refresh();
  if(!data.truncated){
   status.textContent=result.accepted?'등록 정보가 일치하면 복구 메일을 보냅니다.':result.status?'거래 상태 '+result.status:'작업을 처리했습니다.';
  }
 });
});
byId('retry-retention').addEventListener('click',event=>run(event.currentTarget,async()=>{
 const result=await api({action:'retry-retention'});
 status.textContent='삭제 '+result.erased+'건 · 재시도 필요 '+result.failed+'건';
 await refresh();
}));
byId('migrate').addEventListener('click',event=>run(event.currentTarget,async()=>{
 const result=await api({action:'migrate-finance'});
 status.textContent='복사 '+result.copied+'건 · 기존 '+result.alreadyPresent+'건 · 불일치 '+result.mismatch+'건';
}));
byId('compare').addEventListener('submit',event=>{
 event.preventDefault();
 run(event.submitter,async()=>{
  const {csv,from,to}=event.currentTarget.elements;
  if(Boolean(from.value)!==Boolean(to.value)) throw Error('시작일과 종료일을 모두 입력해 주세요.');
  const [header,...lines]=csv.value.trim().split(/\r?\n/);
  if(header!=='orderId,balanceAmount,transactionKey') throw Error('CSV 첫 줄을 확인해 주세요.');
  const rows=lines.map(line=>{
   const [orderId,balance,transactionKey,...rest]=line.split(',');
   if(rest.length || !/^\d+$/.test(balance??'') || !transactionKey) throw Error('CSV 거래 줄의 형식을 확인해 주세요.');
   return {orderId,balanceAmount:Number(balance),transactionKey};
  });
  const result=await api({action:'compare',rows,...(from.value?{scope:{from:from.value,to:to.value}}:{})});
  fill('mismatches',result.issues.map(row=>[row.orderId,row.issue]),'입력한 거래에서 불일치를 찾지 못했습니다.');
 });
});
for(const action of ['legal-index','legal-hold']){
 byId(action).addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const data=Object.fromEntries(new FormData(form));
  if(action==='legal-hold') data.hold=data.hold==='yes';
  run(event.submitter,async()=>{
   await api({action,...data});
   status.textContent='보존 설정을 적용했습니다.';
   form.reset();
  });
 });
}
byId('export').addEventListener('click',event=>run(event.currentTarget,async()=>{
 if(!data||data.truncated) throw Error('자료를 모두 불러온 뒤 저장해 주세요.');
 const columns=['orderId','status','amount','balanceAmount','approvedAt','transactionKey'];
 const cell=value=>'"'+String(value??'').replace(/^[=+\-@\t\r\n]/,"'$&").replaceAll('"','""')+'"';
 const lines=[columns.join(','),...data.finance.map(row=>columns.map(key=>cell(row[key])).join(','))];
 const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const link=element('a','');
 link.href=url;link.download='halmae-transactions.csv';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}));
start().catch(error=>{if(error.message.includes('비활성화')) status.textContent=error.message;});
