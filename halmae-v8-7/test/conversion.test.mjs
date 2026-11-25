import test from 'node:test';
import assert from 'node:assert/strict';
import {clearPurchaseStorage,readingVariant,recordConversion,readFunnel,recordFunnel} from '../purchase.js';

test('전환 집계는 허용 이벤트의 횟수만 유형별 탭 저장소에 기록한다',t=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 const map=new Map();
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{
  getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key),
 }});
 t.after(()=>{
  if(original) Object.defineProperty(globalThis,'sessionStorage',original);
  else delete globalThis.sessionStorage;
 });
 assert.equal(readingVariant('story'),'story');
 assert.equal(readingVariant(),'story');
 map.set('halmae-conversion-counts:story',JSON.stringify({email:'removed@example.test',free_reading_start:1}));
 const events=['free_reading_start','free_reading_success','checkout_click','test_payment_open','test_payment_success','test_payment_failure'];
 for(const name of events) recordConversion(name,{birthDate:'2000-01-01'});
 recordConversion('test@example.test');
 assert.deepEqual(JSON.parse(map.get('halmae-conversion-counts:story')),
  Object.fromEntries(events.map(name=>[name,name==='free_reading_start'?2:1])));
 assert.equal([...map.values()].some(value=>value.includes('2000-01-01')||value.includes('@example')),false);
 clearPurchaseStorage();
 assert.equal(map.size,0);
 assert.equal(readingVariant('unrecognized'),'ledger');
});

test('퍼널은 탭에서 단계별 한 번만 기록하고 모의 승인과 구매 승인을 구별한다',t=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 const map=new Map();
 let writes=0;
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{
  getItem:key=>map.get(key)??null,setItem:(key,value)=>{writes++;map.set(key,value);},removeItem:key=>map.delete(key),
 }});
 t.after(()=>original?Object.defineProperty(globalThis,'sessionStorage',original):delete globalThis.sessionStorage);
 const stages=['home_view','reading_start','reading_complete','purchase_click','checkout_view','test_payment_approved'];
 for(const stage of stages) {
  recordFunnel(stage,{birthDate:'2000-01-01',email:'buyer@example.test'});
  recordFunnel(stage);
 }
 recordFunnel('buyer@example.test');
 assert.equal(writes,stages.length);
 assert.deepEqual(readFunnel(),Object.fromEntries(stages.map(stage=>[stage,true])));
 assert.equal(readFunnel().payment_approved,undefined);
 assert.doesNotMatch([...map.values()].join(''),/example|birthDate/);
 clearPurchaseStorage();
 assert.deepEqual(readFunnel(),{});
});
