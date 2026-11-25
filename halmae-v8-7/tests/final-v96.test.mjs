import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {merchantReady} from '../netlify/functions/payment-config.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';

const fixture={LIVE_MERCHANT_DISCLOSURES_APPROVED:'true',LIVE_SUPPORT_PHONE:'02-0000-0000',
 LIVE_MAIL_ORDER_NUMBER:'2026-가상구-0000',LIVE_PRIVACY_OFFICER:'가상 검증'};

test('사업자 공개 정보의 누락과 미승인은 신규 판매를 잠근다',()=>{
 assert.equal(merchantReady(fixture),true);
 for(const key of Object.keys(fixture)) assert.equal(merchantReady({...fixture,[key]:''}),false,key);
 for(const placeholder of ['지정 대기','미정','TBD']) assert.equal(merchantReady({...fixture,LIVE_PRIVACY_OFFICER:placeholder}),false);
});

test('사업자 공개 페이지에는 제공된 식별 정보만 정적으로 포함한다',async()=>{
 const html=await readFile(new URL('../merchant.html',import.meta.url),'utf8');
 for(const item of ['244-86-02709','장철근','402-S36호','평일 10:00~18:00']) assert.ok(html.includes(item));
 assert.doesNotMatch(html,/미정|지정 대기|주소 변경 처리 중|LIVE_SUPPORT_PHONE/);
});

test('사업운은 일간과 해당 월의 십성에 따라 서로 다른 해석을 제공한다',()=>{
 const input={gender:'male',birthTime:'02:00'};
 const report=date=>buildFortuneReport({...input,birthDate:date});
 const business=date=>report(date).chapters[14].groups.find(group=>group.title==='사업운').paragraphs[0];
 assert.notEqual(business('1992-01-21'),business('1992-01-22'));
});

test('운영 삭제 경보는 실패가 있을 때만 발송하고 고객 정보를 넣지 않는다',async t=>{
 const {notifyRetention}=await import('../netlify/lib/retention-alert.mjs');
 const saved=Object.fromEntries(['OPS_RETENTION_ALERT_EMAIL','LIVE_RECOVERY_RESEND_API_KEY','LIVE_RECOVERY_FROM_EMAIL']
  .map(key=>[key,process.env[key]]));
 t.after(()=>{for(const [key,value] of Object.entries(saved)){if(value===undefined) delete process.env[key];else process.env[key]=value;}});
 Object.assign(process.env,{OPS_RETENTION_ALERT_EMAIL:'ops@example.test',
  LIVE_RECOVERY_RESEND_API_KEY:'mock-alert-key',LIVE_RECOVERY_FROM_EMAIL:'alerts@example.test'});
 const sent=[];
 t.mock.method(globalThis,'fetch',async (url,options)=>{
  assert.equal(url,'https://api.resend.com/emails');
  sent.push(JSON.parse(options.body));
  return Response.json({id:'mock'});
 });
 const provider={mode:'live',origin:'https://shop.example.test'};
 assert.equal(await notifyRetention(provider,{failed:0}),false);
 assert.equal(await notifyRetention(provider,{failed:1,details:['customer@example.test','1988-10-08']}),true);
 assert.equal(sent.length,1);
 assert.deepEqual(sent[0].to,['ops@example.test']);
 assert.doesNotMatch(sent[0].text,/customer@example\.test|1988-10-08/);
});
