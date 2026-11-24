import assert from 'node:assert/strict';
import test from 'node:test';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';

const now=Date.UTC(2026,10,24);
const base={name:'예시',gender:'female',calendarType:'solar',birthTime:'06:30'};
const profiles=Array.from({length:24},(_,i)=>({
 ...base,
 birthDate:new Date(Date.UTC(1962+2*i,i%12,12+i%10)).toISOString().slice(0,10),
 gender:i%2?'male':'female',
 birthTime:i%5===0?'':i%2?'23:15':'06:30',
}));
profiles.push({...base,birthDate:'2023-02-01',calendarType:'lunar',isLeapMonth:true});
const monthlyTitles=['총운','재물운','직업운','사업운','애정운','주의할 점'];
const text=chapter=>chapter.paragraphs.join('\n');

test('25개 출생 조건의 26장 분량, 반복률, 개인별 해석 차이',t=>{
 const sizes=[],duplicates=[],signatures=new Set(),sets=[];
 for(const profile of profiles){
  const report=buildFortuneReport(profile,{now});
  assert.equal(report.chapters.length,26);
  const paragraphs=report.chapters.flatMap(chapter=>chapter.paragraphs);
  const size=[...paragraphs.join('')].length;
  const duplicate=(paragraphs.length-new Set(paragraphs).size)/paragraphs.length;
  assert.ok(size>=25_000&&size<=30_000,`${profile.birthDate}: ${size}`);
  assert.ok(duplicate<=0.02,`${profile.birthDate}: ${duplicate}`);
  assert.doesNotMatch(paragraphs.join('\n'),/undefined|NaN|\bnull\b|\(와\)|\(를\)|[А-Яа-я]/);
  for(const chapter of report.chapters) {
   assert.deepEqual(chapter.groups.flatMap(group=>group.paragraphs),chapter.paragraphs);
  }
  for(const chapter of report.chapters.slice(14)){
   assert.deepEqual(chapter.groups.map(group=>group.title),monthlyTitles);
  }
  signatures.add(report.chapters.slice(14).map(chapter=>chapter.groups.filter(group=>group.title==='총운'||group.title==='애정운').flatMap(group=>group.paragraphs).join('')).join(''));
  sets.push(new Set(paragraphs));
  sizes.push(size);
  duplicates.push(duplicate);
 }
 assert.ok(signatures.size>=20);
 const overlaps=sets.flatMap((left,index)=>sets.slice(index+1).map(right=>
  [...left].filter(paragraph=>right.has(paragraph)).length/Math.min(left.size,right.size)));
 t.diagnostic(`보고서 간 일치 문단 비율 ${(100*Math.min(...overlaps)).toFixed(2)}–${(100*Math.max(...overlaps)).toFixed(2)}%`);
 t.diagnostic(`본문 ${Math.min(...sizes)}–${Math.max(...sizes)}자, 문단 최대 중복률 ${(100*Math.max(...duplicates)).toFixed(2)}%, 월운 해석 ${signatures.size}종`);
});

test('연속 60일의 일주 해석과 10개 일간이 각각 드러난다',()=>{
 const dayReadings=new Set(),stems=new Set();
 for(let i=0;i<60;i++){
  const birthDate=new Date(Date.UTC(1993,4,5+i)).toISOString().slice(0,10);
  const {meta,chapters}=buildFortuneReport({...base,birthDate},{now});
  const [stem]=meta.pillars[2];
  const group=chapters[4].groups.at(-1);
  assert.match(group.title,new RegExp(meta.pillars[2]));
  dayReadings.add(group.paragraphs[0]);
  stems.add(stem);
 }
 assert.equal(dayReadings.size,60);
 assert.equal(stems.size,10);
});

test('유료 제14장에서 무료 발췌가 확인되고 현재 대운과 2027년이 구분된다',()=>{
 for(const profile of profiles){
  const {saju,luck,annual}=fortuneCycles(profile);
  const report=buildFortuneReport(profile,{now});
  const preview=ledgerPreview(saju);
  assert.ok(report.chapters[13].paragraphs.includes(preview.excerpt));
  assert.ok(preview.context.includes(saju.pillars[1][1]));
  const active=luck.decades.find(cycle=>Date.parse(cycle.start)<=now&&now<Date.parse(cycle.end));
  if(active) assert.ok(text(report.chapters[12]).includes(active.pillar));
  for(const cycle of annual.decades) assert.ok(text(report.chapters[13]).includes(cycle.pillar));
  if(!profile.birthTime) assert.match(report.meta.calculationNotes.join(' '),/출생 시각이 없어/);
 }
});

test('세 고객 조건 모두 26장과 매달 여섯 항목을 제공하고 절입일에는 일주만 해석한다',()=>{
 const requested=[
  {...base,birthDate:'1992-01-21',birthTime:'02:00',gender:'male'},
  {...base,birthDate:'1995-07-15',birthTime:'14:30'},
  {...base,birthDate:'1988-10-08',birthTime:'',gender:'male'},
  {...base,birthDate:'2000-02-04',birthTime:''},
 ];
 for(const profile of requested){
  const {saju}=fortuneCycles(profile);
  const report=buildFortuneReport(profile,{now});
  assert.equal(report.chapters.length,26);
  assert.ok(report.chapters[13].paragraphs.includes(ledgerPreview(saju).excerpt));
  const body=report.chapters.flatMap(chapter=>chapter.paragraphs).join('');
  assert.ok(body.length>=25000&&body.length<=30000,profile.birthDate+' '+body.length);
  assert.doesNotMatch(body,/개인 해석 보류|정확한 시간을 다시 입력/);
  for(const chapter of report.chapters.slice(14)){
   assert.deepEqual(chapter.groups.map(group=>group.title),monthlyTitles);
   assert.ok(chapter.groups.every(group=>group.paragraphs.join('').length>=65));
  }
  if(saju.dateBoundaryUncertain){
   assert.equal(report.chapters[12].bullets.length,0);
   assert.doesNotMatch(body,/태어난 달의 자리|태어난 달과 이 절기|네 장부에 펼친 긴 흐름은 월주|[년월]지 [子丑寅卯辰巳午未申酉戌亥]의/);
   assert.match(report.meta.calculationNotes.join(' '),/정오 기준 참고값/);
  }
 }
});
