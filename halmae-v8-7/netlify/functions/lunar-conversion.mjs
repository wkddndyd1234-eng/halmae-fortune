import {lunarMonthStarts} from './calendar-data.mjs';

const dayMs=86_400_000;
const format=n=>String(n).padStart(2,'0');
const monthIndex=new Map(lunarMonthStarts.map(([year,month,leap],index)=>[`${year}-${format(month)}-${Boolean(leap)}`,index]));

function lunarMonth(yearMonth,isLeapMonth) {
 if (typeof isLeapMonth!=='boolean') throw Error('윤달 선택을 확인해 주세요.');
 const index=monthIndex.get(`${yearMonth}-${isLeapMonth}`);
 if(index===undefined) throw Error('선택한 음력 월 또는 윤달이 달력에 없어요.');
 if(index+1===lunarMonthStarts.length) throw Error('음력 변환 가능한 날짜 범위를 벗어났어요.');
 const start=lunarMonthStarts[index][3];
 return {start,length:lunarMonthStarts[index+1][3]-start};
}

export function lunarMonthLength(year,month,isLeapMonth=false){
 return lunarMonth(`${year}-${format(month)}`,isLeapMonth).length;
}

export function lunarToSolar({birthDate,isLeapMonth=false}) {
 const match=/^(\d{4}-\d{2})-(\d{2})$/.exec(String(birthDate||''));
 if(!match) throw Error('음력 날짜를 확인해 주세요.');
 const [,month,day]=match;
 const {start,length}=lunarMonth(month,isLeapMonth);
 if(Number(day)<1||Number(day)>length) throw Error('해당 음력 월에는 선택한 날짜가 없어요.');
 return {solarDate:new Date((start+Number(day)-1)*dayMs).toISOString().slice(0,10),
  lunarDate:birthDate,isLeapMonth,lunarMonthDays:length};
}

export function solarToLunar(birthDate) {
 if(typeof birthDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw Error('양력 날짜를 확인해 주세요.');
 const date=new Date(birthDate+'T00:00:00Z');
 if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==birthDate) throw Error('존재하지 않는 양력 날짜예요.');
 const ordinal=+date/dayMs;
 const i=lunarMonthStarts.findIndex((row,index)=>ordinal>=row[3]&&index+1<lunarMonthStarts.length&&ordinal<lunarMonthStarts[index+1][3]);
 if(i<0) throw Error('음력 변환 가능한 날짜 범위를 벗어났어요.');
 const [year,month,leap,start]=lunarMonthStarts[i];
 return {lunarDate:`${year}-${format(month)}-${format(ordinal-start+1)}`,isLeapMonth:Boolean(leap)};
}
