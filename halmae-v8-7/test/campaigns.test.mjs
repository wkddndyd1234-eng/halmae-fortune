import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {scan} from '../netlify/lib/admin-ledger.mjs';
import {campaign, campaignContext, campaignReport, linkCampaign, recordStage, setSpend} from '../netlify/lib/campaigns.mjs';

const attribution={source:'naver',medium:'cpc',campaign:'newyear_2027'};

test('campaign storage allows just campaign fields and deduplicates stages on retry',async()=>{
 const store=getStore('campaign-stage-fixture');
 const context=campaignContext({attribution:{...attribution,email:'hidden@example.com'},visit:randomUUID(),birthDate:'1992-01-21'});
 assert.deepEqual(context.attribution,attribution);
 assert.equal(campaign({...attribution,campaign:'hidden@example.com'}),null);
 assert.equal(campaignContext({attribution,visit:'not-an-id'}),null);
 await Promise.all([recordStage(store,context,'reading_start'),recordStage(store,context,'reading_start')]);
 assert.equal(await recordStage(store,context,'payment_approved'),false);
 await recordStage(store,context,'reading_complete');
 const {records}=await scan(store);
 assert.equal(records.length,2);
 assert.ok(records.every(row=>row.value===true&&row.key.includes('/naver/cpc/newyear_2027/')));
 assert.ok(records.every(row=>!row.key.includes(context.visit)));
});

test('campaign revenue counts a verified order once and reflects partial and full refunds',async()=>{
 const store=getStore('campaign-finance-fixture');
 const orderId='fixture-order';
 await linkCampaign(store,orderId,attribution);
 await linkCampaign(store,orderId,{...attribution,campaign:'different'});
 assert.equal(await setSpend(store,attribution,-1),false);
 assert.equal(await setSpend(store,attribution,5000),true);
 const spend=(await scan(store,'spend/')).records;
 const order={orderId,status:'DONE',amount:39900,balanceAmount:39900,approvedAt:'2026-11-25T12:00:00Z'};
 const approved={value:order};
 const partial={value:{...order,status:'PARTIAL_CANCELED',balanceAmount:29900}};
 const full={value:{...order,status:'CANCELED',balanceAmount:0}};
 const [row]=await campaignReport(store,[approved,approved,partial,approved],[],spend);
 assert.deepEqual([row.approved,row.gross,row.refund,row.netSales,row.spend,row.estimatedContribution],
  [1,39900,10000,29900,5000,24900]);
 const [refunded]=await campaignReport(store,[full,partial,approved],[],spend);
 assert.deepEqual([refunded.approved,refunded.refund,refunded.estimatedContribution],[1,39900,-5000]);
 const [unattributed]=await campaignReport(store,[{value:{...order,orderId:'old-order'}},
  {value:{...order,orderId:'pending-order',status:'IN_PROGRESS'}}],[],[]);
 assert.deepEqual([unattributed.attribution,unattributed.approved,unattributed.spend],[null,1,null]);
});
