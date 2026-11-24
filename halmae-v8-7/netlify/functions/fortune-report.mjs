import {monthlyGroups,natalGroups} from '../lib/premium-reading.mjs';
import {annualReflection,fortuneCycles} from './fortune-cycles.mjs';
const names={甲:'곧게 뻗는 큰 나무',乙:'바람을 타는 풀과 덩굴',丙:'먼 곳까지 비추는 태양',丁:'어둠 속을 밝히는 등불',戊:'흔들리지 않는 산',己:'생명을 기르는 밭',庚:'단단한 쇠',辛:'정교하게 빛나는 보석',壬:'넓게 흐르는 강과 바다',癸:'스며드는 이슬과 비'};
const ten={비견:'나와 비슷한 힘을 가진 동료와 자립',겁재:'경쟁과 나눔 사이의 긴장',식신:'꾸준한 생산과 표현',상관:'틀을 바꾸려는 표현과 문제 제기',편재:'움직이는 자원과 외부 기회',정재:'관리하는 재물과 책임',편관:'압박과 돌파의 과제',정관:'규칙과 공적인 역할',편인:'독특한 배움과 직관',정인:'보호와 축적된 배움'};
const elements={목:'성장과 시작',화:'표현과 확산',토:'중심과 조율',금:'선택과 정리',수:'관찰과 흐름'};
const seasons={寅:'봄이 문을 여는 때',卯:'봄기운이 왕성한 때',辰:'봄에서 여름으로 넘어가는 때',巳:'여름이 시작되는 때',午:'열기가 가장 강한 때',未:'여름이 무르익고 넘어가는 때',申:'가을이 시작되는 때',酉:'가을기운이 깊어지는 때',戌:'가을에서 겨울로 넘어가는 때',亥:'겨울이 시작되는 때',子:'차가운 기운이 깊은 때',丑:'겨울이 마무리되는 때'};
const section=(kicker,title,lead,paragraphs,bullets=[],quote='')=>({kicker,title,lead,paragraphs,bullets,quote});
const fmt=iso=>new Date(Date.parse(iso)+9*3600000).toISOString().slice(0,16).replace('T',' ');
const weekdays=[...'일월화수목금토'];
const luckText=(cycles,reason)=>{
 if(!cycles.length)return reason||'이 구간에 표시할 대운이 없어요.';
 return cycles.map(cycle=>`근사 대운 ${cycle.pillar}(${cycle.tenGod}) · 운의 두 지지는 ${cycle.relations.join('·')||'직접 합충형해 없음'}`).join(' / ');
};
const cautious='출생 시각을 모르는 절입일이라 이 구간의 개인별 풀이를 비워 두었단다. 정확한 시간을 다시 입력해 보렴.';
const transitText=items=>items.length?items.map(r=>r.position+'지 '+r.natal+'와 '+r.transit+'의 '+r.type).join(' · '):'직접적인 합충형해 없음';
export function buildFortuneReport(order,{now=Date.now()}={}){
 const f=fortuneCycles(order),s=f.saju,name=order.name||'손님';
 const [year,month,day,hour]=s.pillars;
 const e=Object.entries(s.elements).map(([key,value])=>key+' '+value+'개').join(' · ');
 const monthSeason=seasons[month[1]];
 const main=names[s.dayStem];
 const relations=f.relations.map(x=>x.a+'·'+x.b+'의 '+x.branches+' '+x.type);
 const relationText=relations.length?relations.join(', '):'이 방식에서 두 글자씩 대조한 합충형해가 없어요';
 const stemText=f.stemTenGods.map((x,i)=>x?['년','월','일','시'][i]+'간 '+x+'('+ten[x]+')':null).filter(Boolean).join(' / ');
 const base=`${name}, 네 일간은 ${s.dayStem}(${s.dayElement})이구나. 전통 명리에서는 ${main}에 빗대어 읽지. 월지 ${month[1]}는 ${monthSeason}의 자리야.`;
 const evidence=`원국은 ${[year,month,day,hour||'시주 미상'].join(' · ')}이고, 겉에 드러난 오행은 ${e}란다. 이 수치는 지장간의 세력이나 용신을 판정한 점수가 아니야.`;
 const noHour=!hour?'태어난 시간을 모르니 시주와 시간에 기대는 해석은 비워 두었단다.':'시주는 '+hour+'로 계산했단다.';
 const chapters=[
 section('第一章','네 사주 네 기둥',base,[evidence,`연주 ${year}는 바깥 환경, 월주 ${month}는 계절과 사회적 자리, 일주 ${day}는 자신과 가까운 관계, 시주 ${hour||'미상'}는 후반의 지향을 읽는 상징이란다.`,noHour],[`출생 입력: ${s.birthDate} · ${s.calendarType==='lunar'?(s.isLeapMonth?'음력 윤달':'음력 평달'):'양력'}`,`양력 환산: ${s.solarDate}`,`성별: ${s.gender==='male'?'남성':s.gender==='female'?'여성':'기록 없음'}`,...s.warnings],`“${name}, 이 네 기둥이 네 운명의 첫 문장이란다.”`),
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
  chapters.push(section('第'+['七','八','九','十','十一','十二'][i]+'章',title,found.length?`네 천간에 ${found.join('·')}이 보이는구나.`:`이 주제와 연결되는 ${a}·${b}의 상징을 살펴보자.`,[
   `${a}는 ${ten[a]}, ${b}는 ${ten[b]}의 뜻으로 읽힌단다.`,
   found.length?`네 사주의 겉천간에는 ${found.join('·')}이 나타나 있어 이 주제와 연결해 볼 수 있겠구나. 하지만 지장간까지 보지 않고 강약이나 성패를 단정할 수는 없어.`:`겉천간에서 ${a}·${b}의 이름은 확인되지 않으니 아래 지장간을 펴 보렴. 때마다 만나는 운의 글자가 다른 단서를 건네기도 한단다.`,
   hiddenFound.length?'지장간까지 살피면 '+hiddenFound.join(' · ')+'도 나타나는구나. 겉에 드러난 역할과 안에 담긴 역할은 구분해서 읽어야 한단다.':`이 원국에는 ${a}·${b}를 지장간에서도 확인할 수 없구나. 그 자리에서는 이 주제로 복의 유무를 판단하지 않아.`,
   caution
  ],[`일간: ${s.dayStem}`,`관련 십성: ${a}·${b}`]));
 }
 const decades=f.luck.decades;
 chapters.push(section('第十三章','열 해마다 바뀌는 대운',f.luck.unavailableReason||
  `${f.luck.direction} · 첫 대운 약 ${f.luck.startAgeYears.toFixed(1)}세`,[
  '전통 기준에서 양간 해의 남성·음간 해의 여성은 순행, 음간 해의 남성·양간 해의 여성은 역행으로 계산해.',
  f.luck.unavailableReason||`월주 ${month}에서 ${f.luck.direction}하고, 한국 시간 ${fmt(f.luck.boundary)} 절입까지의 간격을 3일당 1년으로 환산했단다.`,
  f.luck.caveat
 ],decades.map(d=>`약 ${d.startAge}세부터 ${d.pillar} · ${d.tenGod}`)));
 chapters.push(section('第十四章','2027년 정미년의 기운',
  s.dateBoundaryUncertain?'절입일 출생 시각 미상':`${f.annual.pillar} · ${f.annual.tenGod}`,[
  `한국 시간 ${fmt(f.annual.start)} 입춘부터 ${fmt(f.annual.end)} 직전까지 정미년으로 보아. 그해 입춘 전은 이전 해의 절기에 속해.`,
  ...(s.dateBoundaryUncertain?[cautious]:[
   annualReflection(s,f.annual),
   `${f.annual.tenGod}는 ${ten[f.annual.tenGod]}의 상징으로 읽어 보렴.`,
   `정미의 未와 네 원국을 대조하면 ${transitText(f.annual.relations)}이란다. ${luckText(f.annual.decades,f.luck.unavailableReason)}`,
   '일어날 일을 정해 놓은 이야기는 아니란다. 월운 장에서 달마다 어떤 글자와 만나는지 이어 읽어 보렴.'
  ]),
 ]));
 f.monthly.forEach((m,i)=>{
  const relation=m.dayBranchClash?'일지와 충하는 변화의 상징':m.dayBranchCombine?'일지와 육합하는 연결의 상징':'일지와 직접적인 충·육합이 없는 흐름';
  const shared=[
   `한국 시간 ${fmt(m.start)}부터 ${fmt(m.end)} 직전까지가 ${m.pillar}의 절기 구간이야. 달력의 첫날에 월운이 바뀌지는 않아.`,
   ...(i===0?['1월 소한 전은 앞서 시작된 2026년 자월에 속한단다.']:[]),
  ];
  if(s.dateBoundaryUncertain) {
   chapters.push(section('2027 · '+String(i+1).padStart(2,'0')+'월',`${i+1}월 · ${m.pillar}의 문`,'개인 해석 보류',[...shared,cautious]));
   return;
  }
  const groups=monthlyGroups(f,m,i,shared);
  chapters.push({...section('2027 · '+String(i+1).padStart(2,'0')+'월',`${i+1}월 · ${m.pillar}의 문`,`${m.tenGod} · ${relation}`,groups.flatMap(g=>g.paragraphs),
   [`월운 간지: ${m.pillar}`,`일간 기준 십성: ${m.tenGod}`,`절입: ${fmt(m.start)} 한국 시간`]),groups});
 });
 for(let i=0;i<14;i++){
  const chapter=chapters[i];
  const extra=natalGroups(i,f,now);
  chapter.groups=[{title:'장부에 적힌 근거',paragraphs:chapter.paragraphs},...extra];
  chapter.paragraphs=chapter.groups.flatMap(g=>g.paragraphs);
 }
 return {meta:{name,birthDate:s.birthDate,solarDate:s.solarDate,calendarType:s.calendarType,isLeapMonth:s.isLeapMonth,gender:s.gender||null,birthTime:s.birthTime||'미상',pillars:s.pillars,elementCounts:s.elements,calculationWarnings:s.warnings,weekday:weekdays[new Date(s.solarDate+'T00:00:00Z').getUTCDay()]+'요일',edition:'할매의 운명방 · 2027 개인별 전통 명리 해석',chapterCount:chapters.length,verified:false},chapters:chapters.map((c,i)=>({...c,basis:i<6?'원국의 전통 상징':i<12?'원국·십성의 상징':i===12?'대운 근사 계산':i===13?'2027 세운':'절기 기반 2027 월운'}))};
}
