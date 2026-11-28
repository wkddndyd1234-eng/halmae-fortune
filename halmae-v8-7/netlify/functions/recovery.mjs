import {error,json,orders,parse,verifyProvider} from './shared.mjs';
import {paymentConfig,recoveryScope} from './payment-config.mjs';
import {eligibleOrder,fingerprint,orderPattern,reportLink,verifiedPurchase} from './entitlement.mjs';
import {mailConfig,recoveryEmail,sendRecovery} from './recovery-mail.mjs';

const accepted = () => json({accepted:true},202);
const denied = () => json({error:'유효한 구매 또는 복구 링크를 확인하지 못했습니다. 필요하면 새 링크를 요청해 주세요.'},403);
const interval = 15*60_000;

export default async req => {
  const config = paymentConfig(req);
  const mail = mailConfig(config);
  if (req.method === 'GET') return json({enabled:Boolean(mail),...(config?.mode==='live'?{paymentMode:'live'}:{})});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405);
  if (!mail) return json({error:'이메일 복구는 현재 제공되지 않습니다.'},503);
  try {
    const input = await parse(req);
    const exchange = input?.action === 'exchange';
    if (!exchange && input?.action !== 'request') return json({error:'복구 요청을 확인해 주세요.'},400);
    const claim = exchange ? verifyProvider(input.token,config) : null;
    const orderId = exchange ? claim?.orderId : input.orderId;
    if (typeof orderId !== 'string' || !orderPattern.test(orderId) ||
        (exchange && claim?.scope !== recoveryScope(config))) return exchange ? denied() : accepted();
    const store = orders(config);
    const order = await store.get(orderId,{type:'json'});
    if (!eligibleOrder(order,orderId,config) || !(order.recoveryEmailHash || order.recoveryEmail) ||
        config.mode==='live' && await store.get('optout/'+orderId,{type:'json'})) {
      return exchange ? denied() : accepted();
    }
    if (!exchange) {
      const email = recoveryEmail(input.email);
      const expected = order.recoveryEmailHash ?? fingerprint('email',order.recoveryEmail,config);
      if (!email || fingerprint('email',email,config) !== expected) return accepted();
      try {
        const now = Date.now();
        const windowEnd = (Math.floor(now/interval)+1)*interval;
        const rateKey = 'recovery/rate/'+orderId+'/'+windowEnd;
        const limit = await store.setJSON(rateKey,{expiresAt:windowEnd},{onlyIfNew:true});
        if (!limit.modified) return accepted();
        let purchase;
        try {
          purchase = await verifiedPurchase(config,store,order);
        } finally {
          // Before an email is attempted, a later approval or retry may recover this order.
          if (!purchase) await store.delete(rateKey);
        }
        if (purchase){
          const at=Date.now();
          if(config.mode!=='live') await sendRecovery(mail,purchase,email,rateKey);
          else {
            const marker='recovery/delivery/'+orderId;
            for(let attempt=1;attempt<=2;attempt++){
              if(await store.get('optout/'+orderId,{type:'json'})) break;
              try {
                await sendRecovery(mail,purchase,email,rateKey,at);
                await store.setJSON(marker,{state:'sent',attempt,at});
                break;
              }catch(error){
                await store.setJSON(marker,{state:'retry-needed',attempt,at});
                if(error.status===429) break;
              }
            }
          }
        }
      } catch { /* Return the same public response for unmatched, expired and failed requests. */ }
      return accepted();
    }
    const purchase = await verifiedPurchase(config,store,order);
    if (!purchase || claim.exp<=Date.now()) return denied();
    const marker = 'recovery/used/'+fingerprint('consumed',input.token,config);
    const consumed = await store.setJSON(marker,{expiresAt:claim.exp},{onlyIfNew:true});
    const link = consumed.modified && reportLink(purchase,Date.now(),config);
    return link ? json(link) : denied();
  } catch(e) {
    return error(e);
  }
};
