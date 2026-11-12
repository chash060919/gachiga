/* 3단계 교통 데이터: 실제 교통 API 대신 검증 가능한 시연용 정적 자료 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GachigaTransport=api;})(globalThis,function(){
'use strict';
const BUSES=[{id:'2000',stop:'강남역 정류장',minutes:12},{id:'1005',stop:'판교역 정류장',minutes:18},{id:'9401',stop:'서현역 정류장',minutes:25}];
const SUBWAYS=[{id:'2',name:'2호선',stations:['강남','역삼','선릉','삼성','종합운동장','잠실']},{id:'4',name:'4호선',stations:['서울역','회현','명동','충무로','동대문역사문화공원','동대문']},{id:'7',name:'7호선',stations:['고속터미널','반포','논현','학동','강남구청','청담']}];
const ICON={bus:'🚌',subway:'🚇',walk:'🚶',car:'🚕'};
const LABEL={bus:'버스',subway:'지하철',walk:'도보',car:'택시/자동차'};
function eta(base,minutes){if(!Number.isFinite(minutes)||minutes<0)throw Error('남은 시간은 0 이상의 숫자여야 합니다.');const d=new Date(base);if(Number.isNaN(d.getTime()))throw Error('기준 시각이 올바르지 않습니다.');return new Date(d.getTime()+minutes*60000);}
function formatClock(date){return new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date);}
function formatDateTime(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${formatClock(date)}`;}
function meetingDate(room){return new Date(`${room.date}T${room.time}:00`);}
function isLate(base,minutes,room){return eta(base,minutes).getTime()>meetingDate(room).getTime();}
function applyProgress(person,delta){if(!Number.isFinite(delta)||delta<0)throw Error('경과 시간이 올바르지 않습니다.');const minutes=Math.max(0,person.minutes-delta);const initial=Math.max(person.initialMinutes||person.minutes,1);return {...person,minutes,progress:Math.min(100,Math.max(0,Math.round((initial-minutes)/initial*100)))};}
function summarizePeople(people,base){const pending=people.filter(p=>!p.arrived).sort((a,b)=>a.minutes-b.minutes||a.name.localeCompare(b.name,'ko'));const arrived=people.filter(p=>p.arrived);return {pending,arrived,first:pending[0]||null,last:pending.at(-1)||null,allArrived:people.length>0&&pending.length===0,everyoneAt:pending.length?eta(base,pending.at(-1).minutes):null};}
function subwayJourney(lineId,from,to,status){const line=SUBWAYS.find(l=>l.id===lineId);if(!line)throw Error('노선을 선택해 주세요.');const start=line.stations.indexOf(from),end=line.stations.indexOf(to);if(start<0||end<0||start===end)throw Error('서로 다른 출발역과 목적지역을 선택해 주세요.');const stops=Math.abs(end-start);const total=stops*3+4;const minutes=status==='before'?total+5:status==='after'?4:total;const progress=status==='before'?0:status==='after'?90:15;return {minutes,stops,progress};}
return {BUSES,SUBWAYS,ICON,LABEL,eta,formatClock,formatDateTime,meetingDate,isLate,applyProgress,summarizePeople,subwayJourney};
});
