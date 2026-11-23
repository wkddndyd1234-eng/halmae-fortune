export const PRICE = 39900;
export const ORDER_NAME = '할매의 깊은 장부';
export const DAY = 24 * 60 * 60 * 1000;

const previewOrigins = new Set([
  'https://halmae-fortune-v87-preview.netlify.app',
  'https://test-v87--halmae-fortune-v87-preview.netlify.app',
]);

export function paymentConfig(req) {
  const {PAYMENT_MODE, TOSS_TEST_CLIENT_KEY, TOSS_TEST_SECRET_KEY, REPORT_TOKEN_SECRET} = process.env;
  const origin = new URL(req.url).origin;
  if (PAYMENT_MODE !== 'test' || !previewOrigins.has(origin) ||
      !/^test_(?:gck|ck)_[A-Za-z0-9_]+$/.test(TOSS_TEST_CLIENT_KEY ?? '') ||
      !/^test_(?:gsk|sk)_[A-Za-z0-9_]+$/.test(TOSS_TEST_SECRET_KEY ?? '') ||
      (REPORT_TOKEN_SECRET?.length ?? 0) < 32) return null;
  return {origin, clientKey: TOSS_TEST_CLIENT_KEY, secretKey: TOSS_TEST_SECRET_KEY};
}
