import assert from 'node:assert/strict';
import {test} from 'node:test';
import {materializeReport} from '../netlify/lib/report-delivery.mjs';

test('first successful report response evidence is immutable across repeat views and generation failure',async()=>{
 const records=new Map();
 const store={async setJSON(key,value,{onlyIfNew}={}){
  if(onlyIfNew&&records.has(key)) return {modified:false};
  records.set(key,value);
  return {modified:true};
 }};
 const order={orderId:'fixture'};
 await materializeReport(store,order,()=>({chapters:[]}));
 const first=records.get('first-delivery/fixture');
 assert.ok(Number.isSafeInteger(first.at));
 await materializeReport(store,order,()=>({chapters:[]}));
 await assert.rejects(materializeReport(store,order,()=>{throw Error('fixture');}));
 assert.equal(records.get('first-delivery/fixture'),first);
 assert.equal(records.get('delivery/fixture').state,'retry-needed');
});
