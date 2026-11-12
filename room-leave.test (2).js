/* 약속방 나가기 시 다른 방의 기록이 보존되는지 확인합니다. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../room-leave.js');
const P=require('../privacy.js');
const S=require('../social.js');
function store(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
test('일반 방 나가기: 해당 방만 제거, 다른 방 유지',()=>{
 const db=store(),rooms=[{id:'a'},{id:'b'}];db.setItem('gachiga.rooms.v1',JSON.stringify(rooms));
 db.setItem(S.key('a'),'[]');db.setItem(S.key('b'),'[]');P.save(db,'a',{consented:true});P.save(db,'b',{consented:true});
 const left=L.leave(db,rooms[0],rooms,P.KEY,S.key);
 assert.deepEqual(left,[{id:'b'}]);assert.equal(db.getItem(S.key('a')),null);assert.equal(db.getItem(S.key('b')),'[]');
 assert.equal(P.get(db,'a').consented,false);assert.equal(P.get(db,'b').consented,true);
});
test('데모 방 나가기: 코드 재입장 숨김 플래그 유지',()=>{
 const db=store();L.leave(db,{id:'gachiga-demo-room',demo:true},[],P.KEY,S.key);
 assert.equal(L.isDemoLeft(db),true);
});
