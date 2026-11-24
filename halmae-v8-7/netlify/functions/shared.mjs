import crypto from 'node:crypto';
import {getStore} from '@netlify/blobs';
export const orders=config=>config?.mode==='live'?getStore({name:'halmae-live-orders',consistency:'strong'}):getStore('halmae-orders');
export const financeStore=()=>getStore({name:'halmae-live-finance',consistency:'strong'});
export const adminStore=mode=>getStore({name:'halmae-admin-'+mode,consistency:'strong'});
export const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export const parse=async req=>{try{return await req.json()}catch{return {}}};
export const secret=()=>process.env.REPORT_TOKEN_SECRET;
export const sign=(payload,key=secret())=>{if(!key||key.length<32)throw Error('REPORT_TOKEN_SECRET 환경변수 설정 필요');const body=Buffer.from(JSON.stringify(payload)).toString('base64url');const sig=crypto.createHmac('sha256',key).update(body).digest('base64url');return body+'.'+sig};
export const verify=(token,key=secret())=>{if((key?.length??0)<32||typeof token!=='string'||token.length>2048)return null;const [body,sig,...extra]=String(token||'').split('.');if(!body||!sig||extra.length)return null;const expected=crypto.createHmac('sha256',key).update(body).digest();let got;try{got=Buffer.from(sig,'base64url')}catch{return null}if(got.length!==expected.length||!crypto.timingSafeEqual(got,expected))return null;try{const p=JSON.parse(Buffer.from(body,'base64url').toString());return p.exp>Date.now()?p:null}catch{return null}};
export const error=()=>json({error:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'},500);

export function verifyProvider(token,config){
 const current=verify(token,config?.tokenSecret);
 if(current || config?.mode!=='live') return current;
 const until=Date.parse(process.env.LIVE_PREVIOUS_SIGNING_UNTIL??'');
 const previous=process.env.LIVE_PREVIOUS_REPORT_TOKEN_SECRET;
 return Number.isFinite(until)&&Date.now()<until&&(previous?.length??0)>=32&&previous!==secret()
  ? verify(token,previous):null;
}
