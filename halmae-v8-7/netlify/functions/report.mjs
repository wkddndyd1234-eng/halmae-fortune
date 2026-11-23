import {buildFortuneReport} from './fortune-report.mjs';
import {addChapterInterpretations,readStems} from './interpretation.mjs';
import {orders,json,verify,error} from './shared.mjs';
import {paymentConfig} from './payment-config.mjs';
import {eligibleOrder,REPORT_SCOPE,verifiedPurchase} from './entitlement.mjs';
import {calculateSaju} from './saju.mjs';
const weekdays=['일','월','화','수','목','금','토'];
const seasonData=[
 {name:'겨울의 깊은 결',months:[12,1,2],symbol:'머무름과 응축',strength:'오래 관찰하고 필요한 것을 남기는 태도',caution:'준비가 길어져 첫걸음을 늦추는 습관',question:'충분히 준비했다는 신호를 무엇으로 정할까?'},
 {name:'봄의 돋아나는 결',months:[3,4,5],symbol:'시작과 성장',strength:'새로운 가능성을 발견하고 시도하는 태도',caution:'시작의 열기가 마무리보다 앞서는 습관',question:'이번에는 어떤 일을 끝까지 키워볼까?'},
 {name:'여름의 뻗어가는 결',months:[6,7,8],symbol:'표현과 확장',strength:'사람과 기회를 연결하며 에너지를 나누는 태도',caution:'해야 할 일을 너무 넓게 벌리는 습관',question:'어디에 힘을 모아야 가장 멀리 갈까?'},
 {name:'가을의 거두는 결',months:[9,10,11],symbol:'정리와 선택',strength:'성과를 돌아보고 기준을 세우는 태도',caution:'완벽한 답을 찾느라 변화를 미루는 습관',question:'무엇을 내려놓으면 더 선명해질까?'}];
const themes=[
 ['1월','기초를 다지는 달','지난해의 선택을 돌아보고 올해 가장 중요한 한 가지를 정해 보세요.','지출·일정·관계를 한 페이지에 정리하기'],
 ['2월','관계를 살피는 달','주고받는 기대가 서로 같은지 대화로 확인해 보세요.','소중한 사람에게 구체적인 감사 전하기'],
 ['3월','새로운 시도를 여는 달','작은 실험 하나를 시작하되 끝나는 날짜를 함께 정해 보세요.','2주짜리 실험 계획 세우기'],
 ['4월','일의 방향을 고르는 달','바쁜 일과 중요한 일을 구분하면 판단이 쉬워집니다.','업무·학습의 우선순위 세 개 정하기'],
 ['5월','돈의 흐름을 점검하는 달','운에 맡길 수 없는 부분은 기록과 기준으로 지켜 보세요.','고정비와 비상자금 점검하기'],
 ['6월','몸과 마음의 리듬을 살피는 달','지속 가능한 속도가 긴 여정을 만듭니다.','회복을 위한 시간을 일정에 넣기'],
 ['7월','관계의 경계를 세우는 달','좋은 인연에는 존중과 명확한 경계가 함께 필요합니다.','부담스러운 부탁에 답할 기준 적기'],
 ['8월','배움과 확장을 살피는 달','새로운 지식은 실제 행동으로 옮길 때 의미가 생깁니다.','배운 것 하나를 결과물로 만들기'],
 ['9월','선택을 정리하는 달','많은 가능성보다 남길 가능성을 고르는 시기입니다.','진행 중인 계획 한 가지 정리하기'],
 ['10월','성과를 확인하는 달','숫자와 경험을 함께 돌아보면 다음 선택이 분명해집니다.','상반기 이후 변화 세 가지 기록하기'],
 ['11월','인연을 돌보는 달','오래 가는 관계는 거창한 약속보다 꾸준한 행동으로 자랍니다.','먼저 안부를 전할 사람 정하기'],
 ['12월','한 해를 매듭짓는 달','잘된 일과 아쉬운 일을 함께 받아들이고 다음 장을 준비하세요.','2028년으로 가져갈 원칙 한 가지 쓰기']];
function section(kicker,title,lead,paragraphs,bullets=[],quote=''){return {kicker,title,lead,paragraphs,bullets,quote}}
function readingNotices(saju){
 const notes=[];
 if(!saju.birthTime) notes.push('태어난 시간은 몰라서 시주를 비워 두었어요.');
 if(saju.warnings.some(note=>note.startsWith('절기'))) notes.push('절기 가까이 태어나 연주나 월주가 출생 시각에 따라 달라질 수 있어요.');
 if(saju.birthTime.startsWith('23:')) notes.push('밤 11시대에는 하루의 경계를 잡는 방식에 따라 일주와 시주가 달라질 수 있어요.');
 return notes;
}
export const buildReport = buildFortuneReport;
export default async req => {
 if (req.method !== 'GET') return json({error:'Method not allowed'},405);
 try {
  const claim = verify((req.headers.get('authorization') ?? '').replace(/^Bearer /,''));
  const demo = claim?.scope === 'report' && claim.demo === true;
  const config = claim?.scope === REPORT_SCOPE ? paymentConfig(req) : null;
  if (!demo && !config) return json({error:'유효한 보고서 접근 권한이 없습니다.'},403);
  const store = orders();
  const o = await store.get(claim.orderId,{type:'json'});
  if (!o || o.orderId !== claim.orderId) return json({error:'발급 권한이 확인되지 않았습니다.'},403);
  let purchase;
  if (demo) {
   if (o.status !== 'demo' || (o.channel && o.channel !== 'admin-demo')) {
    return json({error:'관리자 테스트 발급 권한이 확인되지 않았습니다.'},403);
   }
  } else {
   if (eligibleOrder(o,o.orderId) && o.status === 'test-paid') {
    purchase = await verifiedPurchase(config,store,o);
   }
   if (!purchase || claim.exp<=Date.now()) {
    return json({error:'완료된 테스트 카드 결제를 확인하지 못했습니다.'},403);
   }
  }
  return json({...buildReport(o),demo,...(!demo?{purchaseExpiresAt:purchase.purchaseExpiresAt}:{})});
 } catch (e) { return error(e); }
};
