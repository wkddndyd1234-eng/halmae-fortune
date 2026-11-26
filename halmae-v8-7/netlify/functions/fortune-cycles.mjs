// v9.2 draft: traditional symbolic cycle calculations; independent almanac comparison pending.
import {preciseTermMinutes} from './calendar-data.mjs';
import {calculateSaju} from './saju.mjs';
const stems=[...'甲乙丙丁戊己庚辛壬癸'];
const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
const mod=(n,m)=>(n%m+m)%m;
const term=(year,index)=>{
 const row=preciseTermMinutes[year-1899];
 if(!row||row[index]===undefined)throw Error('절기표 범위를 벗어났어요.');
 return row[index]*60000;
};
const sexagenary=(n)=>stems[mod(n,10)]+branches[mod(n,12)];
const pillarIndex=p=>Array.from({length:60},(_,i)=>i).find(i=>sexagenary(i)===p);
const elementIndex=i=>Math.floor(mod(i,10)/2);
const generating=[1,2,3,4,0];
const dayMs=86_400_000;
const meanYearMs=365.2425*dayMs;
const monthBranches='寅卯辰巳午未申酉戌亥子丑';
const seasons=['봄','여름','가을','겨울'];
const chiefElements=['목','화','금','수'];

export function seasonalContext(branch){
 const index=monthBranches.indexOf(branch);
 const seasonIndex=Math.floor(index/3);
 return {season:seasons[seasonIndex],chiefElement:chiefElements[seasonIndex],transition:index%3===2};
}
export function tenGod(dayStem,otherStem){
 const a=stems.indexOf(dayStem),b=stems.indexOf(otherStem);
 if(a<0||b<0)return null;
 const x=elementIndex(a),y=elementIndex(b),samePolarity=a%2===b%2;
 if(x===y)return samePolarity?'비견':'겁재';
 if(generating[x]===y)return samePolarity?'식신':'상관';
 if(generating[y]===x)return samePolarity?'편인':'정인';
 if((x+2)%5===y)return samePolarity?'편재':'정재';
 return samePolarity?'편관':'정관';
}
// The conventional hidden-stem sets vary by school; this uses a common Korean arrangement.
const hidden={
 子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙戊庚',午:'丁己',
 未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'
};
const clashes={子:'午',丑:'未',寅:'申',卯:'酉',辰:'戌',巳:'亥'};
const combines={子:'丑',寅:'亥',卯:'戌',辰:'酉',巳:'申',午:'未'};
const opposite=(map,a,b)=>map[a]===b||map[b]===a;
const harms={子:'未',丑:'午',寅:'巳',卯:'辰',申:'亥',酉:'戌'};
const punishments=['子卯','寅巳','巳申','申寅','丑戌','戌未','未丑'];
export function pairRelations(a,b){return [opposite(clashes,a,b)?'충':null,opposite(combines,a,b)?'육합':null,opposite(harms,a,b)?'해':null,punishments.some(p=>p===a+b||p===b+a)||(a===b&&'辰午酉亥'.includes(a))?'형':null].filter(Boolean);}
const transitRelations=(pillars,p)=>pillars.flatMap((n,i)=>n?pairRelations(n[1],p[1]).map(type=>({position:['년','월','일','시'][i],natal:n[1],transit:p[1],type})):[]);
export function branchRelations(pillars){
 const entries=pillars.map((p,i)=>p?{position:['년','월','일','시'][i],branch:p[1]}:null).filter(Boolean),out=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const a=entries[i],b=entries[j];
  for(const type of pairRelations(a.branch,b.branch))out.push({type,a:a.position,b:b.position,branches:a.branch+b.branch});
 }
 return out;
}
export function fortuneCycles(input){
 return cyclesForSaju(calculateSaju(input));
}

export function annualReflection(saju,annual){
 const meeting=annual.relations.find(item=>item.position==='일')??(saju.dateBoundaryUncertain?null:annual.relations[0]);
 const openings={
  비견:'함께하자는 제안이 오면 네가 혼자 정할 일과 같이 결정할 일을 먼저 나눠 보렴.',
  겁재:'사람과 돈을 함께 쓰는 일이라면 친하다는 말보다 각자 맡을 몫을 적어 두는 쪽이 마음 편하단다.',
  식신:'한 번 반짝이는 성과보다 다음 달에도 이어갈 수 있는 작업 하나에 눈을 줘 보렴.',
  상관:'오래 답답했던 규칙이 있니? 불만을 삼키기 전에 바꿔 볼 방법 하나를 보여 주렴.',
  편재:'새로운 돈벌이 제안이 눈에 들어오면, 얼마를 벌지보다 누가 언제 돈을 주고 네가 먼저 낼 비용이 뭔지 살펴보렴.',
  정재:'금액이 커 보이는 일보다 제때 받는 돈과 매달 나가는 돈을 나란히 적어 보렴.',
  편관:'급한 부탁을 받으면 바로 떠맡기 전에 기한과 도움받을 사람부터 정해 보렴.',
  정관:'역할이 커지는 일 앞에서는 직함보다 네가 결정할 수 있는 범위를 먼저 물어보렴.',
  편인:'평소와 다른 배움을 권하는 사람이 있다면, 지금 하는 일에 작은 시험으로 써 보렴.',
  정인:'혼자 끌어안던 일이 있다면 한 번 해 본 사람에게 네가 막히는 곳을 구체적으로 물어보렴.',
 };
 const subjects={년:'오래 이어 온 모임이나 가족과의 약속',월:'일터에서 맡은 몫이나 함께 정한 기한',일:'가까운 사람과 나눈 약속',시:'나중을 위해 오래 품어 온 계획'};
 const questions={
  충:'계획이 어긋날 때 그대로 지킬 것과 바꿀 수 있는 것을 미리 가려 두렴.',
  형:'같은 문제로 자꾸 마음이 쓰인다면 누구 잘못인지 따지기 전에 반복되는 상황을 적어 보렴.',
  해:'큰 문제는 없어 보여도 서운했던 대목이 있다면 상대가 어떻게 이해했는지 물어보렴.',
  육합:'손발이 맞는 사람과는 일이 잘 풀릴 때일수록 서로 맡은 몫을 말로 확인해 두렴.',
 };
 const question=meeting?
  subjects[meeting.position]+'부터 떠올려 봐. '+(questions[meeting.type]??'이미 지킬 수 있는 것과 다시 상의할 것을 가려 두렴.'):
  '하던 일에서 더 키우고 싶은 몫과 잠시 덜어 낼 몫을 골라 보렴. 둘을 한꺼번에 해내려 애쓰지 않아도 된단다.';
 return '2027년의 장을 펴니, 할매는 네게 이 말부터 건네고 싶구나. '+openings[annual.tenGod]+' '+question;
}

export function cyclesForSaju(saju){
 const [y,m,d]=saju.solarDate.split('-').map(Number);
 const [hour,minute]=saju.birthTime?saju.birthTime.split(':').map(Number):[12,0];
 const born=Date.UTC(y,m-1,d,hour-9,minute);
 const yearStem=stems.indexOf(saju.pillars[0][0]);
 const forward=saju.gender==='male'?yearStem%2===0:saju.gender==='female'?yearStem%2!==0:null;
 const starts=[];
 for(let year=y-1;year<=y+1;year++)for(let k=0;k<12;k++){
  const idx=k===11?0:2*k+2;
  const actualYear=k===11?year+1:year;
  if(actualYear<1899||actualYear>=1899+preciseTermMinutes.length)continue;
  const t=term(actualYear,idx);
  starts.push(t);
 }
 starts.sort((a,b)=>a-b);
 const boundary=forward===null||!saju.birthTime?null:forward?starts.find(t=>t>=born):starts.filter(t=>t<=born).at(-1);
 const monthIndex=pillarIndex(saju.pillars[1]);
 const startAgeYears=boundary==null?null:Math.abs(boundary-born)/dayMs/3;
 const decadePillars=startAgeYears===null?[]:Array.from({length:12},(_,i)=>{
  const age=startAgeYears+i*10;
  const pillar=sexagenary(monthIndex+(forward?i+1:-i-1));
  return {order:i+1,startAge:Number(age.toFixed(2)),pillar,tenGod:tenGod(saju.dayStem,pillar[0]),
   start:new Date(born+Math.round(age*meanYearMs)).toISOString(),
   end:new Date(born+Math.round((age+10)*meanYearMs)).toISOString()};
 });
 const relevantLuck=(start,end,transit)=>decadePillars
  .filter(cycle=>Date.parse(cycle.start)<end&&Date.parse(cycle.end)>start)
  .map(cycle=>({...cycle,relations:pairRelations(cycle.pillar[1],transit[1])}));
 const yearPillar=sexagenary(mod(2027-1984,60));
 const monthly=Array.from({length:12},(_,i)=>{
  const start=term(2027,i*2);
  const end=i===11?term(2028,0):term(2027,(i+1)*2);
  const solarYear=i===0?2026:2027;
  const monthOrder=i===0?11:i-1;
  const monthStem=mod((mod(solarYear-1984,60)%10%5)*2+2+monthOrder,10);
  const pillar=stems[monthStem]+branches[mod(monthOrder+2,12)];
  return {month:i+1,start:new Date(start).toISOString(),end:new Date(end).toISOString(),
   pillar,tenGod:tenGod(saju.dayStem,pillar[0]),relations:transitRelations(saju.pillars,pillar),decades:relevantLuck(start,end,pillar),
   dayBranchClash:opposite(clashes,saju.dayBranch,pillar[1]),
   dayBranchCombine:opposite(combines,saju.dayBranch,pillar[1])};
 });
 return {saju,hiddenStems:saju.pillars.map(p=>p?hidden[p[1]]:null),
  hiddenTenGods:saju.pillars.map(p=>p?[...hidden[p[1]]].map(stem=>({stem,tenGod:tenGod(saju.dayStem,stem)})):[]),
  stemTenGods:saju.pillars.map((p,i)=>p&&i!==2?tenGod(saju.dayStem,p[0]):null),
  relations:branchRelations(saju.pillars),season:seasonalContext(saju.pillars[1][1]),
  luck:{direction:forward===null||saju.dateBoundaryUncertain?'미상':forward?'순행':'역행',startAgeYears,boundary:boundary==null?null:new Date(boundary).toISOString(),decades:decadePillars,
   unavailableReason:startAgeYears===null?(!saju.gender?'성별 기록이 없어요.':!saju.birthTime?'출생 시각이 없어 절입까지의 간격을 정할 수 없어요.':'필요한 절기표 자료가 없어요.'):null,
   caveat:'절입 3일을 1년으로 환산한 근사 대운 기산이며, 절기 경계·태양시·자시 관례와 학파별 계산 차이가 있습니다.'},
  annual:{year:2027,pillar:yearPillar,tenGod:tenGod(saju.dayStem,yearPillar[0]),relations:transitRelations(saju.pillars,yearPillar),start:new Date(term(2027,2)).toISOString(),end:new Date(term(2028,2)).toISOString(),decades:relevantLuck(term(2027,2),term(2028,2),yearPillar)},
  monthly,verified:false};
}
