import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSaju,normalizeBirth} from '../netlify/functions/saju.mjs';
for(const [date,expected] of [['1900-01-01','甲戌'],['1992-01-21','丙申'],['2000-01-01','戊午'],['2026-11-14','壬辰']]){
 test(`일주 기준 예시 ${date}`,()=>assert.equal(calculateSaju({birthDate:date}).pillars[2],expected));
}
test('양력 시각 미상은 시주 없음',()=>assert.equal(calculateSaju({birthDate:'1992-01-21'}).pillars[3],null));
test('양력 시각 입력은 시주 계산',()=>assert.equal(calculateSaju({birthDate:'1992-01-21',birthTime:'02:00'}).pillars[3],'己丑'));
test('유효하지 않은 양력 날짜 거절',()=>assert.throws(()=>normalizeBirth({birthDate:'2026-02-30'})));
test('유효한 날짜라도 음력 입력 거절',()=>assert.throws(()=>normalizeBirth({birthDate:'2024-01-01',calendarType:'lunar'}),/양력 생년월일만/));
for(const isLeapMonth of [true,'true',1,'1']){
 test(`양력 요청의 윤달 표시 거절 (${typeof isLeapMonth} ${isLeapMonth})`,()=>assert.throws(()=>normalizeBirth({birthDate:'2024-01-01',calendarType:'solar',isLeapMonth}),/양력 생년월일만/));
}
