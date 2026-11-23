import {lunarMonthStarts} from './calendar-data.mjs';
const MS=86400000;
const ordinal=(y,m,d)=>Math.floor(Date.UTC(y,m-1,d)/MS);
const fmt=n=>String(n).padStart(2,'0');
const monthRows=lunarMonthStarts.map(([year,month,leap,start])=>({year,month,leap:Boolean(leap),start}));
export function lunarToSolar({birthDate,isLeapMonth=false}){
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthDate||''));
 if(!match)throw Error('음력 날짜를 확인해 주세요.');
 const [,ys,ms,ds]=match,[y,m,d]=[Number(ys),Number(ms),Number(ds)];
 const index=monthRows.findIndex(row=>row.year===y&&row.month===m&&row.leap===Boolean(isLeapMonth));
 if(index<0)throw Error('선택한 음력 월 또는 윤달이 달력에 없어요.');
 const row=monthRows[index],next=monthRows[index+1];
 if(!next)throw Error('음력 변환 가능한 날짜 범위를 벗어났어요.');
 const length=next.start-row.start;
 if(d<1||d>length)throw Error('해당 음력 월에는 선택한 날짜가 없어요.');
 const date=new Date((row.start+d-1)*MS);
 return {solarDate:`${date.getUTCFullYear()}-${fmt(date.getUTCMonth()+1)}-${fmt(date.getUTCDate())}`,
  lunarDate:birthDate,isLeapMonth:Boolean(isLeapMonth),lunarMonthDays:length};
}
export function solarToLunar(birthDate){
 const [y,m,d]=String(birthDate).split('-').map(Number),o=ordinal(y,m,d);
 const i=monthRows.findIndex((row,index)=>o>=row.start&&index+1<monthRows.length&&o<monthRows[index+1].start);
 if(i<0)throw Error('음력 변환 가능한 날짜 범위를 벗어났어요.');
 const row=monthRows[i];return {lunarDate:`${row.year}-${fmt(row.month)}-${fmt(o-row.start+1)}`,isLeapMonth:row.leap};
}
