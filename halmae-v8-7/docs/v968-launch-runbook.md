# 할매의 운명방 출시일 운영 매뉴얼

기준 상품은 39,900원 단건, 개인 사주 장부 26장과 2027년 월별 운세, 승인 시각부터 365일 열람이다.

## PG 신청 전에 마칠 일

1. [사업자 증빙 및 정책 후보안](./v968-policy-candidates.md)에 실제 증빙을 대조한다. 최신 통신판매업 신고증, 사업자등록증, 공개 전화번호, 보호책임자, 메일 응대 담당자를 확인한다. 정책·부분 환불 권한·전자적 계약서면 교부 방식을 운영자가 확정한다.
2. 실제 판매 도메인과 Netlify 운영 사이트의 관계를 확인한다. Domain management에서 기본 도메인, DNS, HTTPS 인증서 발급과 만료 상태를 확인한다. 광고에 쓸 HTTPS 주소에서 브라우저 경고 없음과 동일 도메인 리디렉션을 확인하고, 정책 링크·결제 콜백·빌드 canonical 주소에 동일한 원점을 사용한다. 운영 도메인과 인증서의 실제 상태는 계정 및 대상이 확인될 때까지 미확정이다. 기존 프리뷰 주소는 운영 주소로 사용하지 않는다.
3. 운영 환경 목록을 준비하되 비밀값은 운영 Netlify 환경변수에만 넣는다. 배포 프리뷰와 코드·문서·채팅에는 넣지 않는다. 정책 원문은 공개본과 동일하게 준비하되 검토용 페이지는 판매 중 정책으로 승인하지 않는다.
4. 실제 자격 증명 없이 80개 회귀 테스트, 빌드, 주문 금액과 26장 발급·365일 열람·재발급을 합성 입력으로 점검한다. 휴대폰에서는 실제 기기 iOS Safari와 Android Chrome에서 히어로 CTA, 날짜 입력, 무료 풀이, 장부 발췌, 주문 버튼, 뒤로가기·재열람을 별도로 확인한다.

## Netlify 환경변수

### 이번 검수 결과

- 기존 v9.6.7의 Edge PC·모바일 에뮬레이션 구매 검수를 기준으로 삼았다. 이번 버전은 브라우저 연결이 불가능하여 바뀐 주문 문구와 미리보기 열기 링크는 빌드 산출물·코드에서 점검했다. 실기기에서 최종 확인한다.
- 첫 화면 인물 이미지는 97,860바이트 WebP로 우선 요청하도록 설정되어 있고, 아래 한옥 이미지는 320,364바이트 WebP로 지연 로딩한다. 이미지 크기가 HTML에 지정되어 있다. 모바일 실제 로딩 시간과 화면 깨짐은 이 버전에서 실측하지 못했다.
- 결제 전 제한 조건 가까이에 실제 장부 미리보기 링크를 넣고, 복구 이메일이 꺼진 환경에서 등록을 권하는 고정 문구를 제거했다. 확인·구매 버튼의 디자인은 기존 것을 사용한다.

기존 `PRODUCTION-PAYMENTS.md`의 설명보다 이 표를 함께 적용한다. Functions 범위와 Production 컨텍스트를 사용하고 설정 반영용 배포는 운영 승인 후에만 한다.

| 종류 | 키 및 확인 방법 |
| --- | --- |
| 운영 런타임 필수 | `PAYMENT_MODE=live`, `PAYMENT_RUNTIME_TIER=production`, `PAYMENT_LIVE_ORIGIN`, `PAYMENT_LIVE_SITE_ID`. Netlify가 제공하는 `URL`, `SITE_ID`와 각각 일치해야 한다. |
| 사업자·정책 필수 | `LIVE_SUPPORT_PHONE`, `LIVE_MAIL_ORDER_NUMBER`, `LIVE_PRIVACY_OFFICER`, `LIVE_MERCHANT_DISCLOSURES_APPROVED`, `LIVE_TERMS_URL`, `LIVE_PRIVACY_URL`, `LIVE_REFUND_URL`, `LIVE_POLICY_VERSION`, `LIVE_POLICY_ARCHIVE_JSON`, `LIVE_POLICY_APPROVED`. 원문 JSON은 아래 예시와 같이 버전 및 URL이 일치해야 하며 URL별 텍스트는 최대 30,000바이트다. |
| 서명·조회 필수 | `LIVE_REPORT_TOKEN_SECRET`, `PAYMENT_LIVE_OPERATOR_TOKEN`, 기본 웹훅 방식에 `PAYMENT_LIVE_WEBHOOK_KEY`. 각각 별도의 32자 이상 난수로 발급한다. 프리뷰 `REPORT_TOKEN_SECRET`과 재사용하지 않는다. |
| 승인 후 필수 | `TOSS_LIVE_MERCHANT_ID`, `TOSS_LIVE_CLIENT_KEY`, `TOSS_LIVE_SECRET_KEY`, `PAYMENT_LIVE_APPROVED=true`. 운영 상점과 사이트가 맞는지 확인한다. `PAYMENT_LIVE_SALES_ENABLED`는 최종 출시 결정 전까지 `false`로 유지한다. |
| 관리자 운영 시 | `OPS_ADMIN_ENABLED`, `OPS_LIVE_PASSWORD_HASH`, `OPS_LIVE_TOTP_SECRET_HEX`, `OPS_LIVE_ALLOWED_IPS`. 허용 IP, 비밀번호, 2단계 인증, 세션·CSRF 제어를 테스트한다. 관리자 CS 접근이 되지 않으면 제한을 풀어 출시하지 않고 담당자·IP를 확인한다. |
| 웹훅 대안 | `PAYMENT_WEBHOOK_PUBLIC=true`를 선택하는 경우에만 승인된 `PAYMENT_WEBHOOK_ALLOWED_IPS`를 사용한다. 신뢰 IP를 확인할 수 없으면 기본 키 방식과 질의문 로그 보호를 검토한다. |
| 선택 및 별도 승인 | 이메일 복구 `LIVE_RECOVERY_RESEND_API_KEY`, `LIVE_RECOVERY_FROM_EMAIL`. 캠페인 `CAMPAIGN_MEASUREMENT_ENABLED`. 취소 `PAYMENT_REFUNDS_APPROVED`. 주문 정리 `LIVE_RETENTION_ENABLED`, 알림 `OPS_RETENTION_ALERT_EMAIL`, 법정 기록 정리 `LIVE_FINANCE_PURGE_APPROVED`. 보존·분쟁 보류·삭제 절차를 확인하기 전에는 파기 플래그를 켜지 않는다. |
| 키 관리 | `LIVE_IDENTITY_SECRET`은 별도로 둘 수 있다. 기존 주문에 사용한 식별용 키를 임의 교체하지 않는다. 서명 키 교체는 `LIVE_PREVIOUS_REPORT_TOKEN_SECRET`, `LIVE_PREVIOUS_SIGNING_UNTIL`의 전환 기간을 검토한다. |
| 빌드 범위 | `SITE_PUBLIC_ORIGIN`은 확정된 HTTPS 원점만 지정한다. 빌드가 canonical·OG URL에 사용한다. |

정책 원문 JSON 구조 예시이며 아래 값은 설정에 바로 사용하지 않는다.

```json
{"version":"2027.01.01","terms":{"url":"https://example.invalid/terms.html","text":"확정 약관 원문"},"privacy":{"url":"https://example.invalid/privacy.html","text":"확정 개인정보처리방침 원문"},"refund":{"url":"https://example.invalid/refund.html","text":"확정 취소·환불 안내 원문"}}
```

동일 버전 원문은 덮어쓰지 않는다. 계약서면 저장·재교부 기능은 이미 구현되어 있다. Resend 설정은 **복구 이메일용**이다. 계약서면 자동 이메일은 운영 구매에 연결되어 있지 않다. 계약서면 제공 시점·고객 저장·재교부 및 발급 실패 대응의 적정성을 검토한다. 자동 이메일이 필요하다는 결론이면 별도 연동과 합성 수신 테스트를 완료한다. 운영 메일을 준비할 때 실제 고객 주소 없이 검증된 발신 도메인과 Resend 테스트 주소만 사용한다.

## 승인 후 출시 순서

| 순서 | 확인 | 실패 시 |
| --- | --- | --- |
| 1. PG 승인 대조 | 토스 상점관리자에서 운영 가맹점, 계약된 결제수단, 정산 정보, 실사용 도메인을 대조한다. | 누락된 승인·가맹점 정보는 토스에서 보완한다. 판매 스위치는 꺼 둔다. |
| 2. 운영 설정 반영 | 승인된 운영 배포에서 판매를 닫은 상태로 HTTPS, 정책 공개본과 보존 원문, 사업자 정보, 콜백 URL, 운영 관리자 인증을 대조한다. | 잘못된 운영·프리뷰 컨텍스트나 설정값을 수정한 뒤 다시 확인한다. |
| 3. 복구·웹훅 확인 | 결제 성공·실패·취소 메시지, 웹훅 수신과 토스 서버 거래 재조회, 동일 주문 재시도, 장부 발급·재열람, 계약서면 저장·재교부를 확인한다. 격리된 테스트부터 실행한다. | 중복 요청에는 새 결제를 시키기 전에 기존 거래를 조회한다. 발급 실패는 운영 콘솔에서 재대조 후 발급 복구를 확인하고 지원 경로로 응대한다. |
| 4. 출시 판단 | 실제 모바일 결제창과 운영 발급·정산·수신 확인에 필요한 검증을 승인받고 실시한다. 이번 작업에서는 실제 결제를 실행하지 않았다. 모든 필수 항목에 담당자가 서명한 뒤에만 판매 활성화를 승인한다. | 승인 전 상태를 유지한다. 출시 직후 문제가 생기면 광고를 즉시 중지하고 신규 판매 스위치를 끈다. 기존 거래는 조회·권한·환급 절차로 처리한다. |
| 5. 광고 시작 | 광고 링크를 모바일 앱에서 열고 랜딩·파라미터 유지·무료 시작 및 완료·주문 진입을 확인한다. 판매가 정상 확인된 후에만 소액으로 시작한다. | 집계가 빠지면 UTM, 계측 플래그, 탭 이동을 점검한다. 승인액이 금융 원장과 다르면 원인을 확인할 때까지 증액하지 않는다. |

## 광고 링크와 매출 판단

아래 링크는 확정 운영 도메인을 `{origin}`에 대입한 뒤 광고 관리자에서 사용한다. 동일 소재라도 채널 태그를 분리한다. `utm_campaign`은 `newyear_2027_{format}_{creative}_{wave}` 형태의 소문자 영문·숫자·밑줄로 작성한다. 소재 구분은 집계되는 캠페인 값에 넣고 고객 정보를 넣지 않는다.

| 광고 채널 | 복사용 URL 템플릿 |
| --- | --- |
| 인스타그램 | `{origin}/?utm_source=instagram&utm_medium=paid_social&utm_campaign=newyear_2027_reel_a_w01` |
| 페이스북 | `{origin}/?utm_source=facebook&utm_medium=paid_social&utm_campaign=newyear_2027_feed_a_w01` |
| 유튜브 | `{origin}/?utm_source=youtube&utm_medium=paid_video&utm_campaign=newyear_2027_shorts_a_w01` |
| 네이버 | `{origin}/?utm_source=naver&utm_medium=cpc&utm_campaign=newyear_2027_search_a_w01` |

- 광고 직전 확정 운영 도메인에 링크 4개를 열어 UTM이 유지되는지 확인한다. 광고 관리자에서 소재별 URL과 예산을 대조하고 집행은 출시 확인 후 시작한다.
- 운영 관리자에서 동일 캠페인의 누적 광고비를 입력하고 CSV를 받는다. 승인 수는 브라우저 이벤트 대신 금융 원장에 반영된 주문 수이며 전체·부분 환불은 원래 캠페인에 차감된다. 매체 보고서와 주문·취소 원장을 대조한다. 다른 탭·기기, 전송 유실, 미귀속 주문의 차이가 있을 수 있다.
- 캠페인별 순매출은 승인금액에서 환불액을 뺀다. 광고비 대비 매출은 순매출 ÷ 광고비로 비교하고 광고비가 0이면 산출하지 않는다. 정산 수수료·세금·기타 변동비를 실제 자료로 반영해 순수익을 판단한다. 소재별 예산 상향은 취소 반영 순수익으로 판단한다.

- [토스페이먼츠 배포 체크리스트](https://docs.tosspayments.com/guides/v2/deploy-checklist)
- [Netlify Functions 환경변수](https://docs.netlify.com/build/functions/environment-variables/)
- [Netlify 도메인 HTTPS](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/)
- [Resend 테스트 이메일 주소](https://resend.com/docs/dashboard/emails/send-test-emails)
