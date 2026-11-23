const stemImages = {
 甲:['뿌리를 내리는 큰 나무','무엇을 먼저 키울지 하나만 골라 보렴.'],
 乙:['틈을 찾아 뻗는 덩굴','바꿔도 좋은 방법과 지키고 싶은 약속을 나눠 보렴.'],
 丙:['마당을 밝히는 햇살','아직 알리지 못한 생각을 한 문장으로 꺼내 보렴.'],
 丁:['책상 위의 작은 등불','방해받지 않을 짧은 시간을 정해 한 가지를 마쳐 보렴.'],
 戊:['한 자리를 지켜 온 산','떠받치고 있는 일 중 도움을 청할 수 있는 것이 있는지 보렴.'],
 己:['손길을 기다리는 밭','이미 잘 자란 습관에 작은 물을 한 번 더 줘 보렴.'],
 庚:['날을 세우는 쇠','해야 할 일과 이제 그만둬도 될 일을 한 줄씩 적어 보렴.'],
 辛:['빛을 고르는 세공사의 손','고칠 곳 하나를 고른 뒤 어디에서 멈출지도 정해 보렴.'],
 壬:['굽이를 돌아가는 큰 물','다른 길도 살펴보고 언제 결정을 내릴지 정해 보렴.'],
 癸:['잎 끝에 맺힌 이슬','흘려보낸 신호 하나를 확인할 질문으로 바꿔 보렴.'],
};
const workOptions = {
 목:'배우고 싶은 일 하나를 골라 이번 주에 해 볼 첫 단계를 적어 보렴.',
 화:'묻어 둔 의견 하나를 믿을 만한 사람에게 먼저 전해 보렴.',
 토:'일을 떠받치는 작은 반복 하나를 정하고 함께 나눌 몫을 살펴보렴.',
 금:'일을 끝냈다고 판단할 기준 한 가지부터 써 보렴.',
 수:'결정을 내리기 전에 어떤 정보 하나가 더 필요한지 정해 보렴.',
};
const branchQuestions = {
 子:'말을 꺼내기 전에 상대가 어떻게 느꼈는지 한 번 물어보렴.',
 丑:'네가 꾸준히 지키고 싶은 작은 약속을 하나 이야기해 보렴.',
 寅:'먼저 인사하거나 제안하고 싶은 사람이 있는지 떠올려 보렴.',
 卯:'맞춰 준 일과 네가 진짜 원하던 일을 나눠 말해 보렴.',
 辰:'바뀐 상황에서 함께 고쳐 쓸 약속이 무엇인지 물어보렴.',
 巳:'한 번도 자세히 듣지 못했던 상대의 이야기를 골라 보렴.',
 午:'고마웠던 장면 하나를 구체적인 말로 전해 보렴.',
 未:'네가 도와준 일과 네가 도움받고 싶은 일을 하나씩 말해 보렴.',
 申:'서로에게 더 편한 방법이 있는지 작은 제안으로 꺼내 보렴.',
 酉:'마음에 남은 말을 다듬어 오해가 없도록 다시 전해 보렴.',
 戌:'무엇을 책임질 수 있고 어디까지는 어려운지 알려 보렴.',
 亥:'대답을 재촉하기보다 다음에 다시 얘기할 시간을 잡아 보렴.',
};

export function readFreeInsights(dayPillar,counts,relationshipNote='') {
  const [stem,branch] = dayPillar;
  const [image,temperament] = stemImages[stem];
  const elements = Object.entries(counts);
  const topCount = Math.max(...elements.map(([,count])=>count));
  const leading = elements.filter(([,count])=>count===topCount).map(([element])=>element);
  const useful = leading.map(element=>workOptions[element]);
  const work = leading.length===1 ? useful[0] : '이 중 요즘 네 일에 가까운 질문 하나를 골라 보렴. '+useful.join(' ');
  return {
    headline:`${image}에서 시작하는 네 이야기`,
    introduction:`네 일주는 ${dayPillar}이구나. 할매는 그 첫 글자 ${stem}의 전통 상징을 빌려 네 이야기를 열어 보마.`,
    temperament,
    work:`겉으로 드러난 오행에서 ${leading.join('·')}이(가) ${topCount}회로 가장 많이 나왔단다. ${work}`,
    relationships:`일주의 두 번째 글자 ${branch}에서 관계를 돌아볼 질문을 골랐어. ${branchQuestions[branch]}${relationshipNote?' '+relationshipNote:''}`,
  };
}
