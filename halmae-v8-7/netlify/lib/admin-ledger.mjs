import {orderPattern} from '../functions/entitlement.mjs';
import {financeStore,orders} from '../functions/shared.mjs';

export async function scan(store,prefix='',limit=1000){
 const records=[];
 let truncated=false;
 for await(const page of store.list({prefix,paginate:true})){
  const keys=page.blobs.slice(0,limit-records.length);
  truncated=keys.length<page.blobs.length;
  for(let i=0;i<keys.length;i+=12){
   records.push(...await Promise.all(keys.slice(i,i+12).map(async({key})=>({key,value:await store.get(key,{type:'json'})}))));
  }
  if(truncated) break;
 }
 return {records,truncated};
}

export function safeOrder(order){
 return {orderId:order.orderId,status:order.status,amount:order.amount,createdAt:order.createdAt,
  approvedAt:order.approvedAt??null,purchaseExpiresAt:order.purchaseExpiresAt??null,
  recoveryAvailable:Boolean(order.recoveryEmailHash||order.recoveryEmail),
  issuance:order.reportState??(order.status.endsWith('-paid')?'awaiting-first-opening':'pending')};
}

export function summarize(finance){
 const newest=new Map();
 for(const {value} of finance){
  if(!value?.orderId) continue;
  const old=newest.get(value.orderId);
  if(!old || value.balanceAmount<old.balanceAmount ||
    value.balanceAmount===old.balanceAmount && String(value.observedAt)>String(old.observedAt)) newest.set(value.orderId,value);
 }
 const daily={},monthly={};
 const add=(at,kind,value)=>{
  if(!Number.isFinite(Date.parse(at))||!Number.isSafeInteger(value)) return;
  const kst=new Date(Date.parse(at)+9*3600000).toISOString().slice(0,10);
  for(const [table,key] of [[daily,kst],[monthly,kst.slice(0,7)]]){
   const row=table[key]??={gross:0,refund:0};
   row[kind]+=value;
  }
 };
 for(const item of newest.values()){
  add(item.approvedAt,'gross',item.amount);
  const unique=new Map((item.cancellations??[]).filter(cancel=>cancel.cancelStatus==='DONE'&&cancel.transactionKey)
   .map(cancel=>[cancel.transactionKey,cancel]));
  for(const cancel of unique.values()) add(cancel.canceledAt,'refund',cancel.cancelAmount);
 }
 return {daily,monthly,newest};
}

export async function dashboard(config){
 const orderStore=orders(config);
 const raw=await scan(orderStore,'HM-');
 const finance=config.mode==='live'?await scan(financeStore(),'finance/'):{records:[],truncated:false};
 const legacy=config.mode==='live'?await scan(orderStore,'finance/'):{records:[],truncated:false};
 const {newest,daily,monthly}=summarize([...legacy.records,...finance.records]);
 const delivery=new Map((await scan(orderStore,'delivery/')).records.map(({key,value})=>[key.split('/').at(-1),value?.state]));
 const mail=new Map((await scan(orderStore,'recovery/delivery/')).records.map(({key,value})=>[key.split('/').at(-1),value?.state]));
 const list=raw.records.filter(({key,value})=>orderPattern.test(key)&&value).map(({value})=>{
  const row=safeOrder(value);
  const record=newest.get(row.orderId);
  return {...row,issuance:delivery.get(row.orderId)??row.issuance,mail:mail.get(row.orderId)??null,financialStatus:record?.status??null,balanceAmount:record?.balanceAmount??null};
 }).sort((a,b)=>b.createdAt-a.createdAt);
 const issues=list.filter(row=>row.issuance==='retry-needed' || row.mail==='retry-needed' ||
  config.mode==='live' && row.approvedAt && !row.financialStatus ||
  ['CANCELED','PARTIAL_CANCELED'].includes(row.financialStatus));
 return {list,daily,monthly,issues,finance:[...newest.values()].map(row=>({
  orderId:row.orderId,status:row.status,amount:row.amount,balanceAmount:row.balanceAmount,
  approvedAt:row.approvedAt??null,transactionKey:row.transactionKey??null,
 })),truncated:raw.truncated||finance.truncated||legacy.truncated};
}

export function compareSettlements(expected,provided){
 const results=[];
 for(const row of provided){
  if(!row||!orderPattern.test(row.orderId??'')||!Number.isInteger(row.balanceAmount)) throw Error('invalid settlement');
  const internal=expected.find(item=>item.orderId===row.orderId);
  if(!internal || internal.balanceAmount!==row.balanceAmount || internal.transactionKey!==row.transactionKey){
   results.push({orderId:row.orderId,issue:internal?'거래 식별자 또는 잔액 불일치':'내부 거래 없음'});
  }
 }
 return results;
}
