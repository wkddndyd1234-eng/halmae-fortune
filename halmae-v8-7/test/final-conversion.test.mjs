import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';
import {calculateSaju} from '../netlify/functions/saju.mjs';

test('both story entries target the free form and only one result bridge is shown',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<a class="btn home-reading" href="#form">내 사주 무료로 보기/);
 assert.match(html,/<a class="story-cta" href="#form">/);
 assert.match(html,/id="element-summary-values"/);
 assert.match(html,/id="conversionNext"/);
 assert.doesNotMatch(html,/id="conversionMid"/);
});

test('personalized annual excerpt and monthly choices are tied to the current chart',()=>{
 const choices=new Map();
 for(let day=1;day<=30;day++){
  const input={name:'김민지',gender:day%2?'female':'male',
   birthDate:new Date(Date.UTC(1994,0,23+day)).toISOString().slice(0,10),
   birthTime:String((day*7)%24).padStart(2,'0')+':30'};
  const saju=calculateSaju(input);
  const report=buildFortuneReport(input);
  assert.equal(report.chapters.length,26);
  assert.ok(report.chapters[13].paragraphs.includes(ledgerPreview(saju).excerpt));
  assert.equal(new Set(report.chapters.slice(14).map(chapter=>chapter.lead)).size,12);
  const stem=saju.dayStem;
  const readings=choices.get(stem)??new Set();
  readings.add(JSON.stringify(report.chapters.slice(6).map(chapter=>chapter.groups[0].paragraphs[0])));
  choices.set(stem,readings);
 }
 assert.equal(choices.size,10);
 assert.ok([...choices.values()].every(readings=>readings.size>1));
});
