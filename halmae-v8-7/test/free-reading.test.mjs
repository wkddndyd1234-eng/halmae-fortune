import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSaju,normalizeBirth} from '../netlify/functions/saju.mjs';
import {fromFreeForm,readBirthDraft,saveBirthDraft,todayInKorea,validateBirthDraft} from '../birth-handoff.js';
import {readFreeInsights} from '../free-insights.js';

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
 assert.match(first.introduction,/戊午/);
 assert.match(first.relationships,/午/);
});
