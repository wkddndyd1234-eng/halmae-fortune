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

test('supply evidence survives the customer-data deletion window and is purged only at its archive deadline',async()=>{
 const {purgeArchive,retentionEnd}=await import('../netlify/lib/legal-records.mjs');
 const makeStore=()=>{
  const data=new Map();
  return {
   data,
   async get(key){return data.get(key);},
   async setJSON(key,value,{onlyIfNew}={}){
    if(onlyIfNew&&data.has(key)) return {modified:false};
    data.set(key,value);
    return {modified:true};
   },
   async delete(key){data.delete(key);},
   async *list({prefix}){yield {blobs:[...data.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};},
  };
 };
 const customer=makeStore(),archive=makeStore();
 const order={orderId:'fixture',email:'ignored@example.test',birthDate:'1990-01-01'};
 const key='legal/payment/supply-fixture';
 await materializeReport(customer,order,()=>({chapters:['private']}),archive);
 const evidence=archive.data.get(key);
 assert.deepEqual(Object.keys(evidence).sort(),['expiresAt','firstResponsePreparedAt','kind','reference']);
 assert.equal(evidence.expiresAt,retentionEnd('payment',evidence.firstResponsePreparedAt));
 customer.data.clear();
 assert.equal((await purgeArchive(archive,evidence.firstResponsePreparedAt+365*86400000)).deleted,0);
 archive.data.set('hold/fixture',true);
 assert.equal((await purgeArchive(archive,evidence.expiresAt)).deleted,0);
 archive.data.delete('hold/fixture');
 assert.equal((await purgeArchive(archive,evidence.expiresAt-1)).deleted,0);
 assert.equal((await purgeArchive(archive,evidence.expiresAt)).deleted,1);
 assert.equal(archive.data.has(key),false);
});
