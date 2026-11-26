import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFreeInsights} from '../free-insights.js';
import {calculateSaju} from '../netlify/functions/saju.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';

test('20 different profiles keep personalized reading, monthly chapters and exact previews',()=>{
 const introductions=new Set(),excerpts=new Set(),workProfiles=new Set();
 for(let i=0;i<20;i++){
  const input={name:i%2?'서진':'Alex Kim',birthDate:`${1980+i}-${String(i%12+1).padStart(2,'0')}-${String(8+i).padStart(2,'0')}`,
   gender:i%2?'female':'male',birthTime:i%5===0?'':String(i).padStart(2,'0')+':35'};
  const saju=calculateSaju(input);
  const free=readFreeInsights(saju.pillars[2],saju.elements,'',saju.pillars[1][1]);
  const report=buildFortuneReport(input);
  const preview=ledgerPreview(saju);
  assert.equal(report.meta.name,input.name);
  assert.ok(report.chapters[0].lead.startsWith(input.name+','));
  assert.deepEqual(report.meta.pillars,calculateSaju({...input,name:'다른 이름'}).pillars);
  assert.equal(report.chapters.length,26);
  assert.ok(report.chapters[13].paragraphs.includes(preview.excerpt));
  assert.doesNotMatch([free.temperament,free.work,free.relationships,preview.excerpt].join(' '),/[\u3400-\u9fff]|지장간|십성/);
  const monthly=report.chapters.slice(14);
  assert.deepEqual(monthly.map(chapter=>chapter.title.split(' · ')[0]),Array.from({length:12},(_,n)=>`${n+1}월`));
  assert.equal(new Set(monthly.map(chapter=>chapter.groups.find(group=>group.title==='사업운').paragraphs.join(' '))).size,12);
  assert.ok(monthly.every(chapter=>chapter.groups.length===6));
  introductions.add(free.temperament);
  excerpts.add(preview.excerpt);
  workProfiles.add(monthly.map(chapter=>chapter.groups.find(group=>group.title==='직업운').paragraphs.join(' ')).join('\n'));
 }
 assert.ok(introductions.size>=6&&excerpts.size>=6&&workProfiles.size===20);
});
