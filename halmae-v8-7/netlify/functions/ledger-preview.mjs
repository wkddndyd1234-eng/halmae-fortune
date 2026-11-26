import {annualReflection,cyclesForSaju} from './fortune-cycles.mjs';
const stems = [...'甲乙丙丁戊己庚辛壬癸'];
const categories = [
 ['비견','겁재','자기 기준과 협력','혼자 정할 기준 하나와 도움을 요청할 기준 하나를 나눠 적기'],
 ['식신','상관','표현과 생산','생각 하나를 초안으로 만든 뒤 믿을 만한 사람에게 보여주기'],
 ['편재','정재','자원의 배분','새 기회에 쓸 몫과 매달 지킬 몫을 각각 정해 보기'],
 ['편관','정관','규칙과 책임','맡은 일의 완료 기준과 책임 범위를 상대와 합의하기'],
 ['편인','정인','학습과 돌봄','지금 필요한 조언을 구하고 실제로 써 볼 방법을 하나 고르기'],
];

export function readStems(saju) {
  const day = stems.indexOf(saju.dayStem);
  return [[0,'연간'],[1,'월간'],[3,'시간']].map(([pillar,label])=>{
    const glyph = saju.pillars[pillar]?.[0];
    if (!glyph) return {label};
    const index = stems.indexOf(glyph);
    const group = categories[(Math.floor(index/2)-Math.floor(day/2)+5)%5];
    return {label,glyph,relation:group[(index+day)%2],theme:group[2],action:group[3]};
  });
}


export const workEvidence = ({label,glyph,relation}) => `${label} ${glyph} · ${relation}`;

export function workReflection(relation) {
  return `${workEvidence(relation)}의 전통 주제는 ${relation.theme}이다. 할매가 건네는 작은 제안이야. ‘${relation.action}’부터 해 보렴.`;
}

export function leastVisibleElements(elements) {
  const counts=Object.entries(elements);
  const min=Math.min(...counts.map(([,count])=>count));
  return {min,low:counts.filter(([,count])=>count===min).map(([element])=>element)};
}

export function ledgerPreview(saju) {
  const fortune=cyclesForSaju(saju);
  const now=Date.now();
  const current=fortune.luck.decades.find(cycle=>Date.parse(cycle.start)<=now&&now<Date.parse(cycle.end));
  const luck=fortune.luck.unavailableReason||
    `대운은 ${fortune.luck.direction}으로, 첫 기산은 약 ${fortune.luck.startAgeYears.toFixed(1)}세로 계산돼. ${current?`지금은 ${current.pillar}(${current.tenGod})의 근사 구간이야. `:''}장부에서는 이 긴 흐름과 2027년의 글자가 어떻게 만나는지 살펴본단다.`;
  const relation=fortune.relations.find(item=>item.a==='일'||item.b==='일')??fortune.relations[0];
  const seasonAction={
    목:'새로 시작할 일이 많을수록 첫걸음 하나부터 정해 봐.',
    화:'의견을 꺼낼 때는 네가 바라는 답을 한 문장으로 말해 보렴.',
    토:'계획이 어긋나면 다시 돌아올 기준부터 정하는 편이 좋단다.',
    금:'손에 쥔 일에서 꼭 남길 것과 내려놓을 것을 가려 보렴.',
    수:'바로 답을 내기보다 다른 길이 있는지 한 번 돌아보렴.',
  };
  const context=saju.dateBoundaryUncertain?
    '계절이 바뀌는 날에 태어났구나. 태어난 시간을 모르니 어느 철로 읽을지는 열어 두고, 확인되는 이야기부터 들려주마.':
    `할매는 네가 태어난 철을 보고 이렇게 권하고 싶구나. ${seasonAction[fortune.season.chiefElement]} ${relation?'다른 사람과 맞춰야 할 때는 네가 지키고 싶은 기준도 먼저 말해 두렴.':''}`.trim();
  return {
    context:saju.dateBoundaryUncertain?context:`${context} 풀이에 쓴 태어난 달의 글자는 ${saju.pillars[1][1]}이야.`,
    story:context,
    hook:`네 두 글자 ${saju.pillars[2]}에서 이어 읽는 재물·일·인연의 흐름이란다.`,
    invitation:'새 일이 들어왔을 때 바로 움직일지, 조건을 더 살필지. 할매가 네 2027년 장부에 돈과 일과 인연의 질문을 달마다 적어 두었단다.',
    excerpt:annualReflection(saju,fortune.annual),
    luck,
  };
}
