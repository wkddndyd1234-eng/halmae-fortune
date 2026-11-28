import {calculateSaju} from './saju.mjs';
import {cyclesForSaju} from './fortune-cycles.mjs';
import {chartPreviewChapter,topicExcerpt} from './story-scenes.mjs';

export function renderLedgerPreview(container,saju,chapter) {
 const view=saju ?? calculateSaju({birthDate:'2000-01-01',birthTime:'12:00'});
 const cycles=cyclesForSaju(view);
 chapter??=saju?chartPreviewChapter(cycles):13;
 container.querySelector('[data-preview-label]').textContent=saju?
  ({6:'돈이 들어올 때와 지갑을 열 때',7:'네 일이 편해지려면 어디부터 바꿀까',8:'좋아하는 마음을 어떻게 건넬까',10:'가까운 사람에게 어디까지 손을 내밀까',13:'2027년엔 어떤 힘을 쓰면 좋을까'})[chapter]:
  '가상 생일로 만든 전체 풀이 예시';
 container.querySelector('blockquote').textContent=topicExcerpt(cycles,chapter);
}
