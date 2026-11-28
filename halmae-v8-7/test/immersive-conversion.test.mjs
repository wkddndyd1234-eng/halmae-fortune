import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {ledgerPreview} from '../netlify/functions/ledger-preview.mjs';
import {concernReading} from '../netlify/functions/immersion.mjs';
import {readPersonalReading} from '../free-insights.js';
import {approvedPayment} from '../netlify/functions/toss.mjs';

test('ten synthetic charts retain 26 distinct openers and actual excerpts for all concern choices',()=>{
 const personalities=new Set();
 const annual=new Set();
 const topics=['money','work','love','people','future','custom',''];
 for(let i=0;i<10;i++){
  const input={name:'가상고객',birthDate:new Date(Date.UTC(1980+i*2,i,12+i)).toISOString().slice(0,10),
   birthTime:i%3===0?'':i%2?'07:15':'22:20',gender:i%2?'female':'male'};
  const chart=fortuneCycles(input);
  const book=buildFortuneReport(input);
  const reading=readPersonalReading(chart,chart.saju,'');
  const {excerpt}=ledgerPreview(chart.saju);
  personalities.add(reading.temperament);
  annual.add(excerpt);
  assert.equal(book.chapters.length,26);
  assert.equal(new Set(book.chapters.map(c=>c.opening)).size,26);
  assert.ok(book.chapters.slice(14).every(chapter=>chapter.groups.length===6));
  assert.ok(book.chapters[13].paragraphs.includes(excerpt));
  for(const topic of topics){
   const result=concernReading(topic,reading,excerpt);
   if(!topic){assert.equal(result,null);continue;}
   const chapter=book.chapters[result.chapter];
   assert.ok(chapter.opening===result.teaser||chapter.paragraphs.includes(result.teaser));
   assert.ok(result.advice.length>35);
  }
 }
 assert.ok(personalities.size>5);
 assert.ok(annual.size>5);
});

test('Toss approves only the exact stored price for legacy and newly priced orders',()=>{
 const config={mode:'live'};
 const payment={orderId:'fixture',paymentKey:'payment',status:'DONE',currency:'KRW',method:'카드',
  approvedAt:'2026-11-27T00:00:00Z',totalAmount:39900,balanceAmount:39900};
 assert.equal(approvedPayment(payment,'fixture','payment',config,39900),true);
 assert.equal(approvedPayment(payment,'fixture','payment',config,29900),false);
 assert.equal(approvedPayment({...payment,totalAmount:29900,balanceAmount:29900},'fixture','payment',config,29900),true);
});
