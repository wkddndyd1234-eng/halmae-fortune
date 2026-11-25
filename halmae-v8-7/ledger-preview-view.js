import {calculateSaju} from './saju.mjs';
import {ledgerPreview} from './ledger-preview.mjs';

export function renderLedgerPreview(container,saju) {
 const view=saju ?? calculateSaju({birthDate:'2000-01-01',birthTime:'12:00'});
 container.querySelector('[data-preview-label]').textContent=saju?
  '결제 후 제공되는 본문 · 내 입력으로 읽는 「2027년 정미년의 기운」 발췌':
  '실제 보고서 예시 · 가상 입력 2000년 1월 1일 정오 · 「2027년 정미년의 기운」 발췌';
 container.querySelector('blockquote').textContent=ledgerPreview(view).excerpt;
}
