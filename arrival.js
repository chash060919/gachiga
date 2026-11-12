/* 도착 현황 계산: 브라우저와 Node 테스트에서 함께 사용합니다. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GachigaArrival = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DEMO_BASE = '2026-11-11T14:00:00';
  const DEMO_PARTICIPANTS = Object.freeze([
    {id:'subin', name:'수빈', transport:'🚌 2000번 버스', minutes:12, color:'peach', x:17, y:70},
    {id:'jimin', name:'지민', transport:'🚇 지하철 2호선', minutes:8, color:'lilac', x:35, y:26},
    {id:'hayoung', name:'하영', transport:'🚶 도보', minutes:5, color:'yellow', x:66, y:74},
    {id:'soyeon', name:'소연', transport:'📍 약속 장소', minutes:0, color:'mint', x:80, y:40}
  ]);
  function arrivalTime(base, minutes) {
    if (!Number.isFinite(minutes) || minutes < 0) throw new Error('올바른 남은 시간을 입력하세요.');
    const date = new Date(base);
    if (Number.isNaN(date.getTime())) throw new Error('올바른 기준 시각이 필요해요.');
    return new Intl.DateTimeFormat('ko-KR', {hour:'2-digit', minute:'2-digit', hour12:false}).format(new Date(date.getTime()+minutes*60000));
  }
  function summarize(participants, base=DEMO_BASE) {
    const waiting = participants.filter(p=>p.minutes>0).sort((a,b)=>a.minutes-b.minutes);
    const arrived = participants.filter(p=>p.minutes===0);
    return {
      waiting, arrived,
      first:waiting[0] || null,
      last:waiting[waiting.length-1] || null,
      everyoneAt:waiting.length ? arrivalTime(base,waiting[waiting.length-1].minutes) : null,
      allArrived:waiting.length===0 && participants.length>0
    };
  }
  return {DEMO_BASE, DEMO_PARTICIPANTS, arrivalTime, summarize};
});
