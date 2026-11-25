import {createHash} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {financeStore,orders} from '../functions/shared.mjs';
import {paymentConfig,PRICE} from '../functions/payment-config.mjs';
import {scan,summarize} from './admin-ledger.mjs';

export const stages=['home_view','reading_start','reading_complete','purchase_click','checkout_view'];
const slug=/^[a-z][a-z0-9_-]{0,47}$/;
export const campaignStore=()=>getStore({name:'halmae-live-campaigns',consistency:'strong'});
export const campaignEnabled=req=>process.env.CAMPAIGN_MEASUREMENT_ENABLED==='true' && paymentConfig(req)?.mode==='live';

export function campaign(value){
 if(!['source','medium','campaign'].every(key=>typeof value?.[key]==='string'&&slug.test(value[key]))) return null;
 const {source,medium,campaign}=value;
 return {source,medium,campaign};
}

export function campaignContext(value){
 const attribution=campaign(value?.attribution);
 if(!attribution || typeof value?.visit!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value.visit)) return null;
 return {attribution,visit:value.visit};
}

const group=value=>value?[value.source,value.medium,value.campaign].join('/'):null;
const digest=value=>createHash('sha256').update(value).digest('hex');
const orderKey=orderId=>'order/'+digest(orderId);

export async function recordStage(store,context,stage){
 if(!stages.includes(stage)) return false;
 const key='stage/'+stage+'/'+group(context.attribution)+'/'+digest(context.visit);
 await store.setJSON(key,true,{onlyIfNew:true});
 return true;
}

export async function linkCampaign(store,orderId,attribution){
 await store.setJSON(orderKey(orderId),{attribution},{onlyIfNew:true});
}

export async function setSpend(store,attribution,spend){
 if(!attribution || !Number.isSafeInteger(spend) || spend<0 || spend>1_000_000_000) return false;
 await store.setJSON('spend/'+group(attribution),{attribution,spend});
 return true;
}

export async function campaignReport(store,verified,stageRecords,spendRecords){
 const rows=new Map();
 const rowFor=attribution=>{
  const key=group(attribution);
  if(!rows.has(key)) rows.set(key,{attribution,events:Object.fromEntries(stages.map(stage=>[stage,0])),
   approved:0,gross:0,refund:0,netSales:0,spend:null,estimatedContribution:null});
  return rows.get(key);
 };
 for(const {key} of stageRecords){
  const [,stage,source,medium,name]=key.split('/');
  const attribution=campaign({source,medium,campaign:name});
  if(attribution&&stages.includes(stage)) rowFor(attribution).events[stage]++;
 }
 for(const {value} of spendRecords){
  const attribution=campaign(value?.attribution);
  if(attribution&&Number.isSafeInteger(value.spend)) rowFor(attribution).spend=value.spend;
 }
 const eligible=[...summarize(verified).newest.values()].filter(item=>
  ['DONE','PARTIAL_CANCELED','CANCELED'].includes(item.status) &&
  Number.isFinite(Date.parse(item.approvedAt)) && item.amount===PRICE &&
  Number.isSafeInteger(item.balanceAmount) && item.balanceAmount>=0 && item.balanceAmount<=item.amount);
 for(let i=0;i<eligible.length;i+=12){
  await Promise.all(eligible.slice(i,i+12).map(async item=>{
   const link=await store.get(orderKey(item.orderId),{type:'json'});
   const row=rowFor(campaign(link?.attribution));
   row.approved++;
   row.gross+=item.amount;
   row.refund+=item.amount-item.balanceAmount;
   row.netSales+=item.balanceAmount;
  }));
 }
 for(const row of rows.values()){
  if(row.spend!==null) row.estimatedContribution=row.netSales-row.spend;
 }
 return [...rows.values()];
}

export async function loadCampaignReport(config,store){
 const [stages,spend,current,legacy]=await Promise.all([
  listStageKeys(store),scan(store,'spend/'),scan(financeStore(),'finance/',10000),scan(orders(config),'finance/',10000),
 ]);
 return {rows:await campaignReport(store,[...legacy.records,...current.records],stages.records,spend.records),
  truncated:[stages,spend,current,legacy].some(result=>result.truncated)};
}

async function listStageKeys(store){
 const records=[];
 for await(const {blobs} of store.list({prefix:'stage/',paginate:true})){
  const remaining=100000-records.length;
  records.push(...blobs.slice(0,remaining));
  if(blobs.length>remaining) return {records,truncated:true};
 }
 return {records,truncated:false};
}
