import {saveBirthDraft} from './birth-handoff.js';

export const checkoutKey = 'halmae-test-checkout';
export const reportKey = 'halmae-last-test-report';
const orderKey = 'halmae-preview-order';
const paidOrderKey = 'halmae-last-paid-order';

export function recentPaidOrder() {
  try { return localStorage.getItem(paidOrderKey) || recentOrder(); }
  catch { return recentOrder(); }
}

export function recentOrder() {
  try { return localStorage.getItem(orderKey); }
  catch { return null; }
}

export function rememberOrder(orderId) {
  if (!orderId) return;
  try { localStorage.setItem(orderKey,orderId); }
  catch { /* A buyer can enter their order number manually. */ }
}

const conversionKey = 'halmae-conversion-counts';
const variantKey = 'halmae-reading-variant';
const variants = new Set(['ledger','story']);
const events = new Set([
  'free_reading_start','free_reading_success','ledger_preview_mid','ledger_preview_end',
  'checkout_click','checkout_view','report_sample_view','test_order_created',
  'test_payment_open','test_payment_cancel','test_payment_failure','test_payment_success',
  'test_report_view',
]);

export function readingVariant(preferred='ledger') {
  const variant = variants.has(preferred) ? preferred : 'ledger';
  try {
    const saved = sessionStorage.getItem(variantKey);
    if (variants.has(saved)) return saved;
    sessionStorage.setItem(variantKey,variant);
  } catch { /* The page keeps its configured variant if storage is unavailable. */ }
  return variant;
}

export function recordConversion(event) {
  if (!events.has(event)) return;
  try {
    const key = conversionKey+':'+readingVariant();
    const stored = JSON.parse(sessionStorage.getItem(key) || '{}');
    const counts = Object.fromEntries([...events].filter(name=>Number.isSafeInteger(stored?.[name])&&stored[name]>=0)
      .map(name=>[name,stored[name]]));
    counts[event] = (counts[event] || 0) + 1;
    sessionStorage.setItem(key,JSON.stringify(counts));
  } catch { /* Counters are optional and stay in this tab. */ }
}

export async function post(name, body, token) {
  const headers = {'Content-Type':'application/json'};
  if (token) headers.Authorization = 'Bearer '+token;
  const response = await fetch('/.netlify/functions/'+name,{
    method:'POST',headers,body:JSON.stringify(body),
  });
  let result;
  try { result = await response.json(); }
  catch { throw Error('연결이 잠시 끊겼어요. 잠시 후 다시 시도해 주세요.'); }
  if (!response.ok) {
    const error=Error(result.error || '요청을 처리하지 못했습니다.');
    error.status=response.status;
    error.restartCheckout=result.restartCheckout===true;
    throw error;
  }
  return result;
}

export const callbackKey = 'halmae-test-payment-callback';

export function rememberReport(result) {
  rememberOrder(result.orderId);
  if(result.orderId){
    try { localStorage.setItem(paidOrderKey,result.orderId); }
    catch { /* Reopening is available through the order number or recovery email. */ }
  }
  try { sessionStorage.setItem(reportKey,JSON.stringify(result)); }
  catch { /* A report link still works without browser storage. */ }
}

export function forgetCheckout() {
  removeSessionKeys([checkoutKey,callbackKey]);
}


function removeSessionKeys(keys) {
  try { for (const key of keys) sessionStorage.removeItem(key); }
  catch { /* Storage is already inaccessible. */ }
}

export function forgetReport() {
  removeSessionKeys([reportKey]);
}

export function clearPurchaseStorage() {
  saveBirthDraft(null);
  forgetCheckout();
  forgetCheckoutAttempt();
  forgetReport();
  removeSessionKeys([conversionKey,variantKey,...[...variants].map(variant=>conversionKey+':'+variant)]);
  try {
    localStorage.removeItem(orderKey);
    localStorage.removeItem(paidOrderKey);
  } catch { /* Storage is inaccessible. */ }
}

// One attempt per tab survives payment return and retry without retaining form values.
const attemptStorageKey='halmae-live-checkout-attempt';
let memoryAttempt;
export function checkoutAttempt(){
  if(memoryAttempt) return memoryAttempt;
  try { memoryAttempt=sessionStorage.getItem(attemptStorageKey); } catch { /* Use memory. */ }
  if(!memoryAttempt){
    memoryAttempt=crypto.randomUUID();
    try { sessionStorage.setItem(attemptStorageKey,memoryAttempt); } catch { /* Use memory. */ }
  }
  return memoryAttempt;
}
export function forgetCheckoutAttempt(){
  memoryAttempt=undefined;
  removeSessionKeys([attemptStorageKey]);
}
