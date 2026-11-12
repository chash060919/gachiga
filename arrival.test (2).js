const test = require('node:test');
const assert = require('node:assert/strict');
const {DEMO_BASE, DEMO_PARTICIPANTS, arrivalTime, summarize} = require('../arrival.js');

test('남은 5/8/12분이 기준 시각과 일치한다', () => {
  assert.equal(arrivalTime(DEMO_BASE,5),'14:05');
  assert.equal(arrivalTime(DEMO_BASE,8),'14:08');
  assert.equal(arrivalTime(DEMO_BASE,12),'14:12');
});
test('이동 중인 참여자는 도착 예정 빠른 순서로 정렬한다', () => {
  assert.deepEqual(summarize(DEMO_PARTICIPANTS).waiting.map(p=>p.name),['하영','지민','수빈']);
});
test('도착 완료한 사람은 남은 시간 순위에서 제외한다', () => {
  const result=summarize(DEMO_PARTICIPANTS);
  assert.deepEqual(result.arrived.map(p=>p.name),['소연']);
  assert.equal(result.first.name,'하영');
  assert.equal(result.last.name,'수빈');
  assert.equal(result.everyoneAt,'14:12');
});
test('모두 도착했다면 모두 도착 완료를 반환한다', () => {
  const result=summarize([{name:'가',minutes:0},{name:'나',minutes:0}]);
  assert.equal(result.allArrived,true);
  assert.equal(result.everyoneAt,null);
});
test('참여자가 없는 새 약속방은 도착 시간을 만들지 않는다', () => {
  const result=summarize([]);
  assert.equal(result.allArrived,false);
  assert.equal(result.first,null);
  assert.equal(result.last,null);
});
test('음수 ETA는 거부한다', () => assert.throws(()=>arrivalTime(DEMO_BASE,-1)));
