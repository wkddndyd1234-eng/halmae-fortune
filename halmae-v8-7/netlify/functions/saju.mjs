import {preciseTermMinutes} from './calendar-data.mjs';
import {lunarToSolar} from './lunar-conversion.mjs';
const stems=[...'甲乙丙丁戊己庚辛壬癸'];
const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
const elements=['목','목','화','화','토','토','금','금','수','수'];
const branchElements=['수','토','목','목','토','화','화','토','금','금','토','수'];
export function pillarElements(pillar){
 return pillar ? [elements[stems.indexOf(pillar[0])],branchElements[branches.indexOf(pillar[1])]] : null;
}
const mod=(n,m)=>(n%m+m)%m;
function validGregorian(y,m,d){const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d}
export function normalizeBirth(input){
 const date=String(input.birthDate||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('생년월일 형식이 올바르지 않습니다.');
 const [y,m,d]=date.split('-').map(Number);
 const calendarType=input.calendarType ?? 'solar';
 const isLeapMonth=input.isLeapMonth ?? false;
 if(!['solar','lunar'].includes(calendarType))throw Error('양력 또는 음력을 선택해 주세요.');
 if(![true,false,'true','false'].includes(isLeapMonth))throw Error('윤달 선택을 확인해 주세요.');
 if(calendarType==='solar'&&(isLeapMonth===true||isLeapMonth==='true'))throw Error('양력에는 윤달을 선택할 수 없어요.');
 if(y<1900||y>2050)throw Error('생년월일 지원 연도를 확인해 주세요.');
 if(!validGregorian(y,m,d))throw Error('존재하지 않는 양력 날짜입니다.');
 if(calendarType==='solar'&&date>new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10))throw Error('미래 생년월일은 입력할 수 없습니다.');
 const gender=input.gender??'';if(gender!==''&&!['male','female'].includes(gender))throw Error('성별을 확인해 주세요.');
 const time=String(input.birthTime||'');if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('출생 시각 형식이 올바르지 않습니다.');
 const leap=isLeapMonth===true||isLeapMonth==='true';
 const solarDate=calendarType==='lunar'?lunarToSolar({birthDate:date,isLeapMonth:leap}).solarDate:date;
 if(solarDate>new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10))throw Error('미래 생년월일은 입력할 수 없습니다.');
 return {birthDate:date,calendarType,isLeapMonth:calendarType==='lunar'&&leap,solarDate,birthTime:time,gender};
}
const term=(year,index)=>{const row=preciseTermMinutes[year-1899];if(!row||index<0||index>23)throw Error('절기 계산 범위를 벗어났습니다.');return row[index]*60000};
export function calculateSaju(input){
 const birth=normalizeBirth(input),[y,m,d]=birth.solarDate.split('-').map(Number);
 const hourKnown=Boolean(birth.birthTime),hour=hourKnown?Number(birth.birthTime.slice(0,2)):12,minute=hourKnown?Number(birth.birthTime.slice(3)):0;
 const utc=Date.UTC(y,m-1,d,hour-9,minute),yearIndex=mod((utc<term(y,2)?y-1:y)-1984,60);
 const ordinal=Math.round((Date.UTC(y,m-1,d)-Date.UTC(2000,0,1))/86400000),dayIndex=mod(54+ordinal,60);
 let termYear=y,monthOrder=0,latest=-Infinity;
 for(let cycle=y-2;cycle<=y;cycle++)for(let k=0;k<12;k++){
  const idx=(k*2+2)%24,astronomicalYear=idx===0?cycle+1:cycle;
  if(astronomicalYear<1899||astronomicalYear>=1899+preciseTermMinutes.length)continue;
  const instant=term(astronomicalYear,idx);
  if(instant<=utc&&instant>latest){latest=instant;termYear=cycle;monthOrder=k;}
 }
 const monthBranch=mod(monthOrder+2,12),monthStem=mod((mod(termYear-1984,60)%10%5)*2+2+monthOrder,10);
 const hourBranch=mod(Math.floor((hour+1)/2),12),hourStem=mod((dayIndex%10%5)*2+hourBranch,10);
 const indices=[[yearIndex%10,yearIndex%12],[monthStem,monthBranch],[dayIndex%10,dayIndex%12],hourKnown?[hourStem,hourBranch]:null];
 const pillars=indices.map(pair=>pair?stems[pair[0]]+branches[pair[1]]:null);
 const counts={목:0,화:0,토:0,금:0,수:0};for(const pair of indices)if(pair){counts[elements[pair[0]]]++;counts[branchElements[pair[1]]]++}
 const nearTerm=[y-1,y,y+1].filter(yr=>yr>=1899&&yr<1899+preciseTermMinutes.length).some(yr=>preciseTermMinutes[yr-1899].some(v=>Math.abs(utc-v*60000)<48*3600000));
 const warnings=[];if(!hourKnown)warnings.push('출생 시각 미상: 시주 미계산');if(nearTerm)warnings.push('절기 경계 48시간 이내: 독립 대조 필요');if(hourKnown&&hour===23)warnings.push('23시 자시 일주 교체 관례에 따라 결과 차이 가능');
 return {...birth,pillars,dayStem:stems[dayIndex%10],dayElement:elements[dayIndex%10],dayBranch:branches[dayIndex%12],elements:counts,warnings,calculationBasis:'KST 고정 · 내장 절기표 · 자정 일주 교체 · 출생지 태양시 보정 없음',verified:false};
}
