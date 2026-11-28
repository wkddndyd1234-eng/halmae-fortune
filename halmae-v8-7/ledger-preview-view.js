import {calculateSaju} from './saju.mjs';
import {cyclesForSaju} from './fortune-cycles.mjs';
import {topicExcerpt} from './story-scenes.mjs';

export function renderLedgerPreview(container,saju,chapter=13) {
 const view=saju ?? calculateSaju({birthDate:'2000-01-01',birthTime:'12:00'});
 container.querySelector('[data-preview-label]').textContent=saju?
  `전체 풀이 ${chapter+1}편에서 가져온 한 문단`:
  '가상 생일로 만든 전체 풀이 예시';
 container.querySelector('blockquote').textContent=topicExcerpt(cyclesForSaju(view),chapter);
}
