const form=document.querySelector('#form'),msg=document.querySelector('#msg'),next=document.querySelector('#next');
const calendar=form.elements.calendarType,leap=form.elements.isLeapMonth;
const sync=()=>{const lunar=calendar.value==='lunar';leap.disabled=!lunar;if(!lunar)leap.checked=false;leap.closest('label').hidden=!lunar};
calendar.addEventListener('change',sync);sync();
let orderId;
form.addEventListener('submit',async e=>{
 e.preventDefault();msg.textContent='테스트 주문을 생성하고 있어요…';next.hidden=true;
 try{
  const data=Object.fromEntries(new FormData(form));
  const r=await fetch('/.netlify/functions/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const j=await r.json();if(!r.ok)throw Error(j.error||'주문 실패');
  orderId=j.orderId;msg.textContent='테스트 주문 번호: '+orderId;next.hidden=false;
 }catch(err){msg.textContent=err.message}
});
document.querySelector('#issue').onclick=async()=>{
 msg.textContent='관리자 테스트 발급 요청 중…';
 try{
  const r=await fetch('/.netlify/functions/demo-issue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId,code:document.querySelector('#code').value})});
  const j=await r.json();if(!r.ok)throw Error(j.error||'발급 실패');location.href='/report.html#'+encodeURIComponent(j.token);
 }catch(err){msg.textContent=err.message}
};
