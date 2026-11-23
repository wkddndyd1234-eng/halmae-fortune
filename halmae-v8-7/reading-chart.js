import {pillarElements} from './saju.mjs';

const descriptions = {
 목:'나무처럼 뻗고 자라는 모습을 떠올리는 상징이에요.',
 화:'불처럼 밝히고 전하는 모습을 떠올리는 상징이에요.',
 토:'흙처럼 받치고 기르는 모습을 떠올리는 상징이에요.',
 금:'쇠처럼 가르고 다듬는 모습을 떠올리는 상징이에요.',
 수:'물처럼 살피고 흐르는 모습을 떠올리는 상징이에요.',
};
const pillarLabels = ['연주','월주','일주','시주'];
const pillarMeanings = [
 '태어난 해를 나타내요. 이 풀이에서는 입춘을 한 해의 경계로 봐요.',
 '태어난 때의 절기를 나타내요. 양력 달력의 첫날이 아니라 절기가 바뀌는 시각을 기준으로 읽어요.',
 '태어난 날을 나타내요. 첫 글자인 일간에서 무료 이야기의 상징을 골랐어요.',
 '태어난 시각을 나타내요. 한국 시간으로 두 시간씩 나눈 구간을 기준으로 읽어요.',
];

const node = (tag,className,text)=>{
 const el=document.createElement(tag);
 if(className) el.className=className;
 if(text!==undefined) el.textContent=text;
 return el;
};

function disclosure(className,label,body) {
 const card=node('details',className);
 const summary=node('summary');
 summary.append(...label);
 card.append(summary,node('p','chart-explanation',body));
 return card;
}

export function renderReadingChart(pillarsContainer,elementsContainer,saju) {
 pillarsContainer.replaceChildren(...saju.pillars.map((pillar,index)=>{
  const pair = pillarElements(pillar);
  const glyphs=node('span','pillar-glyphs');
  if(pair){
   [...pillar].forEach((glyph,i)=>{
    const unit=node('span','chart-glyph',glyph);
    unit.dataset.element=pair[i];
    glyphs.append(unit);
   });
  } else glyphs.textContent='미상';
  const body=pair ? pillarMeanings[index]+` 첫 글자 ${pillar[0]}은 ${pair[0]}, 두 번째 글자 ${pillar[1]}은 ${pair[1]}이에요.` :
   '출생 시간을 입력하지 않아 시주와 그 두 글자의 오행을 빼고 읽었어요.';
  return disclosure('chart-pillar',[node('span','chart-pillar-label',pillarLabels[index]),glyphs],body);
 }));

 const total=Object.values(saju.elements).reduce((sum,count)=>sum+count,0);
 elementsContainer.replaceChildren(...Object.entries(saju.elements).map(([element,count])=>{
  const track=node('span','chart-track');
  track.setAttribute('aria-hidden','true');
  const fill=node('span','chart-fill');
  fill.style.width=(count/total*100)+'%';
  track.append(fill);
  const row=disclosure('chart-element',[node('span','chart-element-name',element),track,node('b','chart-count',count+'회')],
   `${descriptions[element]} 겉에 보이는 ${total}글자 중 ${count}회 나왔어요.`);
  row.dataset.element=element;
  return row;
 }));
}
