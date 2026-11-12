/* 4단계: 약속방별 데모 위치 공유 상태. 실제 위치·인증 정보는 다루지 않습니다. */
(function(root){
 'use strict';
 const KEY='gachiga.privacy.v1';
 function read(store){try{const data=JSON.parse(store.getItem(KEY)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch{return {};}}
 function get(store,roomId){const item=read(store)[roomId]||{};return {consented:item.consented===true,ended:item.ended===true,active:false};}
 function save(store,roomId,update){const data=read(store);const before=data[roomId]||{};data[roomId]={consented:update.consented===true,ended:before.ended===true||update.ended===true};store.setItem(KEY,JSON.stringify(data));return data[roomId];}
 function remove(store,roomId){const data=read(store);delete data[roomId];store.setItem(KEY,JSON.stringify(data));}
 function canStart(state,checked){return !state.ended && (state.consented===true || checked===true);}
 function visiblePeople(people,state){if(state.ended)return [];return people.filter(p=>p.id!=='me'||state.active===true);}
 root.GachigaPrivacy={KEY,read,get,save,remove,canStart,visiblePeople};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.GachigaPrivacy;
})(globalThis);
