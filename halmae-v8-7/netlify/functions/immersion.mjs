// Editorial additions. The calculated chart and chapter interpretation are inputs.
const headings=[
 '네가 힘을 낼 때는 언제인지, 책상 위에 네 글자부터 펴 놓자.',
 '같은 말도 누구 입에서 나오느냐에 따라 다르지. 네가 힘을 내는 방식부터 보자.',
 '부엌에 양념이 많다고 국이 맛있어지는 건 아니란다. 네 장부에서도 먼저 손이 가는 기운이 있어.',
 '바깥에서 맡는 역할과 집에 돌아와 쉬는 모습이 언제나 같은 줄 알았니?',
 '가까운 사이에서는 좋은 마음도 자꾸 말을 아끼면 상대에게 안 보인단다.',
 '손발이 맞는 자리와 자꾸 걸려 넘어지는 자리를 장부에 따로 표시해 보자.',
 '돈은 들어오는 문도 중요하지만, 어느 문으로 새는지 봐야 돈이 남지.',
 '일이 술술 풀렸던 날을 떠올려 봐. 어떤 몫을 맡았을 때 그랬을까?',
 '좋아한다는 말과 마음이 놓인다는 말은 결이 조금 다르단다.',
 '둘이 같이 걷는다고 보폭까지 같아야 하는 법은 없지.',
 '네 곁에 사람은 많을 수 있어. 누구와 무슨 말을 나눌 수 있는지가 더 중요하단다.',
 '하루를 오래 끌고 가려면 몸이 먼저 멈추라고 보내는 신호를 들어야지.',
 '지금 가는 길과 예전에 오래 걸어온 길을 한 장에 겹쳐 보자.',
 '자, 여기서부터는 2027년 이야기야. 네가 무엇 앞에서 한 번 더 생각할지 보자꾸나.',
 '새해라며 솥부터 키우지 말고, 작년에 남긴 재료부터 보자.',
 '봄바람이 분다고 문을 전부 열 필요는 없어. 어디부터 바람을 들일까?',
 '여럿이 뛰기 시작하면 쉬운 일도 엉킬 수 있지. 네 몫을 먼저 챙겨 봐.',
 '돌다리를 두드릴 때 마음이 놓이는 것과 그대로 서 있는 건 다르단다.',
 '말 한마디로 일이 빨라지기도, 돌아가기도 하는 달이 있지.',
 '손에 쥔 일이 많으면 새로운 걸 받을 손이 없어. 이번엔 무엇을 잠깐 내려놓을까?',
 '묵은 일도 뚜껑을 열어야 손볼 데가 보인단다.',
 '한창 바쁠 때야말로 네가 혼자 풀어야 할 일인지 한 번 물어 보렴.',
 '가을 장에선 잘 익은 것부터 거둬야지. 아직 이른 일에는 시간을 더 줘.',
 '밤이 깊어진다고 답이 저절로 찾아오진 않아. 내일 다시 볼 질문 하나를 남겨 봐.',
 '무언가 더 들이기 전에 손에 남은 것부터 제대로 챙겨 보자.',
 '열두 달을 다 넘겼구나. 무엇을 해냈는지보다 무엇을 다시 해 볼 만했는지 세어 보렴.',
];
const topics={
 money:{title:'재물과 돈',chapter:6,tip:'이번 주에 자주 결제하는 한 항목만 골라 봐. 쓸 때 기뻤는지, 다음 날에도 아깝지 않았는지 두 번 물으면 돈 흐름이 보이기 시작한단다.'},
 work:{title:'직장과 사업',chapter:7,tip:'일주일 동안 고맙다는 말을 들은 구체적인 일을 적어 보렴. 잘하는 일이 무엇인지 알아보는 데 거창한 적성 검사가 꼭 필요한 건 아니야.'},
 love:{title:'사랑과 인연',chapter:8,tip:'상대가 알아주었으면 하는 일 하나를 한 문장으로 말해 봐. 뜻을 맞히는 게임은 설렘이 아니라 피로를 남기기도 한단다.'},
 people:{title:'가족과 인간관계',chapter:10,tip:'네가 도와줄 수 있는 몫과 오늘은 어려운 몫을 구분해 말해 보렴. 잘 지내려면 서로 짐의 무게를 알아야지.'},
 future:{title:'앞으로의 미래',chapter:13,tip:'두 갈래가 보일 때 돈이나 시간을 크게 걸기 전에, 일주일 안에 시험할 한 걸음부터 골라 보렴.'},
};
export const chapterOpening=index=>headings[index];
export function concernReading(choice,reading,excerpt){
 const topic=Object.hasOwn(topics,choice)?topics[choice]:null;
 const evidence={money:reading.money,work:reading.work,love:reading.relationships,people:reading.relationships,future:reading.balance};
 if(topic) return {...topic,advice:evidence[choice]+' '+topic.tip,teaser:headings[topic.chapter]};
 if(choice==='custom') return {title:'네가 적어 둔 질문',chapter:13,advice:reading.balance+' 그 질문에서 네가 바꿀 수 있는 것 하나를 골라 보렴.',teaser:excerpt};
 return null;
}
