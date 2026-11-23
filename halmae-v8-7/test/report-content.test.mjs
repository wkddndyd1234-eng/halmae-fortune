import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport} from '../netlify/functions/report.mjs';

test('26장 보고서는 계산 기록, 계산 연결, 공통 가이드를 표시', () => {
  const january = buildReport({name:'가상',birthDate:'2000-01-01',birthTime:'12:00'});
  const sameMonth = buildReport({name:'가상',birthDate:'2000-01-02',birthTime:'12:00'});
  const summer = buildReport({name:'가상',birthDate:'2000-07-01'});
  assert.deepEqual(january.meta.pillars,['己卯','丙子','戊午','戊午']);
  assert.equal(summer.meta.pillars.at(-1),null);
  assert.equal(Object.values(summer.meta.elementCounts).reduce((a,b)=>a+b,0),6);
  assert.equal(january.meta.chapterCount,26);
  assert.equal(new Set(january.chapters.map(ch=>ch.title)).size,26);
  assert.ok(january.chapters.every(ch=>ch.paragraphs.length>=2 && ch.bullets.length>=3));
  assert.deepEqual(january.chapters.reduce((counts,ch)=>{
    counts[ch.basis]=(counts[ch.basis]||0)+1;
    return counts;
  },{}),{'계산·출생 기록':4,'계산 연결 성찰 질문':8,'공통 성찰 가이드':14});
  assert.notDeepEqual(january.chapters[2],sameMonth.chapters[2]);
  assert.match(january.chapters[2].paragraphs.join(' '),/연간 己 · 겁재/);
  assert.notDeepEqual(january.meta.elementCounts,sameMonth.meta.elementCounts);
  for(const index of [4,5,6,7,8,9,10,11]){
    assert.notEqual(january.chapters[index].paragraphs.at(-1),sameMonth.chapters[index].paragraphs.at(-1));
  }
  assert.match(january.chapters[5].paragraphs.at(-1),/편인.*학습과 돌봄/);
  assert.match(summer.chapters[11].paragraphs.at(-1),/출생 시간이 미상/);
  assert.notDeepEqual(january.chapters[4],summer.chapters[4]);
  const monthly = book => book.chapters.filter(ch=>ch.kicker.startsWith('2027 MONTHLY'));
  assert.equal(monthly(january).length,12);
  const text=january.chapters.flatMap(ch=>[...ch.paragraphs,...ch.bullets]);
  assert.equal(new Set(text).size,text.length);
  assert.deepEqual(monthly(january),monthly(summer));
});
