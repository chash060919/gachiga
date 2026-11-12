const test=require('node:test');const assert=require('node:assert/strict');const M=require('../meetup-memory.js');
function store(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
test('약속방마다 만남 기록이 분리된다',()=>{const s=store();M.add(s,'a',{date:'2026-11-12',place:'성수'});assert.equal(M.read(s,'a').length,1);assert.equal(M.read(s,'b').length,0);});
test('가장 자주 만난 장소와 횟수를 계산한다',()=>{const stats=M.stats([{place:'성수'},{place:'건대'},{place:'성수'}]);assert.deepEqual(stats,{count:3,topPlace:'성수',topCount:2});});
test('기록 삭제가 해당 약속방에만 적용된다',()=>{const s=store();const a=M.add(s,'a',{date:'2026-11-12',place:'성수'});M.add(s,'b',{date:'2026-11-12',place:'홍대'});M.remove(s,'a',a.id);assert.equal(M.read(s,'a').length,0);assert.equal(M.read(s,'b').length,1);});
test('말풍선은 방별로 저장되고 35자로 제한된다',()=>{const s=store();M.setBubble(s,'a','가'.repeat(40));assert.equal(M.getBubble(s,'a').length,35);assert.equal(M.getBubble(s,'b'),'');});
test('빈 말풍선을 저장하면 해당 방 말풍선만 제거된다',()=>{const s=store();M.setBubble(s,'a','곧 도착!');M.setBubble(s,'b','출발');M.setBubble(s,'a',' ');assert.equal(M.getBubble(s,'a'),'');assert.equal(M.getBubble(s,'b'),'출발');});
test('날짜나 장소가 없으면 기록하지 않는다',()=>{const s=store();assert.throws(()=>M.add(s,'a',{date:'',place:'성수'}));assert.throws(()=>M.add(s,'a',{date:'2026-11-12',place:' '}));});
