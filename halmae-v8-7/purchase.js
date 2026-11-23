export const checkoutKey = 'halmae-test-checkout';
export const reportKey = 'halmae-last-test-report';

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
