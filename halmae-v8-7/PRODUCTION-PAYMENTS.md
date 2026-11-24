# v9.3 운영 결제

주식회사 밸류시커의 할매의 운명방 카드 결제창 상품은 39,900원, 승인 후 즉시 26장 발급, 승인 시각부터 365일 재열람을 기준으로 한다. v9.2 프리뷰 구매와 복구는 기존 저장소, 키와 토큰 범위를 유지한다.

## 운영 잠금과 설정

| 범위 | 설정 |
| --- | --- |
| 배포 범위 | 별도 Netlify 운영 사이트의 Production 및 Functions 환경변수에만 `PAYMENT_MODE=live`, `PAYMENT_RUNTIME_TIER=production`, `PAYMENT_LIVE_ORIGIN`, `PAYMENT_LIVE_SITE_ID` 지정. 런타임에서 Netlify `SITE_ID`, `URL` 및 요청 origin 일치 확인 |
| PG 자격 | 검증된 가맹점의 `TOSS_LIVE_MERCHANT_ID`, `TOSS_LIVE_CLIENT_KEY`, `TOSS_LIVE_SECRET_KEY` |
| 서명 | 운영 전용 `LIVE_REPORT_TOKEN_SECRET`, 프리뷰 `REPORT_TOKEN_SECRET`과 별도 관리 |
| 활성화 | PG와 운영 검토가 끝나면 `PAYMENT_LIVE_APPROVED=true`. 정책과 장애 대응 점검을 마친 후에만 `PAYMENT_LIVE_SALES_ENABLED=true`. 판매 스위치를 끄면 신규 주문·승인이 닫히고 기존 승인 건 조회·복구·환불은 유지 |
| 고지 | 검토·게시한 HTTPS 정책 주소를 `LIVE_TERMS_URL`, `LIVE_PRIVACY_URL`, `LIVE_REFUND_URL`에 지정. 결제 화면과 홈페이지에서 해당 페이지로 연결 |
| 웹훅과 운영 | 별개의 고엔트로피 `PAYMENT_LIVE_WEBHOOK_KEY`, `PAYMENT_LIVE_OPERATOR_TOKEN`을 각각 최소 32자로 설정. 둘 다 있어야 판매 가능 |
| 선택 이메일 복구 | 운영 전용 `LIVE_RECOVERY_RESEND_API_KEY`, 검증된 발신 주소 `LIVE_RECOVERY_FROM_EMAIL` |
| 프리뷰 | `PAYMENT_MODE=test`, `TOSS_TEST_CLIENT_KEY`, `TOSS_TEST_SECRET_KEY`, `REPORT_TOKEN_SECRET`과 기존 프리뷰 호스트 |

쓰기 경합을 다루는 운영 주문 저장소 `halmae-live-orders`는 강한 일관성을 사용한다. 결제창을 다시 열 때 현재 탭의 시도 ID로 기존 주문을 재사용한다. 서버는 주문 ID와 카드 승인 기준 금액을 확인하고 첫 승인 키를 조건부로 고정한다. 운영 카드 결제창에서 토스가 반환하는 카드 및 간편결제 결과를 처리한다. 토스 멱등 키는 주문별로 고정되며 재시도는 승인 조회를 먼저 한다. 승인 응답이 유실돼도 현재 브라우저 또는 등록 이메일로 발급을 복구할 수 있다. 다른 탭에서 시작한 별개의 구매는 별도 주문이다.

## 웹훅·취소·대조

- 토스 개발자센터 운영 카드 결제의 `PAYMENT_STATUS_CHANGED`를 `/.netlify/functions/payment-webhook?key={PAYMENT_LIVE_WEBHOOK_KEY}`에 등록한다. URL의 자격값은 비밀로 관리하고 접근 로그·모니터링에서 질의 문자열을 가린다. 수신 이벤트는 조회 신호로만 쓰며 토스 서버에서 조회한 주문 번호, 결제 키, 가맹점, 수단, 금액과 상태를 검증한다. 조회 장애는 재시도 가능한 응답으로 처리한다. 카드 결제와 별개인 해외 비동기 간편결제의 취소 웹훅은 다루지 않는다.
- `/.netlify/functions/payment-operations`의 POST는 별도 Bearer 운영 자격을 요구한다. `action=reconcile`과 주문 번호로 현재 상태를 재대조한다. `action=refund`, 주문 번호, 사유로 전액 취소를 요청한다. 이 경로는 승인받은 담당자에게만 제공한다. 부분 취소는 권한 중단에는 반영하되 이 경로에서 추가로 진행하지 않는다.
- 취소가 브라우저 밖에서 발생해도 보고서 열람마다 토스의 현재 승인 상태를 조회한다. 전액·부분 취소는 해당 보고서의 열람을 중단한다. 중복 웹훅이 금융 기록을 복제하지 않도록 상태별 스냅샷을 조건부로 저장한다.
- `finance/{orderId}/` 아래 주문·결제·가맹점·거래 키, 승인 시각, 금액·잔액·통화·상태, 취소 건별 거래 키와 금액·시각이 남는다. 카드번호, 출생 정보, 이메일, 취소 사유는 금융 스냅샷에 포함하지 않는다. 토스 상점관리자의 거래·정산 자료와 주문 번호 및 거래 키로 대조한다. 정산 자동 수집이나 장부 내보내기는 별도 운영 작업이다.

## 운영 전 확인

관계자 승인 전 판매 스위치를 끈다. 사업자 표시와 정책, 반품·환불 권한 승인 절차, 거래기록 보존 및 삭제 계획, 재대조 주기와 조치 담당자를 확정한다. 운영 자격이 배포 프리뷰에 들어가지 않는지 확인한다. 운영 사이트 승인을 받은 뒤에만 실제 PG 웹훅 등록, 키 검증, Resend 수신, 로그 마스킹, 권한 복구와 정산 대조를 확인한다. Netlify에서 Functions 환경변수 변경을 적용하려면 승인된 새 배포가 필요하다.

- [토스페이먼츠 결제창 연동](https://docs.tosspayments.com/guides/v2/payment-window/integration)
- [토스페이먼츠 결제 승인·조회·취소 API](https://docs.tosspayments.com/reference)
- [토스페이먼츠 웹훅 이벤트](https://docs.tosspayments.com/reference/using-api/webhook-events)
- [Netlify Functions 환경변수](https://docs.netlify.com/build/functions/environment-variables/)
