import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSaju,normalizeBirth} from '../netlify/functions/saju.mjs';
for(const [date,expected] of [['1900-01-01','甲戌'],['1992-01-21','丙申'],['2000-01-01','戊午'],['2026-11-14','壬辰']]){
 test(`일주 기준 예시 ${date}`,()=>assert.equal(calculateSaju({birthDate:date}).pillars[2],expected));
}
test('양력 시각 미상은 시주 없음',()=>assert.equal(calculateSaju({birthDate:'1992-01-21'}).pillars[3],null));
test('양력 시각 입력은 시주 계산',()=>assert.equal(calculateSaju({birthDate:'1992-01-21',birthTime:'02:00'}).pillars[3],'己丑'));
test('유효하지 않은 양력 날짜 거절',()=>assert.throws(()=>normalizeBirth({birthDate:'2026-02-30'})));
test('음력 입력은 양력으로 변환',()=>assert.equal(normalizeBirth({birthDate:'2024-01-01',calendarType:'lunar'}).solarDate,'2024-02-10'));
for(const isLeapMonth of [true,'true',1,'1']){
 test(`양력 요청의 윤달 표시 거절 (${typeof isLeapMonth} ${isLeapMonth})`,()=>assert.throws(()=>normalizeBirth({birthDate:'2024-01-01',calendarType:'solar',isLeapMonth}),/윤달/));
}

test('2024 입춘 경계 전후 1분은 연주와 월주만 변경',()=>{
 const date='2024-02-04';
 const before=calculateSaju({birthDate:date,birthTime:'17:26'});
 const after=calculateSaju({birthDate:date,birthTime:'17:27'});
 assert.deepEqual(before.pillars.slice(0,2),['癸卯','乙丑']);
 assert.deepEqual(after.pillars.slice(0,2),['甲辰','丙寅']);
 assert.deepEqual(before.pillars.slice(2),after.pillars.slice(2));
 assert.ok(after.warnings.some(w=>w.includes('절기 경계')));
 const unknown=calculateSaju({birthDate:date});
 assert.equal(unknown.pillars[3],null);
 assert.deepEqual(unknown.pillars.slice(0,2),before.pillars.slice(0,2));
 assert.ok(unknown.warnings.some(w=>w.includes('시각 미상')));
});

test('23시에는 자시로 바뀌고 일주는 자정에 바뀐다',()=>{
 const at = (birthDate,birthTime)=>calculateSaju({birthDate,birthTime});
 const before = at('2000-01-01','22:59');
 const late = at('2000-01-01','23:00');
 const midnight = at('2000-01-02','00:00');
 assert.equal(before.pillars[2],'戊午');
 assert.equal(late.pillars[2],'戊午');
 assert.equal(late.pillars[3],'壬子');
 assert.equal(midnight.pillars[2],'己未');
 assert.ok(late.warnings.some(w=>w.includes('23시')));
});
