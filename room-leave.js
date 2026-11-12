/* 6단계: 방 나가기의 로컬 저장 처리. 다른 방의 데이터는 건드리지 않습니다. */
(function(root){
 'use strict';
 const LEFT_KEY='gachiga.leftRooms.v1';
 function isDemoLeft(store){return store.getItem(LEFT_KEY)==='true';}
 function leave(store,room,rooms,privacyKey,chatKey){
  if(!room || !room.id)throw Error('약속방 정보가 없어요.');
  const remaining=rooms.filter(r=>r.id!==room.id);
  // 목록 변경을 먼저 저장하고 성공한 경우에만 해당 방의 개인 데이터를 정리합니다.
  if(room.demo)store.setItem(LEFT_KEY,'true');
  else store.setItem('gachiga.rooms.v1',JSON.stringify(remaining));
  store.removeItem(chatKey(room.id));
  const privacy=JSON.parse(store.getItem(privacyKey)||'{}');
  delete privacy[room.id];
  store.setItem(privacyKey,JSON.stringify(privacy));
  return remaining;
 }
 root.GachigaRoomLeave={LEFT_KEY,isDemoLeft,leave};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.GachigaRoomLeave;
})(globalThis);
