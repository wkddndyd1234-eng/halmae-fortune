import {json,orders} from './shared.mjs';
import {DAY,paymentConfig} from './payment-config.mjs';
import {eligibleOrder,orderPattern,storedExpiry,verifiedPurchase} from './entitlement.mjs';

export const config = {schedule:'@daily'};

export async function purgePreviewRecords(store,provider,now=Date.now()) {
  let deleted = 0;
  let failed = 0;
  for await (const page of store.list({paginate:true})) {
    for (const {key} of page.blobs) {
      const marker = /^recovery\/(rate|used)\//.test(key);
      if (!marker && !orderPattern.test(key)) continue;
      try {
        const order = await store.get(key,{type:'json'});
        if (!order) continue;
        if (marker) {
          if (!(order.expiresAt+DAY<=now)) continue;
        } else if (order.channel === 'toss-test' && order.status === 'test-paid') {
          if (!(storedExpiry(order)<=now)) continue;
        } else {
          if (!(order.createdAt+30*DAY<=now)) continue;
          if (eligibleOrder(order,key) && await verifiedPurchase(provider,store,order)) continue;
          if (order.channel && !['admin-demo','toss-test'].includes(order.channel)) continue;
          if (!['pending','demo'].includes(order.status)) continue;
        }
        await store.delete(key);
        deleted++;
      } catch {
        failed++;
      }
    }
  }
  return {deleted,failed};
}

export default async () => {
  const {PREVIEW_RETENTION_ENABLED,BRANCH,URL} = process.env;
  if (PREVIEW_RETENTION_ENABLED !== 'true' || BRANCH !== 'test-v87' ||
      URL !== 'https://halmae-fortune-v87-preview.netlify.app') return json({enabled:false});
  const provider = paymentConfig(new Request(URL));
  if (!provider) return json({enabled:false});
  const result = await purgePreviewRecords(orders(),provider);
  return json(result,result.failed ? 503 : 200);
};
