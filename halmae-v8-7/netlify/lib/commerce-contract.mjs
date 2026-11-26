export const merchantIdentity={
 name:'주식회사 밸류시커 (VALUE SEEKER)',
 representative:'장철근',
 registration:'244-86-02709',
 address:'서울특별시 서초구 사임당로8길 13, 4층 402-S36호',
 email:'valueseeker123@naver.com',
};

export function contractTerms(config){
 const live=config.mode==='live';
 return {
  seller:{...merchantIdentity,...(live?{phone:config.merchant.phone,mailOrderNumber:config.merchant.mailOrderNumber}:{})},
  product:'개인 맞춤형 사주 장부 26장 및 2027년 월별 운세',
  delivery:'결제 승인 직후 웹 장부 이용 · 승인 시각부터 365일 열람',
  withdrawal:'청약철회·환불은 구매 시 적용된 안내와 관계 법령에 따릅니다. 제공 오류나 열람 장애는 주문번호로 고객센터에 접수할 수 있습니다.',
  policyVersion:live?config.policyVersion:'preview',
  ...(live && config.policy?{policyDigest:config.policy.digest}:{}),
  policies:live?config.legal:{terms:config.origin+'/terms.html',privacy:config.origin+'/privacy.html',refund:config.origin+'/refund.html'},
  test:!live,
 };
}

export function contractDocument(order){
 if(!order?.contractTerms || !Number.isFinite(Date.parse(order.approvedAt)) ||
    !Number.isSafeInteger(order.purchaseExpiresAt)) return null;
 return {...order.contractTerms,orderId:order.orderId,amount:order.amount,currency:'KRW',
  approvedAt:order.approvedAt,purchaseExpiresAt:order.purchaseExpiresAt};
}
