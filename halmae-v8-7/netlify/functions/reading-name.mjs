const surnames=new Set('김 이 박 최 정 강 조 윤 장 임 한 오 서 신 권 황 안 송 전 홍 유 고 문 양 손 배 백 허 남 심 노 하 곽 성 차 주 우 구 민 류 나 진 지 엄 채 원 천 방 공 현 함 변 염 여 추 도 소 석 선 설 마 길 연 위 표 명 기 반 왕 금 옥 육 인 맹 제 모 탁 국 어 은 편 용'.split(' '));
const compound=/^(남궁|황보|제갈|선우|사공|서문|독고|동방|어금|강전|망절|장곡)/;

export function readingName(input){
 const name=typeof input==='string'?input.trim():'';
 if(!/^[가-힣]{3}$/.test(name)||!surnames.has(name[0])||compound.test(name)){
  return {call:'얘야',possessive:'내'};
 }
 const given=name.slice(1);
 const consonant=(given.charCodeAt(1)-0xac00)%28!==0;
 return {call:given+(consonant?'아':'야'),possessive:given+(consonant?'이의':'의')};
}
