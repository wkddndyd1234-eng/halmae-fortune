import {branchPortraits,chapterEditorial,monthEditorial,monthScenes,rolePortraits,stemPortraits} from './premium-copy.mjs';

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
  groups.push(group('현재의 근사 대운',
   active?`현재 표에서 발을 디딘 곳은 ${active.pillar}(${active.tenGod}), 약 ${active.startAge}세부터 이어지는 구간이란다. ${rolePortraits[active.tenGod][0]} 예전에 맡던 일과 지금도 계속 가져갈 몫을 함께 생각해 보렴.`:
    '현재 진행 중인 근사 대운을 이 표에서 확인할 수 없구나. 출생 시각이나 자료가 없거나 아직 첫 구간이 시작되기 전일 수 있어. 다른 간지를 빈자리에 넣지 않고 확인된 범위까지만 읽을게.'));
 }
 if(index===13&&!s.dateBoundaryUncertain) groups.push(group('정미년과 대운이 포개지는 자리',
  `해의 천간 丁은 네 일간에 ${f.annual.tenGod} 이야기를 건네. ${rolePortraits[f.annual.tenGod][0]} 한 해에 적용할 한 가지와 길게 두고 지켜볼 한 가지를 따로 적어 두렴.`,
  ...(f.annual.decades.length?f.annual.decades.map(describeDecade):['겹치는 대운 구간을 표시할 수 없으니, 정미년과 원국을 비교한 단서까지만 놓아 두렴.'])));
 return groups;
}

export function monthlyGroups(f,month,index,calendar){
 const s=f.saju;
 const [heading,season,money,work,love,caution]=monthEditorial[index];
 const [overallScene,moneyScene,workScene,loveScene,cautionScene]=monthScenes[index];
 const [role,moneyRole,workRole,loveRole]=rolePortraits[month.tenGod];
 const dayRelations=month.relations.filter(item=>item.position==='일');
 const workMeeting=month.relations.filter(item=>item.position==='월');
 const monthRole=f.stemTenGods[1];
 const workReading=workMeeting.length?
  `태어난 달의 자리와 이 절기를 비교한 표에서는 ${workMeeting.map(({type})=>type).join('·')}이 보여. ${relationReading[workMeeting[0].type]} ${workScene}`:
  monthRole===month.tenGod?
   `태어난 달과 이 절기의 천간에는 ${monthRole}이라는 같은 이름이 붙어. 이미 맡아 봐서 익숙한 일과 이번에 새로 책임져야 하는 일을 구분해. ${workScene}`:
   workScene;
 return [
  group('총운',...calendar,`${heading}를 펼쳐 보렴. ${season}`,
   `달의 천간 ${month.pillar[0]}과 네 일간 ${s.dayStem}을 대조하면 ${month.tenGod} 관계가 나와. ${role} ${overallScene}`),
  group('재물',`재물 쪽에서 ${month.tenGod}의 상징을 읽을 때는 ‘${money}’부터 찾아 보렴. ${moneyRole}`,moneyScene),
  group('일과 사업',`이 달 일과 사업의 첫 화두는 ‘${work}’란다. ${workRole}`,workReading),
  group('애정',`애정에서는 ‘${love}’를 떠올려 보렴. ${loveRole}`,
   dayRelations.length?`네 일지 ${s.dayBranch}와 달의 지지 ${month.pillar[1]} 사이에서 ${dayRelations.map(item=>item.type).join('·')}을 확인했구나. ${dayRelations.map(({type})=>relationReading[type]).join(' ')} ${loveScene}`:
    `네 일지 ${s.dayBranch}와 달의 지지 ${month.pillar[1]}에서 직접 확인되는 합충형해는 없어. ${loveScene}`),
  group('주의할 점',`‘${caution}’을 조심해서 살펴봐. ${cautionScene}`,
   month.relations.length?
    `이번 달 ${month.pillar[1]}과 원국을 둘씩 대조한 결과는 ${month.relations.map(({position,natal,type})=>position+'지 '+natal+'의 '+type).join(' · ')}이란다. 각 관계가 어느 자리에서 보이는지 구별해. ${relationReading[month.relations[0].type]}`:
    `${heading}에선 네 원국 지지와 ${month.pillar[1]} 사이에 바로 표시할 합충형해가 없구나.`,
   ...month.decades.filter(cycle=>cycle.relations.length).map(cycle=>
    `${heading}의 ${month.pillar[1]}과 대운 ${cycle.pillar[1]} 사이에는 ${cycle.relations.join('·')}이 보이는구나. ${relationReading[cycle.relations[0]]}`)),
 ];
}
