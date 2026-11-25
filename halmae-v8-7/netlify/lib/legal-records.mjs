import {createHash} from 'node:crypto';

const prefixPattern=/^finance\/(HM-[a-f0-9-]{36})\/[a-f0-9]{64}$/;
const referencePattern=/^[A-Za-z0-9_-]{1,80}$/;
const kinds=new Set(['advertising','contract','dispute','payment']);

export function retentionEnd(kind,at){
 const time=typeof at==='number'?at:Date.parse(at);
 if(!kinds.has(kind)||!Number.isFinite(time)) return null;
 const local=new Date(time+9*3600000);
 const year=local.getUTCFullYear(),month=local.getUTCMonth(),day=local.getUTCDate();
 const monthStart=new Date(Date.UTC(year,month+(kind==='advertising'?6:kind==='dispute'?36:60),1));
 const last=new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth()+1,0)).getUTCDate();
 // Retain through the final KST calendar day.
 return Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth(),Math.min(day,last)+1)-9*3600000;
}

export async function putLegalIndex(store,input){
 const {kind,reference,closedOn}=input;
 if(!kinds.has(kind)||kind==='payment'||typeof reference!=='string'||!referencePattern.test(reference)||
  !/^\d{4}-\d{2}-\d{2}$/.test(closedOn??'')) return false;
 const date=new Date(closedOn+'T00:00:00Z');
 if(!Number.isFinite(date.valueOf())||date.toISOString().slice(0,10)!==closedOn||date.valueOf()>Date.now()+9*3600000) return false;
 const key='legal/'+kind+'/'+reference;
 const expiresAt=retentionEnd(kind,closedOn+'T00:00:00+09:00');
 const record={kind,reference,closedOn,expiresAt};
 const result=await store.setJSON(key,record,{onlyIfNew:true});
 if(result.modified) return true;
 const existing=await store.get(key,{type:'json'});
 return existing?.closedOn===closedOn&&existing.expiresAt===expiresAt;
}

export async function migrateFinance(source,target){
 const counts={copied:0,alreadyPresent:0,mismatch:0};
 for await(const page of source.list({prefix:'finance/',paginate:true})){
  for(const {key} of page.blobs){
   const row=await source.get(key,{type:'json'});
   if(!prefixPattern.test(key)||!row||row.orderId!==prefixPattern.exec(key)[1]){counts.mismatch++;continue;}
   // Explicit allowlist, including the historical transaction values only.
   const fields=['orderId','merchantId','paymentKey','status','currency','method','amount','balanceAmount','approvedAt','transactionKey','observedAt'];
   const safe=Object.fromEntries(fields.filter(field=>field in row).map(field=>[field,row[field]]));
   safe.cancellations=(row.cancellations??[]).map(({transactionKey,cancelAmount,canceledAt,cancelStatus})=>({transactionKey,cancelAmount,canceledAt,cancelStatus}));
   const digest=createHash('sha256').update(JSON.stringify(safe)).digest('hex');
   const destination='migration/'+safe.orderId+'/'+key.split('/').at(-1);
   const previous=await target.get(destination,{type:'json'});
   if(previous && previous.digest!==digest){counts.mismatch++;continue;}
   if(previous){
    const verified=await target.get(previous.financeKey,{type:'json'});
    if(JSON.stringify(verified)===JSON.stringify(safe)) counts.alreadyPresent++;
    else counts.mismatch++;
    continue;
   }
   const financeKey='finance/'+safe.orderId+'/'+digest;
   await target.setJSON(financeKey,safe,{onlyIfNew:true});
   const verified=await target.get(financeKey,{type:'json'});
   if(JSON.stringify(verified)!==JSON.stringify(safe)){counts.mismatch++;continue;}
   const result=await target.setJSON(destination,{digest,financeKey},{onlyIfNew:true});
   counts[result.modified?'copied':'alreadyPresent']++;
  }
 }
 return counts;
}

export async function purgeArchive(store,now=Date.now()){
 const counts={deleted:0,failed:0};
 for(const prefix of ['legal/','finance/','contract/']){
  for await(const page of store.list({prefix,paginate:true})){
   for(const {key} of page.blobs){
    try{
     const entry=await store.get(key,{type:'json'});
     if(!entry) continue;
    const ref=prefix==='legal/'?entry.reference:entry.orderId;
     if(!ref||await store.get('hold/'+ref,{type:'json'})) continue;
     const dates=[entry.approvedAt,...(entry.cancellations??[]).map(row=>row.canceledAt)]
      .map(value=>Date.parse(value)).filter(Number.isFinite);
     const expiry=prefix==='legal/'?entry.expiresAt:dates.length?retentionEnd('payment',Math.max(...dates)):null;
     if(Number.isFinite(expiry)&&expiry<=now){
      await store.delete(key);
      counts.deleted++;
     }
    }catch{counts.failed++;}
   }
  }
 }
 return counts;
}
