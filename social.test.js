const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../social.js');
function store(){const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)};}
test('데모 약속방만 예시 채팅을 가진다',()=>{const st=store();assert.equal(S.read(st,'gachiga-demo-room').length,4);assert.equal(S.read(st,'new-room').length,0);});
test('빈 메시지 전송 차단',()=>{assert.throws(()=>S.send(store(),'r','   '));});
test('전송 후 약속방별 메시지 저장 및 유지',()=>{const st=store();S.send(st,'r1','  안녕!  ',new Date('2026-11-11T05:00:00Z'));assert.equal(S.read(st,'r1')[0].text,'안녕!');assert.equal(S.read(st,'r2').length,0);});
test('기본 별칭으로 변환하고 비공개 필드 제외',()=>{const data=S.shareData({name:'만남',date:'2026-11-11',time:'14:00',code:'SECRET',place:'민감한 장소'},[{id:'a',name:'실명',minutes:5,arrived:false,x:1,y:2,transport:'비밀 경로'}],new Date('2026-11-11T05:00:00Z'),d=>d.toISOString());assert.equal(data.people[0].alias,'친구 1');assert.ok(!JSON.stringify(data).includes('SECRET'));assert.ok(!JSON.stringify(data).includes('민감한 장소'));assert.ok(!JSON.stringify(data).includes('실명'));assert.equal(data.everyone,'2026-11-11T05:05:00.000Z');});
test('도착 완료 인원은 가장 늦은 ETA 계산에서 제외',()=>{const data=S.shareData({name:'약속'},[{id:'a',minutes:12,arrived:false},{id:'b',minutes:0,arrived:true},{id:'c',minutes:5,arrived:false}],new Date('2026-11-11T05:00:00Z'),d=>d.toISOString());assert.equal(data.first,'친구 1');assert.equal(data.everyone,'2026-11-11T05:12:00.000Z');});
test('모두 도착 및 빈 목록 처리',()=>{const base=new Date('2026-11-11T05:00:00Z');assert.equal(S.shareData({},[{id:'a',minutes:0,arrived:true}],base,d=>d.toISOString()).everyone,'모두 도착 완료');assert.equal(S.shareData({},[],base,d=>d.toISOString()).everyone,'공유할 도착 정보 없음');});
