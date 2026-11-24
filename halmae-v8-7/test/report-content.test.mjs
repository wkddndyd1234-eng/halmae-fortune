import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport} from '../netlify/functions/report.mjs';

test('26장 보고서에 원국·삶의 여섯 주제·대운·세운·월운을 표시',()=>{
 const birth={name:'가상',birthDate:'2000-01-01',birthTime:'12:00',gender:'female'};
 const january=buildReport(birth);
 const nextDay=buildReport({...birth,birthDate:'2000-01-02'});
 assert.deepEqual(january.meta.pillars,['己卯','丙子','戊午','戊午']);
 assert.equal(january.meta.chapterCount,26);
 assert.equal(new Set(january.chapters.map(ch=>ch.title)).size,26);
 assert.ok(january.chapters.every(ch=>ch.paragraphs.length>=2 && ch.basis));
 assert.match(january.chapters[2].paragraphs.join(' '),/월령/);
 assert.match(january.chapters[3].paragraphs.join(' '),/겁재/);
 assert.notDeepEqual(january.chapters[6],nextDay.chapters[6]);
 assert.match(january.chapters[12].lead,/순행|역행/);
 assert.match(january.chapters[13].lead,/丁未/);
 const months=january.chapters.slice(14);
 assert.deepEqual(months.map(ch=>ch.title.split(' · ')[0]),Array.from({length:12},(_,i)=>i+1+'월'));
 assert.ok(months.every(ch=>ch.paragraphs.some(p=>p.includes('재물')) && ch.paragraphs.some(p=>p.includes('애정'))));
 assert.notDeepEqual(months,nextDay.chapters.slice(14));
 assert.doesNotMatch(JSON.stringify(january),/undefined|태도을|고르기을/);
});

test('성별과 시각이 없는 기존 주문은 열리며 대운 기산은 보류한다',()=>{
 const book=buildReport({name:'가상',birthDate:'2000-07-01'});
 assert.equal(book.meta.pillars.at(-1),null);
 assert.equal(book.meta.chapterCount,26);
 assert.match(book.meta.calculationNotes.join(' '),/성별/);
 assert.equal(book.chapters[12].bullets.length,0);
 const boundary=buildReport({name:'가상',birthDate:'2024-02-04',gender:'female'});
 assert.equal(boundary.chapters[14].groups.length,6);
 assert.match(boundary.meta.calculationNotes.join(' '),/정오 기준 참고값/);
});
