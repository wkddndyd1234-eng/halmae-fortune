import {monthlyStory} from '../lib/monthly-stories.mjs';
import {chapterStory,monthlyRoleTheme} from './story-scenes.mjs';
import {chapterOpening} from './immersion.mjs';
import {boundaryNatalGroups,monthlyGroups,natalGroups} from '../lib/premium-reading.mjs';
import {annualReflection,fortuneCycles} from './fortune-cycles.mjs';
import {readingName} from './reading-name.mjs';
import {roleLenses,relationalLenses} from '../lib/interpretive-lenses.mjs';
const names={甲:'곧게 뻗는 큰 나무',乙:'바람을 타는 풀과 덩굴',丙:'먼 곳까지 비추는 태양',丁:'어둠 속을 밝히는 등불',戊:'흔들리지 않는 산',己:'생명을 기르는 밭',庚:'단단한 쇠',辛:'정교하게 빛나는 보석',壬:'넓게 흐르는 강과 바다',癸:'스며드는 이슬과 비'};
const ten={비견:'나와 비슷한 힘을 가진 동료와 자립',겁재:'경쟁과 나눔 사이의 긴장',식신:'꾸준한 생산과 표현',상관:'틀을 바꾸려는 표현과 문제 제기',편재:'움직이는 자원과 외부 기회',정재:'관리하는 재물과 책임',편관:'압박과 돌파의 과제',정관:'규칙과 공적인 역할',편인:'독특한 배움과 직관',정인:'보호와 축적된 배움'};
const elements={목:'성장과 시작',화:'표현과 확산',토:'중심과 조율',금:'선택과 정리',수:'관찰과 흐름'};
const seasons={寅:'봄이 문을 여는 때',卯:'봄기운이 왕성한 때',辰:'봄에서 여름으로 넘어가는 때',巳:'여름이 시작되는 때',午:'열기가 가장 강한 때',未:'여름이 무르익고 넘어가는 때',申:'가을이 시작되는 때',酉:'가을기운이 깊어지는 때',戌:'가을에서 겨울로 넘어가는 때',亥:'겨울이 시작되는 때',子:'차가운 기운이 깊은 때',丑:'겨울이 마무리되는 때'};
const section=(kicker,title,lead,paragraphs,bullets=[],quote='')=>({kicker,title,lead,paragraphs,bullets,quote});
const fmt=iso=>new Date(Date.parse(iso)+9*3600000).toISOString().slice(0,16).replace('T',' ');
const weekdays=[...'일월화수목금토'];
const luckText=cycles=>cycles.map(cycle=>
 `근사 대운 ${cycle.pillar}(${cycle.tenGod}) · 운의 두 지지는 ${cycle.relations.join('·')||'직접 합충형해 없음'}`).join(' / ');
const transitText=items=>items.length?items.map(r=>r.position+'지 '+r.natal+'와 '+r.transit+'의 '+r.type).join(' · '):'직접적인 합충형해 없음';
export function buildFortuneReport(order,{now=Date.now()}={}){
 const f=fortuneCycles(order),s=f.saju,name=order.name||'손님';
 const {call}=readingName(order.name);
 const [year,month,day,hour]=s.pillars;
 const e=Object.entries(s.elements).map(([key,value])=>key+' '+value+'개').join(' · ');
 const monthSeason=seasons[month[1]];
 const main=names[s.dayStem];
 const activity=f.stemTenGods[1];
 const inner=f.hiddenTenGods[2][0].tenGod;
 const personalTie=f.relations.find(({a,b})=>a==='일'||b==='일');
 const relations=f.relations.map(x=>x.a+'·'+x.b+'의 '+x.branches+' '+x.type);
 const relationText=relations.length?relations.join(', '):'이 방식에서 두 글자씩 대조한 합충형해가 없어요';
 const stemText=f.stemTenGods.map((x,i)=>x?['년','월','일','시'][i]+'간 '+x+'('+ten[x]+')':null).filter(Boolean).join(' / ');
 const base=`${name}, 네 일간은 ${s.dayStem}(${s.dayElement})이구나. 전통 명리에서는 ${main}에 빗대어 읽지. 월지 ${month[1]}는 ${monthSeason}의 자리야.`;
 const evidence=`원국은 ${[year,month,day,hour||'시주 미상'].join(' · ')}이고, 겉에 드러난 오행은 ${e}란다. 이 수치는 지장간의 세력이나 용신을 판정한 점수가 아니야.`;
 const noHour=hour?'시주 '+hour+'는 오래 품어 온 바람을 돌아보는 자리에 두렴.':'가장 오래 품은 바람은 앞으로도 네가 직접 이야기해 줄 수 있단다.';
 const leads=[
  `${name}, 할매가 네 장부를 펴니 ${main}의 모습이 떠오르는구나. 그 모습이 네가 힘을 내는 순간과 닮았는지부터 살펴보렴.`,
  `너에게 편한 방식이 무엇인지 떠올려 보렴. 할매는 ${main}의 모습을 빌려 그 이야기를 들려줄게.`,
  '힘을 자주 쓰는 곳이 있으면 잠시 내려놓을 곳도 필요하단다. 요즘 자꾸 마음이 쏠리는 일은 뭐니?',
  `밖에서 네 역할이 애매해질 때가 있지. 마음에 걸리는 일 하나를 골라 ${roleLenses[activity][1]}부터 생각해 보렴.`,
  `가까운 사이일수록 말하지 않아도 알겠거니 하게 되지. 할매라면 ${roleLenses[inner][2]}부터 살펴보겠어.`,
  personalTie?`함께 정한 일이 자꾸 마음에 남을 때가 있지. ${relationalLenses[personalTie.type][2]}.`:
   `사람과 일을 맞춰 갈 때 할매라면 ${roleLenses[activity][1]}부터 돌아보겠어.`,
 ];
 const chapters=[
 section('第一章','네 사주 네 기둥',base,[evidence,`연주 ${year}는 바깥 환경, 월주 ${month}는 계절과 사회적 자리, 일주 ${day}는 자신과 가까운 관계, 시주 ${hour||'미상'}는 후반의 지향을 읽는 상징이란다.`,noHour],[`출생 입력: ${s.birthDate} · ${s.calendarType==='lunar'?(s.isLeapMonth?'음력 윤달':'음력 평달'):'양력'}`,`양력 환산: ${s.solarDate}`,`성별: ${s.gender==='male'?'남성':s.gender==='female'?'여성':'기록 없음'}`,],`“${name}, 이 네 기둥이 네 운명의 첫 문장이란다.”`),
 section('第二章','일간에 새겨진 너의 빛',`${s.dayStem} · ${main}`,[`같은 ${s.dayElement} 기운도 계절과 주변 글자에 따라 다르게 읽는단다. 강하다고 늘 밀어붙일 필요도, 약하다고 빛을 잃는 것도 아니지.`,`이 상징이 네 실제 성격을 단정하는 것은 아니야. 다만 네가 힘을 얻는 장면을 돌아보는 거울로 삼아 보렴.`],[`일간 ${s.dayStem}`,`일지 ${s.dayBranch}`]),
 section('第三章','오행이 들려주는 균형',e,[`월령은 ${f.season.season}이고 이 계절의 중심 상징은 ${f.season.chiefElement}이야. ${f.season.transition?'계절이 바뀌는 달이라 흙의 전환 상징도 함께 살펴. ':''}목은 ${elements.목}, 화는 ${elements.화}, 토는 ${elements.토}, 금은 ${elements.금}, 수는 ${elements.수}를 뜻하는 전통의 언어란다.`,`보이지 않는 오행이 곧 결핍이나 불운은 아니란다. 계절과 지장간을 함께 보아야 해서 단순 개수로 좋고 나쁨을 말할 수 없어.`],Object.entries(s.elements).map(([key,value])=>`${key}: ${value}`)),
 section('第四章','십성이 엮는 역할',stemText||'확인된 천간 관계가 적구나',[ `일간 ${s.dayStem}을 기준으로 다른 천간의 음양과 오행 관계를 살피면 ${stemText||'시각 미상으로 일부 관계가 생략되었다'}고 읽힌단다.`,`십성은 사람을 고정된 유형으로 나누는 판정표가 아니라, 관계와 역할을 표현하는 전통의 상징이지.`,`일과 재물, 배움과 책임을 읽을 때에도 한 가지 십성만으로 결론을 내리지 않는단다.`],f.stemTenGods.map((x,i)=>x?['년','월','일','시'][i]+'간: '+x:'').filter(Boolean)),
 section('第五章','일주와 가까운 인연',`${day} · 네가 서 있는 자리`,[`일주 ${day}는 일간 ${s.dayStem}과 일지 ${s.dayBranch}가 만난 모습이란다. ${main}의 이미지가 ${s.dayBranch}라는 자리와 만난 것으로 읽지.`,`전통적으로 일지는 가까운 관계의 자리로도 보지만, 상대의 마음이나 결혼 결과를 정해 주지는 않아.`,`사람을 만날 때 네가 편안해지는 방식과 마음이 부딪히는 순간을 실제 대화로 확인하렴.`]),
 section('第六章','지장간과 합충의 비밀',relationText,[`겉으로 보이는 지지 안에는 지장간이 숨어 있단다. 년지 ${year[1]}에는 ${f.hiddenStems[0]}, 월지 ${month[1]}에는 ${f.hiddenStems[1]}, 일지 ${day[1]}에는 ${f.hiddenStems[2]}${hour?', 시지 '+hour[1]+'에는 '+f.hiddenStems[3]:''}가 담긴다고 본단다.`,`지지를 두 글자씩 보면 ${relationText}라고 읽을 수 있어. 충은 변화나 부딪힘, 합은 연결과 결합의 상징으로 읽되 무조건 길흉을 결정하지는 않는단다.`,`형과 해는 긴장과 마찰의 상징으로도 읽지만 학파별 적용 조건이 다르단다. 지장간의 세력과 합화 성립 여부는 단정하지 않을게.`],relations),
 ];
 const domain=[
 ['재물의 흐름','편재','정재','재물의 기회는 숫자로 확인하고, 무리한 투자를 운명으로 합리화하지 말거라.'],
 ['일과 사업의 길','식신','상관','재능이 결과가 되는 과정에는 표현과 꾸준한 생산이 함께 필요하단다.'],
 ['연애와 마음','비견','겁재','관계는 맞히는 대상이 아니라 서로 알아 가는 시간이란다.'],
 ['결혼과 동행','정관','정재','배우자의 운명을 단정하지 말고 서로의 약속과 현실을 함께 보렴.'],
 ['사람과 귀인','정인','편인','도움과 배움은 인연 속에서 오지만 누가 귀인인지는 실제 행동이 말해 준단다.'],
 ['몸과 기운의 리듬','편관','정인','사주로 질병을 예측할 수는 없으니 몸의 신호는 의료적으로 확인하렴.']
 ];
 for(let i=0;i<domain.length;i++){
  const [title,a,b,caution]=domain[i];
  const found=f.stemTenGods.filter(x=>x===a||x===b);
  const hiddenFound=f.hiddenTenGods.flatMap((items,j)=>items.filter(x=>x.tenGod===a||x.tenGod===b).map(x=>['년','월','일','시'][j]+'지 '+x.stem+'('+x.tenGod+')'));
  const domainLeads=['돈을 더 벌 궁리와 지금 가진 돈을 지킬 궁리는 따로 해야 한단다.','맡은 일이 힘을 보태 주는지, 네 몫만 더 늘리는지 살펴보렴.','사랑에서는 말해 준 마음과 네가 짐작한 마음을 구별해 보렴.','함께 살아가는 이야기는 생활비나 쉬는 시간처럼 작은 약속에서 시작한단다.','도움이 필요할 때는 무엇을 어디까지 부탁할지부터 생각해 봐.','몸이 보내는 신호가 있다면 운수에 기대기 전에 쉬고 살펴보렴.'];
  chapters.push(section('第'+['七','八','九','十','十一','十二'][i]+'章',title,domainLeads[i],[
   `${a}의 뜻은 ${ten[a]}, ${b}의 뜻은 ${ten[b]}이란다.`,
   found.length?`‘${title}’에서 먼저 확인할 겉천간의 단서는 ${found.join('·')} 표시야.`:`겉천간에 ${a}·${b} 표시가 없으니 아래 지장간의 단서를 펴 보렴.`,
   hiddenFound.length?'지장간까지 살피면 '+hiddenFound.join(' · ')+'도 나타나는구나. 겉에 드러난 역할과 안에 담긴 역할은 구분해서 읽어야 한단다.':`지장간에도 ${a}·${b} 표시는 없구나. 이 표에서 해당 역할이 보이지 않는다고 실제 여건을 판단할 수는 없단다.`,
   caution
  ],[`일간: ${s.dayStem}`,`관련 십성: ${a}·${b}`]));
 }
 const decades=f.luck.decades;
 chapters.push(section('第十三章','열 해마다 바뀌는 대운',decades.length?
  `${f.luck.direction} · 첫 대운 약 ${f.luck.startAgeYears.toFixed(1)}세`:'길게 이어지는 삶의 이야기',[
  '마당에 심은 나무를 매일 바라보면 어제와 오늘이 비슷해 보여도, 여러 해를 건너 돌아보면 가지가 처음과 다른 곳까지 닿아 있지. 대운이라는 옛이야기는 그 긴 시간에 이름을 붙여 돌아보는 방식이란다.',
  decades.length?`네 장부에 펼친 긴 흐름은 월주 ${month}에서 ${f.luck.direction}하는 그림이란다. 처음 시작한 일과 오래 곁에 남은 일을 구별하면, 같은 길에서도 어떻게 걷는 법이 달라졌는지 보이지.`:
   '할매가 네게 건네고 싶은 것은 누구의 달력도 대신할 수 없는 질문이란다. 처음에는 배워야 해서 하던 일 중에 이제 다른 사람에게 알려 줄 수 있는 일이 있니? 아직 손에 쥐고 싶은 일 하나와 다음 사람에게 건네주고 싶은 일 하나를 나란히 놓아 보렴. 지금 지나가는 한철을 먼 미래로 재단하지 않아도 긴 시간을 보는 눈은 그렇게 자란단다.'
 ],decades.map(d=>`약 ${d.startAge}세부터 ${d.pillar} · ${d.tenGod}`)));
 const annualRelations=s.dateBoundaryUncertain?f.annual.relations.filter(item=>item.position==='일'):f.annual.relations;
 chapters.push(section('第十四章','2027년 정미년의 기운',`${f.annual.pillar} · ${f.annual.tenGod}`,[
  annualReflection(s,f.annual),
  `정미년의 십성 ${f.annual.tenGod}에서 살필 주제는 ‘${ten[f.annual.tenGod]}’이야.`,
  ...(annualRelations.length?[`정미의 未와 장부에 펼친 자리를 대조하면 ${transitText(annualRelations)} 관계가 보이는구나.`]:[]),
  ...(f.annual.decades.length?[luckText(f.annual.decades)]:[]),
 ]));
 f.monthly.forEach((m,i)=>{
  const groups=monthlyGroups(f,m,i).map((group,index)=>({...group,detailFrom:[2,2,2,1,group.paragraphs.length-1,1][index]}));
  chapters.push({...section('2027 · '+String(i+1).padStart(2,'0')+'월',`${i+1}월 · ${m.pillar}의 문`,groups[0].paragraphs[0],groups.flatMap(g=>g.paragraphs),
   [`월운 간지: ${m.pillar}`,`일간 기준 십성: ${m.tenGod}`,`이 풀이가 적용되는 기간: ${fmt(m.start)}부터 ${fmt(m.end)} 직전까지 (한국 시간). 달력의 1일이 아니라 절기가 드는 시각에 바뀌어요.`]),groups,displayTitle:`${i+1}월 운세`});
 });
 for(let i=0;i<14;i++){
  const chapter=chapters[i];
  if(i===0) chapter.displayLead=`${call}, 할매가 네 장부를 펴니 ${main}의 모습이 떠오르는구나. 무슨 일을 할 때 힘이 나는지부터 같이 돌아보자.`;
  if(s.dateBoundaryUncertain&&i<12){
   const groups=boundaryNatalGroups(i,f);
   chapter.groups=groups;
   chapter.lead=i===0?`일주 ${day} · ${main}`:groups.at(-1).title;
   chapter.bullets=i===0?[`출생 입력: ${s.birthDate}`,`양력 환산: ${s.solarDate}`]:[];
   chapter.quote='';
  }else{
   const details={title:'풀이에 쓴 사주 근거',paragraphs:chapter.paragraphs,detail:true};
   const readings=natalGroups(i,f,now);
   if(i<6){
    chapter.lead=leads[i];
    chapter.groups=[readings[0],details,...readings.slice(1)];
   }else if(i===13){
    chapter.displayLead=`${call}, 2027년에 어떤 선택을 살펴볼까?`;
    chapter.groups=[{title:'할매가 먼저 건네는 말',paragraphs:chapter.paragraphs.slice(0,1)},...readings,
     {...details,paragraphs:chapter.paragraphs.slice(1)}];
   }else{
    if(i>=6&&i<=11){
     const [definition,advice]=readings[0].paragraphs;
     readings[0]={title:'할매가 짚어 보는 이야기',paragraphs:[advice,definition],detailFrom:1};
    }
    if(i===12){
     const current=decades.find(cycle=>Date.parse(cycle.start)<=now&&now<Date.parse(cycle.end));
     if(current&&!s.dateBoundaryUncertain)chapter.displayLead=`지금 이어지는 일을 떠올려 보렴. 할매라면 ${roleLenses[current.tenGod][1]}부터 돌아보겠어.`;
    }
    chapter.groups=[...readings,details];
   }
  }
  chapter.paragraphs=chapter.groups.flatMap(g=>g.paragraphs);
  if(i===0)chapter.quote='';
 }
 const calculationNotes=[s.calculationBasis,...s.warnings,
  ...(s.dateBoundaryUncertain?['표의 연주·월주는 정오 참고값이란다. 본문 원국 해석은 확인된 일주만 쓰고, 월운도 일지와 견줘 읽어.']:[]),
  ...(s.isLeapMonth?[`입력한 음력 윤달 ${s.birthDate}를 양력 ${s.solarDate}로 환산해 명식을 계산했단다.`]:[]),
  ...(s.birthTime?.startsWith('23:')?['이 장부는 한국 시간 자정에 일주를 바꾸는 관례를 써. 밤 11시에 날을 바꾸는 관례로 보면 일주와 시주가 달라질 수 있단다.']:[]),'세운은 입춘, 월운은 월별 절입 시각에 바뀌어요. 2027년 소한 전은 2026년 자월에 속해요.',decades.length?f.luck.caveat:f.luck.unavailableReason].filter(Boolean);
 return {meta:{name,birthDate:s.birthDate,solarDate:s.solarDate,calendarType:s.calendarType,isLeapMonth:s.isLeapMonth,gender:s.gender||null,birthTime:s.birthTime||'미상',pillars:s.pillars,elementCounts:s.elements,calculationWarnings:s.warnings,calculationNotes,weekday:weekdays[new Date(s.solarDate+'T00:00:00Z').getUTCDay()]+'요일',edition:'할매의 운명방 · 2027 개인별 전통 명리 해석',chapterCount:chapters.length,verified:false},chapters:chapters.map((c,i)=>({...c,story:i<14?chapterStory(f,i,now,c):monthlyStory(f,i-14,c,monthlyRoleTheme(f.monthly[i-14].tenGod)),opening:chapterOpening(i),basis:i<12&&s.dateBoundaryUncertain?'일주의 전통 상징':i<6?'원국의 전통 상징':i<12?'원국·십성의 상징':i===12?(decades.length?'대운 근사 계산':'긴 시간의 전통 상징'):i===13?'2027 세운':'절기 기반 2027 월운'}))};
}
