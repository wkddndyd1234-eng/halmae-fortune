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
