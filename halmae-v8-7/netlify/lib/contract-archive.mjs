import {createHash} from 'node:crypto';
import {contractDocument} from './commerce-contract.mjs';

const kinds=['terms','privacy','refund'];
const versionPattern=/^[a-zA-Z0-9._-]{1,50}$/;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function policyArchive(raw,version,urls){
 if(!versionPattern.test(version??'') || typeof raw!=='string' || Buffer.byteLength(raw)>96_000) return null;
 try{
  const value=JSON.parse(raw);
  if(value.version!==version || !kinds.every(key=>urls[key] && value[key]?.url===urls[key] &&
     typeof value[key]?.text==='string' && value[key].text.trim() && Buffer.byteLength(value[key].text)<=30_000)) return null;
  const documents=Object.fromEntries(kinds.map(key=>[key,{url:value[key].url,text:value[key].text}]));
  return {version,documents,digest:digest(documents)};
 }catch{return null;}
}

async function immutable(store,key,value){
 if((await store.setJSON(key,value,{onlyIfNew:true})).modified) return true;
 return digest(await store.get(key,{type:'json'}))===digest(value);
}

export const savePolicy=(store,policy)=>immutable(store,'policy/'+policy.version,policy);

export async function saveContract(store,order){
 if(!order.contractTerms?.policyDigest) return true;
 const document=contractDocument(order);
 return document && await immutable(store,'contract/'+order.orderId,document);
}

export async function withPolicyOriginals(store,document){
 if(!document?.policyDigest) return document;
 const policy=await store.get('policy/'+document.policyVersion,{type:'json'});
 if(!policy || policy.digest!==document.policyDigest || digest(policy.documents)!==document.policyDigest) return null;
 return {...document,policyOriginals:policy.documents};
}
