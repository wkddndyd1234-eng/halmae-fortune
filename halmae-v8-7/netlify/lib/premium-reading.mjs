import {pairRelations,tenGod} from '../functions/fortune-cycles.mjs';
import {financeCases,workCases,positionLabel,relationalLenses,roleLenses} from './interpretive-lenses.mjs';
import {businessScenes,branchPortraits,chapterEditorial,monthEditorial,monthScenes,rolePortraits,stemPortraits} from './premium-copy.mjs';

const places={년:'오래 이어진 환경',월:'평소 움직이는 사회적 자리',일:'자신과 가까운 관계',시:'오래 품는 지향'};
const relationReading={
 육합:'함께 움직이기 쉬운 부분이 있을 수 있어. 이어지는 방식이 정말 서로에게 편한지, 함께 한다는 말에 각자 무엇을 넣고 있는지 보렴.',
 충:'움직이는 속도나 원하는 방향이 부딪히는 장면으로 읽어. 서둘러 맞추기보다 양쪽이 지키고 싶은 것이 무엇인지 먼저 가려 보렴.',
 형:'같은 방식이 되풀이되거나 서로의 기준이 어긋날 때의 긴장으로 읽을 수 있어. 누가 옳은지를 고르는 것보다 힘이 드는 과정을 찾아 보는 편이 좋아.',
 해:'기대가 분명히 전달되지 않았을 때 남는 불편으로 읽어 볼 만해. 상대의 뜻을 짐작해 마음속에 오래 묻기보다 실제로 합의한 것이 무엇인지 확인해 보렴.',
};
const rolePrompt={
 비견:'혼자 지킬 몫과 걸음을 맞출 몫을 구별해',
 겁재:'서로 흥을 돋우는 경쟁과 책임이 섞이는 경쟁을 구별해',
 식신:'오래 반복할 수 있는 기술과 한 번 힘껏 해낼 일을 구별해',
 상관:'바꾸고 싶은 방식과 그 방식으로 보호하던 목적을 구별해',
 편재:'새 제안을 시험할 범위와 이미 책임진 자원을 구별해',
 정재:'계속 이어갈 약속과 견디기만 하는 부담을 구별해',
 편관:'당장 응할 요청과 준비를 더 해야 맡을 요구를 구별해',
 정관:'겉에 걸린 이름과 실제로 권한이 닿는 자리를 구별해',
 편인:'새로 배운 것과 현실에서 확인한 것을 구별해',
 정인:'도움받을 부분과 네가 결정할 부분을 구별해',
};
const businessLens={
 비견:'함께 파는 물건이라면 같은 가격표보다 각자가 감당할 일부터 나눠.',
 겁재:'경쟁자가 붙더라도 값을 낮추기 전에 공동 비용과 남는 몫부터 살펴.',
 식신:'만드는 손이 바빠질수록 같은 품질로 반복할 수 있는 분량을 먼저 잡아.',
 상관:'오래된 거래 방식을 고치고 싶다면 달라지는 조건은 한 가지부터 시험해.',
 편재:'새 판로가 눈에 띈다면 작은 거래로 운반비와 돌아오는 돈의 간격을 보렴.',
 정재:'꾸준한 거래에는 재료비보다 약속한 날짜마다 받을 수 있는 돈도 중요해.',
 편관:'갑작스러운 큰 주문이라면 먼저 납기와 지연 책임을 글로 남겨 두렴.',
 정관:'누구와 거래하든 검사 기준과 환불 절차를 같은 문장으로 설명해 보렴.',
 편인:'낯선 홍보 방식을 쓰고 싶다면 한 번에 바꾸지 말고 반응을 따로 기록해.',
 정인:'배워 온 기술을 팔기 전에 누가 다시 찾아오는지와 그 이유를 먼저 살펴.',
};
const domainDefinitions=[
 '재성은 일간이 다룬다고 보는 오행 관계야. 수입의 크기나 투자 성과를 예측하는 수치는 아니란다.',
 '일의 해석에서는 생산과 표현을 뜻하는 식상과 역할·규칙을 뜻하는 관성을 함께 살펴.',
 '이 장에서 일지는 가까운 사이를 살피는 전통적인 자리야. 상대의 마음이나 관계의 성패를 알아내는 표는 아니란다.',
 '결혼 장에서 일지는 함께 지내는 방식의 상징이야. 배우자나 결혼 시기를 정하는 근거로 쓰지 않아.',
 '인성은 도움이나 배움의 상징이야. 누군가를 네 귀인으로 확정하는 이름은 아니란다.',
 '사주와 오행으로 질병, 장기 상태, 발병 시기는 판단할 수 없어. 불편이 지속되면 의료진과 상의하렴.',
];
const restQuestions={
 목:'새 일 하나를 시작하기 전에 마무리 날짜와 쉴 시간을 달력에 함께 넣어 보렴.',
 화:'사람을 많이 만나는 날에는 끝나는 시간과 다음 약속 사이에 빈 칸을 하나 남겨 두렴.',
 토:'돌봄과 집안일이 몰리는 날에는 네가 쉬는 한 끼의 시간을 가족과 먼저 맞춰 봐.',
 금:'검수나 정리를 다시 시작하기 전에 어디까지 확인하면 끝낼지 한 줄로 써 두렴.',
 수:'밤까지 일이 머리에 남는 날에는 내일 처음 확인할 것만 적고 오늘 장부를 덮어도 좋아.',
};
const workFit={
 비견:'결과를 혼자 책임지는 일과 동료와 기준을 맞추는 일을 구분해 보렴.',
 겁재:'협업의 속도를 올리는 데 힘을 쓰되, 결정권이 겹치는 조직에서는 역할을 먼저 합의해 두렴.',
 식신:'기술을 꾸준히 쌓아 결과물을 만드는 일에 눈을 줘 봐. 독립한다면 한 번의 성과보다 같은 품질로 다시 만들 수 있는 분량부터 살피렴.',
 상관:'문제를 발견하고 고치는 과업에서 힘을 쓰기 좋아. 조직에서는 작은 시험의 결과를 보여 주고, 독립해서는 고객이 다르더라도 통하는지 살펴봐.',
 편재:'새 거래와 사람을 잇는 일에 관심을 둘 만해. 선택 폭이 넓을수록 시험할 범위부터 정해 두렴.',
 정재:'일정과 비용의 흐름을 차분히 관리하거나 끝까지 마무리하는 역할을 살펴보렴.',
 편관:'급한 문제의 순서를 잡는 일도 한 방향이야. 권한 없이 결과를 떠맡는 곳과는 구별해야 한단다.',
 정관:'역할과 책임을 분명히 맡는 일이 잘 맞을 수 있어. 조직이든 독립이든 정해진 권한으로 끝까지 해낼 수 있는지를 먼저 살펴.',
 편인:'자료를 모아 새로운 방식을 시험하는 일에 눈을 줘 봐. 남에게 보여 줄 결과물까지 만들면 혼자 배운 것이 일로 이어질 수 있단다.',
 정인:'배우고 정리한 내용을 다른 사람이 써 볼 수 있게 안내하는 일도 살펴보렴.',
};
const relationshipComfort={
 비견:'각자 시간을 존중하고 함께 할 일은 직접 말하는 사람',겁재:'다른 의견을 이기고 지는 문제로 만들지 않는 사람',
 식신:'작은 챙김을 알아보고 필요한 것은 말로 알려 주는 사람',상관:'불편한 말을 들어도 서로 고칠 점을 의논하는 사람',
 편재:'새 경험을 함께 즐기면서 기존 약속도 기억하는 사람',정재:'사소한 약속을 꾸준히 지키고 변하면 먼저 알려 주는 사람',
 편관:'바쁜 날에도 속도를 강요하지 않고 쉴 틈을 주는 사람',정관:'서로 기대하는 책임을 말로 맞추고 약속을 지키는 사람',
 편인:'혼자 생각하는 시간을 허락하고 궁금한 것은 묻는 사람',정인:'마음을 돌봐 주면서도 네가 고를 몫은 남겨 주는 사람',
};
const labels=['연간','월간','일간','시간(시주의 천간)'];
const branchLabels=['연지','월지','일지','시지'];

function roleEvidence(f,roles,order){
 for(const i of order){
  const visible=f.stemTenGods[i];
  if(roles.includes(visible)) return {role:visible,place:labels[i],glyph:f.saju.pillars[i][0],hidden:false};
  const hidden=f.hiddenTenGods[i].find(item=>roles.includes(item.tenGod));
  if(hidden) return {role:hidden.tenGod,place:branchLabels[i]+' 지장간',glyph:hidden.stem,hidden:true};
 }
 return null;
}
const evidenceText=evidence=>`${evidence.place} ${evidence.glyph}의 ${evidence.role}`;
const roleMeaning=role=>rolePortraits[role][0].split('. ',1)[0]+'.';

function domainReading(index,f){
 const s=f.saju,boundary=s.dateBoundaryUncertain;
 const inner=f.hiddenTenGods[2][0];
 const day=`일지 ${s.dayBranch}의 지장간 ${inner.stem}(${inner.tenGod})`;
 const personalTie=boundary?null:f.relations.find(({a,b})=>a==='일'||b==='일');
 const link=personalTie?
`${positionLabel[personalTie.a]}·${positionLabel[personalTie.b]} ${personalTie.branches}의 ${personalTie.type}`:null;
 if(index===6){
  const wealth=roleEvidence(f,['정재','편재'],boundary?[2]:[1,3,0,2]);
  return wealth?
`돈을 살필 때 할매라면 ${wealth.role==='정재'?'반복되는 수입과 지출':'아직 정해지지 않은 제안'}부터 적겠어. ${roleLenses[wealth.role][0]}부터 해 보렴. ${wealth.hidden?'지장간에서 본 단서이니 겉으로 드러난 수입 구조라고 여기기 전에 이미 해 본 거래부터 확인하렴.':'겉글자에서 보이는 주제이니 금액뿐 아니라 책임과 지급 조건을 밖으로 명확히 밝혀 두렴.'} ${wealth.role==='정재'?'같은 날에 빠져나가는 비용을 묶어 보면 지급일을 옮길 항목이 눈에 띈단다.':'거래가 늦어져도 먼저 내야 하는 비용까지 적어야 제안을 감당할 수 있는지 보인단다.'} 이 질문은 ${evidenceText(wealth)}에서 골랐단다.`:
`살펴본 자리에서 재성의 단서가 없다면 ${day}의 역할을 돈이 오가는 실제 장면에 대어 보렴. ${roleLenses[inner.tenGod][0]}이 출발점이야. 벌이가 적다는 뜻으로 읽을 필요는 없어. 확인할 수 있는 건 견적과 영수증, 정해진 지급일이니까 거래를 시작하기 전에 부담하는 비용부터 적어 두렴.`;
 }
 if(index===7){
  const work=roleEvidence(f,['식신','상관','정관','편관'],boundary?[2]:[1,3,0,2]);
  const role=work?.role??inner.tenGod;
  return`${workFit[role]} 자리 이동을 고민한다면 비슷한 일을 해 본 경험에서 ${roleLenses[role][1]}을 실제로 해낼 여건이 있었는지 돌아봐. 그 여건은 직함만 보고 알기 어렵단다. ${work?evidenceText(work):day}에서 이 질문을 골랐단다.`;
 }
 if(index===8){
  const comfort=relationshipComfort[inner.tenGod];
  const approach=personalTie?`${relationalLenses[personalTie.type][0]}. 그 차이를 처음 알아차렸을 때 어떤 말이 오갔는지도 떠올려 보렴.`:
    `네 마음을 표현하고 싶을 때는 ${roleLenses[inner.tenGod][2]}부터 떠올려 봐. 오래 만난 사이라도 예전의 약속이 지금도 편한지 물어볼 수 있단다.`;
  return `할매라면 가까운 사람이 어떤 말로 너를 안심시키는지 먼저 볼 거야. ${comfort} 곁에서 편안한지 살펴보렴. ${approach} 이 장의 단서는 ${day}${link?'와 '+link:''}야.`;
 }
 if(index===9){
  const agreement=personalTie?`${relationalLenses[personalTie.type][2]}. 의견이 맞지 않는 날에 다시 상의할 시간도 정해 두렴.`:
   `함께 쓸 돈, 따로 쉬는 시간, 돌봄 중 한 가지를 고른 뒤 ‘누가, 언제까지’를 합의해 봐. 네가 중요하게 여기는 약속이 무엇인지는 ${relationshipComfort[inner.tenGod]}을 떠올리면 짚어 보기 쉬워.`;
  return `함께 살림을 꾸린다면 마음과 생활의 약속을 따로 들여다보렴. ${agreement} 생활비를 함께 낸다면 부담할 액수와 미리 상의할 지출 기준을 적어 보자. 이런 질문은 ${day}${link?'와 '+link:''}에서 가져왔어.`;
 }
 if(index===10){
  const help=roleEvidence(f,['정인','편인'],boundary?[2]:[1,0,3,2]);
  const approach=help?.role==='편인'?'이전 방식이 막혔을 땐 다른 경로를 써 본 사람에게 처음 바꿨던 한 가지를 물어 봐.':
   help?.role==='정인'?'다시 찾아갈 수 있는 사람에게 네가 이미 해 본 것과 아직 헷갈리는 것을 나눠 물어 봐.':
   `네가 막힌 부분을 보여 주고 ${roleLenses[inner.tenGod][1]}에 관해 상대가 본 것도 들어 보렴.`;
  return `도움받고 싶은 일이 생기면 부탁 전체를 한꺼번에 넘기지 않아도 된단다. ${approach} 첫 만남에서 모든 답을 기대하기보다, 실제로 도움을 받은 대목을 살피고 다음 부탁을 정해 봐. 할매가 이 질문을 고른 단서는 ${help?evidenceText(help):day}야.`;
 }
 return `일간 ${s.dayStem}의 ${s.dayElement} 상징에서 쉼을 돌아보는 질문을 하나 골랐단다. ${restQuestions[s.dayElement]} 해 본 날과 평소의 차이는 네 일정과 경험에서 확인하렴.`;
}

const group=(title,...paragraphs)=>({title,paragraphs});
const describeDecade=cycle=>{
 const types=cycle.relations?.map(type=>relationReading[type])??[];
 return`근사 대운 ${cycle.pillar}은 ${cycle.tenGod}의 긴 배경으로 놓아 보렴. 이 구간에선 ${roleLenses[cycle.tenGod][1]}부터 해 볼 만하구나. ${types.length?types.join(' '):'운끼리 두 글자로 비교해 바로 확인되는 합충형해는 없으니, 두 천간에 붙은 역할을 각각 놓고 읽어 보렴.'}`;
};

export function natalGroups(index,f,now){
 const s=f.saju;
 const [heading,...editorial]=chapterEditorial[index];
 const groups=index>=6&&index<=11?[]:[group(heading,...editorial)];
 const monthGod=f.stemTenGods[1];
 const dayHidden=f.hiddenTenGods[2][0];
 if(index===0){
  groups[0]=group('태어난 철과 하루의 두 얼굴',
   `바깥에서 일을 맡을 땐 ${workFit[monthGod]} 마음이 놓이는 가까운 자리에서는 ${relationshipComfort[dayHidden.tenGod]} 곁에서 네가 어떤 모습을 보이는지도 함께 떠올려 보렴.`,
   ...editorial);
  groups[0].detailFrom=1;
 }
 if(index===1){
  groups[0]=group('강점이 힘을 발휘하는 자리',stemPortraits[s.dayStem],
   `그 힘이 실제 일에서 쓰일 때는 태어난 달에서 읽은 역할도 봐야 해. ${workFit[monthGod]} 일의 결과를 혼자 떠안았던 때와 책임을 적절히 나눴던 때를 나란히 살펴보렴.`,...editorial);
  groups[0].detailFrom=2;
 }
 if(index===0) groups.push(group('월지와 일지를 함께 펴기',
`월지 ${s.pillars[1][1]}를 ${branchPortraits[s.pillars[1][1]]}에 빗대고 일지 ${s.dayBranch}를 ${branchPortraits[s.dayBranch]}에 빗대 보자. 앞엣것은 태어난 철의 이야기이고 뒤엣것은 일간이 바로 기대 선 그림이야. 서로 비슷한 비유가 나오더라도 이 장부에선 두 자리를 바꿔 읽지 않는단다.`));
 if(index===1) groups.push(group('태어난 달에서 읽은 근거',
`태어난 철에 먼저 보이는 천간 역할은 ${monthGod} 역할이야. ${rolePrompt[monthGod]} 보는 장면에 이 일간의 비유를 얹어 보렴. 생각나는 일이 없다면 억지로 맞추지 말고 이미 사람들과 힘을 나눴던 장면을 하나 떠올려도 좋아.`));
 if(index===2){
  const entries=Object.entries(s.elements);
  const most=Math.max(...entries.map(([,n])=>n));
  const visible=entries.filter(([,n])=>n===most).map(([element])=>element).join('·');
  const seasonal=f.season.chiefElement;
  groups.push(group('겉에 보이는 글자와 월령',
`겉글자에선 ${visible} 쪽이 가장 자주 나오고, ${f.season.season} 월령에서는 ${seasonal} 기운을 먼저 살펴. ${s.dayElement} 일간의 관점에선 월간 ${s.pillars[1][0]}에 붙은 ${monthGod}도 이 그림을 구체화하는 단서란다. 글자의 수가 비슷하더라도 태어난 달이 달라지면 먼저 펴 볼 질문이 달라지는 까닭이야.`,
`오행 분포의 ${seasonal} 수는 ${s.elements[seasonal]}야. 달의 기운이 눈에 띄는 경우라도 다른 글자의 자리를 살펴야 해. 네 요소를 고쳐야 한다고 생각하기 전에 이런 비유가 실제로 도움이 된 장면과 아무 관계가 없었던 장면을 나누어 봐.`));
 }
 if(index===3) groups.push(group('월간에서 먼저 살필 역할',
`${s.pillars[1][0]}에서 계산한 ${monthGod} 역할을 활동하는 자리의 단서로 삼아 보자. ${rolePortraits[monthGod][0]} 여기에 다른 천간의 역할까지 덧대야 같은 일을 다른 상황에서 어떤 태도로 풀 수 있는지 돌아볼 수 있단다.`));
 if(index===4) groups.push(group(`일주 ${s.pillars[2]}의 두 글자`,
`${s.dayStem}의 이미지가 ${branchPortraits[s.dayBranch]}에 놓였구나. 그 자리 안에서 먼저 적힌 ${dayHidden.stem}은 십성으로 보면 ${dayHidden.tenGod}이야. ${rolePrompt[dayHidden.tenGod]} 보는 질문을 가까운 관계에 가져가 보렴. 비슷한 이야기라도 일간만 같은 사람과 일지까지 같은 사람의 원국은 서로 다른 단서를 갖고 있단다.`));
 if(index===5) groups.push(group('어느 자리가 만나는지',
  ...(f.relations.length?f.relations.map(({a,b,branches,type})=>
`${branches}의 ${type} 관계는 ‘${places[a]}’에서 ‘${places[b]}’로 이어지는 자리에서 보이는구나. ${relationReading[type]}`):
   [`이번 표에는 표시할 쌍이 없어 지장간을 먼저 펴 보자. 일지 ${s.dayBranch}에 놓인 ${dayHidden.stem}의 ${dayHidden.tenGod} 역할을 중심으로 보면 ${rolePrompt[dayHidden.tenGod]} 볼 만하겠구나. 쌍이 없다는 사실로 실제 인간관계의 깊이를 알 수는 없단다.`]),
  '표에서 반복되는 이름이 있다면 어느 기둥 사이인지 먼저 확인해. 바깥 활동에 얽힌 두 자리와 가깝게 지내는 사람을 떠올리게 하는 자리는 같은 질문을 던지지 않지. 충과 형이 같은 쌍에서 보일 경우에도 실제 사건이 두 가지라고 세지 않아.'));
 if(index>=6&&index<=11){
  const core=domainReading(index,f);
  const echoes={
   6:`정미년의 ${f.annual.tenGod} 흐름을 돈에 대어 볼 때는 ${roleLenses[f.annual.tenGod][0]}부터 살펴보렴. 올해의 화두는 실제 수입을 보장하는 말이 아니라 돈을 쓰는 습관을 비춰 보는 단서야.`,
   7:`태어난 달의 ${monthGod}이 평소 일하는 태도라면, 정미년 ${f.annual.tenGod}은 그 방식을 어느 자리에서 써 볼지 묻는구나. ${businessLens[f.annual.tenGod]}`,
   8:`가까운 사이에선 일지의 ${dayHidden.tenGod}에서 편안함을 읽고, 올해 새로 나눌 이야기는 ${roleLenses[f.annual.tenGod][2]}에서 시작해 보렴.`,
  };
  groups.push(group('명식에서 살펴볼 점',domainDefinitions[index-6],core));
  if(echoes[index]) groups.push(group('2027년의 흐름을 더해 보면',echoes[index]));
 }
 if(index===12){
  const active=f.luck.decades.find(cycle=>Date.parse(cycle.start)<=now&&now<Date.parse(cycle.end));
  const activeIndex=f.luck.decades.indexOf(active);
  const previous=activeIndex>0?f.luck.decades[activeIndex-1]:null;
  const next=active?f.luck.decades[activeIndex+1]:null;
  groups[0].detail=true;
  groups.push(group(active?'지금의 긴 흐름을 읽는 법':'대운 시점을 정하기 어려울 때',
   active?`지금 하는 일에서 앞으로도 가져갈 몫부터 골라 보렴. ${workFit[active.tenGod]} 이 흐름은 약 ${active.startAge}세부터 시작하는 것으로 읽혀. 지난 경험에서 익힌 방식 중 지금도 힘을 보태는 한 가지를 먼저 남겨 봐.`:
`열 해를 가만히 돌아보면 매일 피우던 작은 불이 나중에는 길을 밝히기도 하지. ${stemPortraits[s.dayStem]} 지난 여러 해 중에 먼저 놓아 준 일 하나와 시간이 지나 더 소중해진 일 하나를 골라 보렴. 두 가지가 같은 날에 생기지 않아도 네 이야기 안에서는 이어질 수 있단다.`));
  if(active){
   groups.push(group('지금 흐름의 앞뒤',
    ...(previous?[`앞 시기에 ${roleLenses[previous.tenGod][1]}이 떠오르는 경험이 있다면, 지금 하는 일에도 아직 필요한지 되짚어 보렴.`]:[]),
    ...(next?[`다음 구간은 약 ${next.startAge}세 무렵부터야. 할매라면 미리 ${roleLenses[next.tenGod][1]}이 어떤 일에 필요한지 살피겠어. 바뀌는 날짜나 사건을 예고하는 표로 읽지는 마렴.`]:[])));
   groups.push({...group('대운의 계산 근거',
    `현재 구간은 ${active.pillar}(${active.tenGod})이야. ${rolePortraits[active.tenGod][0]}`),detail:true});
  }
 }
 if(index===13){
  const annual=f.annual.tenGod;
  const wealth=roleEvidence(f,['정재','편재'],s.dateBoundaryUncertain?[2]:[1,3,0,2]);
  const relation=f.annual.relations.find(item=>item.position==='일');
  const finance=wealth?.role==='정재'?'기존 수입의 지급일과 고정비를 먼저 달력에 올려 두렴.':
   wealth?.role==='편재'?'새 제안의 예상액에서 먼저 나갈 돈과 정산이 늦을 때 감당할 비용을 빼 보렴.':
   '이미 약속받은 돈과 아직 협의 중인 돈을 다른 칸에 적어 두렴.';
  groups[0].detail=true;
  groups.push(group('2027년, 네가 먼저 살펴볼 세 자리',
   `돈은 ${finance} 그다음 올해 들어온 일에 ${roleLenses[annual][0]}을 적용해 봐.`,
   `일과 사업에서는 ${roleLenses[annual][1]}부터 해 보렴. ${businessLens[annual]}`,
   relation?`가까운 사이에서는 ${relationalLenses[relation.type][0]}. 올해 네가 지킬 약속을 먼저 말해 보렴.`:
    `가까운 사이에서는 ${roleLenses[annual][2]}부터 시작해 보렴. 지난해와 달라진 일정이나 부담이 있다면 이번에는 어떻게 나눌지 물어봐.`));
  groups.push({...group('한 해와 대운을 함께 읽는 근거',
   `해의 천간 丁은 네 일간에 ${annual} 이야기를 건네. ${rolePortraits[annual][0]}`,
   ...(f.annual.decades.length?f.annual.decades.map(describeDecade):['대운의 시점을 확정할 정보가 없으니, 2027년 해의 흐름과 대운의 전환이 겹친다고 단정하지 않을게.'])),detail:true});
 }
 return groups;
}

const exampleDetail=(scene,fromEnd=1)=>scene.split(/(?<=[.!?])\s+/).at(-fromEnd)??scene;

function monthlyRelation(relation,topic){
 const pair=`${positionLabel[relation.position]} ${relation.natal}·절기 ${relation.transit}`;
 return`${pair}의 ${relation.type} 관계를 읽을 때는 ${relationalLenses[relation.type][topic]}.`;
}

export function monthlyGroups(f,month,index){
 const s=f.saju;
 const [,season,money,work,love,caution]=monthEditorial[index];
 const [overallScene,moneyScene,workScene,loveScene,cautionScene]=monthScenes[index];
 const roleOpening=roleMeaning(month.tenGod);
 const dayRelations=month.relations.filter(item=>item.position==='일');
 const relations=s.dateBoundaryUncertain?dayRelations:month.relations;
 const workMeeting=relations.find(item=>item.position==='월');
 const role=roleLenses[month.tenGod];
 const yearPillar=index===0?'丙午':f.annual.pillar;
 const yearRole=tenGod(s.dayStem,yearPillar[0]);
 const yearTies=pairRelations(yearPillar[1],month.pillar[1]);
 const yearContext=`${yearPillar} 해의 ${yearRole}${yearRole===month.tenGod?' 주제가 이달에도 이어지는구나.':'과 이달의 '+month.tenGod+'을 함께 살펴봐.'}${yearTies.length?` 해와 달의 지지는 ${yearTies.join('·')} 관계야.`:''}`;
 const openingChoice=workMeeting?
  `‘${work}’에 마음이 쓰일 때는 네가 먼저 정할 것과 상대에게 확인할 것을 나눠 봐. ${relationalLenses[workMeeting.type][1]}.`:
  `‘${work}’에 마음이 쓰이면 ${role[1]}부터 해 보렴.`;
 const natalWealth=roleEvidence(f,['정재','편재'],s.dateBoundaryUncertain?[2]:[1,3,0,2]);
 const moneyQuestion=natalWealth?.role==='정재'?'반복해서 내는 비용과 실제 지급일':
  natalWealth?.role==='편재'?'한 번 들어오는 제안과 정산에 걸리는 시간':'이미 합의한 금액과 아직 기대만 하는 금액';
 const place=relations.find(relation=>relation.position!=='일')??dayRelations[0];
 const mainRelation=relations.map(({position,natal,type})=>positionLabel[position]+' '+natal+'의 '+type).join(' · ');
 const recurring=natalWealth?natalWealth.role==='정재':month.tenGod==='정재';
 const workNeedsAuthority=Boolean(workMeeting)||['정재','편관','정관'].includes(month.tenGod);
 const moneyFollowup=natalWealth && natalWealth.role!==month.tenGod?
  `평소 재물 장에서 읽은 ${natalWealth.role} 쪽은 ‘${moneyQuestion}’에 쓰고, 이달 천간 ${month.pillar[0]}에서 보는 ${month.tenGod} 쪽은 ${role[0]}에 써 보렴.`:
  `이달 천간 ${month.pillar[0]}에서 읽는 ${month.tenGod}의 질문은 ${role[0]}이란다.`;
 const workNatal=s.dateBoundaryUncertain?null:roleEvidence(f,['식신','상관','정관','편관'],[1,3,0,2]);
 const workFollowup=workMeeting && workNatal && workNatal.role!==month.tenGod?
  `평소 일의 단서로 읽은 ${evidenceText(workNatal)}도 같이 놓아 보자. ${roleLenses[workNatal.role][1]}은 평소 맡던 일에서 살피고, 이달의 ‘${work}’에선 위의 절기 질문을 새로 맡은 일에만 시험해 보렴.`:'';
 const financeScene=financeCases[index][recurring?0:1]+'.';
 const workExample=workCases[index][workNeedsAuthority?0:1]+'.';
 const workReading=workMeeting?
`${monthlyRelation(workMeeting,1)}`:
`${month.pillar}에서 본 ${month.tenGod}의 단서로 골랐단다. ${roleOpening}`;
 const relationship=dayRelations.length?
`${dayRelations.map(relation=>monthlyRelation(relation,0)).join(' ')}`:
`일지 ${s.dayBranch}·절기 ${month.pillar[1]} 사이에 직접 확인되는 합충형해는 없구나. 가까운 사이에서 실제로 있었던 일 한 가지에 이달 질문을 대어 보렴.`;
 const scene=businessScenes[index];
 const boundaryRole=f.hiddenTenGods[2][0];
 const boundaryContext=s.dateBoundaryUncertain?
  `태어난 시각을 모르니 이달 일터의 화두 ‘${work}’는 일지 ${s.dayBranch} 속 ${boundaryRole.stem}의 ${boundaryRole.tenGod}에서 시작하자. 평소 맡은 일에서는 ${roleLenses[boundaryRole.tenGod][1]}부터 해 보렴. 그다음 이달 천간 ${month.pillar[0]}에서 읽은 ${month.tenGod}의 질문을 얹으면, 익숙한 방식과 이번에 시도할 방법을 따로 생각해 볼 수 있단다.`:'';
 return [
  group('총운',workMeeting?openingChoice:`${overallScene} ${openingChoice}`,
   `이달의 ${month.pillar}에서 읽은 ${month.tenGod}은 ‘${role[0]}’을 살피는 자리야. ${season}`,
   yearContext),
  group('재물운',financeScene,exampleDetail(moneyScene,recurring?1:2),
   `이번 달 재물 흐름에서는 ‘${money}’를 살펴보렴. ${natalWealth?`태어난 사주에서는 ${evidenceText(natalWealth)}가 단서야. `:''}${moneyFollowup}`),
  group('직업운',`‘${work}’에 마음이 쓰일 때는 이렇게 시험해 보렴. ${workExample}`,exampleDetail(workScene,workNeedsAuthority?1:2),workReading,...[boundaryContext,workFollowup].filter(Boolean)),
  group('사업운',scene+' '+businessLens[month.tenGod],
   workMeeting?`일터를 뜻하는 월지와 이달 지지에서 ${workMeeting.type}이 보여. ${relationalLenses[workMeeting.type][1]}.`:
    `이달의 ${month.tenGod}에서는 ‘${role[0]}’이 거래를 살필 실마리란다.`),
  group('애정운',dayRelations.length?
   `이달 애정운의 화두는 ‘${love}’란다. ${relationalLenses[dayRelations[0].type][0]}. 네가 먼저 바꿀 수 있는 말 한마디를 골라 보렴.`:
   `이달 애정운에서는 ‘${love}’에 마음을 두고 ${role[2]}부터 떠올려 봐. ${loveScene}`,relationship),
  group('주의할 점',`${cautionScene} 이번 달 메모에는 ‘${caution}’, 이 대목을 적어 두렴.`,
   place?`절기 지지 ${month.pillar[1]}에서 확인한 관계를 적어 둘게. ${mainRelation}. ${monthlyRelation(place,2)}`:
    `절기 지지 ${month.pillar[1]}에 견줘 보면 이 장에서 바로 표시할 합충형해는 없구나.`,
   ...month.decades.filter(cycle=>cycle.relations.length).map(cycle=>
    `절기 지지와 대운 지지를 견줘 보렴. ${month.pillar[1]}·${cycle.pillar[1]}에서 읽는 관계는 ${cycle.relations.join('·')}이야. 긴 흐름에서는 ${rolePrompt[cycle.tenGod]} 보고, 이달에는 ${role[1]}부터 살펴봐.`)),
 ];
}

// On a solar-term boundary, only the day pillar anchors natal interpretation.
export function boundaryNatalGroups(index,f){
 const {dayStem,dayBranch,dayElement,pillars}=f.saju;
 const {stem,tenGod}=f.hiddenTenGods[2][0];
 if(index>=6) return [group('확인된 일주에서 읽는 단서',domainDefinitions[index-6],domainReading(index,f))];
 const [heading,...editorial]=chapterEditorial[index];
 const stories=[
`등잔 하나를 켜고 네가 태어난 날의 자리를 보자. 일주 ${pillars[2]}에는 ${dayStem}의 형상이 ${branchPortraits[dayBranch]}에 내려앉아 있구나. 같은 마당을 보아도 안쪽에서 본 모습과 문밖에서 본 풍경은 다르지. 이 장부의 첫 장에는 그중에서도 네가 손으로 만져 볼 수 있는 하루의 이야기를 두었단다. 어릴 적부터 지켜 온 사소한 일을 하나 떠올려 봐. 그 작은 장면부터 한 줄씩 읽으면 된단다.`,
  stemPortraits[dayStem],
`일간의 ${dayElement} 표식을 장부에 놓고, 곁에는 ${branchPortraits[dayBranch]}의 그림을 두렴. 오행 이야기는 다섯 가지 손길을 빌려 삶을 돌아보는 방식이야. 누구나 무언가를 시작하는 날과 잘라내는 날이 있고, 쉬어 갈 때와 마음을 나눌 때도 있지. 오늘 네가 스스로 돕고 싶은 일에는 어떤 손길을 먼저 빌리고 싶은지 살펴봐. 하나를 잘 쓰는 법을 배우는 것과 다섯 손길을 골고루 갖추려 애쓰는 것은 사뭇 다르단다.`,
`겉에는 ${dayStem}의 빛이 있고 일지 안에는 ${stem}, 그 둘을 놓으면 ${tenGod}의 이야기가 나온단다. ${rolePortraits[tenGod][0]} 어떤 일을 스스로 맡아 마음이 가벼웠던 날과, 같은 일을 맡고도 기운이 빠졌던 날을 하나씩 골라 보렴. 네가 좋아하는 기술도 약속한 범위, 곁에 있던 사람, 고를 수 있었던 시간이 다르면 다르게 쓰일 수 있어.`,
`일주 ${pillars[2]}의 두 글자를 가까이 놓아 보렴. ${dayStem}의 그림이 ${branchPortraits[dayBranch]}에 닿으면 자신을 지키는 법과 먼저 다가가는 법을 함께 생각하게 되지. ${rolePortraits[tenGod][3]} 네가 말할 자리가 충분했던 만남과 상대의 말을 잘 들었던 만남이 꼭 같은 날일 필요는 없어. 둘 다 기억해 두면 가까운 사람을 만날 때 네가 원하는 거리를 좀 더 다정하게 설명할 수 있단다.`,
`일지 ${dayBranch} 안을 펼치면 ${f.hiddenTenGods[2].map(item=>item.stem+'('+item.tenGod+')').join(' · ')}의 표식이 있단다. 지장간은 마루 밑에 따로 둔 도구처럼 옛사람들이 그 자리 안에도 여러 이야기가 담긴다고 본 흔적이야. 글 하나를 골라 오늘 실제로 쓴 힘에 빗대어 보고, 손에 들지 않은 도구는 제자리에 두어도 좋아. 관계를 한 번에 맞춰 보려 애쓰기보다 어느 일이 이미 네 손에 익었는지 살펴보렴.`,

 ];
 const approach=index===0?
  [`이 장부에서 일간 ${dayStem}과 일지 ${dayBranch}는 서로 다른 자리에 놓인단다. 일간의 ${dayElement} 상징은 네가 일을 대하는 태도를 돌아보는 데 쓰고, ‘${branchPortraits[dayBranch]}’라는 일지의 이미지는 가까운 사이에서 어떤 약속이 편한지 떠올리는 데 써 보렴. 재물 장에서는 일지에 실제로 들어 있는 십성만 확인하고, 2027년의 장에서는 절기 글자와 일지가 어떻게 만나는지 따로 살필 거야. 나중에 출생 시각을 확인하면 달과 해의 글자도 대조할 수 있지만, 이 장부는 지금 확인한 하루의 단서만으로 읽을 수 있게 썼단다. 출생 시각을 확인하기 전에는 표에 나온 연주와 월주를 정오에 태어났다는 뜻으로 읽지 않으면 된단다.`]:[];
 return [group(heading,...editorial),group('할매가 건네는 이야기',stories[index],...approach)];
}
