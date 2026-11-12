/* 친구 초대 메시지 생성. 서버가 없으므로 초대 코드는 실제 멀티기기 방을 만들지 않습니다. */
(function(root){
 'use strict';
 function message(room){
  return `💌 같이가(GATIGA) 약속방 초대\n\n🌿 ${room.name}\n📅 ${room.date} ${room.time}\n📍 ${room.place}\n🔑 초대 코드: ${room.code}\n\n같이가 앱에서 초대 코드를 입력해 줘!\n${room.remote?'※ 채팅은 Firebase로 동기화돼요. 위치·ETA는 각 기기에서 시연돼요.':'※ DEMO24는 다른 기기와 동기화되지 않아요.'}`;
 }
 function link(room,location){
  if(!location || !/^https?:$/.test(location.protocol))return '';
  const url=new URL(location.href);url.searchParams.set('invite',room.code);url.hash='';return url.href;
 }
 function codeFromSearch(search){const code=new URLSearchParams(search||'').get('invite')||'';return /^[A-Z0-9]{6,12}$/.test(code.toUpperCase())?code.toUpperCase():'';}
 root.GachigaInvite={message,link,codeFromSearch};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.GachigaInvite;
})(globalThis);
