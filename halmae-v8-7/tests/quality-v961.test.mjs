import assert from 'node:assert/strict';
import test from 'node:test';
import {fortuneCycles} from '../netlify/functions/fortune-cycles.mjs';
import {buildFortuneReport} from '../netlify/functions/fortune-report.mjs';
import {financeCases,workCases} from '../netlify/lib/interpretive-lenses.mjs';

const profile={birthDate:'1992-01-21',birthTime:'02:00',gender:'male'};
const rolesOf=(group,report,month)=>report.chapters[14+month].groups.find(entry=>entry.title===group).paragraphs.join(' ');
const nearTerm={birthDate:'1988-10-08',birthTime:'',gender:'male'};

test('재물 사례는 원국 재성의 위치와 정재·편재 조건을 구별한다',()=>{
 const compared={birthDate:'1995-07-15',birthTime:'14:30',gender:'female'};
 const male=buildFortuneReport(profile);
 const other=buildFortuneReport(compared);
 const natal=male.chapters[6].paragraphs.join(' ');
 assert.match(natal,/월간 辛의 정재/);
 assert.ok(rolesOf('재물운',male,0).includes(financeCases[0][0]));
 assert.notEqual(rolesOf('재물운',male,0),rolesOf('재물운',other,0));
});

test('같은 절기에서도 월지 관계 또는 이달 십성에 따라 직업 사례가 달라진다',()=>{
 const f=fortuneCycles(profile);
 const report=buildFortuneReport(profile);
 const variants=new Set();
 for(const [i,month] of f.monthly.entries()){
  const meeting=month.relations.find(item=>item.position==='월');
  const index=meeting||['정재','편관','정관'].includes(month.tenGod)?0:1;
  variants.add(index);
  const body=rolesOf('직업운',report,i);
  assert.ok(body.includes(workCases[i][index]));
  if(meeting) assert.ok(body.includes('월지 '+meeting.natal+'·절기 '+meeting.transit+'의 '+meeting.type));
 }
 assert.equal(variants.size,2);
});

test('절입일 시각 미상 장부에서는 확인된 일지 이외의 원국 관계를 사용하지 않는다',()=>{
 const f=fortuneCycles(nearTerm);
 const report=buildFortuneReport(nearTerm);
 assert.equal(f.saju.dateBoundaryUncertain,true);
 assert.equal(report.meta.pillars[3],null);
 const domain=report.chapters.slice(6,12).flatMap(chapter=>chapter.paragraphs).join(' ');
 assert.match(domain,new RegExp('일지 '+f.saju.dayBranch));
 assert.doesNotMatch(domain,/월간|연간|시간의|배우자나 결혼이 정해/);
 assert.match(report.chapters[11].paragraphs.join(' '),/질병, 장기 상태, 발병 시기는 판단할 수 없어/);
 for(const [i,month] of f.monthly.entries()){
  const romance=rolesOf('애정운',report,i);
  const caution=rolesOf('주의할 점',report,i);
  assert.doesNotMatch(caution,/연지|월지|시지/);
  for(const relation of month.relations.filter(item=>item.position==='일')){
   assert.ok(romance.includes('일지 '+relation.natal+'·절기 '+relation.transit+'의 '+relation.type));
  }
 }
});
