import {annualReflection} from './fortune-cycles.mjs';

const roles={
 비견:['네 손으로 정하고 싶어지는 마음','한 일을 둘이 맡았을 때 자기 방식부터 고집하기','같은 목표만 정하고 방법은 서로 맡겨 보렴'],
 겁재:['나란히 뛰는 사람을 보면 힘이 붙는 성향','남이 속도를 내자 내 사정도 잊고 같이 달리기','그 사람에게 좋은 때와 내게 가능한 때를 구별하렴'],
 식신:['손에 익은 솜씨로 사람을 편하게 해 주는 힘','잘하니까 들어온 부탁을 죄다 내 몫으로 삼기','즐겨 만드는 것과 대신 떠맡은 것을 갈라 보렴'],
 상관:['남들이 당연하게 여긴 일에서 다른 길을 발견하는 눈','고칠 점부터 말해 상대가 애쓴 부분을 놓치기','좋았던 점 하나를 말하고 바꿀 대목을 보여 주렴'],
 편재:['새 사람과 제안에서 가능성을 알아보는 눈','재밌는 제안을 듣자 손에 남은 몫까지 얹기','다음번에도 지킬 수 있는 크기로 먼저 시험해 보렴'],
 정재:['쌓아 둔 생활의 기준을 지키는 힘','오래 이어 온 약속이라 지금도 맞을 거라고 여기기','계속 가져갈 약속인지 상대와 다시 물어보렴'],
 편관:['급한 순간에 먼저 움직이는 담력','남의 다급함을 내 책임으로 받아들이기','지금 도울 수 있는 몫만 소리 내 말해 보렴'],
 정관:['약속을 기억하고 끝까지 챙기는 성향','누가 정한 기준인지도 모른 채 모자란 점만 찾기','끝났다고 할 조건을 상대와 먼저 맞춰 보렴'],
 편인:['한 가지 단서에서도 여러 뜻을 헤아리는 눈','상대가 말하지 않은 사정까지 혼자 짐작하기','추측을 하나 덜고 짧은 질문을 하나 더해 보렴'],
 정인:['배운 것을 품고 있다가 필요한 곳에 건네는 힘','조언을 더 모으느라 네 판단을 미루기','들은 것 중 하나를 골라 직접 써 보고 판단하렴'],
};

export const monthlyRoleTheme=role=>roles[role][0];

const elements={
 목:'목은 씨앗이 뿌리를 찾는 장면이야. 벌인 일에 다시 손을 댈 날을 같이 정해 봐.',
 화:'화는 모닥불 옆을 환히 밝히는 장면이야. 분위기를 띄운 뒤에도 조용한 사람 말이 들리는지 보렴.',
 토:'토는 마루를 떠받치는 기둥 같아. 늘 받쳐 준 사람도 기대어 쉴 자리가 필요하지.',
 금:'금은 무딘 가위를 다시 가는 장면이야. 남길 것 하나를 정하면 자르는 손도 덜 망설여.',
 수:'수는 돌에 막히면 옆으로 길을 찾는 물이야. 다른 길을 찾았으면 어디로 갈지 네 말로 짚어 보렴.',
};

const topics={
 money:[6,'돈을 보던 눈','최근 지출 하나를 골라 그날의 기분과 며칠 뒤의 만족을 따로 적어 보렴.'],
 work:[7,'일터에서 자꾸 마음에 걸리는 것','잘 끝낸 일 하나를 골라 네가 일을 잘하게 해 준 조건을 적어 보렴.'],
 love:[8,'마음이 닿는 거리','상대가 알아채기를 기다렸던 부탁을 오늘 말할 수 있는 문장으로 바꿔 봐.'],
 people:[10,'가까운 사람과의 거리','들어줄 수 있는 부탁과 오늘은 거절해야 할 부탁을 한 가지씩 골라 보렴.'],
 future:[13,'앞으로 걸을 길','두 길 중 하나를 고르기 전에 일주일 안에 직접 해 볼 작은 일부터 정하렴.'],
};

function context(f){
 const {saju:s}=f;
 const inner=f.hiddenTenGods[2][0].tenGod;
 const outer=s.dateBoundaryUncertain?inner:f.stemTenGods[1];
 const counts=s.dateBoundaryUncertain?{[s.dayElement]:1}:s.elements;
 const leadingElement=Object.entries(counts).reduce((leading,entry)=>entry[1]>leading[1]?entry:leading)[0];
 return {s,inner,outer,inside:roles[inner],outside:roles[outer],leadingElement,
  outerBasis:s.dateBoundaryUncertain?`확인되는 일지 ${s.dayBranch}의 중심 관계인 ${inner}`:`월간 ${s.pillars[1][0]}에 나타난 ${outer}`};
}

export function freeEpisodes(f,reading,call,choice){
 const {s,inner,inside,outside,leadingElement,outerBasis}=context(f);
 const topic=Object.hasOwn(topics,choice)?topics[choice]:null;
 const topicEvidence={
  money:topicExcerpt(f,6),
  work:topicExcerpt(f,7),
  love:topicExcerpt(f,8),
  people:topicExcerpt(f,10),
  future:'해의 글자와 달의 글자는 바뀌는 때가 다르지. 큰 방향을 정한 뒤 그걸 어느 달에 시험할지 따로 보자.',
 };
 const turn=annualReflection(s,f.annual);
 const stories=[
  ['네가 태어난 날, 하늘에 새겨진 글자','장부를 펴는 밤',[
   `${call}, 여기 가까이 앉아 보렴. 할매가 제일 먼저 본 글자는 네가 태어난 날의 ${s.dayStem}이야. 네 이름 아래 그 글자를 놓고 시작해 볼까?`,
   reading.introduction,
   s.dateBoundaryUncertain?'네가 태어난 날은 절기 경계라 태어난 시각 없이 어느 계절에 들었는지 정하기 어려워. 확인되는 일주부터 읽어주마.':`이제 그 글자가 사람들 앞에 서면 어떻게 쓰이는지 보자꾸나.`]],
  ['할매 눈에는 네 본모습이 보이는구나','첫인상',[
   `여럿이 모였는데 아무도 첫 말을 꺼내지 않는 장면을 생각해 봐. ${outerBasis}에서 할매가 읽는 건 ‘${outside[0]}’이란다.`,reading.temperament]],
  ['네 속에는 이런 녀석이 살고 있단다','아무도 모를 때',[
   `문을 닫고 돌아오면 바깥에서 부르던 네 이름도 잠깐 쉬겠지. 일지에 담긴 ${inner}에서 할매가 들여다보는 건 ‘${inside[0]}’이야.`,
   `밖에선 일 하나를 금방 정해도 집에 와서까지 바로 답하고 싶지는 않을 수 있지. ${inside[2]}`]],
  ['왜 자꾸 같은 일로 마음고생을 하느냐','할매의 쓴소리',[
   `싸움은 끝났는데 이불을 덮고 나서야 할 말이 생각나는 날이 있지. 할매라면 이번엔 ‘${inside[1]}’ 같은 일이 어디서 시작됐는지 되짚겠어.`,
   '처음 마음이 걸린 순간에 뭐라고 말할 수 있었을까? 이불 차는 건 할매도 잘한다만, 이불이 답장을 보내 주진 않더라.']],
  ['할매가 너를 빚던 날','오행을 빚는 마루',[
   '할매가 널 반죽했다는 건 이야기 속 장면이야. 그래도 네 글자에 담긴 다섯 재료를 마루에 펼쳐 놓고 읽는 재미는 있지.',
   s.dateBoundaryUncertain?`절기 경계에서는 계절을 단정하기 어려우니 확인되는 일간의 ${leadingElement}부터 살펴. ${elements[leadingElement]}`:`겉글자를 세어 보니 가장 자주 보이는 재료 중 하나는 ${leadingElement}의 기운이구나. ${elements[leadingElement]}`,
   reading.elementsStory]],
  ['네 손에는 어떤 재주가 들려 있을까','손에 밴 솜씨',[
   `남들은 일이 끝나고 나서야 알아채지만 넌 쉽게 손대는 일이 있지 않니? ${outerBasis}의 주제인 ‘${outside[0]}’이 발휘된 일이 있는지 찾아 봐.`,reading.work]],
  ['돈이 들어오는 길과 새어나가는 길','돈그릇',[
   '장을 보고 온 돈과 장부에 남은 돈은 다르단다. 할매는 네가 수입을 늘리는 방식과 마음이 움직여 지갑을 여는 순간을 따로 보겠어.',
   reading.money,'이번 주 쓴 돈에서 시간이 지나도 아깝지 않았던 한 건을 골라 봐. 금액 옆에 네가 얻은 것도 적으면 다음에 지갑을 열 때 다른 답이 나올 수 있어.']],
  ['네 곁에 머무는 사람들','인연의 실',[
   reading.relationships,`가까운 사이라도 마음을 알아맞히는 솜씨엔 상이 없단다. 일지에서 ${inner}의 단서를 보니 한 가지 권하고 싶구나. ${inside[2]}`]],
  ['그래, 네가 가장 궁금하다는 그 이야기','비밀 편지',[
   ...(topic?[`‘${topic[1]}’부터 펼쳐 보자꾸나. ${topicEvidence[choice]}`,topic[2]]:
    [choice==='custom'?'적은 문장을 읽어 분석하거나 저장하지는 않아. 그 질문은 네 곁에 두고, 확인되는 명식에서 한 문장만 건네마.':'고민을 고르지 않아도 돼. 할매가 네 글자에서 다시 생각해 볼 이야기를 하나 골랐단다.',reading.balance])]],
  ['2027년, 새로운 장부를 펼칠 때가 왔구나','다가오는 해',[
   turn,'새해에 만날 돈이나 일, 인연에 관해 살펴볼 일이 매달 같지는 않지. 다음 장부에서는 열두 달의 글자를 네 명식에 대어 보고, 한 달마다 무엇을 먼저 살필지 따로 적었단다.']],
 ];
 return stories.map(([title,scene,paragraphs])=>({title,scene,paragraphs}));
}

const portraits=[
 ['장부에 처음 적힌 날','빈 자리가 있어도 거기까지가 오늘 할매가 읽을 수 있는 장부야. 알 수 있는 글자가 먼저 말을 걸어오게 두자.'],
 ['스스로를 움직이는 힘','네가 먼저 손을 댄 일과 누가 재촉해서 시작한 일을 떠올려 봐. 두 장면에서 같은 힘을 썼는지 묻고 싶구나.'],
 ['하루에 자주 쓰는 재료','익숙한 재료만 꺼내 쓰는 날도 있지. 어제와 다른 반응이 필요했던 장면 한 곳에서 다른 방식으로 손을 써 봐.'],
 ['밖에서 흔히 맡는 역할','회의든 집안일이든, 일이 꼬이면 네가 자주 맡는 자리가 있을 게야. 다른 사람이 정한 몫과 네가 맡고 싶었던 몫을 나눠 보렴.'],
 ['집에 돌아와 드러나는 마음','낯선 사람에게는 참을 만한 말도 가까운 사람이 하면 오래 남지. 어떤 말이 걸렸는지와 왜 걸렸는지를 따로 적어 둬.'],
 ['서로 맞물리거나 어긋나는 자리','매번 같은 데서 삐걱대면 힘을 더 주기 전에 한 번 멈춰 봐. 목표는 같은데 손을 뻗는 순서만 다른 것일 수도 있어.'],
 ['손을 떠나도 후회 없는 돈','곧 들어올 것 같은 돈으로 이미 쓸 곳을 정해 둔 적은 있니? 예상한 돈, 받은 돈, 남은 돈을 한 줄에 쓰지 말고 따로 펼쳐 두렴.'],
 ['혼자 잘할 일, 함께 더 잘할 일','낯선 일을 권하는 사람에게 하루가 어떤 순서로 흘러가는지 먼저 물어봐. 이름이 근사한 일과 네 손에 맞는 일이 꼭 같지는 않거든.'],
 ['좋아하는 마음을 건네는 법','마음을 표현하고 싶다면 거창한 말부터 궁리하지 마. 상대가 기억해 주었으면 했던 일을 먼저 네 말로 꺼내 봐.'],
 ['같이 살며 정하는 약속','살림을 같이 꾸린다면 주말에 꼭 함께하고 싶은 일과 혼자 쉬고 싶은 시간을 서로 바꿔 읽어. 좋은 사이에도 서로 다른 하루가 있단다.'],
 ['손을 내밀어도 괜찮은 관계','늘 부탁을 들어 주던 사람도 다 들어줄 수는 없지. 이번엔 누구에게 묻느냐보다 무엇을 묻고 싶은지부터 생각해 봐.'],
 ['일을 멈추고 쉬는 순서','쉴 시간이 남으면 쉬겠다는 말로 하루를 보내면 대개 일이 먼저 시간을 다 먹지. 바쁜 날에 먼저 지킬 짧은 쉼 하나를 골라.'],
 ['여러 해를 건너 이어진 일','요즘 돌아보니 전보다 손이 가벼워진 일이 있니? 예전에는 수고였는데 지금 다른 사람에게 알려 줄 수 있다면 오래 걸으며 얻은 솜씨겠지.'],
 ['새 장부에 남겨 둘 질문','새해 계획을 펼치기 전에 지난해부터 가져갈 일 하나를 골라. 이미 기른 힘을 어디에 쓰고 싶은지 알면 새 제안을 볼 눈도 조금 달라진단다.'],
];

export function chapterStory(f,index,now,chapter){
 const {s,inner,inside,outside,leadingElement,outerBasis}=context(f);
 const [title,scene]=portraits[index];
 const illustration={0:'hanok',2:{목:'gap',화:'jeong',토:'mu',금:'gyeong',수:'im'}[leadingElement],6:'mu',8:'eul',12:'hanok',13:'host'}[index];
 const innerLine=`일지 ${s.dayBranch} 안쪽의 ${inner}에서 할매가 읽는 건 ‘${inside[0]}’이야.`;
 const current=f.luck.decades.find(c=>Date.parse(c.start)<=now&&now<Date.parse(c.end));
 const tie=f.relations.find(r=>r.a==='일'||r.b==='일');
 const pattern={
  육합:'서로 맞던 조건을 발견해도 같은 속도를 바란다고 넘겨짚지 마.',
  충:'바라는 순서가 다르면 한쪽 속도만 올리기 전에 양보할 수 없는 것을 서로 물어 봐.',
  형:'무슨 말이 되풀이되는지 살피고 이번에는 대답할 순서를 한번 바꿔 봐.',
  해:'마음에 걸린 일이라면 실제로 들은 말과 나중에 보탠 생각을 가려 보렴.',
 };
 const detail=[
  `네가 태어난 날의 ${s.pillars[2]}부터 읽을게. ${s.dayStem}에는 ${s.dayElement}의 옛 그림이 담겼단다. ${s.dateBoundaryUncertain?'정확한 절입을 가를 출생 시각이 없어 계절은 열어 둬야 해.':`그 글자가 놓인 철은 ${f.season.season}이야.`}`,
  `${elements[s.dayElement]} ${outerBasis}까지 놓고 보면 그 힘을 ‘${outside[0]}’에서 확인해 볼 만하구나.`,
  elements[leadingElement],
  `${outerBasis}에서 ‘${outside[0]}’을 살필 수 있어. ${outside[2]}`,
  `${innerLine} ${inside[2]}`,
  tie&&!s.dateBoundaryUncertain?`가까운 자리와 다른 기둥의 글자 ${tie.branches}에서 ${tie.type}을 읽어. ${pattern[tie.type]}`:`${innerLine} 그 마음이 다른 사람 앞에서도 그대로 드러나는지 봐.`,
  topicExcerpt(f,6),topicExcerpt(f,7),
  topicExcerpt(f,8),
  `${innerLine} 생활을 합친 뒤에도 그 마음을 지킬 수 있도록, 둘이 반복해서 만나게 될 집안일 하나로 어떤 분담이 편할지 의논하렴.`,
  topicExcerpt(f,10),
  s.dateBoundaryUncertain?'태어난 철은 단정할 수 없으니 일정이 길어진 날 어디서 쉬어야 할지 실제 생활을 먼저 살펴.':`네 사주에서 보는 ${f.season.season}의 흐름과 ${leadingElement}의 상징을 겹쳐 보면 힘을 쓰는 리듬을 돌아볼 만해. ${elements[leadingElement]}`,
  current&&!s.dateBoundaryUncertain?`지금은 근사 계산으로 ${current.pillar} 대운이야. ${current.tenGod}의 ‘${roles[current.tenGod][0]}’이 최근 네가 맡은 일에서 어떤 모습으로 나타나는지 돌아봐.`:'지금 줄 수 있는 단서만으로 대운 구간을 특정하지 않을게. 달력에 답이 없는 자리는 네 경험으로 읽어도 된단다.',
  annualReflection(s,f.annual),
 ][index];
 const other=chapter.groups.filter(g=>!g.detail).flatMap(g=>g.paragraphs.slice(0,1)).filter(p=>p!==detail&&p!==scene);
 return {title,illustration,intro:[detail,scene],sections:other.length?[{title:'네 장부에서 눈여겨볼 곳',paragraphs:other.slice(0,2)}]:[]};
}

export function concernChapter(choice){
 return Object.hasOwn(topics,choice)?topics[choice][0]:13;
}

export function topicExcerpt(f,index){
 const {s,inner,outside,inside,outerBasis}=context(f);
 const resources=s.dateBoundaryUncertain?[]:f.stemTenGods.filter(role=>role==='정재'||role==='편재');
 switch(index){
  case 6:
   if(resources.includes('정재')&&resources.includes('편재')) return '네 천간에는 정재와 편재가 같이 있구나. 꾸준히 들어오는 몫과 한 번 움직여 얻는 몫을 나란히 살피는 장면이야. 장부를 한 칸만 만들면 들쑥날쑥한 수입도 고정비에 기대게 되니 돈의 문을 둘로 그려 보렴.';
   if(resources.includes('정재')) return '네 천간에 보이는 정재는 한 번 크게 얻는 것보다 오래 이어서 남기는 돈에 눈이 가는 상징이야. 같은 물건이라도 들어갈 때 드는 돈과 유지하는 데 드는 돈을 따로 세어 봐.';
   if(resources.includes('편재')) return '네 천간에 보이는 편재에서는 거래나 제안이 움직이는 곳을 살핀단다. 흥미로운 제안을 들으면 이익부터 적고 싶지. 이번에는 답을 기다리는 동안 묶일 돈부터 적어 봐.';
   return `겉글자에서 바로 확인되는 재물의 단서가 적으니 돈이 없다거나 많다고 읽지 않겠어. ${outerBasis}에서 살핀 ‘${outside[0]}’이 지출을 결정할 때에도 나타나는지 실제 기록에서 찾아 보렴.`;
  case 7: {
   const scenes={
    비견:'혼자 맡으면 빠른 일이라도 마지막 판단은 누구와 해야 하는지 물어 봐.',
    겁재:'같이 만든 결과라면 빠른 사람 속도에 맞추기 전에 서로 맡은 일을 한 줄씩 적어.',
    식신:'사람들이 자주 부탁하는 솜씨가 있다면 단계 하나를 정리해 다른 사람도 따라 할 수 있게 해 봐.',
    상관:'회의에서 새 방법을 내고 싶다면 불편했던 대목과 바꿀 순서를 실제 예 한 건으로 보여 줘.',
    편재:'새 제안 두 건이 왔다면 어느 쪽이 짧게 시험해 볼 수 있는지부터 물어.',
    정재:'직장을 옮길 때 첫 달 급여뿐 아니라 출퇴근과 반복 업무까지 한 주 일정에 적어 봐.',
    편관:'급한 부탁에는 언제까지 할 수 있는지와 누가 마지막 결정을 할지부터 답해.',
    정관:'새 직함을 권하거든 책임이 늘면 승인 권한도 따라오는지 물어 보렴.',
    편인:'좋아 보이는 새 도구는 문서 하나에 먼저 써 봐. 두 시간 걸리던 일이 한 시간에 끝났는지 보자.',
    정인:'오래 배운 일이 있다면 남에게 가르칠 수 있는 과정 하나를 꺼내 봐.',
   };
   return `${outerBasis}의 ‘${outside[0]}’을 일터에서 살펴보자. ${scenes[f.saju.dateBoundaryUncertain?inner:f.stemTenGods[1]]}`;
  }
  case 8: return `일지 ${s.dayBranch} 안에 담긴 ${inner}의 상징을 보면 가까워질수록 ‘${inside[0]}’이 어떻게 드러나는지 살펴볼 만해. 좋아한다는 걸 보여 줄 때 ‘${inside[1]}’ 같은 일이 마음에 걸리지 않는지 살펴 보렴.`;
  case 10: return `오래 볼 사람 앞에서 ${inner}에 담긴 ‘${inside[0]}’이 드러나는지 떠올려 보렴. 다 들어주고 뒤늦게 속이 상한다면 그날 누구에게 힘을 보탤지보다 네가 어디까지 할 수 있는지 먼저 말해 봐.`;
  case 13: return annualReflection(s,f.annual);
  default: return null;
 }
}
