import {campaignContext, campaignEnabled, campaignStore, recordStage} from '../lib/campaigns.mjs';
import {json, parse} from './shared.mjs';

export default async req => {
 if(req.method!=='POST') return json({},405);
 const origin=new URL(req.url).origin;
 if(!campaignEnabled(req) || req.headers.get('origin')!==origin ||
    req.headers.get('sec-fetch-site')!=='same-origin' ||
    !req.headers.get('content-type')?.startsWith('application/json')) return json({},403);
 const input=await parse(req);
 const context=campaignContext(input?.context);
 if(!context) return json({},400);
 try{
  if(!await recordStage(campaignStore(),context,input.stage)) return json({},400);
  return json({ok:true});
 }catch{return json({},503);}
};
