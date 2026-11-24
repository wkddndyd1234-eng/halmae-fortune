import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

const source=file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('모든 페이지에 브랜드 아이콘이 있고 개인 화면의 검색 색인을 제한한다',async()=>{
 const privatePages=['checkout','payment-result','report','recovery'];
 const names=['index','privacy','terms','refund',...privatePages];
 for(const name of names){
  const html=await source(name+'.html');
  assert.match(html,/rel="icon"[^>]*\/art\/favicon\.png/);
  assert.match(html,/href="\/release\.css"/);
  assert.equal(html.includes('name="robots" content="noindex, nofollow"'),privatePages.includes(name));
 }
 const landing=await source('index.html');
 assert.match(landing,/class="btn home-reading" href="#form"/);
 assert.match(landing,/property="og:image" content="\/art\/share.jpg"/);
});
