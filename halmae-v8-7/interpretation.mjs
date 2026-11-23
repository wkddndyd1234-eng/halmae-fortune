const stems = [...'甲乙丙丁戊己庚辛壬癸'];
const categories = [
 ['비견','겁재','자기 기준과 협력','혼자 정할 기준 하나와 도움을 요청할 기준 하나를 나눠 적기'],
 ['식신','상관','표현과 생산','생각 하나를 초안으로 만든 뒤 믿을 만한 사람에게 보여주기'],
 ['편재','정재','자원의 배분','새 기회에 쓸 몫과 매달 지킬 몫을 각각 정해 보기'],
 ['편관','정관','규칙과 책임','맡은 일의 완료 기준과 책임 범위를 상대와 합의하기'],
 ['편인','정인','학습과 돌봄','지금 필요한 조언을 구하고 실제로 써 볼 방법을 하나 고르기'],
];
const stemActions = [
 '큰 목표를 정하고 그 방향으로 이어지는 첫 행동을 고르기',
 '상황이 바뀌어도 지킬 원칙과 유연하게 바꿀 방법을 나누기',
 '알리고 싶은 생각을 골라 구체적인 말 한 문장으로 전하기',
 '집중할 작은 일을 정하고 다른 일 없이 끝내 보는 시간 갖기',
 '맡은 일을 떠받치는 기준을 적고 무리한 책임 하나 내려놓기',
 '이미 쌓아 온 습관 중 앞으로도 돌볼 것을 하나 고르기',
 '기준을 적은 뒤 더 들고 갈 일과 내려놓을 일을 구분하기',
 '작은 오류 하나를 고치되 손을 멈출 완료 기준도 정하기',
 '정보를 여러 곳에서 모은 뒤 결정을 미룰 수 없는 때를 정하기',
 '지나쳤던 미세한 신호를 기록한 뒤 확인할 질문을 적어 보기',
];
const elementActions = {
 목:'다음 주에 자라게 할 작은 습관 고르기',
 화:'미뤄 온 생각을 전달할 사람과 시점 정하기',
 토:'반복할 수 있는 일상 기준 한 가지 세우기',
 금:'정리할 약속이나 기준 한 가지 고르기',
 수:'결정을 내리기 전 관찰 내용을 한 번 기록하기',
};

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

export function addChapterInterpretations(chapters,saju,relations) {
  const day = stems.indexOf(saju.dayStem);
  const [year,month,hour] = relations;
  const counts = Object.entries(saju.elements);
  const min = Math.min(...counts.map(([,count])=>count));
  const low = counts.filter(([,count])=>count===min).map(([element])=>element);
  const dayEvidence = `일주 ${saju.pillars[2]}의 일간 ${saju.dayStem}(${saju.dayElement})`;
  const evidence = ({label,glyph,relation}) => `${label} ${glyph} · ${relation}`;
  const work = relation => `${evidence(relation)}의 전통 주제는 ${relation.theme}이다. 한 가지 실험으로 ${relation.action}을 적어 보렴.`;
  const options = low.map(element=>`${element}(${min}회)에서는 ‘${elementActions[element]}’`).join(', ');
  const readings = [
    [4, `${dayEvidence}을 이번 장의 출발점으로 삼자. 최근 선택 하나를 떠올리고 ‘${stemActions[day]}’가 도움이 되는 상황을 찾아보렴.`],
    [5, `일의 장에서는 월간과 일간의 관계를 질문의 출발점으로 삼는다. ${work(month)}`],
    [6, `재물의 장에서는 월간을 통해 자원을 점검할 관점을 고른다. ${evidence(month)}에서 빌린 ‘${month.theme}’이라는 주제로, ${month.action}이 네 시간이나 생활비에도 적용되는지 가계부와 일정으로 확인하렴.`],
    [7, `가까운 관계에서는 ${dayEvidence}의 상징을 빌려 ‘${stemActions[day]}’를 상의해 보렴. 상대의 생각은 사주 대신 대화로 확인하는 거란다.`],
    [8, `가족과 역할을 돌아보는 질문에는 연간과 일간의 관계를 쓴다. ${work(year)}`],
    [9, `전환점의 시기를 계산하는 대신, 월주 ${saju.pillars[1]}에 기록된 ${evidence(month)}에서 ‘${month.theme}’을 가져온다. 바꿀 수 있는 조건을 하나 정하고, ${month.action}을 그 조건에 맞는 작은 실험으로 써 보렴.`],
    [10, `생활 균형을 돌아볼 때는 오행 표에서 가장 적게 표시된 항목을 질문의 소재로 사용한다. ${options} 중 실제 생활에 맞는 것을 골라 보렴. 수치로 건강 상태를 판단하지는 않는다.`],
    [11, hour.glyph ? `30일 계획의 마지막 주에는 시간의 관계를 선택 점검에 써 볼 수 있단다. ${work(hour)}` :
      `출생 시간이 미상이라 시간과 일간의 관계는 사용할 수 없다. 대신 ${dayEvidence}에서 가져온 ‘${stemActions[day]}’를 마지막 주의 점검 항목으로 쓰렴.`],
  ];
  for (const [index,paragraph] of readings) chapters[index].paragraphs.push(paragraph);
}
