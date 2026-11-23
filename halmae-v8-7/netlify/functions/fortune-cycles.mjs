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
export function branchRelations(pillars){
 const entries=pillars.map((p,i)=>p?{position:['년','월','일','시'][i],branch:p[1]}:null).filter(Boolean),out=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const a=entries[i],b=entries[j];
  if(opposite(clashes,a.branch,b.branch))out.push({type:'충',a:a.position,b:b.position,branches:a.branch+b.branch});
  if(opposite(combines,a.branch,b.branch))out.push({type:'육합',a:a.position,b:b.position,branches:a.branch+b.branch});
 }
 return out;
}
export function fortuneCycles(input){
 const saju=calculateSaju(input);
 const [y,m,d]=saju.birthDate.split('-').map(Number);
 const [hour,minute]=saju.birthTime?saju.birthTime.split(':').map(Number):[12,0];
 const born=Date.UTC(y,m-1,d,hour-9,minute);
 const yearStem=stems.indexOf(saju.pillars[0][0]);
 const forward=saju.gender==='male'?yearStem%2===0:saju.gender==='female'?yearStem%2!==0:null;
 const starts=[];
 for(let year=y-1;year<=y+2;year++)for(let k=0;k<12;k++){
  const idx=k===11?0:2*k+2;
  const t=term(k===11?year+1:year,idx);
  starts.push(t);
 }
 starts.sort((a,b)=>a-b);
 const boundary=forward===null?null:forward?starts.find(t=>t>born):starts.filter(t=>t<=born).at(-1);
 const monthIndex=pillarIndex(saju.pillars[1]);
 const startAgeYears=boundary===null||boundary===undefined?null:Math.abs(boundary-born)/86400000/3;
 const decadePillars=startAgeYears===null?[]:Array.from({length:8},(_,i)=>({
  order:i+1,startAge:Number((startAgeYears+i*10).toFixed(2)),
  pillar:sexagenary(monthIndex+(forward?i+1:-i-1))
 }));
 const yearPillar=sexagenary(mod(2027-1984,60));
 const monthly=Array.from({length:12},(_,i)=>{
  const start=term(2027,i*2);
  const end=i===11?term(2028,0):term(2027,(i+1)*2);
  const solarYear=i===0?2026:2027;
  const monthOrder=i===0?11:i-1;
  const monthStem=mod((mod(solarYear-1984,60)%10%5)*2+2+monthOrder,10);
  const pillar=stems[monthStem]+branches[mod(monthOrder+2,12)];
  return {month:i+1,start:new Date(start).toISOString(),end:new Date(end).toISOString(),
   pillar,tenGod:tenGod(saju.dayStem,pillar[0]),
   dayBranchClash:opposite(clashes,saju.dayBranch,pillar[1]),
   dayBranchCombine:opposite(combines,saju.dayBranch,pillar[1])};
 });
 return {saju,hiddenStems:saju.pillars.map(p=>p?hidden[p[1]]:null),
  stemTenGods:saju.pillars.map((p,i)=>p&&i!==2?tenGod(saju.dayStem,p[0]):null),
  relations:branchRelations(saju.pillars),
  luck:{direction:forward===null?'미상':forward?'순행':'역행',startAgeYears,decades:decadePillars,
   caveat:'절입 3일을 1년으로 환산한 근사 대운 기산이며, 절기 경계·태양시·자시 관례와 학파별 계산 차이가 있습니다.'},
  annual:{year:2027,pillar:yearPillar,tenGod:tenGod(saju.dayStem,yearPillar[0])},
  monthly,verified:false};
}
