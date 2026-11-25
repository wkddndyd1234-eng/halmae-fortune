import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {profiles} from './report-profiles.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';

const [baselineRoot,destination]=process.argv.slice(2);
if(!baselineRoot||!destination) throw Error('Usage: node qa/audit-v961.mjs BASE_PROJECT OUTPUT');
const baseline=(await import(pathToFileURL(resolve(baselineRoot,'netlify/functions/fortune-report.mjs')))).buildFortuneReport;
const {chapterEditorial,monthEditorial,monthScenes,businessScenes,rolePortraits}=
 await import(pathToFileURL(resolve(baselineRoot,'netlify/lib/premium-copy.mjs')));
const out=resolve(destination);
const now=Date.UTC(2026,10,25);
const norm=text=>text.trim().replace(/\s+/g,' ');
const paragraphs=report=>report.chapters.flatMap(chapter=>chapter.paragraphs);
const split=parts=>parts.flatMap(part=>norm(part).split(/(?<=[.!?。])\s+/));
const sentences=parts=>split(parts).filter(text=>text.length>=15);
const intersection=(one,two)=>[...one].filter(text=>two.has(text));
const ratio=(one,two)=>100*intersection(one,two).length/Math.min(one.size,two.size);
const average=values=>values.reduce((a,b)=>a+b,0)/values.length;
const pairs=sets=>sets.flatMap((one,i)=>sets.slice(i+1).map(two=>ratio(one,two)));
const unique=parts=>new Set(sentences(parts));
const round=n=>Number(n.toFixed(2));
const csv=(rows)=>rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const before=profiles.map(profile=>baseline(profile,{now}));
const after=profiles.map(profile=>buildFortuneReport(profile,{now}));
const groups=['총운','재물운','직업운','사업운','애정운','주의할 점'];
for(const [i,report] of after.entries()){
 assert.deepEqual(report.meta,before[i].meta);
 assert.deepEqual(report.chapters.map(chapter=>chapter.title),before[i].chapters.map(chapter=>chapter.title));
 assert.ok(paragraphs(report).join('').length>=25000&&paragraphs(report).join('').length<=30000,profiles[i].birthDate);
 for(const chapter of report.chapters.slice(14)) assert.deepEqual(chapter.groups.map(group=>group.title),groups);
}

const editorials=chapterEditorial.map(row=>unique(row.slice(1)));
const calendar=monthEditorial.map(row=>unique(row.slice(1,2)));
const examples=monthScenes.map((row,i)=>unique([...row,businessScenes[i]]));
const roleText=unique(Object.values(rolePortraits).flat());
function classify(i,text){
 if(/질병.{0,15}(판단|예측)|검사 결과나 진료 기록|장기 상태|성패를 알아내는/.test(text)) return '해석 한계 또는 주의';
 if(i<6&&editorials[i].has(text)) return '공통 기본 설명';
 if(i>=14&&calendar[i-14].has(text)) return '월별 공통 절기 배경';
 if(i>=14&&examples[i-14].has(text)) return '월별 공통 상황 예시';
 if(i<14&&editorials[i].has(text)) return '공통 주제 해설';
 if(roleText.has(text)) return '십성 본문 템플릿';
 return '기타 공통 또는 계산 조건부 문장';
}
const chapterRows=[['chapter','title','before_mean_sentence_match_percent','after_mean_sentence_match_percent',
 'before_mean_sentence_chars','after_mean_sentence_chars','before_universal_sentences','after_universal_sentences','before_mean_paragraph_match_percent','after_mean_paragraph_match_percent','before_sentences_over_80_percent','after_sentences_over_80_percent']];
const sentenceRows=[['chapter','sentence','before_reports','after_reports','source_category']];
for(let i=0;i<26;i++){
 const first=before.map(report=>report.chapters[i].paragraphs);
 const last=after.map(report=>report.chapters[i].paragraphs);
 const count=sets=>{
  const lookup=new Map();
  for(const set of sets) for(const text of set) lookup.set(text,(lookup.get(text)??0)+1);
  return lookup;
 };
 const firstSets=first.map(unique),lastSets=last.map(unique);
 const prior=count(firstSets),next=count(lastSets);
 const long=sections=>100*average(sections.flatMap(split).map(text=>Number(text.length>80)));
 const reading=sections=>average(sections.flatMap(split).map(text=>text.length));
 chapterRows.push([i+1,after[0].chapters[i].title,round(average(pairs(firstSets))),round(average(pairs(lastSets))),
  round(reading(first)),round(reading(last)),[...prior.values()].filter(n=>n===36).length,[...next.values()].filter(n=>n===36).length,
  round(average(pairs(first.map(lines=>new Set(lines.map(norm)))))),round(average(pairs(last.map(lines=>new Set(lines.map(norm)))))),round(long(first)),round(long(last))]);
 for(const text of [...new Set([...prior.keys(),...next.keys()])].sort((a,b)=>
  Math.max(next.get(b)??0,prior.get(b)??0)-Math.max(next.get(a)??0,prior.get(a)??0))){
  if(Math.max(prior.get(text)??0,next.get(text)??0)<2) continue;
  sentenceRows.push([i+1,text,prior.get(text)??0,next.get(text)??0,classify(i,text)]);
 }
}
const first=before.map(report=>unique(paragraphs(report))),last=after.map(report=>unique(paragraphs(report)));
const reportRows=[['sample','date','time','gender','calendar','leap','before_chars','after_chars','before_mean_match','after_mean_match',
 'before_repeated_sentences','after_repeated_sentences']];
const repeat=report=>sentences(paragraphs(report)).length-unique(paragraphs(report)).size;
for(const [i,profile] of profiles.entries()){
 reportRows.push([i+1,profile.birthDate,profile.birthTime,profile.gender,profile.calendarType??'solar',profile.isLeapMonth??false,
  paragraphs(before[i]).join('').length,paragraphs(after[i]).join('').length,
  ...[first,last].map(sets=>round(average(sets.filter((_,j)=>i!==j).map(set=>ratio(sets[i],set))))),
  repeat(before[i]),repeat(after[i])]);
}
const summary={reports:profiles.length,pairs:pairs(first).length,meanSentenceMatch:[first,last].map(sets=>round(average(pairs(sets)))),
 meanRepeatedSentences:[before,after].map(reports=>round(average(reports.map(repeat)))),
 meanSentenceChars:[before,after].map(reports=>round(average(reports.flatMap(report=>split(paragraphs(report))).map(text=>text.length)))),
 monthlyMeanMatch:[2,3].map(column=>round(average(chapterRows.slice(15).map(row=>row[column]))))};
await mkdir(out,{recursive:true});
for(const [file,rows] of Object.entries({'chapters.csv':chapterRows,'repeat-sentences.csv':sentenceRows,'reports.csv':reportRows})){
 await writeFile(resolve(out,file),'\ufeff'+csv(rows));
}
await writeFile(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(summary);
