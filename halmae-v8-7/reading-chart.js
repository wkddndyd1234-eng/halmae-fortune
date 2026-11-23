import {pillarElements} from './saju.mjs';

const descriptions = {
 목:['자라는 나무','씨앗을 심고 가지를 키우듯, 배움과 시작을 떠올려요.'],
 화:['밝히는 불','불을 밝혀 함께 바라보듯 표현하고 마음을 나누는 모습을 떠올려요.'],
 토:['받쳐 주는 흙','흙이 뿌리를 붙잡듯 곁을 돌보고 일상의 중심을 세우는 상징이에요.'],
 금:['다듬는 쇠','필요한 것을 가리고 가장자리를 다듬듯 기준을 돌아보는 상징이에요.'],
 수:['흐르는 물','물이 길을 찾듯 차분히 살피고 상황에 맞춰 움직이는 모습을 떠올려요.'],
};
const pillarLabels = ['연주','월주','일주','시주'];
const pillarMeanings = [
 '태어난 해를 나타내요. 이 풀이에서는 입춘을 한 해의 경계로 봐요.',
 '태어난 때의 절기를 나타내요. 양력 달력의 첫날이 아니라 절기가 바뀌는 시각을 기준으로 읽어요.',
 '태어난 날을 뜻해요. 첫 글자인 일간은 이야기의 상징을 고르는 기준이에요.',
 '태어난 시각을 나타내요. 한국 시간으로 두 시간씩 나눈 구간을 기준으로 읽어요.',
];

const node = (tag,className,text)=>{
 const el=document.createElement(tag);
 if(className) el.className=className;
 if(text!==undefined) el.textContent=text;
 return el;
};

function disclosure(group,index,labels,heading,body) {
 const button=node('button',`chart-toggle chart-${group}`);
 button.type='button';
 button.id=`chart-${group}-button-${index}`;
 const panel=node('div','chart-explanation');
 panel.id=`chart-${group}-detail-${index}`;
 panel.hidden=true;
 panel.setAttribute('role','region');
 panel.setAttribute('aria-labelledby',button.id);
 panel.append(node('strong','',heading),node('p','',body));
 button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-controls',panel.id);
 button.append(...labels);
 button.addEventListener('click',()=>{
  panel.hidden=!panel.hidden;
  button.setAttribute('aria-expanded',String(!panel.hidden));
 });
 return {button,panel};
}

export function renderReadingChart(pillarsContainer,elementsContainer,saju) {
 pillarsContainer.replaceChildren(...saju.pillars.flatMap((pillar,index)=>{
  const pair = pillarElements(pillar);
  const glyphs=node('span','pillar-glyphs');
  if(pair){
   [...pillar].forEach((glyph,i)=>{
    const unit=node('span','chart-glyph',glyph);
    unit.dataset.element=pair[i];
    glyphs.append(unit);
   });
  } else glyphs.textContent='미상';
  const body=pair ? pillarMeanings[index]+` ${pillar[0]}은 ${pair[0]}, ${pillar[1]}은 ${pair[1]}이에요.` :
   '출생 시간을 입력하지 않아 시주와 그 두 글자의 오행을 빼고 읽었어요.';
  const {button,panel}=disclosure('pillar',index,[node('span','chart-pillar-label',pillarLabels[index]),glyphs],pillarLabels[index],body);
  button.style.setProperty('--card-order',index*2);
  panel.style.setProperty('--detail-order',index<2?3:7);
  return [button,panel];
 }));

 const total=Object.values(saju.elements).reduce((sum,count)=>sum+count,0);
 elementsContainer.replaceChildren(...Object.entries(saju.elements).flatMap(([element,count],index)=>{
  const track=node('span','chart-track');
  track.setAttribute('aria-hidden','true');
  const fill=node('span','chart-fill');
  fill.style.width=(count/total*100)+'%';
  track.append(fill);
  const [summary,description]=descriptions[element];
  const {button,panel}=disclosure('element',index,[
   node('span','chart-element-name',element),node('span','chart-element-meaning',summary),
   node('b','chart-count',count+'회'),track,
  ],`${element} · ${summary}`,`${description} 겉으로 드러난 글자 ${total}개 중 ${count}회 나왔어요.`);
  button.dataset.element=element;
  return [button,panel];
 }));
}
