import crypto from 'node:crypto';
import {getStore} from '@netlify/blobs';
export const orders=()=>getStore('halmae-orders');
export const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export const parse=async req=>{try{return await req.json()}catch{return {}}};
export const secret=()=>process.env.REPORT_TOKEN_SECRET;
export const sign=payload=>{if(!secret()||secret().length<32)throw Error('REPORT_TOKEN_SECRET 환경변수 설정 필요');const body=Buffer.from(JSON.stringify(payload)).toString('base64url');const sig=crypto.createHmac('sha256',secret()).update(body).digest('base64url');return body+'.'+sig};
export const verify=token=>{if(!secret())return null;const [body,sig,...extra]=String(token||'').split('.');if(!body||!sig||extra.length)return null;const expected=crypto.createHmac('sha256',secret()).update(body).digest();let got;try{got=Buffer.from(sig,'base64url')}catch{return null}if(got.length!==expected.length||!crypto.timingSafeEqual(got,expected))return null;try{const p=JSON.parse(Buffer.from(body,'base64url').toString());return p.exp>Date.now()?p:null}catch{return null}};
export const error=e=>json({error:e.message||'서버 오류'},500);
