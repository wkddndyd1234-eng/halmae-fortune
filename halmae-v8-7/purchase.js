export const checkoutKey = 'halmae-test-checkout';
export const reportKey = 'halmae-last-test-report';
const orderKey = 'halmae-preview-order';

export function recentOrder() {
  try { return localStorage.getItem(orderKey); }
  catch { return null; }
}

export function rememberOrder(orderId) {
  if (!orderId) return;
  try { localStorage.setItem(orderKey,orderId); }
  catch { /* A buyer can enter their order number manually. */ }
}

export function recordConversion(event) {
  try {
    const key = 'halmae-conversion-counts';
    const counts = JSON.parse(sessionStorage.getItem(key) || '{}');
    counts[event] = (counts[event] || 0) + 1;
    sessionStorage.setItem(key,JSON.stringify(counts));
  } catch {
    // Storage may be disabled. Counters are optional and stay in this tab.
  }
}

export async function post(name, body, token) {
  const headers = {'Content-Type':'application/json'};
  if (token) headers.Authorization = 'Bearer '+token;
  const response = await fetch('/.netlify/functions/'+name,{
    method:'POST',headers,body:JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || '요청을 처리하지 못했습니다.');
  return result;
}

export const callbackKey = 'halmae-test-payment-callback';

export function rememberReport(result) {
  rememberOrder(result.orderId);
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
  forgetCheckout();
  forgetReport();
  removeSessionKeys(['halmae-conversion-counts']);
  try { localStorage.removeItem(orderKey); } catch { /* Storage is inaccessible. */ }
}
