/* 약속방별 만남 도감: 브라우저 로컬 저장 전용. 서버 전송 없음. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GachigaMemory=api;})(globalThis,function(){
'use strict';
const key=id=>'gachiga.meetups.v1.'+id;
const bubbleKey=id=>'gachiga.mapbubble.v1.'+id;
function read(store,id){try{const v=JSON.parse(store.getItem(key(id))||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'):[];}catch{return [];}}
function save(store,id,records){store.setItem(key(id),JSON.stringify(records));}
function add(store,id,entry){const date=String(entry.date||'');const place=String(entry.place||'').trim().slice(0,80);const note=String(entry.note||'').trim().slice(0,160);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!place)throw Error('날짜와 장소를 확인해 주세요.');const records=read(store,id);const record={id:Date.now()+'-'+Math.random().toString(36).slice(2),date,place,note,photo:entry.photo||''};save(store,id,[record,...records]);return record;}
function remove(store,id,recordId){save(store,id,read(store,id).filter(r=>r.id!==recordId));}
function stats(records){const places={};for(const r of records){const p=String(r.place||'').trim();if(p)places[p]=(places[p]||0)+1;}const ranked=Object.entries(places).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko'));return {count:records.length,topPlace:ranked[0]?.[0]||null,topCount:ranked[0]?.[1]||0};}
function getBubble(store,id){try{return (store.getItem(bubbleKey(id))||'').slice(0,35);}catch{return '';}}
function setBubble(store,id,value){const text=String(value||'').trim().slice(0,35);if(text)store.setItem(bubbleKey(id),text);else store.removeItem(bubbleKey(id));return text;}
return {key,bubbleKey,read,add,remove,stats,getBubble,setBubble};
});
