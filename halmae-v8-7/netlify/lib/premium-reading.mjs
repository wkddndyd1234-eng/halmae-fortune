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
const domainPrompts=[
 '월간에 직접 보이는 몫이라면 거래 조건을 처음부터 말로 밝히는 장면에, 지장간에서 보이는 몫이라면 가격표 뒤로 들어간 시간과 수고를 가려내는 장면에 놓아 보렴. 이미 도와준 값과 앞으로도 맡을 값은 한꺼번에 정하지 않아도 돼.',
 '아이디어 제안, 실제 제작, 손님이나 동료에게 전달하는 일 중 어떤 것을 맡는 상황인지 구별해. 주변에서 반응한 부분과 계속 운영할 사람이 필요한 부분은 다르지. 한 역할이 잘 맞는다고 세 가지를 모두 바꿀 필요는 없단다.',
 '새로 가까워지는 사이에선 둘 다 편한 연락 속도가 있는지 살펴봐. 이미 함께한 사람이라면 처음 품었던 기대를 지금도 그대로 바라는지 물어도 좋지. 긴장을 덜어 주는 대답과 실제로 지킬 수 있는 약속을 구별하렴.',
 '생활을 함께 꾸린다면 돈을 합쳐 쓰기 전에 공동으로 쓰는 몫과 각자 쓰는 몫부터 정해 보렴. 함께 살지 않는 관계에서도 돌봄이나 가족 일을 어떤 때 같이 맡을지는 미리 얘기할 수 있어. 가까운 사이에 기준을 설명하는 것이 정을 덜어내는 것은 아니야.',
 '도움을 바랄 때 필요한 게 말할 자리인지, 실제로 손을 보태 줄 사람인지 나누어 봐. 기억 속의 고마운 일에 기대 아직 하지 않은 부탁까지 들어줄 거라 짐작하지 않아도 돼. 일의 규모에 맞는 도움을 청하면 상대도 답하기 쉽지.',
 '일상이 버겁다고 느낄 때는 하루 중 잠을 재촉한 일, 식사 시간을 놓친 일, 부탁을 거절하기 어려웠던 일을 구별해 봐. 몸의 상태를 점치는 대신 실제 생활을 돌아보는 질문이란다. 쉬기 어렵게 만든 조건이 무엇인지 알아채는 데서 시작하렴.',
];

const group=(title,...paragraphs)=>({title,paragraphs});
const describeDecade=cycle=>{
 const types=cycle.relations?.map(type=>relationReading[type])??[];
 return `근사 대운 ${cycle.pillar}은 ${cycle.tenGod}의 긴 배경으로 놓아 보렴. 이 구간에선 ${rolePrompt[cycle.tenGod]} 보는 질문이 어울려. ${types.length?types.join(' '):'운끼리 두 글자로 비교해 바로 확인되는 합충형해는 없으니, 두 천간에 붙은 역할을 각각 놓고 읽어 보렴.'}`;
};

export function natalGroups(index,f,now){
 const s=f.saju;
 const [heading,...editorial]=chapterEditorial[index];
 const groups=[group(heading,...editorial)];
 const monthGod=f.stemTenGods[1];
 const dayHidden=f.hiddenTenGods[2][0];
 if(index===0) groups.push(group('월지와 일지를 함께 펴기',
  `월지 ${s.pillars[1][1]}를 ${branchPortraits[s.pillars[1][1]]}에 빗대고 일지 ${s.dayBranch}를 ${branchPortraits[s.dayBranch]}에 빗대 보자. 앞엣것은 태어난 철의 이야기이고 뒤엣것은 일간이 바로 기대 선 그림이야. 서로 비슷한 비유가 나오더라도 이 장부에선 두 자리를 바꿔 읽지 않는단다.`));
 if(index===1) groups.push(group('일간의 비유',stemPortraits[s.dayStem],
  `태어난 철에 먼저 보이는 천간 역할은 ${monthGod}이야. ${rolePrompt[monthGod]} 보는 장면에 이 일간의 비유를 얹어 보렴. 생각나는 일이 없다면 억지로 맞추지 말고 이미 사람들과 힘을 나눴던 장면을 하나 떠올려도 좋아.`));
 if(index===2){
  const entries=Object.entries(s.elements);
  const most=Math.max(...entries.map(([,n])=>n));
  const visible=entries.filter(([,n])=>n===most).map(([element])=>element).join('·');
  const seasonal=f.season.chiefElement;
  groups.push(group('겉에 보이는 글자와 월령',
   `겉글자에선 ${visible} 쪽이 가장 자주 나오고, ${f.season.season} 월령에서는 ${seasonal}을 먼저 살펴. ${s.dayElement} 일간의 관점에선 월간 ${s.pillars[1][0]}에 붙은 ${monthGod}도 이 그림을 구체화하는 단서란다. 글자의 수가 비슷하더라도 태어난 달이 달라지면 먼저 펴 볼 질문이 달라지는 까닭이야.`,
   `오행 분포의 ${seasonal} 수는 ${s.elements[seasonal]}야. 달의 기운이 눈에 띄는 경우라도 다른 글자의 자리를 살펴야 해. 네 요소를 고쳐야 한다고 생각하기 전에 이런 비유가 실제로 도움이 된 장면과 아무 관계가 없었던 장면을 나누어 봐.`));
 }
 if(index===3) groups.push(group('월간에서 먼저 살필 역할',
  `${s.pillars[1][0]}에서 계산한 ${monthGod}을 활동하는 자리의 단서로 삼아 보자. ${rolePortraits[monthGod][0]} 여기에 다른 천간의 역할까지 덧대야 같은 일을 다른 상황에서 어떤 태도로 풀 수 있는지 돌아볼 수 있단다.`));
 if(index===4) groups.push(group(`일주 ${s.pillars[2]}의 두 글자`,
  `${s.dayStem}의 이미지가 ${branchPortraits[s.dayBranch]}에 놓였구나. 그 자리 안에서 먼저 적힌 ${dayHidden.stem}은 ${dayHidden.tenGod}로 읽혀. ${rolePrompt[dayHidden.tenGod]} 보는 질문을 가까운 관계에 가져가 보렴. 비슷한 이야기라도 일간만 같은 사람과 일지까지 같은 사람의 원국은 서로 다른 단서를 갖고 있단다.`));
 if(index===5) groups.push(group('어느 자리가 만나는지',
  ...(f.relations.length?f.relations.map(({a,b,branches,type})=>
   `${branches}의 ${type}은 ‘${places[a]}’에서 ‘${places[b]}’로 이어지는 자리에서 보이는구나. ${relationReading[type]}`):
   [`이번 표에는 표시할 쌍이 없어 지장간을 먼저 펴 보자. 일지 ${s.dayBranch}에 놓인 ${dayHidden.stem}의 ${dayHidden.tenGod}을 중심으로 보면 ${rolePrompt[dayHidden.tenGod]} 볼 만하겠구나. 쌍이 없다는 사실로 실제 인간관계의 깊이를 알 수는 없단다.`]),
  '표에서 반복되는 이름이 있다면 어느 기둥 사이인지 먼저 확인해. 바깥 활동에 얽힌 두 자리와 가깝게 지내는 사람을 떠올리게 하는 자리는 같은 질문을 던지지 않지. 충과 형이 같은 쌍에서 보일 경우에도 실제 사건이 두 가지라고 세지 않아.'));
 if(index>=6&&index<=11){
  const focus=[
   `돈이 여러 사람 손을 거치는 경우라면 월간 ${monthGod}의 주제에서 ${rolePrompt[monthGod]} 보고, 금액과 지급할 사람을 같은 줄에 적어 보렴.`,
   `일지 안의 ${dayHidden.tenGod}에선 ${rolePrompt[dayHidden.tenGod]} 보는 질문이 나와. 직함을 얻는 일과 혼자서도 갈고닦을 수 있는 기술을 함께 살펴.`,
   `일지의 ${dayHidden.stem}(${dayHidden.tenGod})을 가까워질 때의 성찰에 놓고, ${rolePrompt[dayHidden.tenGod]} 보는 질문을 건네고 싶구나.`,
   `함께 생활하는 방식을 상의할 때는 월간 ${monthGod}과 일지 안의 ${dayHidden.tenGod}을 구분해 읽어. 바깥 역할에서 익숙해진 기준을 서로 동의하지 않고 집에 가져오지는 않는지 살펴봐.`,
   `바깥 인연에서는 월간 ${monthGod}을 단서로, ${rolePrompt[monthGod]} 볼 만해. 오래 알고 지낸 사람과 같은 일을 한다면 예전의 친분과 이번에 한 합의를 명확히 해.`,
   `월간 ${monthGod}을 평소 맡는 역할의 상징으로 놓고 ${rolePrompt[monthGod]} 보렴. 그 질문으로 하루를 조금 가볍게 만들 수 있어도 신체 상태는 실제 생활과 증상으로 살펴야 해.`,
  ];
  groups.push(group('네 글자를 생활에 놓기',domainPrompts[index-6],focus[index-6]));
 }
 if(index===12){
  const active=f.luck.decades.find(cycle=>Date.parse(cycle.start)<=now&&now<Date.parse(cycle.end));
  groups.push(group(active?'현재의 근사 대운':'오래 타는 불의 이야기',
   active?`현재 표에서 발을 디딘 곳은 ${active.pillar}(${active.tenGod}), 약 ${active.startAge}세부터 이어지는 구간이란다. ${rolePortraits[active.tenGod][0]} 예전에 맡던 일과 지금도 계속 가져갈 몫을 함께 생각해 보렴.`:
    `열 해를 가만히 돌아보면 매일 피우던 작은 불이 나중에는 길을 밝히기도 하지. ${stemPortraits[s.dayStem]} 지난 여러 해 중에 먼저 놓아 준 일 하나와 시간이 지나 더 소중해진 일 하나를 골라 보렴. 두 가지가 같은 날에 생기지 않아도 네 이야기 안에서는 이어질 수 있단다.`));
 }
 if(index===13) groups.push(group(f.annual.decades.length?'정미년과 대운이 포개지는 자리':'정미년 그늘 아래',
  `해의 천간 丁은 네 일간에 ${f.annual.tenGod} 이야기를 건네. ${rolePortraits[f.annual.tenGod][0]} 한 해에 적용할 한 가지와 길게 두고 지켜볼 한 가지를 따로 적어 두렴.`,
  ...(f.annual.decades.length?f.annual.decades.map(describeDecade):['한 해는 긴 두루마리에서 손에 닿는 한 쪽이란다. 정미의 작은 불은 가까운 것이 보이게 하고 여름 끝의 흙은 서둘러 거두지 않아도 되는 몫을 품지. 네가 이미 오래 해 온 일 중 누군가에게 보여 줄 때가 된 것과 한 철 더 뿌리를 내릴 것을 골라 보렴. 두 몫이 다 소중해도 같은 날에 내어 줄 필요는 없단다.'])));
 return groups;
}

export function monthlyGroups(f,month,index){
 const s=f.saju;
 const [heading,season,money,work,love,caution]=monthEditorial[index];
 const [overallScene,moneyScene,workScene,loveScene,cautionScene]=monthScenes[index];
 const [role,moneyRole,workRole,loveRole]=rolePortraits[month.tenGod];
 const dayRelations=month.relations.filter(item=>item.position==='일');
 const relations=s.dateBoundaryUncertain?dayRelations:month.relations;
 const workMeeting=relations.filter(item=>item.position==='월');
 const monthRole=f.stemTenGods[1];
 const workReading=workMeeting.length?
  `태어난 달의 자리와 이 절기를 비교한 표에서는 ${workMeeting.map(({type})=>type).join('·')}이 보여. ${relationReading[workMeeting[0].type]} ${workScene}`:
  !s.dateBoundaryUncertain&&monthRole===month.tenGod?
   `태어난 달과 이 절기의 천간에는 ${monthRole}이라는 같은 이름이 붙어. 이미 맡아 봐서 익숙한 일과 이번에 새로 책임져야 하는 일을 구분해. ${workScene}`:
   workScene;
 return [
  group('총운',`${heading}를 펼쳐 보렴. ${season}`,
   `달의 천간 ${month.pillar[0]}과 네 일간 ${s.dayStem}을 대조하면 ${month.tenGod} 관계가 나와. ${role} ${overallScene}`),
  group('재물운',`재물 쪽에서 ${month.tenGod}의 상징을 읽을 때는 ‘${money}’부터 찾아 보렴. ${moneyRole}`,moneyScene),
  group('직업운',`일터에서 할매가 네게 건네고 싶은 화두는 ‘${work}’란다. ${workRole}`,workReading),
  group('사업운',businessScenes[index]),
  group('애정운',`애정에서는 ‘${love}’를 떠올려 보렴. ${loveRole}`,
   dayRelations.length?`네 일지 ${s.dayBranch}와 달의 지지 ${month.pillar[1]} 사이에서 ${dayRelations.map(item=>item.type).join('·')}을 확인했구나. ${dayRelations.map(({type})=>relationReading[type]).join(' ')} ${loveScene}`:
    `네 일지 ${s.dayBranch}와 달의 지지 ${month.pillar[1]}에서 직접 확인되는 합충형해는 없어. ${loveScene}`),
  group('주의할 점',`‘${caution}’을 조심해서 살펴봐. ${cautionScene}`,
   relations.length?
    `이번 달 ${month.pillar[1]}과 장부에 펼친 자리를 대조하면 ${relations.map(({position,natal,type})=>position+'지 '+natal+'의 '+type).join(' · ')}이란다. 각 관계가 어느 자리에서 보이는지 구별해. ${relationReading[relations[0].type]}`:
    `${heading}에선 살펴본 지지와 ${month.pillar[1]} 사이에 바로 표시할 합충형해가 없구나.`,
   ...month.decades.filter(cycle=>cycle.relations.length).map(cycle=>
    `${heading}의 ${month.pillar[1]}과 대운 ${cycle.pillar[1]} 사이에는 ${cycle.relations.join('·')}이 보이는구나. ${relationReading[cycle.relations[0]]}`)),
 ];
}

// On a solar-term boundary, only the day pillar anchors natal interpretation.
export function boundaryNatalGroups(index,f){
 const {dayStem,dayBranch,dayElement,pillars}=f.saju;
 const {stem,tenGod}=f.hiddenTenGods[2][0];
 const [heading,...editorial]=chapterEditorial[index];
 const stories=[
  `등잔 하나를 켜고 네가 태어난 날의 자리를 보자. 일주 ${pillars[2]}에는 ${dayStem}의 형상이 ${branchPortraits[dayBranch]}에 내려앉아 있구나. 같은 마당을 보아도 안쪽에서 본 모습과 문밖에서 본 풍경은 다르지. 이 장부의 첫 장에는 그중에서도 네가 손으로 만져 볼 수 있는 하루의 이야기를 두었단다. 어릴 적부터 지켜 온 사소한 일을 하나 떠올려 봐. 그 작은 장면부터 한 줄씩 읽으면 된단다.`,
  stemPortraits[dayStem],
  `일간의 ${dayElement} 표식을 장부에 놓고, 곁에는 ${branchPortraits[dayBranch]}의 그림을 두렴. 오행 이야기는 다섯 가지 손길을 빌려 삶을 돌아보는 방식이야. 누구나 무언가를 시작하는 날과 잘라내는 날이 있고, 쉬어 갈 때와 마음을 나눌 때도 있지. 오늘 네가 스스로 돕고 싶은 일에는 어떤 손길을 먼저 빌리고 싶은지 살펴봐. 하나를 잘 쓰는 법을 배우는 것과 다섯 손길을 골고루 갖추려 애쓰는 것은 사뭇 다르단다.`,
  `겉에는 ${dayStem}의 빛이 있고 일지 안에는 ${stem}, 그 둘을 놓으면 ${tenGod}의 이야기가 나온단다. ${rolePortraits[tenGod][0]} 어떤 일을 스스로 맡아 마음이 가벼웠던 날과, 같은 일을 맡고도 기운이 빠졌던 날을 하나씩 골라 보렴. 네가 좋아하는 기술도 약속한 범위, 곁에 있던 사람, 고를 수 있었던 시간이 다르면 다르게 쓰일 수 있어.`,
  `일주 ${pillars[2]}의 두 글자를 가까이 놓아 보렴. ${dayStem}의 그림이 ${branchPortraits[dayBranch]}에 닿으면 자신을 지키는 법과 먼저 다가가는 법을 함께 생각하게 되지. ${rolePortraits[tenGod][3]} 네가 말할 자리가 충분했던 만남과 상대의 말을 잘 들었던 만남이 꼭 같은 날일 필요는 없어. 둘 다 기억해 두면 가까운 사람을 만날 때 네가 원하는 거리를 좀 더 다정하게 설명할 수 있단다.`,
  `일지 ${dayBranch} 안을 펼치면 ${f.hiddenTenGods[2].map(item=>item.stem+'('+item.tenGod+')').join(' · ')}의 표식이 있단다. 지장간은 마루 밑에 따로 둔 도구처럼 옛사람들이 그 자리 안에도 여러 이야기가 담긴다고 본 흔적이야. 글 하나를 골라 오늘 실제로 쓴 힘에 빗대어 보고, 손에 들지 않은 도구는 제자리에 두어도 좋아. 관계를 한 번에 맞춰 보려 애쓰기보다 어느 일이 이미 네 손에 익었는지 살펴보렴.`,
  `일지의 ${tenGod} 상징을 살림에 놓아 보자. ${rolePortraits[tenGod][1]} 지갑에 남은 돈을 보는 날에는 그동안 받아 온 도움도 함께 생각해. 도움에 고마워하는 마음은 귀하지만 내일도 받을 수 있다고 여겨 이번 달 계약까지 정할 필요는 없어. 값을 치르기로 한 일은 기한을 따로 적고, 부탁에 드는 품은 실제로 셀 수 있는 단위로 바꿔 보렴.`,
  `일지 속 ${tenGod}의 이야기를 네 손으로 해 본 일에 새겨 보렴. ${rolePortraits[tenGod][2]} 일터에서 누군가 칭찬한 재능을 작은 거래에도 그대로 쓰려 한다면, 결과를 받을 사람이 누구인지와 다시 같은 품질을 낼 수 있는지를 먼저 살펴봐. 자리 하나를 옮기고 싶다면 떠날 곳보다 가려는 곳에서 하루를 어떻게 보낼지도 그려 보렴.`,
  `가까운 사람의 말은 같은 목소리로 들려도 온도가 다를 때가 있지. 일지 안의 ${tenGod}에는 ${rolePrompt[tenGod]} 보는 비유가 있어. 상대가 웃어넘긴 이야기라도 네 마음에는 오래 남을 수 있단다. 만약 두 사람이 계속 같은 곳에서 막힌다면, 마지막 말이 무엇이었는지보다 처음에 서로 무엇을 기대했는지 얘기해 보렴.`,
  `함께 사는 이야기는 두 사람이 각각 들고 온 작은 그릇을 같은 찬장에 놓는 데서 시작하지. ${pillars[2]}의 자리에서 떠올린 기질을 일상의 약속에 가져가 보렴. ${rolePrompt[tenGod]} 보고, 오늘 지킬 수 있는 일을 먼저 합의해. 어느 한쪽이 늘 챙기던 일을 잠깐 바꿔 보면 기꺼이 돌보는 일과 습관처럼 떠맡은 일이 구별되기도 해.`,
  `인연의 문턱에서는 도움이 먼저 찾아오기도 하고 내가 먼저 손을 내밀기도 하지. ${dayStem}의 상징을 빌려, 사람들이 네게 맡긴 일과 네가 듣고 싶었던 말을 각각 떠올려 보렴. 말없이 놓고 간 따뜻한 차처럼 당장 보답이 필요 없는 도움도 있어. 오래 이어 가고 싶은 인연이라면 고맙던 순간과 앞으로 함께할 수 있는 몫을 가만히 나눠 말해도 좋단다.`,
  `마당의 빛이 기울면 어떤 일을 다음 날로 옮겨도 된단다. ${dayElement}의 상징을 빌려 하루에 언제 힘을 내고 언제 손을 쉬게 하는지 보렴. 긴 하루가 끝난 뒤 네가 편안했던 자리에는 무엇이 있었니? 일정을 모두 취소할 필요 없이 짧더라도 스스로 고른 여유를 남길 수 있어. 몸에 불편이 계속되면 이 이야기보다 실제 증상을 살필 수 있는 사람에게 먼저 물으렴.`,
 ];
 return [group(heading,...editorial),group('할매가 건네는 이야기',stories[index],...(index>=6?[domainPrompts[index-6]]:[]))];
}
