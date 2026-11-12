/* 4단계 개인정보 보호 상태 단위 테스트 */
const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../privacy.js');
function memory(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
test('동의하지 않으면 공유 시작 불가',()=>{const s=memory();assert.equal(P.canStart(P.get(s,'a'),false),false);});
test('동의하면 해당 방의 동의 상태 저장',()=>{const s=memory();P.save(s,'a',{consented:true,ended:false});assert.equal(P.get(s,'a').consented,true);assert.equal(P.canStart(P.get(s,'a'),false),true);});
test('동의 상태는 방마다 분리',()=>{const s=memory();P.save(s,'a',{consented:true,ended:false});assert.equal(P.get(s,'b').consented,false);});
test('새로고침에 해당하는 새 조회는 공유 중지',()=>{const s=memory();P.save(s,'a',{consented:true,ended:false});assert.equal(P.get(s,'a').active,false);});
test('공유 중지 시 본인 마커만 숨김',()=>{const people=[{id:'me'},{id:'friend'}];assert.deepEqual(P.visiblePeople(people,{active:false,ended:false}),[{id:'friend'}]);assert.equal(P.visiblePeople(people,{active:true,ended:false}).length,2);});
test('약속방 종료 시 모든 마커 숨김, 재시작 불가',()=>{const s=memory();P.save(s,'a',{consented:true,ended:true});assert.deepEqual(P.visiblePeople([{id:'me'},{id:'friend'}],{active:true,ended:true}),[]);assert.equal(P.canStart(P.get(s,'a'),true),false);});
test('종료 상태는 이후 저장으로 해제되지 않음',()=>{const s=memory();P.save(s,'a',{consented:true,ended:true});P.save(s,'a',{consented:true,ended:false});assert.equal(P.get(s,'a').ended,true);});
