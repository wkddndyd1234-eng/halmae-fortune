try {
 const response=await fetch('/.netlify/functions/payment',{cache:'no-store'});
 if(response.ok){
  const {merchant,legal}=await response.json();
  if(merchant){
   document.querySelector('#merchant-review').hidden=true;
   const details=document.querySelector('.merchant-details');
   for(const [label,value] of [['고객센터 전화',merchant.phone],['통신판매업 신고번호',merchant.mailOrderNumber],['개인정보 보호책임자',merchant.privacyOfficer],['통신판매업 신고기관',merchant.mailOrderAuthority]]){
    if(!value) continue;
    const term=document.createElement('dt');
    const description=document.createElement('dd');
    term.textContent=label;
    description.textContent=value;
    details.append(term,description);
   }
  }
  for(const [name,url] of Object.entries(legal??{})) document.querySelector('a[href="/'+name+'.html"]').href=url;
 }
}catch { /* The provided business details remain visible during an outage. */ }
