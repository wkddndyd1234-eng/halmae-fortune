import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSaju,normalizeBirth} from '../netlify/functions/saju.mjs';
import {lunarToSolar,solarToLunar} from '../netlify/functions/lunar-conversion.mjs';
import {fortuneCycles,tenGod,pairRelations} from '../netlify/functions/fortune-cycles.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
const base={name:'테스트',birthDate:'1992-01-21',birthTime:'01:30',gender:'male'};
test('known lunar new year dates',()=>{
 for(const [lunar,solar] of [['2024-01-01','2024-02-10'],['2023-01-01','2023-01-22'],['2025-01-01','2025-01-29']]){
 assert.equal(lunarToSolar({birthDate:lunar}).solarDate,solar);
 assert.equal(solarToLunar(solar).lunarDate,lunar);
 }
});
test('leap month and invalid date',()=>{
 assert.equal(lunarToSolar({birthDate:'2023-02-01',isLeapMonth:true}).solarDate,'2023-03-22');
 assert.throws(()=>normalizeBirth({...base,birthDate:'2024-02-01',calendarType:'lunar',isLeapMonth:true}));
 assert.throws(()=>normalizeBirth({...base,birthDate:'2024-02-30'}));
});
test('solar lunar same chart',()=>{
 const l=solarToLunar(base.birthDate);
 assert.deepEqual(calculateSaju(base).pillars,calculateSaju({...base,birthDate:l.lunarDate,calendarType:'lunar',isLeapMonth:l.isLeapMonth}).pillars);
});
test('reference chart regression',()=>assert.deepEqual(calculateSaju(base).pillars,['辛未','辛丑','丙申','己丑']));
test('unknown hour and gender direction',()=>{
 assert.equal(calculateSaju({...base,birthTime:''}).pillars[3],null);
 assert.equal(fortuneCycles(base).luck.direction,'역행');
 assert.equal(fortuneCycles({...base,gender:'female'}).luck.direction,'순행');
 assert.equal(fortuneCycles({...base,gender:''}).luck.direction,'미상');
});
test('ten gods and branch relations',()=>{
 assert.equal(tenGod('丙','丁'),'겁재');
 assert.equal(tenGod('丙','庚'),'편재');
 assert.ok(pairRelations('子','午').includes('충'));
 assert.ok(pairRelations('子','未').includes('해'));
});
test('2027 monthly sequence',()=>{
 const f=fortuneCycles(base);
 assert.equal(f.annual.pillar,'丁未');
 assert.deepEqual(f.monthly.map(x=>x.pillar),['辛丑','壬寅','癸卯','甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子']);
 for(let i=1;i<12;i++)assert.equal(f.monthly[i-1].end,f.monthly[i].start);
});
test('26 chapters across representative inputs',()=>{
 for(const birthDate of ['1900-01-01','1988-08-08','1992-01-21','2000-02-29','2024-02-10']){
 for(const gender of ['male','female',''])for(const birthTime of ['','00:00','12:00','23:59']){
 const r=buildFortuneReport({...base,birthDate,gender,birthTime});
 assert.equal(r.chapters.length,26);
 assert.ok(r.chapters.every(c=>c.title&&c.paragraphs.length&& !JSON.stringify(c).includes('undefined')));
 }
 }
});

test('2027 절입 13개는 별도 천문 계산과 60초 이내',()=>{
 // astronomy-engine 2.1.19 SearchSunLongitude, 285°부터 30°씩 증가.
 const reference=['2027-01-05T14:10:07Z','2027-02-04T01:46:24Z','2027-03-05T19:39:28Z',
  '2027-04-05T00:17:09Z','2027-05-05T17:24:38Z','2027-06-05T21:25:22Z','2027-07-07T07:36:49Z',
  '2027-08-07T17:26:25Z','2027-09-07T20:28:02Z','2027-10-08T12:16:48Z','2027-11-07T15:38:35Z',
  '2027-12-07T08:37:51Z','2028-01-05T19:54:45Z'];
 const {monthly,annual}=fortuneCycles(base);
 assert.equal(annual.start,monthly[1].start);
 const boundaries=[...monthly.map(month=>month.start),monthly.at(-1).end];
 boundaries.forEach((time,i)=>assert.ok(Math.abs(Date.parse(time)-Date.parse(reference[i]))<=60_000));
});

test('대운 기산은 비교한 절입과 부합하고 누락된 시각은 임의로 채우지 않는다',()=>{
 const f=fortuneCycles(base);
 const reference=Date.parse('1992-01-06T02:08:39.726Z');
 const born=Date.parse('1992-01-20T16:30:00Z');
 assert.ok(Math.abs(f.luck.startAgeYears-(born-reference)/86_400_000/3)<1/4320);
 assert.equal(f.luck.decades[0].pillar,'庚子');
 assert.ok(f.monthly.some(month=>month.decades.length));
 assert.equal(fortuneCycles({...base,birthTime:''}).luck.startAgeYears,null);
 assert.ok(fortuneCycles({...base,birthTime:''}).monthly.every(month=>month.decades.length===0));
 assert.equal(fortuneCycles({birthDate:'2024-02-04',birthTime:'17:27',gender:'male'}).luck.startAgeYears,0);
});

test('정규화되지 않는 양력은 음력으로 조용히 넘어가지 않는다',()=>{
 assert.throws(()=>solarToLunar('2024-02-30'));
 assert.throws(()=>solarToLunar('2024-2-09'));
 assert.throws(()=>lunarToSolar({birthDate:'2023-02-01',isLeapMonth:'false'}));
});
