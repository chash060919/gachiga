/* Node 내장 테스트: 3단계 ETA, 날짜 경계, 정렬, 진행률 */
const test=require('node:test');const assert=require('node:assert/strict');const T=require('../transport.js');
test('자정이 지나면 다음 날짜로 ETA 계산',()=>assert.equal(T.formatDateTime(T.eta('2026-11-12T23:55:00',10)),'2026-11-13 00:05'));
test('약속 시각 경과와 지각 판정',()=>{const room={date:'2026-11-12',time:'14:00'};assert.equal(T.isLate('2026-11-12T13:55:00',5,room),false);assert.equal(T.isLate('2026-11-12T14:01:00',0,room),true);});
test('남은 시간이 0이어도 자동 도착 아님',()=>{const p=T.applyProgress({name:'나',minutes:3,initialMinutes:3,arrived:false},5);assert.equal(p.minutes,0);assert.equal(p.arrived,false);assert.equal(p.progress,100);});
test('도착자 제외하고 ETA 빠른 순 정렬',()=>{const people=[{name:'수빈',minutes:12,arrived:false},{name:'소연',minutes:0,arrived:true},{name:'하영',minutes:5,arrived:false}];const s=T.summarizePeople(people,'2026-11-12T14:00:00');assert.deepEqual(s.pending.map(p=>p.name),['하영','수빈']);assert.equal(s.last.name,'수빈');assert.equal(s.arrived.length,1);});
test('모두 도착 판정은 arrived 상태 기준',()=>{const s=T.summarizePeople([{name:'A',minutes:0,arrived:false}],'2026-11-12T14:00:00');assert.equal(s.allArrived,false);});
test('지하철 남은 역 수와 시간',()=>{const r=T.subwayJourney('2','강남','삼성','riding');assert.equal(r.stops,3);assert.equal(r.minutes,13);});
test('잘못된 역과 음수 ETA 거절',()=>{assert.throws(()=>T.subwayJourney('2','강남','강남','riding'));assert.throws(()=>T.eta('2026-11-12T14:00:00',-1));});
