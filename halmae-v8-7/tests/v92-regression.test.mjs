import test from 'node:test';
import assert from 'node:assert/strict';
import {lunarToSolar,solarToLunar} from '../netlify/functions/lunar-conversion.mjs';
import {lunarMonthStarts} from '../netlify/functions/calendar-data.mjs';
import {calculateSaju} from '../netlify/functions/saju.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
const birth={birthDate:'1992-01-21',birthTime:'02:00',gender:'male',name:'검증'};
test('2023 윤2월은 평2월과 다르다',()=>{
 assert.equal(lunarToSolar({birthDate:'2023-02-01'}).solarDate,'2023-02-20');
 assert.equal(lunarToSolar({birthDate:'2023-02-01',isLeapMonth:true}).solarDate,'2023-03-22');
});
test('없는 윤달·음력 31일은 거부',()=>{
 assert.throws(()=>lunarToSolar({birthDate:'2023-03-01',isLeapMonth:true}));
 assert.throws(()=>lunarToSolar({birthDate:'2023-02-31'}));
});
test('달력 표 전체의 월초·월말 왕복 변환',()=>{
 for(let i=0;i<lunarMonthStarts.length-1;i++){
  const [y,m,leap,start]=lunarMonthStarts[i],days=lunarMonthStarts[i+1][3]-start;
  assert.ok(days===29||days===30,`${y}-${m} 월 길이 ${days}`);
  for(const day of [1,days]){
   const lunarDate=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
   const solar=lunarToSolar({birthDate:lunarDate,isLeapMonth:!!leap});
   assert.deepEqual(solarToLunar(solar.solarDate),{lunarDate,isLeapMonth:!!leap});
  }
 }
});
test('양력·음력 동일 실제 출생일은 동일한 사주',()=>{
 const solar=calculateSaju({birthDate:'2023-03-22',gender:'female'});
 const lunar=calculateSaju({birthDate:'2023-02-01',calendarType:'lunar',isLeapMonth:true,gender:'female'});
 assert.deepEqual(lunar.pillars,solar.pillars);
});
test('2027 정미 세운과 월운 12개',()=>{
 const x=fortuneCycles(birth);
 assert.equal(x.annual.pillar,'丁未');
 assert.equal(x.monthly.length,12);
 assert.equal(x.monthly[0].pillar,'辛丑');
 assert.equal(x.monthly[1].pillar,'壬寅');
 assert.equal(x.monthly[11].pillar,'壬子');
 for(let i=0;i<12;i++){
  assert.ok(new Date(x.monthly[i].start)<new Date(x.monthly[i].end));
  if(i)assert.equal(x.monthly[i-1].end,x.monthly[i].start);
 }
});
test('26장, 고객별 사주 반영, 출생시간 미상',()=>{
 const r=buildFortuneReport(birth);
 assert.equal(r.chapters.length,26);
 assert.ok(r.chapters.some(x=>x.paragraphs.some(p=>p.includes('丙申'))));
 const noHour=buildFortuneReport({...birth,birthTime:''});
 assert.equal(noHour.chapters.length,26);
 assert.equal(noHour.meta.pillars[3],null);
 assert.equal(noHour.meta.verified,false);
});
test('성별 대운 순행 역행',()=>{
 assert.equal(fortuneCycles({...birth,gender:'male'}).luck.direction,'역행');
 assert.equal(fortuneCycles({...birth,gender:'female'}).luck.direction,'순행');
});
