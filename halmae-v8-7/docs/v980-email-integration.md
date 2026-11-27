# v9.8.0 거래 메일 발송 검토

2026-11-27 KST · 기준 463b719812bcf1f55c978e69eabb977ac97d370b

## 결정

네이버 메일은 문의·답장·본인 확인 후 수동 재교부에 사용한다. 구매 계약서면과 복구 링크의 자동 발송에는 기존 Resend 경로를 유지한다. 운영 발송 계정이나 DNS는 변경하지 않았다.

네이버 도움말은 smtp.naver.com:465(SSL), SMTP 사용 설정, 2단계 인증과 앱 비밀번호를 안내한다. 587 STARTTLS는 동일 공식 도움말에서 확인되지 않았다. 네이버 계정으로 정상적인 개별 거래 메일을 일괄 금지한다는 근거는 찾지 못했으나, 무인 자동 거래 발송을 보장하는 정책과 일일 발송량은 확인되지 않았다. 네이버는 짧은 간격의 발송을 제한할 수 있고, 구체적 발송 한도는 공개하지 않으며 한도를 넘으면 최대 24시간이 걸릴 수 있다고 안내한다. 이 조건으로 계약서면 필수 교부를 의존하기 어렵다고 판단했다.

Netlify 지원 포럼의 기존 답변은 Functions 아웃바운드 포트를 일괄 차단하지 않는다고 설명한다. 격리 작업 환경에서는 smtp.naver.com:465와 :587 모두 DNS 단계 EAI_AGAIN으로 중단됐다. 이 결과는 Netlify Functions 자체의 접속 차단이나 허용을 입증하지 않는다. 배포된 함수에서 SMTP 통신, SMTP 인증, 네이버·Gmail 받은편지함/스팸함, 실제 반송은 미검증이다.

## 발송 구성과 검증

- 발신 표시 이름은 할매의 운명방이다. From은 인증된 발신 도메인의 주소로 정하고, Reply-To는 계약서면과 운영 복구 메일 모두 valueseeker123@naver.com으로 보낸다. 네이버 공용 도메인을 Resend From으로 쓰지 않는다.
- 도메인 인증과 무료 플랜 선택이 승인되면 관리 콘솔에서 검증된 도메인의 주소를 LIVE_RECOVERY_FROM_EMAIL, 서버 전용 발송 키를 LIVE_RECOVERY_RESEND_API_KEY에 입력한다. LIVE_RECOVERY_FROM_EMAIL에는 표시 이름 없이 주소만 넣는다. 키는 함수 환경에만 저장한다.
- Resend 무료 한도는 하루 100통, 월 3,000통이다. 계약서면과 복구를 합산한다. 도메인 인증 후 합성 주문으로 네이버·Gmail에서 수신함, 스팸함, 발신자 표시, 답장 주소, 반송 상태를 확인한다. API 접수만으로 받은편지함 수신을 완료 처리하지 않는다.
- 모의 HTTP 503 후 같은 멱등 키 재시도, 중복 승인 통지의 발송 억제, 실패 후 고객센터 이관 기록을 회귀 검증했다. 실패한 계약서면은 고객센터에서 본인 확인 후 구매 당시 보존본을 재교부한다. 자동 반송 이벤트 수집은 연결되지 않았다.

## 근거

- [네이버 SMTP 설정](https://help.naver.com/service/30029/contents/21341)
- [네이버 2단계 인증과 앱 비밀번호](https://help.naver.com/notice/noticeView.help?lang=ko&noticeNo=22533&serviceNo=30029)
- [네이버 발송 제한](https://help.naver.com/service/30029/contents/21159)
- [Netlify 지원 포럼 SMTP 답변](https://answers.netlify.com/t/can-i-send-mail-through-smtp-from-a-function/8076/5)
- [Resend 도메인 인증](https://resend.com/docs/dashboard/domains/introduction)
- [Resend 요금](https://resend.com/pricing)
