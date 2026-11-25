import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {profiles} from './report-profiles.mjs';

const baselinePath=resolve(process.argv[2],'netlify/functions/fortune-report.mjs');
const baseline=(await import(pathToFileURL(baselinePath))).buildFortuneReport;
const now=Date.UTC(2026,10,25);
const samples=[...profiles,
 {birthDate:'1995-08-15',calendarType:'lunar',isLeapMonth:true,birthTime:'23:35',gender:'male'},
 {birthDate:'1991-04-18',birthTime:'09:30',gender:'female'},
];
const split=paragraph=>paragraph.trim().replace(/\s+/g,' ').split(/(?<=[.!?。])\s+/).filter(line=>line.length>=15);
const sentences=report=>report.chapters.flatMap(chapter=>chapter.paragraphs.flatMap(split));
const universal=sets=>new Set([...sets[0]].filter(s=>sets.every(set=>set.has(s))));
const overlap=(a,b)=>100*[...a].filter(s=>b.has(s)).length/(Math.min(a.size,b.size)||1);
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
const pairs=sets=>sets.flatMap((a,i)=>sets.slice(i+1).map(b=>overlap(a,b)));
const particles=/(?<role>비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인)(?<particle>은|는|이|가|을|를|으로|로)(?=\s|[.,])/g;
function errors(text){
 return [...text.matchAll(particles)].filter(({groups:{role,particle}})=>
  role.endsWith('재')?/^(은|이|을|으로)$/.test(particle):/^(는|가|를|로)$/.test(particle))
  .map(m=>m[0]);
}
function summary(reports,commonText){
 const lists=reports.map(sentences);
 const sets=lists.map(list=>new Set(list));
 const common=universal(sets);
 const commonSets=sets.map(set=>new Set([...set].filter(s=>commonText.has(s))));
 const remainder=sets.map(set=>new Set([...set].filter(s=>!commonText.has(s))));
 return {commonSentences:common.size,allPairOverlap:mean(pairs(sets)),
  commonCopyPairOverlap:mean(pairs(commonSets)),interpretationPairOverlap:mean(pairs(remainder)),
  commonCoverage:mean(sets.map((set,i)=>100*commonSets[i].size/set.size)),
  internalRepeats:mean(lists.map((list,i)=>list.length-sets[i].size)),
  particleErrors:reports.flatMap(r=>errors(r.chapters.flatMap(c=>[c.lead,...c.paragraphs]).join('\n')))
   .reduce((totals,word)=>(totals[word]=(totals[word]??0)+1,totals),{}),
  sizes:[Math.min(...reports.map(r=>r.chapters.flatMap(c=>c.paragraphs).join('').length)),
   Math.max(...reports.map(r=>r.chapters.flatMap(c=>c.paragraphs).join('').length))]};
}
const before=samples.map(profile=>baseline(profile,{now}));
const after=samples.map((profile,index)=>{
 const report=buildFortuneReport(profile,{now});
 const previous=before[index];
 const {calculationNotes,...meta}=report.meta;
 const {calculationNotes:previousNotes,...previousMeta}=previous.meta;
 assert.deepEqual(meta,previousMeta);
 assert.ok(previousNotes.every(note=>calculationNotes.includes(note)));
 assert.equal(report.chapters.length,26);
 const model=fortuneCycles(profile);
 if(model.saju.dateBoundaryUncertain){
  assert.match(calculationNotes.join(' '),/정오 참고값/);
  assert.equal(report.meta.pillars[3],null);
  assert.equal(report.chapters[12].bullets.length,0);
  const boundaryBody=report.chapters.slice(6,12).flatMap(c=>c.paragraphs).join(' ');
  assert.doesNotMatch(boundaryBody,/연간|월간|시간\(시주의 천간\)/);
 }
 if(profile.isLeapMonth) assert.ok(calculationNotes.some(note=>note.includes(model.saju.solarDate)));
 if(profile.birthTime.startsWith('23:')) assert.match(calculationNotes.join(' '),/밤 11시/);
 report.chapters.forEach((chapter,i)=>{
  assert.equal(chapter.title,previous.chapters[i].title);
  if(i<14)return;
  const month=model.monthly[i-14];
  assert.equal(chapter.groups.length,6);
  assert.match(chapter.groups[0].paragraphs.join(' '),new RegExp('이달 천간 '+month.pillar[0]+'과 네 일간 '+model.saju.dayStem));
  assert.ok(chapter.groups[0].paragraphs.join(' ').includes(month.tenGod));
  for(const group of chapter.groups.slice(1,5)){
   assert.ok(group.paragraphs.join(' ').includes(month.tenGod),group.title);
  }
  if(model.saju.dateBoundaryUncertain){
   assert.doesNotMatch(chapter.paragraphs.join(' '),/연지|월지|시지|대운/);
  }
  assert.deepEqual(chapter.bullets,previous.chapters[i].bullets);
 });
 return report;
});
const commonText=new Set([...universal(before.map(r=>new Set(sentences(r)))),
 ...universal(after.map(r=>new Set(sentences(r))))]);
const beforeMetrics=summary(before,commonText),afterMetrics=summary(after,commonText);
assert.deepEqual(afterMetrics.particleErrors,{});
console.log(JSON.stringify({count:samples.length,before:beforeMetrics,after:afterMetrics,
 profiles:samples.map((profile,i)=>({...profile,chapters:after[i].chapters.length,
  repeatBefore:sentences(before[i]).length-new Set(sentences(before[i])).size,
  repeatAfter:sentences(after[i]).length-new Set(sentences(after[i])).size})),
 examples:after.slice(-2).map(r=>[r.meta.pillars,r.chapters[6].groups.at(-1).paragraphs[1],
  r.chapters[14].groups[1].paragraphs[1]])},null,2));
