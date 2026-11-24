import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {adminStore} from '../functions/shared.mjs';
import {paymentConfig} from '../functions/payment-config.mjs';

const derive=promisify(scrypt);
const sha=value=>createHash('sha256').update(value).digest('hex');
const random=()=>randomBytes(32).toString('hex');
const lifetime=1800;
const cookieName='__Host-halmae-operator';

export function adminConfig(req){
 const provider=paymentConfig(req);
 if(!provider || process.env.OPS_ADMIN_ENABLED!=='true') return null;
 const hash=process.env[provider.mode==='live'?'OPS_LIVE_PASSWORD_HASH':'OPS_PREVIEW_PASSWORD_HASH'];
 if(!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash??'') || hash===process.env.OPS_LIVE_PASSWORD_HASH && hash===process.env.OPS_PREVIEW_PASSWORD_HASH) return null;
 return {provider,hash,store:adminStore(provider.mode)};
}

export async function passwordMatches(input,hash){
 if(typeof input!=='string'||input.length>256) return false;
 const [salt,expected]=hash.split(':');
 const key=await derive(input,Buffer.from(salt,'hex'),64);
 return timingSafeEqual(key,Buffer.from(expected,'hex'));
}

export function cookie(value=''){
 return cookieName+'='+value+'; Path=/; Max-Age='+(value?lifetime:0)+'; Secure; HttpOnly; SameSite=Strict';
}

export async function createSession(config){
 const id=random();
 const key='session/'+sha(id);
 const session={csrf:random(),expiresAt:Date.now()+lifetime*1000,passwordVersion:sha(config.hash)};
 await config.store.setJSON(key,session,{onlyIfNew:true});
 return {id,session};
}

export async function sessionFor(req,config){
 const id=(req.headers.get('cookie')??'').split(';').map(part=>part.trim())
  .find(part=>part.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 if(!/^[a-f0-9]{64}$/.test(id??'')) return null;
 const key='session/'+sha(id);
 const session=await config.store.get(key,{type:'json'});
 return session?.expiresAt>Date.now() && session.passwordVersion===sha(config.hash)?{key,...session}:null;
}

// Fixed windows reserve individual slots atomically, including concurrent invocations.
export async function rateAllowed(store,scope,limit,interval=60_000){
 const expiresAt=(Math.floor(Date.now()/interval)+1)*interval;
 const bucket='rate/'+sha(scope)+'/'+expiresAt+'/';
 for(let i=0;i<limit;i++){
  if((await store.setJSON(bucket+i,{expiresAt},{onlyIfNew:true})).modified) return true;
 }
 return false;
}

export async function audit(store,action,outcome,orderId){
 const at=new Date().toISOString();
 await store.setJSON('audit/'+at+'/'+random(),{at,action,outcome,...(orderId?{orderId}:{})},{onlyIfNew:true});
}
