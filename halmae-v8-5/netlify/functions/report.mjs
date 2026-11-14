import {orders,json,verify,error} from './shared.mjs';
const topicLabels={work:'일과 돈',love:'사랑과 인연',self:'나 자신'};
function chapters(o){const name=o.name,topic=topicLabels[o.topic],time=o.birthTime||'미상';return [
{title:'第一帖 · 네가 남긴 생의 좌표',body:`${name}아, 네가 적어 준 생일은 ${o.birthDate}, 태어난 시각은 ${time}이구나. 이 날짜와 시각은 네 이야기를 시작하는 단서이지, 삶을 단정하는 답은 아니란다. 지금 네가 가장 궁금해하는 것은 ‘${topic}’이지. 이 장부에서는 그 질문을 천천히 들여다보자.`},
{title:'第二帖 · 너를 이루는 선택',body:'오래도록 반복한 선택을 세 가지 떠올려 보거라. 마음이 편해지는 선택, 다른 사람을 위해 감수한 선택, 뒤늦게 아쉬웠던 선택. 네 기질을 이해하는 데는 타고난 상징뿐 아니라 실제로 쌓아 온 경험도 중요하단다.'},
{title:'第三帖 · 일과 돈의 결',body:'수입과 지출을 기록하고, 결정의 이유를 한 줄씩 남겨 보거라. 무리한 확신보다 확인할 수 있는 숫자와 작은 실험이 너를 돕는 날이 많단다. 이 장부는 투자 수익이나 직업적 성공을 예언하지 않는다.'},
{title:'第四帖 · 인연의 온도',body:'관계에서 네가 가장 중요하게 여기는 약속은 무엇이냐. 상대에게 원하는 것과 직접 표현한 것을 나누어 적어 보거라. 운명이라는 말보다 대화와 존중이 인연을 오래 붙잡는 힘이 될 수 있단다.'},
{title:'第五帖 · 네가 고른 질문',body:o.topic==='work'?'이번 달에 바꿀 수 있는 돈 관리 습관 하나, 일의 방향을 확인할 작은 행동 하나를 정해 보거라.':o.topic==='love'?'관계에서 지키고 싶은 경계 하나와 솔직하게 표현하고 싶은 마음 하나를 적어 보거라.':'마음이 지칠 때 회복되는 순간과 자주 미루는 바람 하나를 적어 보거라.'},
{title:'第六帖 · 할매가 남기는 말',body:`${name}아, 미래를 모두 안다면 오히려 오늘의 선택이 무뎌질 수도 있겠지. 이 장부를 읽고 네가 직접 바꿀 수 있는 일 한 가지를 적어 두렴. 네 삶을 살아내는 사람은 결국 너란다.`}];}
export default async req=>{if(req.method!=='GET')return json({error:'Method not allowed'},405);try{const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');const p=verify(token);if(!p||p.scope!=='report')return json({error:'유효한 보고서 접근 권한이 없습니다.'},403);const o=await orders().get(p.orderId,{type:'json'});if(!o||!(o.status==='paid'&&!p.demo||o.status==='demo'&&p.demo))return json({error:'발급 권한이 확인되지 않았습니다.'},403);return json({name:o.name,chapters:chapters(o),demo:!!p.demo})}catch(e){return error(e)}};
