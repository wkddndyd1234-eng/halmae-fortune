import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSaju,normalizeBirth,pillarElements} from '../netlify/functions/saju.mjs';
import {fromFreeForm,readBirthDraft,saveBirthDraft,todayInKorea,validateBirthDraft} from '../birth-handoff.js';
import {readFreeInsights} from '../free-insights.js';
import {buildReport} from '../netlify/functions/report.mjs';

test('무료 입력을 양력 날짜와 분 단위 시간으로 변환하고 선택 필드만 전달',()=>{
 const values={name:' 해윤 ',year:'2000',month:'2',day:'29',hour:'0',minute:'7',relation:'기혼'};
 assert.deepEqual(fromFreeForm(values),{name:'해윤',birthDate:'2000-02-29',birthTime:'00:07'});
 assert.deepEqual(fromFreeForm({...values,hour:''}),{name:'해윤',birthDate:'2000-02-29',birthTime:''});
 assert.equal(fromFreeForm({...values,year:'2001'}),null);
 assert.equal(fromFreeForm({...values,hour:'24'}),null);
 assert.equal(fromFreeForm({...values,minute:'60'}),null);
 assert.equal(validateBirthDraft({name:'x',birthDate:'2099-01-01',birthTime:''}),null);
 assert.equal(validateBirthDraft({name:'x'.repeat(21),birthDate:'2000-01-01',birthTime:''}),null);
});

test('한국 날짜 경계를 기준으로 클라이언트와 서버에서 같은 생일을 허용',t=>{
 const now=Date.parse('2024-02-28T15:00:00Z');
 assert.equal(todayInKorea(now-1),'2024-02-28');
 assert.equal(todayInKorea(now),'2024-02-29');
 t.mock.method(Date,'now',()=>now);
 const draft={name:'',birthDate:'2024-02-29',birthTime:''};
 assert.ok(validateBirthDraft(draft));
 assert.equal(normalizeBirth(draft).solarDate,draft.birthDate);
 assert.throws(()=>normalizeBirth({...draft,birthDate:'2024-03-01'}),/미래/);
});

test('탭 저장을 지우거나 사용할 수 없어도 주문 화면은 빈 입력으로 이어진다',t=>{
 const original = Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 const entries=new Map();
 const storage={setItem:(key,value)=>entries.set(key,value),getItem:key=>entries.get(key)??null,removeItem:key=>entries.delete(key)};
 t.after(()=>{
  if(original) Object.defineProperty(globalThis,'sessionStorage',original);
  else delete globalThis.sessionStorage;
 });
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:storage});
 assert.equal(readBirthDraft(),null);
 saveBirthDraft({name:'가상',birthDate:'2000-01-01',birthTime:'12:01'});
 assert.deepEqual(readBirthDraft(),{name:'가상',birthDate:'2000-01-01',birthTime:'12:01'});
 saveBirthDraft(null);
 assert.equal(readBirthDraft(),null);
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get:()=>{throw Error('unavailable');}});
 assert.doesNotThrow(()=>saveBirthDraft({}));
 assert.equal(readBirthDraft(),null);
});

test('같은 계절의 다른 일주·오행은 무료 도입과 기질·일·관계의 본문을 바꾼다',()=>{
 const a=calculateSaju({birthDate:'2000-01-01',birthTime:'12:00'});
 const b=calculateSaju({birthDate:'2000-01-02',birthTime:'12:00'});
 const first=readFreeInsights(a.pillars[2],a.elements);
 const second=readFreeInsights(b.pillars[2],b.elements);
 for(const section of ['headline','introduction','temperament','work','relationships']){
  assert.notEqual(first[section],second[section]);
 }
 assert.match(first.introduction,/산/);
 assert.doesNotMatch(first.introduction,/戊午|일간|일주/);
 assert.match(first.relationships,/고마웠던 장면/);
});

test('계산된 열 가지 일간은 각 상징과 생활 장면, 균형 질문으로 구분된다',()=>{
 const symbols=['큰 나무','덩굴','태양','등불','산','밭','쇠','보석','큰 물','이슬'];
 const stems=[...'甲乙丙丁戊己庚辛壬癸'];
 const readings=Array.from({length:10},(_,index)=>{
  const birthDate='2000-01-'+String(index+1).padStart(2,'0');
  const saju=calculateSaju({birthDate,birthTime:'01:30'});
  const reading=readFreeInsights(saju.pillars[2],saju.elements);
  assert.match(reading.headline,new RegExp(symbols[stems.indexOf(saju.dayStem)]));
  assert.match(reading.introduction,new RegExp(symbols[stems.indexOf(saju.dayStem)]));
  assert.doesNotMatch(reading.introduction,/일간|일주/);
  return reading;
 });
 for(const field of ['headline','introduction','temperament','balance']){
  assert.equal(new Set(readings.map(reading=>reading[field])).size,10);
 }
});

test('01:30 승계 값과 미상 입력의 원국·오행이 유료 보고서와 일치한다',()=>{
 const source={name:'가상',year:'2000',month:'1',day:'1',hour:'1',minute:'30'};
 for(const hour of ['1','','3']){
  const draft=fromFreeForm({...source,hour});
  const reading=calculateSaju(draft);
  const report=buildReport(draft);
  assert.deepEqual(reading.pillars,report.meta.pillars);
  assert.deepEqual(reading.elements,report.meta.elementCounts);
  assert.equal(draft.birthTime,hour?'0'+hour+':30':'');
  assert.equal(report.meta.birthTime,draft.birthTime||'미상');
  const pairs=reading.pillars.flatMap(pillar=>pillarElements(pillar)??[]);
  assert.equal(pairs.length,hour?8:6);
  for(const [element,count] of Object.entries(report.meta.elementCounts)){
   assert.equal(pairs.filter(item=>item===element).length,count);
  }
 }
 const a=calculateSaju(fromFreeForm(source));
 const b=calculateSaju(fromFreeForm({...source,hour:'3'}));
 assert.notEqual(a.pillars[3],b.pillars[3]);
 assert.notDeepEqual(a.elements,b.elements);
});

test('주문 화면 장부 미리보기는 가상 입력으로 생성한 실제 보고서 발췌다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const checkout=await readFile(new URL('../checkout.html',import.meta.url),'utf8');
 const quote=checkout.match(/<blockquote>([^<]+)<\/blockquote>/)?.[1];
 assert.ok(quote);
 const report=buildReport({name:'가상',birthDate:'2000-01-01',birthTime:'12:00'});
 assert.ok(report.chapters[5].paragraphs.some(paragraph=>paragraph.includes(quote)));
});


test('열 가지 일간 이미지가 고유한 경량 수묵 그림과 연결된다',async()=>{
 const {readFile}=await import('node:fs/promises');
 const art=await readFile(new URL('../day-symbols.svg',import.meta.url),'utf8');
 assert.ok(Buffer.byteLength(art)<10_000);
 const expected={甲:'gap',乙:'eul',丙:'byeong',丁:'jeong',戊:'mu',己:'gi',庚:'gyeong',辛:'sin',壬:'im',癸:'gye'};
 for(let day=1;day<=10;day++){
  const saju=calculateSaju({birthDate:'2000-01-'+String(day).padStart(2,'0')});
  const story=readFreeInsights(saju.pillars[2],saju.elements);
  assert.equal(story.imageId,expected[saju.dayStem]);
  assert.ok(art.includes('<symbol id="art-'+story.imageId+'"'));
 }
 assert.equal([...art.matchAll(/<symbol id=/g)].length,10);
});
