import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';

import {profiles} from './report-profiles.mjs';
export {profiles};
export const topics=['총운','재물운','직업운','사업운','애정운','주의할 점'];
const now=Date.UTC(2026,10,25);
const norm=text=>text.trim().replace(/\s+/g,' ');
const sentences=paragraphs=>new Set(paragraphs.flatMap(paragraph=>
 norm(paragraph).split(/(?<=[.!?。])\s+/).filter(sentence=>sentence.length>=15)));
const source=process.env.V95_AUDIT_BASE
 ? (await import(pathToFileURL(resolve(process.env.V95_AUDIT_BASE,'netlify/functions/fortune-report.mjs')))).buildFortuneReport
 : null;

const records=profiles.map((profile,index)=>{
 const {saju,monthly,luck}=fortuneCycles(profile);
 const report=buildFortuneReport(profile,{now});
 const paragraphs=report.chapters.flatMap(chapter=>chapter.paragraphs);
 const set=new Set(paragraphs.map(norm));
 const chars=paragraphs.join('').length;
 assert.equal(report.chapters.length,26);
 assert.equal(new Set(report.chapters.map(chapter=>chapter.title)).size,26);
 assert.deepEqual(report.meta.pillars,saju.pillars);
 assert.ok(chars>=25000&&chars<=30000,profile.birthDate+' '+chars);
 assert.doesNotMatch(paragraphs.join('\n'),/undefined|NaN|무조건 성공|반드시 불행|개인 해석 보류/);
 if(!profile.birthTime){
  assert.equal(report.meta.pillars[3],null);
  assert.equal(luck.decades.length,0);
  assert.equal(report.chapters[12].bullets.length,0);
 }
 if(saju.dateBoundaryUncertain){
  assert.match(report.meta.calculationNotes.join(' '),/정오 기준 참고값/);
  assert.doesNotMatch(report.chapters.slice(14).flatMap(chapter=>chapter.paragraphs).join(' '),/태어난 달의 자리|태어난 달과 이 절기/);
 }
 for(const [i,chapter] of report.chapters.slice(14).entries()){
  assert.deepEqual(chapter.groups.map(group=>group.title),topics);
  assert.ok(chapter.paragraphs.some(text=>text.includes(monthly[i].tenGod)));
  assert.ok(chapter.groups.every(group=>group.paragraphs.join('').length>=65));
 }
 const baseline=source?.(profile,{now});
 const baselineSet=baseline?new Set(baseline.chapters.flatMap(chapter=>chapter.paragraphs.map(norm))):null;
 return {id:index+1,...profile,solarDate:saju.solarDate,pillars:saju.pillars.join('/'),chars,
  paragraphDuplicates:paragraphs.length-set.size,set,baselineSet,
  sentenceSet:sentences(paragraphs),
  baselineSentences:baseline?sentences(baseline.chapters.flatMap(chapter=>chapter.paragraphs)):null,
  domainSignatures:report.chapters.slice(6,12).map(chapter=>chapter.paragraphs.map(norm).join('|')),
  business:report.chapters[14].groups.find(group=>group.title==='사업운').paragraphs[0]};
});
const distinctBusiness=new Set(records.map(record=>record.business)).size;
assert.ok(distinctBusiness>=8);
assert.notEqual(records[33].pillars,records[34].pillars);

function pairMetric(key){
 const scores=records.flatMap((first,index)=>records.slice(index+1).map(second=>{
  const one=first[key],two=second[key];
  return 100*[...one].filter(text=>two.has(text)).length/Math.min(one.size,two.size);
 }));
 return {pairs:scores.length,min:Math.min(...scores).toFixed(2),max:Math.max(...scores).toFixed(2),
  average:(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)};
}
const summary={count:records.length,chars:[Math.min(...records.map(row=>row.chars)),Math.max(...records.map(row=>row.chars))],
 maxRepeatedParagraphs:Math.max(...records.map(row=>row.paragraphDuplicates)),distinctJanuaryBusiness:distinctBusiness,
 distinctDomainReports:Array.from({length:6},(_,i)=>new Set(records.map(row=>row.domainSignatures[i])).size),
 overlapV96:pairMetric('set'),sentenceOverlapV96:pairMetric('sentenceSet'),
 ...(source?{overlapV95:pairMetric('baselineSet'),sentenceOverlapV95:pairMetric('baselineSentences')}:{})};
if(process.argv[2]){
 const out=resolve(process.argv[2]);
 await mkdir(out,{recursive:true});
 const columns=['id','birthDate','birthTime','gender','calendarType','isLeapMonth','solarDate','pillars','chars','paragraphDuplicates','business'];
 const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 await writeFile(resolve(out,'sample-comparison.csv'),columns.join(',')+'\n'+records.map(record=>columns.map(column=>quote(record[column])).join(',')).join('\n')+'\n');
 await writeFile(resolve(out,'sample-summary.json'),JSON.stringify(summary,null,2)+'\n');
}
console.log(JSON.stringify(summary,null,2));
