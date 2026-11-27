import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';
import {readPersonalReading} from '../free-insights.js';

const birth={name:'김서린',birthDate:'2002-04-23',birthTime:'14:30',gender:'female'};
test('monthly labels and readable term periods preserve all six themes and the correct year context',()=>{
 const cycles=fortuneCycles(birth);
 const report=buildFortuneReport(birth);
 assert.ok(report.chapters[13].paragraphs.includes(ledgerPreview(cycles.saju).excerpt));
 report.chapters.slice(14).forEach((chapter,index)=>{
  assert.equal(chapter.displayTitle,`${index+1}월 운세`);
  assert.deepEqual(chapter.groups.map(group=>group.title),['총운','재물운','직업운','사업운','애정운','주의할 점']);
  assert.ok(chapter.groups[0].paragraphs.some(text=>text.includes(index===0?'丙午':'丁未')));
  assert.match(chapter.bullets.join(' '),/절기가 드는 시각/);
 });
});

test('the free opening grounds the reading in the actual day pillar and withholds uncertain seasonal evidence',()=>{
 const known=fortuneCycles(birth);
 const uncertain=fortuneCycles({...birth,birthDate:'2000-02-04',birthTime:''});
 for (const chart of [known,uncertain]) {
  const opening=readPersonalReading(chart,chart.saju,'').introduction;
  assert.ok(opening.includes(chart.saju.pillars[2]));
  if(chart.saju.dateBoundaryUncertain) assert.doesNotMatch(opening,/월령/);
  else assert.ok(opening.includes(chart.season.season+'의 월령'));
 }
});
