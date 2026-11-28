# v9.8.3 최종 운영 검수

기준 218891c6c12db0c08b3feedfa8f1515481c0aa5c · 2026-12-04 조건부 출시 목표

- [x] 운영자 확인: halmae.jector.kr HTTPS, Netlify Functions 27개, Ohio CMH, Log Drains 미사용. 함수 실행 위치와 Blobs 저장 위치는 별도로 확인한다.
- [x] 운영자 확인: Resend 발신 도메인·주소 설정, 일반 테스트 메일 네이버와 Gmail 수신, 무료 일 100·월 3,000건, 자동 과금 꺼짐. 실제 구매 이벤트의 계약서면·복구 수신은 별도 확인한다.
- [x] 서명 DPA 확인: Resend 법인 Plus Five Five, Inc., 미국, 2261 Market Street #5039, San Francisco, CA 94114, privacy@resend.com. 2025-12-31 개정, 2026-01-14 공급사 서명. 계약 종료 후 90일 내 삭제 원칙과 법적 예외, 전송·저장 암호화, 재위탁 변경 최소 14일 통지. 이 90일은 발송 메일의 통상 보존 기간이 아니다. 서명 원본은 저장소에 올리지 않는다.
- [x] 개인정보 국외 이전 검토본에 미국 함수 실행 및 Resend 법인, 미국 처리, 이전 항목·시점·방법·목적·거부 경로를 반영. 개인정보보호법 제28조의8에는 계약 이행을 위한 처리위탁·보관 필요성과 법정 상세 항목의 공개 또는 고지에 따른 경로가 있다. 필수 처리와 선택 복구를 나누고 계약 필요성, 각 처리자 및 실제 이전 조건을 확인한 뒤 해당 근거를 확정한다. DPA만으로 국내 적법 근거를 확정하지 않는다.
- [ ] Netlify 운영자 또는 지원팀 확인: Blobs의 저장·복제·백업 국가, 삭제 처리 기한, 플랜의 함수 로그 보관 기간과 로그 내 주문 정보 여부. 공식 문서의 최대 보존 안내는 실제 기간이 아니다. Trust Center의 현행 하위 처리업체를 실제 사용 기능과 대조한다.
- [ ] Resend 운영자 확인: Domains → halmae.jector.kr → Settings에서 Open Tracking·Click Tracking 두 항목이 OFF인지 확인. 계정으로 확인할 수 없다면 검수 미완료다. 이메일 코드의 일반 텍스트 사용은 도메인 클릭 추적이 꺼져 있다는 증거가 아니다. Emails에서 개별 메일·발송 로그의 보유/삭제 정책 및 반송 처리를 확인하고 법정 보존본과 분리한다.
- [x] 모의 서버 검수: 한도/속도 제한 429는 같은 요청에서 즉시 재발송하지 않는다. 계약서면은 고객센터 재교부로 이관하고, 복구는 재요청 대상으로 남긴다. 일시 실패 재시도와 중복 통지 억제, 이메일에 생년월일·구매 전화·장부 전문 미포함, 발송 오류가 365일 열람에 영향을 주지 않는지 검증한다. 고객 본인 확인 후 구매 당시 원문을 재교부한다.
- [ ] 운영 확인: 페이앱 전자계약과 서류 제출은 사용자 확인 완료. 심사 승인, 정산계좌·결제수단, 실통지와 승인·부분취소·전액취소 대조, 실제 PC·모바일·인앱 결제 복귀 검수는 별도 승인 뒤 진행한다.
- [ ] 출시 고지: 신고번호·기관, 업무용 듀얼번호(`LIVE_SUPPORT_PHONE`), 시행일, 구매 당시 정책 아카이브 갱신. 실제 계약서면·복구 및 반송을 승인된 결제 잠금 환경에서 확인한 후 판매 승인한다.

공식 자료: [Netlify DPA](https://www.netlify.com/pdf/netlify-dpa.pdf/) · [Netlify 로그](https://docs.netlify.com/manage/monitoring/logs/) · [Resend DPA](https://resend.com/legal/dpa) · [Resend 하위 처리업체](https://resend.com/legal/subprocessors) · [Resend 보관·삭제](https://resend.com/security/gdpr) · [추적 설정](https://resend.com/blog/open-and-click-tracking) · [개인정보 보호법 제28조의8](https://www.law.go.kr/법령/개인정보보호법/제28조의8)
