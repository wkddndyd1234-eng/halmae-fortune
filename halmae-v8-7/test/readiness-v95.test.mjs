import assert from 'node:assert/strict';
import test from 'node:test';
import {allowedOperatorIp,boundedJson,consumeTotp,totpCode} from '../netlify/lib/ops-access.mjs';
import {compareSettlements} from '../netlify/lib/admin-ledger.mjs';
import {migrateFinance,purgeArchive,putLegalIndex,retentionEnd} from '../netlify/lib/legal-records.mjs';

const view=()=>new Map();
const store=data=>({
 async *list({prefix}){yield {blobs:[...data.keys()].filter(key=>key.startsWith(prefix)).map(key=>({key}))};},
 async get(key){return data.get(key)??null;},
 async delete(key){data.delete(key);},
 async setJSON(key,value,{onlyIfNew}={}){
  if(onlyIfNew&&data.has(key)) return {modified:false};
  data.set(key,value);
  return {modified:true};
 },
});
const orderId='HM-12345678-abcd-4123-9123-0123456789ab';

test('운영 접속 목록은 신뢰한 호출 IP를 정확히 비교하고 인증 앱 코드는 한 번만 쓴다',async()=>{
 assert.equal(allowedOperatorIp('192.0.2.7','192.0.2.1, 192.0.2.7,2001:db8::1'),true);
 assert.equal(allowedOperatorIp(undefined,'192.0.2.7'),false);
 assert.equal(allowedOperatorIp('192.0.2.77','192.0.2.7'),false);
 assert.equal(allowedOperatorIp('invalid','invalid'),false);
 const secret=Buffer.from('12345678901234567890');
 const code=totpCode(secret,1);
 assert.equal(code,'287082'); // RFC 6238 SHA-1 vector truncated to six digits.
 const auth=store(view());
 assert.equal(await consumeTotp(auth,secret.toString('hex'),'000000',59000),false);
 const results=await Promise.all([1,2].map(()=>consumeTotp(auth,secret.toString('hex'),code,59000)));
 assert.equal(results.filter(Boolean).length,1);
});

test('웹훅 파서는 최대 크기 밖의 JSON을 읽지 않는다',async()=>{
 const request=body=>new Request('https://example.test',{method:'POST',body});
 assert.deepEqual(await boundedJson(request('{"hello":1}')),{hello:1});
 assert.equal(await boundedJson(request(JSON.stringify({value:'x'.repeat(100)})),20),null);
 assert.equal(await boundedJson(request('{')),null);
});

test('전체 정산 대조는 승인일 범위 안에서 누락과 중복을 검출한다',()=>{
 const second='HM-99999999-abcd-4123-9123-0123456789ab';
 const internal=[{orderId,approvedAt:'2026-11-23T15:00:00Z',balanceAmount:29900,transactionKey:'a'},
  {orderId:second,approvedAt:'2026-11-24T15:00:00Z',balanceAmount:29900,transactionKey:'b'}];
 const scope={from:'2026-11-24',to:'2026-11-24'};
 assert.deepEqual(compareSettlements(internal,[],scope),[{orderId,issue:'정산 자료에 주문 누락'}]);
 assert.match(compareSettlements(internal,[internal[0],internal[0]],scope)[0].issue,/중복/);
});

test('기존 금융 이관은 출생정보를 복사하지 않고 보존기간·보류를 적용한다',async()=>{
 const original=view(),archive=view();
 const key='finance/'+orderId+'/'+'a'.repeat(64);
 original.set(key,{orderId,approvedAt:'2019-01-01T00:00:00+09:00',amount:29900,birthDate:'1988-10-08'});
 const source=store(original),target=store(archive);
 assert.deepEqual(await migrateFinance(source,target),{copied:1,alreadyPresent:0,mismatch:0});
 assert.deepEqual(await migrateFinance(source,target),{copied:0,alreadyPresent:1,mismatch:0});
 assert.doesNotMatch(JSON.stringify([...archive.values()]),/1988-10-08/);
 assert.equal(await putLegalIndex(target,{kind:'advertising',reference:'ad-001',closedOn:'2020-02-30'}),false);
 assert.equal(await putLegalIndex(target,{kind:'advertising',reference:'ad-002',closedOn:'2020-02-29'}),true);
 assert.equal(new Date(retentionEnd('advertising','2020-08-31T00:00:00+09:00')).toISOString(),'2021-02-28T15:00:00.000Z');
 assert.equal(new Date(retentionEnd('dispute','2020-02-29T00:00:00+09:00')).toISOString(),'2023-02-28T15:00:00.000Z');
 const now=Date.parse('2026-11-24');
 await target.setJSON('hold/'+orderId,{});
 assert.deepEqual(await purgeArchive(target,now),{deleted:1,failed:0});
 await target.delete('hold/'+orderId);
 assert.deepEqual(await purgeArchive(target,now),{deleted:1,failed:0});
 assert.equal(original.has(key),true);
});
