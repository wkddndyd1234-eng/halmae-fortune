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

test('monthly copy distinguishes work and relationship evidence and preserves 12 separate remarks',()=>{
 const boundary={name:'최서윤',birthDate:'2000-02-04',birthTime:'',gender:'female'};
 const lunar={name:'한도현',birthDate:'1988-08-15',calendarType:'lunar',birthTime:'23:15',gender:'male'};
 function monthly(input){
  return buildFortuneReport(input).chapters.slice(14).map(c=>c.story);
 }
 const first=monthly(boundary), second=monthly(lunar);
 assert.equal(new Set(first.map(c=>c.sections.at(-1).paragraphs.at(-1))).size,12);
 assert.ok(first.every(c=>c.sections.length===6));
 assert.doesNotMatch(first.flatMap(c=>c.sections[2].paragraphs).join(' '),/월지/);
 assert.ok(first.filter((chapter,i)=>JSON.stringify(chapter.sections)!==JSON.stringify(second[i].sections)).length>=8);
});

test('customer-facing stories and real excerpts hide technical terms while retaining calculation evidence',()=>{
 const terms=/[\u4e00-\u9fff]|일간|일지|천간|월간|십성|정재|편재|육합|합충|세운|월운|대운|절입|원국/u;
 for(const input of samples){
  const f=fortuneCycles(input);
  const free=freeEpisodes(f,readPersonalReading(f,f.saju,''),'민지야','money');
  const {chapters}=buildFortuneReport(input);
  const visible=chapters.flatMap(c=>[c.story.title,...c.story.intro,...c.story.sections.flatMap(g=>g.paragraphs)]);
  assert.doesNotMatch([...free.flatMap(e=>e.paragraphs),...visible].join(' '),terms);
  assert.match(chapters[0].paragraphs.join(' '),terms);
  assert.equal(chapters[6].story.intro[0],topicExcerpt(f,6));
 }
});

test('birth changes a scene and asset while concern changes emphasis without changing the chart',()=>{
 const sample={name:'가상 민서',birthDate:'1995-07-15',birthTime:'14:30',gender:'female'};
 const other={...sample,birthDate:'1988-10-21'};
 function read(input,topic){
  const f=fortuneCycles(input);
  return freeEpisodes(f,readPersonalReading(f,f.saju,''),'손님',topic);
 }
 const money=read(sample,'money'), work=read(sample,'work'), sameTopic=read(other,'money');
 assert.match(money[0].paragraphs[0],/돈 이야기/);
 assert.match(work[0].paragraphs[0],/일 이야기/);
 assert.notEqual(money[1].title,work[1].title);
 assert.notEqual(money[1].paragraphs[0],sameTopic[1].paragraphs[0]);
 assert.notEqual(money[1].art,sameTopic[1].art);
 const now=Date.UTC(2026,10,29);
 const a=buildFortuneReport(sample,{now}),b=buildFortuneReport(other,{now});
 assert.notEqual(a.chapters[6].story.intro[1],b.chapters[6].story.intro[1]);
 assert.ok(a.chapters.slice(14).some((c,i)=>c.story.intro[0]!==b.chapters[i+14].story.intro[0]));
 assert.deepEqual(a.chapters.map(c=>c.story),buildFortuneReport({...sample,name:'가상 이름 바꿈'},{now}).chapters.map(c=>c.story));
});
