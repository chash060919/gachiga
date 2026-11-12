const test=require('node:test');
const assert=require('node:assert/strict');
const V=require('../invite.js');
const S=require('../social.js');
function memory(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)};}
const room={code:'DEMO24',name:'친구들과의 약속',date:'2026-11-12',time:'18:00',place:'성수역'};
test('초대 문구에 방 정보와 데모 한계를 포함',()=>{const text=V.message(room);assert.match(text,/DEMO24/);assert.match(text,/성수역/);assert.match(text,/동기화되지 않아요/);});
test('초대 코드 쿼리 검증',()=>{assert.equal(V.codeFromSearch('?invite=demo24'),'DEMO24');assert.equal(V.codeFromSearch('?invite=hello%20world'),'');});
test('로컬 파일은 공유 URL을 생성하지 않음',()=>{assert.equal(V.link(room,{protocol:'file:',href:'file:///test/index.html'}),'');});
test('HTTP 링크는 초대 코드로 사전 입력 가능',()=>{const url=V.link(room,{protocol:'https:',href:'https://example.org/index.html'});assert.equal(new URL(url).searchParams.get('invite'),'DEMO24');});
test('데모 친구 답장은 데모방에서만 가능하고 로컬 기록에 저장',()=>{const store=memory();S.demoReply(store,'gachiga-demo-room','수빈','안녕');assert.equal(S.read(store,'gachiga-demo-room').at(-1).name,'수빈 · 데모');assert.throws(()=>S.demoReply(store,'other','수빈','안녕'));});
test('기존 사용자 채팅도 계속 저장',()=>{const store=memory();S.send(store,'gachiga-demo-room','테스트');assert.equal(S.read(store,'gachiga-demo-room').at(-1).text,'테스트');});
