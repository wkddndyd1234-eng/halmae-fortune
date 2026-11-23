import {calculateSaju} from './saju.mjs';
import {ledgerPreview} from './ledger-preview.mjs';

export function renderLedgerPreview(container,saju) {
 const view=saju ?? calculateSaju({birthDate:'2000-01-01',birthTime:'12:00'});
 container.querySelector('[data-preview-label]').textContent=saju?
  '내 입력으로 읽는 「일과 재능의 방향」 발췌':
  '가상 입력 2000년 1월 1일 정오 · 「일과 재능의 방향」 발췌';
 container.querySelector('blockquote').textContent=ledgerPreview(view).excerpt;
}
