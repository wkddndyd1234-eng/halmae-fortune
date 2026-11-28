import {freeArcs,paidScenes} from './story-editions.mjs';

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
 return {s,inner,outer,inside:roles[inner],outside:roles[outer],leadingElement};
}

// Families are selected by the calculated relationship, not a name or random seed.
const families={비견:0,겁재:0,식신:1,상관:2,편재:2,정재:1,편관:0,정관:1,편인:2,정인:1};
export const storyFamily=role=>families[role];

const questions={
 money:'돈 이야기를 골랐구나. 돈이 되는 기회와 지금 지갑에 있는 돈부터 따로 보자.',
 work:'일 이야기를 골랐구나. 일이 손에 안 맞는 날과 네 몫이 너무 많은 날은 다르단다.',
 love:'사랑을 골랐구나. 좋아하는 마음을 어떻게 건네고, 답이 늦을 땐 어떻게 기다리는지부터 보자.',
 people:'사람 사이가 마음에 걸렸구나. 도와주고 싶을 때와 네가 도움을 받고 싶은 때를 함께 볼게.',
 future:'앞날이 궁금하구나. 오래 이어갈 것 하나와 작게 시험할 것 하나를 골라 보자.',
};

export function freeEpisodes(f,reading,call,choice){
 const {s,outer,inner}=context(f);
 const route=s.dateBoundaryUncertain?2:storyFamily(outer);
 const priorities=[
  {money:4,work:3,love:6,people:2,future:8},
  {money:5,work:4,love:7,people:6,future:8},
  {money:6,work:7,love:5,people:3,future:8},
 ];
 const order=[0,1,2,3,4,5,6,7,8];
 const early=Object.hasOwn(questions,choice)?priorities[route][choice]:undefined;
 if(early!==undefined) order.splice(1,0,order.splice(order.indexOf(early),1)[0]);
 // With a confirmed season, the alternate-path arc uses its first everyday scene.
 const first=s.dateBoundaryUncertain?freeArcs[2][0]:route===2?freeArcs[2][1]:freeArcs[route][0];
 return [...order,9].map((slot,position)=>{
  const arc=slot===2&&route!==2&&storyFamily(inner)===2?2:route;
  let [title,body,art]=slot===0?first:freeArcs[arc][slot];
  if(route===2&&slot===1&&!s.dateBoundaryUncertain) [title,body,art]=[
   '막힌 길 옆의 작은 문','계획이 바뀌면 남들이 아직 이유를 따질 때 옆길이 보일 수 있어. 같이 가는 사람에게 방향을 알려 줘. 너만 지름길을 알면 나머지는 그 길에서 너를 찾거든.','episode-2',
  ];
  if(slot===8) body=annualScene(f);
  if(slot===9){
   title='다음에 펼칠 이야기';
   body=Object.hasOwn(questions,choice)
    ?questions[choice].split('. ')[1]+' 전체 풀이에서 이 질문을 2027년의 선택과 이어서 읽을 수 있게 적어 뒀단다.'
    :'네가 쓰기 편한 힘과 남에게 맡겨도 되는 일을 나눠 봤지. 새해 이야기에서는 그 차이를 열두 달에 대어 볼 거야.';
   art='episode-10';
  }
  const paragraphs=slot===0?[
   `${call}, ${questions[choice]??'네 이야기부터 천천히 펼칠게.'}`,
   body,
   s.dateBoundaryUncertain?'오늘은 태어난 날에서 확인할 수 있는 이야기만 읽을게.':`할매 눈에는 이런 모습이 떠올랐어. ‘${reading.headline}’ 말이야.`,
  ]:[body];
  if(position===1) paragraphs.push(`다음에는 ‘${freeArcs[route][order[2]][0]}’ 이야기도 들어 보렴.`);
  if(position===8){
   paragraphs.unshift(choice==='custom'?'적은 문장을 읽어 분석하거나 저장하지는 않아.':'이제 처음 꺼낸 이야기로 돌아가 보자.');
   paragraphs.push('전체 풀이에는 네가 고른 주제에서 실제로 읽을 문단을 한 대목 열어 두었어.');
  }
  if(paragraphs.length===1) paragraphs.push(position===9
   ?'열어 둔 한 문단을 먼저 읽고 정해도 된단다.'
   :`다음에는 ‘${freeArcs[route][order[position+1]??9][0]}’ 이야기를 들려줄게.`);
  return {title,scene:position===0?'첫 만남':'이야기',art,paragraphs};
 });
}

const annualStories={
 비견:'2027년엔 비슷한 힘을 가진 사람과 함께 일하는 장면에 눈이 가는구나. 좋은 동료가 있어도 같이 정할 일과 각자 정할 일을 나눠야 편해. 친구랑 전을 부쳐도 누가 뒤집을지는 정하잖니.',
 겁재:'새해에 옆 사람이 먼저 달리면 덩달아 힘이 날 수 있어. 그 사람 몫까지 네 달력에 적지는 마. 응원하는 날과 네가 나서는 날이 달라도 된다.',
 식신:'2027년에는 한 번 잘한 일을 다시 할 수 있게 만드는 데 마음을 써 봐. 첫 그릇이 맛있었다면 다음에도 같은 불로 끓일 수 있는지 보는 거야.',
 상관:'새해에 답답한 순서가 눈에 들어온다면 한 번에 갈아엎지 마. 한 일만 다르게 해 보고 나아진 곳이 어디인지부터 보여 줘.',
 편재:'2027년에 새 제안이 재미있게 들리면 돈이 어디에서 들어오고 어디에 오래 묶이는지 살펴. 장터를 한 바퀴 돌았다고 가게까지 내야 하는 건 아니거든.',
 정재:'2027년엔 오래 지킬 기준을 하나 고르는 그림이야. 매달 넣을 수 있는 돈이나 무리 없이 지킬 약속처럼, 바쁜 달에도 남는 것부터 골라 보렴.',
 편관:'새해엔 급한 말에 곧장 답하기 전에 어디까지 맡을지 정해 봐. 불이 난 자리를 찾아내는 힘과 모든 불을 혼자 끄는 건 다르단다.',
 정관:'2027년엔 새 역할을 맡을 때 해낼 일과 결정할 수 있는 일을 나란히 봐. 문패가 생기면 문을 열 열쇠도 받아야지.',
 편인:'2027년에는 익숙한 답 옆에 다른 방법을 놓아 보기 좋겠구나. 설명만 모으지 말고 일 한 건에 시험해 봐. 편해진 데가 없으면 원래대로 돌아와도 돼.',
 정인:'새해에 배우고 싶은 일이 있다면 사람에게서 들은 말 중 하나만 생활에 써 봐. 장독을 많이 산다고 익은 장이 늘지는 않거든.',
};
const annualScene=f=>annualStories[f.annual.tenGod];

const chapterTitles=['태어난 날에 담긴 이야기', '스스로를 움직이는 힘', '네가 자주 쓰는 다섯 가지 힘', '밖에서 흔히 맡는 역할', '집에 돌아와 드러나는 마음', '서로 맞물리거나 어긋나는 자리', '손을 떠나도 후회 없는 돈', '혼자 잘할 일, 함께 더 잘할 일', '좋아하는 마음을 건네는 법', '같이 살며 정하는 약속', '손을 내밀어도 괜찮은 관계', '일을 멈추고 쉬는 순서', '긴 시간에 걸친 변화', '2027년 한 해 운세'];

export function chapterStory(f,index,now){
 const {s,inner,outer,inside,outside,leadingElement}=context(f);
 const title=chapterTitles[index];
 const illustration={0:'hanok',2:{목:'gap',화:'jeong',토:'mu',금:'gyeong',수:'im'}[leadingElement],6:'mu',8:'eul',12:'hanok',13:'host'}[index];
 const current=f.luck.decades.find(c=>Date.parse(c.start)<=now&&now<Date.parse(c.end));
 const tie=s.dateBoundaryUncertain?null:f.relations.find(r=>r.a==='일'||r.b==='일');
 const pattern={
  육합:'호흡이 잘 맞는 사람과도 같은 속도로 가야 한다고 넘겨짚지 마.',
  충:'두 사람이 원하는 순서가 다를 수 있어. 먼저 하고 싶은 일을 서로 말해 보렴.',
  형:'같은 말이 자꾸 오가면 이번엔 대답할 순서부터 바꿔 봐.',
  해:'서운한 일이 있었다면 실제로 들은 말과 네가 짐작한 말을 나눠 봐.',
 };
 const detail=[
  s.dateBoundaryUncertain?'태어난 시간이 없어서 정확한 계절은 열어 두었어. 오늘은 생일에서 알 수 있는 이야기부터 할게.':`네가 태어난 철은 ${f.season.season}이야. 그때의 흐름을 함께 보면 ‘${outside[0]}’이 눈에 들어오는구나.`,
  `네가 힘을 내는 방식엔 ‘${outside[0]}’이 보여. 처음부터 다 잘하려고 기운을 다 쓰진 마.`,
  elements[leadingElement],
  `밖에서 일을 맡을 때는 ‘${outside[0]}’이 드러날 수 있어. ${outside[2]}.`,
  `마음이 놓이는 사람 앞에선 ‘${inside[0]}’이 더 잘 드러날 수 있어. ${inside[2]}.`,
  tie?pattern[tie.type]:`‘${inside[0]}’은 누구 앞에서나 똑같이 드러날 필요는 없단다.`,
  topicExcerpt(f,6),topicExcerpt(f,7),topicExcerpt(f,8),
  `같이 사는 사람 앞에서 ‘${inside[0]}’이 나타날 수 있어. 누가 무슨 집안일을 맡을지부터 이야기해 봐.`,
  topicExcerpt(f,10),
  s.dateBoundaryUncertain?'태어난 철은 확실히 알 수 없어. 바쁜 날에는 쉬는 시간부터 확보해 보렴.':`태어난 철을 보면 ‘${outside[0]}’에 힘을 쓰기 쉬워. 그런 일에 몰두하는 날에도 끼니와 쉼은 챙기렴.`,
  current?`요즘 길게 이어지는 흐름에서는 ‘${roles[current.tenGod][0]}’이 먼저 보여. 처음엔 버거웠는데 지금은 익숙해진 일을 떠올려 봐.`:'지금 정보로 몇 살부터 어떤 흐름인지 정하기는 어려워. 오래 하면서 손에 익은 일부터 돌아보렴.',
  topicExcerpt(f,13),
 ][index];
 const role=index===13?f.annual.tenGod:index===12?current?.tenGod
  :[4,5,8,9,10].includes(index)?inner:outer;
 const scene=role?paidScenes[index][storyFamily(role)]
  :'때를 모르는 부분은 비워 두자. 네가 이미 겪은 일에서 계속하고 싶은 것과 내려놓고 싶은 것을 가려 내도 좋단다.';
 const chartBoundary=index===0&&s.dateBoundaryUncertain;
 return {title,illustration,intro:[detail,chartBoundary?paidScenes[0][2]:scene],sections:[]};
}

export function concernChapter(choice){
 return Object.hasOwn(topics,choice)?topics[choice][0]:13;
}

export function topicExcerpt(f,index){
 const {s,outer,outside,inside}=context(f);
 const resources=s.dateBoundaryUncertain?[]:f.stemTenGods.filter(role=>role==='정재'||role==='편재');
 switch(index){
  case 6:
   if(resources.includes('정재')&&resources.includes('편재')) return '네 풀이에는 매달 지키는 돈과 한 번 움직여 버는 돈이 둘 다 보여. 새 제안에서 벌 돈을 아직 받지도 않고 월세에 보태면 마음이 조급해진단다. 통장에 들어오는 날을 따로 보렴.';
   if(resources.includes('정재')) return '너한테는 꾸준히 남기는 돈이 잘 맞을 수 있어. 큰돈을 한 번 넣는 일보다 매달 지킬 수 있는 액수부터 정하면 마음이 편하단다.';
   if(resources.includes('편재')) return '새 제안에 먼저 눈이 갈 수 있어. 얼마나 남을지 적기 전에 돈이 언제 돌아오는지 물어보렴. 장부에만 있는 돈으론 장을 못 보잖니.';
   return `너는 ‘${outside[0]}’을 돈 쓸 때도 발휘할 수 있어. 바로 결제한 물건과 하루 기다렸다 산 물건 중 어느 쪽을 더 오래 썼는지 보렴.`;
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
   return scenes[outer];
  }
  case 8: return `좋아하는 사람 앞에서는 ‘${inside[0]}’이 드러날 수 있어. 마음을 보여 주려다 ‘${inside[1]}’ 같은 순간이 생기면 먼저 한 발 쉬어도 된단다.`;
  case 10: return `오래 볼 사람에게는 ‘${inside[0]}’이 힘이 될 수 있어. 부탁을 다 들어주고 속이 상한다면, 오늘 할 수 있는 몫만 말해 보렴.`;
  case 13: return annualScene(f);
  default: return null;
 }
}
