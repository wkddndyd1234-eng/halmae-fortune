import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readPersonalReading} from '../free-insights.js';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {freeEpisodes,concernChapter,topicExcerpt} from '../netlify/functions/story-scenes.mjs';

const samples=Array.from({length:10},(_,i)=>({
 name:'김민지',birthDate:new Date(Date.UTC(1980+i*2,i,12+i)).toISOString().slice(0,10),
 birthTime:i%3===0?'':i%2?'07:15':'22:20',gender:i%2?'female':'male',
}));

test('ten free episodes and 26 paid narratives keep distinct subjects and genuine teasers',()=>{
 const choices=['money','work','love','people','future','custom',''];
 const firstEpisodes=new Set();
 for(const [i,input] of samples.entries()){
  const f=fortuneCycles(input);
  const episodes=freeEpisodes(f,readPersonalReading(f,f.saju,''),'민지야',choices[i%choices.length]);
  assert.equal(new Set(episodes.map(e=>e.title)).size,10);
  assert.ok(episodes.every(e=>e.paragraphs.length>=2));
  firstEpisodes.add(episodes[0].paragraphs.join('\n'));
  const {chapters}=buildFortuneReport(input,{now:Date.UTC(2026,10,28)});
  assert.equal(new Set(chapters.map(c=>c.story.title)).size,26);
  for(const choice of choices){
   const index=concernChapter(choice);
   assert.equal(chapters[index].story.intro[0],topicExcerpt(f,index));
  }
  const monthly=chapters.slice(14);
  assert.equal(new Set(monthly.map(c=>c.story.intro[1])).size,12);
  assert.ok(monthly.every(c=>c.story.sections.length===6&&c.story.sections.every(g=>g.paragraphs.length>0)));
 }
 assert.ok(firstEpisodes.size>5);
});

test('custom text offers no claimed analysis and ambiguous seasonal cases do not assert a month stem',()=>{
 const input={name:'가상',birthDate:'2000-02-04',birthTime:'',gender:'female'};
 const f=fortuneCycles(input);
 assert.equal(f.saju.dateBoundaryUncertain,true);
 const episodes=freeEpisodes(f,readPersonalReading(f,f.saju,''),'얘야','custom');
 assert.match(episodes[8].paragraphs[0],/분석하거나 저장하지는 않아/);
 const {chapters}=buildFortuneReport(input);
 assert.doesNotMatch(chapters.slice(0,13).flatMap(c=>c.story.intro).join('\n'),/월간 [甲乙丙丁戊己庚辛壬癸]/);
});
