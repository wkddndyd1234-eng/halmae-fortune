import {freeManuscript,paidManuscript,storyFacts} from './story-manuscript.mjs';
import {pillarElements} from './saju.mjs';
import {daySymbol} from './lantern-stories.mjs';
import {freeArcs} from './story-editions.mjs';

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

const openings={
 비견:['“그냥 내가 할게”가 제일 빠른 날','사람들 손이 멈추면 직접 시작하는 쪽이 편할 수 있어. 덕분에 일이 풀려도 그 일이 죄다 네 몫이 되는 건 아니란다.'],
 겁재:['옆 사람 발걸음에 나도 빨라질 때','함께 뛰는 사람이 있으면 혼자 할 때보다 힘이 날 수 있어. 옆집 빨래가 마른다고 네 빨래까지 다 마른 건 아니지.'],
 식신:['말보다 따뜻한 밥이 먼저 떠오를 때','가까운 사람이 지쳐 보이면 뭐라도 해 주고 싶을 수 있어. 밥 한 끼가 고맙지만 어떤 날엔 곁에 앉아 주는 게 더 반갑단다.'],
 상관:['다들 하던 대로 할 때 다른 길이 보이는 사람','답답한 순서에서 고칠 데를 먼저 알아볼 수 있어. 다 맞는 말을 해도 첫마디가 너무 매서우면 뒷말을 놓치더라.'],
 편재:['재밌는 제안 하나에 달력이 꽉 찰 때','새로운 일이 보이면 다른 사람보다 쓰임새를 빨리 떠올릴 수 있어. 제안이 근사해도 달력 빈칸까지 다 내줄 필요는 없지.'],
 정재:['마감부터 정리해야 마음이 놓이는 날','일이 밀리면 먼저 끝낼 순서부터 잡는 쪽이 편할 수 있어. 꼼꼼하게 챙기는 건 장점이지만 정리표까지 예쁘게 만들다 늦게 퇴근하면 억울하잖니.'],
 편관:['급한 부탁에 내 손부터 올라갈 때','단체방에 “오늘 중으로 돼?”가 뜨면 누가 할지 정하기도 전에 답장부터 열 수 있어. 막힌 일을 푸는 건 네 힘이고, 남은 일까지 떠맡는 건 또 다른 얘기란다.'],
 정관:['약속은 지켰는데 내 일이 늘어날 때','기한을 챙기다 보면 사람들 눈에는 네가 늘 여유 있어 보일 수 있지. 할매도 장부를 잘 쓴다고 동네 외상까지 다 받을 순 없단다.'],
 편인:['짧은 답장에 뒷이야기가 길어질 때','작은 단서에서 여러 이유를 떠올리는 힘이 있어. 다만 상대가 보낸 건 한 줄인데 네가 그 뒤를 세 편까지 쓰면 피곤하지.'],
 정인:['조언은 모였는데 다시 한 번 묻게 될 때','예전부터 배운 걸 잘 챙겨 두는 건 힘이야. 그래도 양념장을 다 꺼내 놔야 국 한 그릇을 끓이는 건 아니란다.'],
};
const nextFocus={
 money:'돈 이야기에서는 지금 쓸 수 있는 돈과 아직 기다려야 할 돈부터 가려 볼게.',
 work:'일 이야기에서는 네가 잘하는 일과 계속 맡아도 편한 일을 나눠 볼게.',
 love:'인연 이야기에서는 네 마음을 건네는 방식부터 살펴보자.',
 people:'가까운 사람에게 어디까지 손을 내밀 수 있는지도 이어서 볼게.',
 future:'새해에는 이 힘을 어디에 쓰고 어디서 아껴 둘지 이어서 볼게.',
};
const elementMeaning={
 목:'목은 새 일을 벌이고 키우는 쪽으로 살펴보는 기운이야. 손대고 싶은 일이 많다면 이미 시작한 것 중 무엇을 끝내고 싶은지 떠올려 봐.',
 화:'화는 마음과 생각을 밖으로 드러내는 쪽으로 읽어. 여러 사람이 머뭇거릴 때 첫 말을 꺼내는 장면을 생각하면 쉬워.',
 토:'토는 일이 흔들릴 때 자리를 받쳐 주는 쪽으로 읽어. 급한 사람들 사이에서 순서를 잡거나 일상 약속을 이어 가는 그림이란다.',
 금:'금은 무엇을 남기고 덜어 낼지 가르는 쪽으로 읽어. 손에 든 일 중 지금 필요 없는 몫을 골라 내는 그림이야.',
 수:'수는 작은 낌새를 살피거나 다른 길을 찾는 쪽으로 읽어. 정해 둔 길이 막혔을 때 한 걸음 물러나 옆길을 보는 그림이란다.',
};
const seasonalLight={
 봄:'봄에 태어난 바탕은 새 일이 움트는 모습에 빗대지. 가능성을 알아보는 것과 그 일을 오래 키우는 건 따로 살펴볼 대목이야.',
 여름:'여름에 태어난 바탕에선 안에서 품은 것을 밖으로 꺼내는 장면을 살펴. 사람들 앞에서 쓰는 힘과 혼자 있을 때 돌아오는 힘이 같을 필요는 없지.',
 가을:'가을에 태어난 바탕은 무엇을 남기고 무엇을 덜어 낼지 가르는 모습에 빗댄단다. 한 가지를 깊이 골라 보면 그제야 보이는 것이 있어.',
 겨울:'겨울에 태어난 바탕에선 속으로 모아 둔 힘도 살펴본단다. 겉이 잠잠한 동안에 마음까지 아무 일도 안 하는 건 아니거든.',
};
export function freeOpening(f,call,choice,elementCounts){
 const {s,outer}=context(f);
 const [title,body]=openings[outer];
 const most=Math.max(...Object.values(elementCounts));
 const leaders=Object.keys(elementCounts).filter(key=>elementCounts[key]===most);
 const elementCopy=leaders.length===1
  ?`네 그래프에서는 ${leaders[0]} 기운이 ${most}개로 가장 자주 보여. ${elementMeaning[leaders[0]]}`
  :`네 그래프에서는 ${leaders.join('·')} 기운이 각각 ${most}개로 나란히 보여. 태어난 날의 기운을 한 가지 장면으로 먼저 읽어 보자. ${elementMeaning[f.saju.dayElement]}`;
 if(choice===undefined){
  const [symbol,gift,watch]=daySymbol(f.saju.dayStem);
  const season=s.dateBoundaryUncertain?'태어난 시각에 따라 달라지는 계절의 이야기는 오늘은 비워 둘게.':seasonalLight[f.season.season];
  return {title,paragraphs:[
   `${call}, 넌 ${symbol} 같은 기운을 품고 태어난 아이구나. 할매 눈엔 ${gift}부터 보여. ${body}`,
   `${season} ${watch}`,
  ],elementCopy};
 }
 return {title,paragraphs:[`${call}, ${body}`,Object.hasOwn(nextFocus,choice)?nextFocus[choice]:'이 힘이 사람들 앞에서 어떻게 쓰이고 집에선 어떻게 달라지는지 다음 이야기에서 보자.'],elementCopy};
}

export function freeEpisodes(f,reading,call,choice){
 const {s,outer,inner}=context(f);
 const route=s.dateBoundaryUncertain?2:storyFamily(outer);
 if(choice===undefined){
  const chartElements=s.dateBoundaryUncertain
   ?pillarElements(s.pillars[2]).reduce((counts,key)=>({...counts,[key]:(counts[key]??0)+1}),{})
   :s.elements;
  const opening=freeOpening(f,call,undefined,chartElements);
  const heading=s.dayStem==='丙'?'허허, 넌 큰 태양을 품고 태어난 아이구나.':`넌 ${daySymbol(s.dayStem)[0]} 같은 힘을 품었구나.`;
  return freeManuscript(f,call,heading,opening.elementCopy);
 }
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

const annualScene=f=>{
 const {annual,outward}=storyFacts(f);
 return `2027년 장부에서 먼저 보이는 건 ‘${annual[0]}’이야. ${annual[1]} 이 힘이 네게 익숙한 ‘${outward[0]}’과 어떻게 만나는지에 따라 같은 일도 다르게 느껴질 수 있단다.`;
};

const chapterTitles=['태어난 날에 담긴 이야기', '스스로를 움직이는 힘', '네가 자주 쓰는 다섯 가지 힘', '밖에서 흔히 맡는 역할', '집에 돌아와 드러나는 마음', '서로 맞물리거나 어긋나는 자리', '손을 떠나도 후회 없는 돈', '혼자 잘할 일, 함께 더 잘할 일', '좋아하는 마음을 건네는 법', '같이 살며 정하는 약속', '손을 내밀어도 괜찮은 관계', '일을 멈추고 쉬는 순서', '긴 시간에 걸친 변화', '2027년 한 해 운세'];

export function chapterStory(f,index,now){
 const {leadingElement}=context(f);
 const illustration={0:'hanok',2:{목:'gap',화:'jeong',토:'mu',금:'gyeong',수:'im'}[leadingElement],6:'mu',8:'eul',12:'hanok',13:'host'}[index];
 return {title:chapterTitles[index],illustration,...paidManuscript(f,index,now,topicExcerpt(f,index))};
}

export function chartPreviewChapter(f){
 const {s,inner,outer}=context(f);
 if(s.dateBoundaryUncertain) return 13;
 if(f.stemTenGods.includes('정재')||f.stemTenGods.includes('편재')) return 6;
 if(['편관','상관','정관'].includes(outer)) return 7;
 if(['정인','식신','편인'].includes(inner)) return 8;
 return 13;
}

export function concernChapter(choice){
 return Object.hasOwn(topics,choice)?topics[choice][0]:13;
}

export function topicExcerpt(f,index){
 const {s,outer,inner,outside}=context(f);
 const resources=s.dateBoundaryUncertain?[]:f.stemTenGods.filter(role=>role==='정재'||role==='편재');
 switch(index){
  case 6:
   if(resources.includes('정재')&&resources.includes('편재')) return '네 장부에는 오래 쌓여 돌아오는 값과 새로 만난 사람 사이에서 생기는 값이 함께 보여. 한쪽이 생활을 지켜 주고 다른 쪽이 네 일의 폭을 넓힐 수 있지. 두 힘은 함께 있어도 자라는 속도가 같지 않단다.';
   if(resources.includes('정재')) return '네게 돈이 붙는 모양은 한꺼번에 흘러드는 물보다 익숙한 우물에 가까워. 한 번 맡은 일을 오래 믿을 만하게 해낼 때 그 믿음이 수입의 바탕이 되기 쉬운 사주로 읽힌단다.';
   if(resources.includes('편재')) return '사람이 가진 것과 남이 찾는 것의 짝을 발견하는 데 눈이 밝을 수 있어. 그 감각이 일과 돈을 데려오는 길이 되지만, 좋아 보이는 기회 모두가 너와 오래 갈 만큼 단단한 건 아니란다.';
   return `너는 ‘${outside[0]}’을 돈 쓸 때도 발휘할 수 있어. 돈이 얼마나 들어올지보다 그 재주가 어떤 사람에게 꼭 필요한지를 먼저 읽어 보는 대목이란다.`;
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
   return storyFacts(f).outward[1]+' '+scenes[outer];
  }
  case 8: return [
   '마음이 커지면 말로 재기보다 곁으로 먼저 다가가는 쪽이야. 갑자기 일이 생겨도 손부터 내미는 다정함이 있지. 네가 어떻게 도울지만 정해 두면, 상대에게는 고를 자리가 없을 수도 있단다.',
   '좋아한다는 말이 쑥스러워도 마음은 손끝에서 먼저 보일 수 있어. 지친 날에 쉬운 길을 만들어 주거나, 전에 좋다고 했던 것을 기억하는 식이야. 안정감을 주는 재주지만 네가 받고 싶은 마음까지 말없이 접어 두면 서운해질 수 있지.',
   '네가 마음을 쓰는 사람의 말은 같은 한 줄이라도 여러 모양으로 들릴 수 있어. 표정이 바뀐 이유를 세심하게 읽는 건 귀한데, 그 사람이 말하지 않은 마음까지 네가 정해 놓으면 둘이 만나는 자리가 좁아질 수 있단다.',
  ][storyFamily(inner)];
  case 10: return [
   '오래 볼 사람을 아끼는 마음은 어려운 날 먼저 나타날 수 있어. 매번 급할 때만 네가 필요하다면, 고마움과 의무가 언제부터 뒤섞였는지 돌아보렴.',
   '연락이 잦지 않아도 한결같이 만나는 관계에서 마음이 편해질 수 있겠어. 익숙한 사이일수록 네가 손을 보태는 게 반가운지, 늘 그렇겠거니 여기는지 차이가 난단다.',
   '가까운 사람과 나눈 사소한 이야기도 잘 남는 쪽이야. 덕분에 안부가 생생하지만, 마음에 걸린 말이 오래 남았다면 꺼낼 때의 네 마음부터 짚어 보렴.',
  ][storyFamily(inner)];
  case 13: return annualScene(f);
  default: return null;
 }
}
