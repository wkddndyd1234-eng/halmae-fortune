import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readPersonalReading} from '../free-insights.js';
import {readingName} from '../netlify/functions/reading-name.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';

test('Korean vocatives follow the ending sound and ambiguous names use a safe address',()=>{
 for(const [name,call,possessive] of [
  ['장우용','우용아','우용이의'],['김민지','민지야','민지의'],['이준혁','준혁아','준혁이의'],
  ['박서연','서연아','서연이의'],['최지우','지우야','지우의'],
 ]){
  assert.deepEqual(readingName(name),{call,possessive});
 }
 for(const name of ['남궁민','황보은','Alex Kim','하늘','왕샤오밍','낯선글','<img onerror=x>','김 민 지',null]){
  assert.deepEqual(readingName(name),{call:'얘야',possessive:'내'});
 }
});

test('30 synthetic charts cover all ten images and distinguish readings within each day stem',()=>{
 const details=new Map();
 const stems=[...'甲乙丙丁戊己庚辛壬癸'];
 const titles=['하늘을 향해 자라는 큰 나무','바람에도 꺾이지 않는 풀꽃','세상을 밝히는 큰 태양','어둠을 밝히는 작은 불꽃',
  '세상을 품은 거대한 산','생명을 키워내는 비옥한 대지','단단하게 벼려진 강철','어둠 속에서도 빛나는 보석',
  '끝없이 펼쳐진 거대한 바다','메마른 땅을 적시는 단비'];
 for(let index=0;index<30;index++){
  const date=new Date(Date.UTC(1994,0,24+index));
  const input={name:'김민지',birthDate:date.toISOString().slice(0,10),
   gender:index%2?'female':'male',birthTime:String((index*7)%24).padStart(2,'0')+':30'};
  const fortune=fortuneCycles(input);
  const {saju}=fortune;
  const free=readPersonalReading(fortune,saju,'');
  const book=buildFortuneReport(input);
  assert.equal(free.headline,titles[stems.indexOf(saju.dayStem)]);
  assert.doesNotMatch([free.money,free.elementsStory,free.bridge].join(' '),/[\u3400-\u9fff]|십성|지장간/);
  assert.match(book.chapters[0].displayLead,/^민지야,/);
  assert.match(book.chapters[13].displayLead,/^민지야,/);
  assert.deepEqual(book.meta.pillars,fortuneCycles({...input,name:'장우용'}).saju.pillars);
  assert.equal(book.chapters.length,26);
  assert.ok(book.chapters.every(chapter=>chapter.paragraphs.length>1));
  assert.ok(book.chapters[13].paragraphs.includes(ledgerPreview(saju).excerpt));
  const months=book.chapters.slice(14);
  assert.equal(new Set(months.map(chapter=>chapter.lead)).size,12);
  const examples=details.get(saju.dayStem)??new Set();
  examples.add([free.elementsStory,free.work,free.money,free.bridge].join(' '));
  details.set(saju.dayStem,examples);
 }
 assert.equal(details.size,10);
 for(const examples of details.values())assert.ok(examples.size>=2);
});
