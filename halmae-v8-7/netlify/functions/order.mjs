import {preparePayappCheckout} from '../lib/payapp-flow.mjs';
import crypto from 'node:crypto';
import {financeStore,orders,json,parse,sign,error} from './shared.mjs';
import {mailConfig,recoveryEmail} from './recovery-mail.mjs';
import {browserCredential,browserHeader,fingerprint,verifiedPurchase} from './entitlement.mjs';
import {findPayment} from './toss.mjs';
import {liveRevoked} from './live-ledger.mjs';
import {normalizeBirth} from './saju.mjs';
import {DAY,ORDER_NAME,PRICE,checkoutScope,paymentConfig} from './payment-config.mjs';
import {contractTerms} from '../lib/commerce-contract.mjs';
import {savePolicy} from '../lib/contract-archive.mjs';
import {campaign, campaignStore, linkCampaign} from '../lib/campaigns.mjs';

export default async req => {
 if (req.method !== 'POST') return json({error:'Method not allowed'},405);
 try {
  const x = await parse(req);
  if (!x || typeof x !== 'object') return json({error:'출생 정보를 확인해 주세요.'},400);
  const name = typeof x.name === 'string' ? x.name.trim() : '';
  if (name.length > 30) return json({error:'이름은 30자 이하로 입력해 주세요.'},400);
  const channel = x.channel ?? 'admin-demo';
  if (!['admin-demo','toss-test','toss-live','payapp-live'].includes(channel)) return json({error:'주문 유형을 확인해 주세요.'},400);
  const config=channel==='admin-demo'?null:paymentConfig(req);
  if (channel!=='admin-demo' && (!config?.salesEnabled || channel!==(config.provider??'toss')+'-'+config.mode)) {
    return json({error:'현재 결제를 시작할 수 없습니다.'},503);
  }
  if (channel==='admin-demo' && process.env.PAYMENT_MODE==='live') return json({error:'관리자 발급은 프리뷰에서만 사용할 수 있습니다.'},403);
 if(config?.mode==='live' && (x.policyVersion!==config.policyVersion || x.policyDigest!==config.policy.digest || x.immediateDelivery!==true)){
    return json({error:'최신 구매 안내를 확인하고 즉시 제공을 요청해 주세요.'},400);
  }
 if(config?.mode==='live' && x.termsAccepted!==true){
   return json({error:'이용약관과 구매 조건을 확인해 주세요.'},400);
 }
  const isPayapp=config?.provider==='payapp';
  const contractEmail=isPayapp?recoveryEmail(x.contractEmail):'';
  const paymentPhone=isPayapp&&typeof x.paymentPhone==='string'?x.paymentPhone.replaceAll('-',''):'';
  if(isPayapp && (!contractEmail || !/^010\d{8}$/.test(paymentPhone))) return json({error:'계약서면 이메일과 결제용 휴대전화 번호를 확인해 주세요.'},400);
  const attempt=typeof x.checkoutAttempt==='string'&&/^[a-f0-9-]{36}$/.test(x.checkoutAttempt)?x.checkoutAttempt:null;
  if (config?.mode==='live' && !attempt) return json({error:'주문 화면에서 다시 시도해 주세요.'},400);
  if (x.consent !== true) return json({error:'정보 처리에 동의해 주세요.'},400);
  const optedIn = Boolean(mailConfig(config)) && x.recoveryConsent === true;
  const email = optedIn ? recoveryEmail(x.email) : '';
  if (optedIn && !email) {
    return json({error:'복구 이메일 주소를 확인해 주세요.'},400);
  }
  let birth;
  try { birth = normalizeBirth(x); }
  catch (e) { return json({error:e.message},400); }
  if (!['male','female'].includes(birth.gender)) return json({error:'성별을 선택해 주세요.'},400);
  const {birthDate,birthTime,gender,calendarType,isLeapMonth,solarDate} = birth;
  const live=config?.mode==='live';
  const credential=config?(live?browserCredential(req,fingerprint('checkout-browser',attempt,config)):browserCredential(req)):null;
  const attemptHash=live?fingerprint('checkout-attempt',attempt,config):'';
  const orderId=live?'HM-'+[attemptHash.slice(0,8),attemptHash.slice(8,12),attemptHash.slice(12,16),
    attemptHash.slice(16,20),attemptHash.slice(20,32)].join('-'):'HM-'+crypto.randomUUID();
  const createdAt=Date.now();
  const fields={orderId,name:name||'손님',birthDate,gender,calendarType,isLeapMonth,solarDate,...(birthTime?{birthTime}:{}),
    amount:PRICE,channel,...(email?{recoveryEmailHash:fingerprint('email',email,config)}:{}),
    ...(credential?{browserHash:fingerprint('browser',credential,config)}:{})};
  const store=orders(config);
  let reused=false;
  let order={...fields,status:'pending',createdAt,...(config?{contractTerms:contractTerms(config)}:{})};
  if(live){
    if(!await savePolicy(financeStore(),config.policy)){
      return json({error:'구매 정책을 확인하는 중이에요. 잠시 후 다시 시도해 주세요.'},503);
    }
    const purchaseFields={...fields};
    delete purchaseFields.recoveryEmailHash;
    const inputHash=fingerprint('checkout-input',JSON.stringify(purchaseFields),config);
    order.inputHash=inputHash;
    if(isPayapp) order.payappContractIdentity=fingerprint('contract-email',contractEmail,config);
    order.policyAcceptance={version:config.policyVersion,acceptedAt:new Date(createdAt).toISOString(),
      immediateDelivery:true,termsAccepted:true};
    const inserted=await store.setJSON(orderId,order,{onlyIfNew:true});
    if(!inserted.modified){
      reused=true;
      order=await store.get(orderId,{type:'json'});
      if(!order || order.inputHash!==inputHash || order.policyAcceptance?.version!==config.policyVersion){
        return json({error:'기존 주문 정보를 확인하거나 새 주문을 시작해 주세요.'},409);
      }
    }
  }else await store.setJSON(orderId,order);
  if(isPayapp){
    if(order.payappContractIdentity!==fingerprint('contract-email',contractEmail,config)) return json({error:'기존 주문의 계약서면 이메일을 확인해 주세요.'},409);
    const checkout=await preparePayappCheckout(store,config,order,paymentPhone,contractEmail);
    const response=json(checkout.body,checkout.status);
    response.headers.set('Set-Cookie',browserHeader(credential,'Lax'));
    return response;
  }
  const result={orderId,amount:PRICE,status:order.status,paymentEnabled:Boolean(config)};
  if(config){
    result.clientKey=config.clientKey;
    result.orderName=ORDER_NAME;
    result.checkoutToken=sign({orderId,scope:checkoutScope(config),exp:order.createdAt+DAY},config.tokenSecret);
    result.successUrl=config.origin+'/payment-result.html';
    result.failUrl=config.origin+'/payment-result.html?failed=1';
    if(live) result.paymentMode='live';
  }
  if(reused){
    if(email && order.recoveryEmailHash!==fields.recoveryEmailHash){
      return json({error:'이 주문의 복구 설정은 처음 결제창을 열 때 정해졌어요. 기존 주문을 이어가려면 새 이메일 등록을 해제해 주세요.'},409);
    }
    if(await verifiedPurchase(config,store,order)) result.paymentAlreadyApproved=true;
    else {
      const provider=await findPayment(config,orderId);
      if(['ABORTED','EXPIRED'].includes(provider?.status) || (!provider && order.createdAt+DAY<=createdAt)){
        return json({error:'이전 결제창이 만료됐어요. 결제 버튼을 다시 눌러 새 주문을 시작해 주세요.',restartCheckout:true},409);
      }
      if(order.createdAt+DAY<=createdAt || order.status==='live-paid' || await liveRevoked(store,order)){
        return json({error:'기존 주문은 결제 결과 화면에서 확인해 주세요.'},409);
      }
    }
  }
  if(live && process.env.CAMPAIGN_MEASUREMENT_ENABLED==='true'){
    try { await linkCampaign(campaignStore(),orderId,campaign(x.attribution)); }
    catch { /* Measurement outages must not interrupt checkout. */ }
  }
  const response = json(result);
  if (credential) response.headers.set('Set-Cookie',browserHeader(credential));
  return response;
 } catch (e) { return error(e); }
};
