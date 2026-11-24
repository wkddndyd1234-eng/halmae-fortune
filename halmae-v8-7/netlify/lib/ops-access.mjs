import {isIP} from 'node:net';
import {createHmac,timingSafeEqual} from 'node:crypto';

export function allowedOperatorIp(ip,configured=process.env.OPS_LIVE_ALLOWED_IPS){
 const allow=(configured??'').split(',').map(item=>item.trim());
 return Boolean(isIP(ip??'')&&allow.includes(ip));
}

export function totpCode(secret,counter){
 const value=Buffer.alloc(8);
 value.writeBigUInt64BE(BigInt(counter));
 const digest=createHmac('sha1',secret).update(value).digest();
 return String((digest.readUInt32BE(digest.at(-1)&15)&0x7fffffff)%1_000_000).padStart(6,'0');
}

export async function consumeTotp(store,secretHex,code,now=Date.now()){
 if(!/^[a-f0-9]{40,128}$/i.test(secretHex??'')||secretHex.length%2||!/^\d{6}$/.test(code??'')) return false;
 const secret=Buffer.from(secretHex,'hex');
 const supplied=Buffer.from(code);
 const current=Math.floor(now/30_000);
 for(const counter of [current,current-1,current+1]){
  if(counter<0||!timingSafeEqual(supplied,Buffer.from(totpCode(secret,counter)))) continue;
  const event=await store.setJSON('rate/mfa/'+counter,{expiresAt:(counter+2)*30_000},{onlyIfNew:true});
  return event.modified;
 }
 return false;
}

export async function boundedJson(req,maxBytes=32768){
 if(!req.body) return null;
 const reader=req.body.getReader();
 const decoder=new TextDecoder();
 let bytes=0,text='';
 try{
  for(;;){
   const chunk=await reader.read();
   if(chunk.done) return JSON.parse(text+decoder.decode());
   bytes+=chunk.value.byteLength;
   if(bytes>maxBytes){
    await reader.cancel();
    return null;
   }
   text+=decoder.decode(chunk.value,{stream:true});
  }
 }catch {return null;}
 finally {reader.releaseLock();}
}
