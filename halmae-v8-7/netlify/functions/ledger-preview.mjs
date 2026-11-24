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
  const monthGod=fortune.stemTenGods[1];
  const now=Date.now();
  const current=fortune.luck.decades.find(cycle=>Date.parse(cycle.start)<=now&&now<Date.parse(cycle.end));
  const luck=fortune.luck.unavailableReason||
    `대운은 ${fortune.luck.direction}으로, 첫 기산은 약 ${fortune.luck.startAgeYears.toFixed(1)}세로 계산돼. ${current?`지금은 ${current.pillar}(${current.tenGod})의 근사 구간이야. `:''}장부에서는 이 긴 흐름과 2027년의 글자가 어떻게 만나는지 살펴본단다.`;
  const counts=Object.entries(saju.elements);
  const high=Math.max(...counts.map(([,value])=>value));
  const visible=counts.filter(([,value])=>value===high).map(([key])=>key).join('·');
  const relation=fortune.relations.find(item=>item.a==='일'||item.b==='일')??fortune.relations[0];
  const context=saju.dateBoundaryUncertain?
    '절입일인데 출생 시각을 모르니 태어난 철과 다른 글자의 조합은 열어 둘게. 확인할 수 있는 기둥과 아래 안내를 함께 읽어 보렴.':
    `너는 ${fortune.season.season}의 ${saju.pillars[1][1]}월에 태어났구나. 이 절기에서는 ${fortune.season.chiefElement}의 이야기를 먼저 보고, 겉글자에서는 ${visible} 표시가 가장 자주 보여. 월간의 ${monthGod}과 함께 살피면 계절의 배경과 평소 네가 쓰는 힘을 따로 생각해 볼 수 있단다. ${relation?`두 자리의 ${relation.type}(${relation.branches})을 사람과 일을 맞춰 가는 방식에 빗대어 보렴.`:'두 지지를 비교한 표에서는 직접 드러나는 합충형해가 없구나. 일상에서 아래 질문을 떠올려 봐.'}`;
  return {
    context,
    hook:`네 일주 ${saju.pillars[2]}와 태어난 절기의 ${monthGod}가 들려주는 이야기가 있단다. 재물·일·인연을 보고, 2027년의 열두 절기 구간도 차례로 살펴보렴.`,
    excerpt:saju.dateBoundaryUncertain?'출생 시각을 모르는 절입일이라 이 구간의 개인별 풀이를 비워 두었단다. 정확한 시간을 다시 입력해 보렴.':annualReflection(saju,fortune.annual),
    luck,
  };
}
