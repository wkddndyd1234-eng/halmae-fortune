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
  const {low}=leastVisibleElements(saju.elements);
  const month=readStems(saju)[1];
  return {
    hook:`네 일간 ${saju.dayStem}과 일지 ${saju.dayBranch}를 함께 보는 일주 이야기, 그리고 겉에 적게 보인 ${low.join('·')}에서 고른 생활 질문을 장부에 담았단다.`,
    excerpt:workReflection(month),
  };
}
