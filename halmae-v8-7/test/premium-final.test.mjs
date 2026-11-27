import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';

const now=Date.parse('2026-11-27T01:00:00Z');
const build=input=>buildFortuneReport(input,{now});
const cases=[
 {name:'김서린',gender:'female',birthDate:'2002-04-23',birthTime:'14:30'},
 {name:'박도윤',gender:'male',birthDate:'1991-09-12',birthTime:'02:00'},
 {name:'이해원',gender:'female',birthDate:'1983-03-09',birthTime:'09:10'},
 {name:'한정우',gender:'male',birthDate:'1974-08-31',birthTime:'17:40'},
 {name:'최유진',gender:'female',birthDate:'2000-02-04',birthTime:''},
];

test('five customer journals keep the exact preview and distinguish yearly and monthly decisions',()=>{
 const charts=cases.map(input=>fortuneCycles(input).saju);
 const reports=cases.map(build);
 assert.equal(new Set(charts.map(chart=>chart.dayStem)).size,5);
 assert.equal(new Set(reports.map(book=>book.chapters[13].groups[2].paragraphs.join(' '))).size,5);
 for(const [index,book] of reports.entries()){
  assert.equal(book.chapters.length,26);
  assert.ok(book.chapters[13].paragraphs.includes(ledgerPreview(charts[index]).excerpt));
  assert.equal(new Set(book.chapters.slice(14).map(chapter=>chapter.groups[3].paragraphs[0])).size,12);
 }
});

test('same day stem does not fix the career reading and uncertain dates keep limited evidence',()=>{
 const input={...cases[0],birthDate:'1994-01-24'};
 const other={...input,birthDate:'1994-07-03',birthTime:'16:30'};
 assert.equal(fortuneCycles(input).saju.dayStem,fortuneCycles(other).saju.dayStem);
 const business=input=>build(input).chapters.slice(14).map(chapter=>chapter.groups.find(group=>group.title==='사업운').paragraphs);
 assert.notDeepEqual(business(input),business(other));
 const boundary=build(cases[4]);
 assert.equal(boundary.meta.pillars[3],null);
 assert.match(boundary.meta.calculationNotes.join(' '),/정오 참고값/);
 assert.equal(boundary.chapters[12].bullets.length,0);
 for(const chapter of boundary.chapters.slice(6,12)){
  assert.doesNotMatch(chapter.paragraphs.join(' '),/월간|연간|월지|연지/);
 }
 const leap=build({...cases[0],birthDate:'2023-02-01',calendarType:'lunar',isLeapMonth:true});
 assert.equal(leap.meta.solarDate,'2023-03-22');
});
