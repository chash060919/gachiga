/* 5단계: 채팅 저장 및 개인정보를 제외한 SNS 카드 데이터 생성. 외부 서버 연결 없음. */
(function(root){
 'use strict';
 const PREFIX='gachiga.chat.v1.';
 const DEMO_ID='gachiga-demo-room';
 const DEMO_MESSAGES=[
  {id:'demo-1',sender:'subin',name:'수빈',text:'나 2000번 버스 타고 가는 중! 🚌',at:'2026-11-11T13:48:00+09:00'},
  {id:'demo-2',sender:'jimin',name:'지민',text:'나도 곧 도착해 💚',at:'2026-11-11T13:50:00+09:00'},
  {id:'demo-3',sender:'hayoung',name:'하영',text:'카페 앞에서 만나자!',at:'2026-11-11T13:53:00+09:00'},
  {id:'demo-4',sender:'soyeon',name:'소연',text:'나 먼저 도착했어 🙌',at:'2026-11-11T13:55:00+09:00'}
 ];
 function key(roomId){return PREFIX+encodeURIComponent(roomId);}
 function read(store,roomId){
  try{const raw=store.getItem(key(roomId));if(raw===null)return roomId===DEMO_ID?DEMO_MESSAGES.map(x=>({...x})):[];
   const data=JSON.parse(raw);return Array.isArray(data)?data.filter(x=>x&&typeof x.text==='string'&&typeof x.sender==='string'):[];
  }catch{return [];}
 }
 function send(store,roomId,text,at){
  const clean=String(text||'').trim();if(!clean||clean.length>1000)throw Error('메시지는 1~1000자로 입력해 주세요.');
  const message={id:'m-'+Date.now()+'-'+Math.random().toString(36).slice(2),sender:'me',name:'나',text:clean,at:(at||new Date()).toISOString()};
  const messages=read(store,roomId);messages.push(message);store.setItem(key(roomId),JSON.stringify(messages));return message;
 }
 // 다른 사람의 메시지처럼 보이지만 데모 시뮬레이션임을 명확히 표시합니다.
 function demoReply(store,roomId,name,text,at){
  if(roomId!==DEMO_ID)throw Error('데모 약속방에서만 사용할 수 있어요.');
  const message={id:'demo-reply-'+Date.now()+'-'+Math.random().toString(36).slice(2),sender:'simulated',name:name+' · 데모',text:String(text),at:(at||new Date()).toISOString()};
  const messages=read(store,roomId);messages.push(message);store.setItem(key(roomId),JSON.stringify(messages));return message;
 }
 function aliasPeople(people){return people.map((p,i)=>({...p,alias:'친구 '+(i+1)}));}
 function shareData(room,people,base,formatDateTime){
  // 실제 좌표, 경로, 초대 코드, 인증 정보, 정확한 현재 위치를 복사하지 않습니다.
  const sorted=people.filter(p=>p&&p.id&&typeof p.minutes==='number').slice().sort((a,b)=>Number(a.arrived)-Number(b.arrived)||a.minutes-b.minutes);
  const aliases=aliasPeople(sorted);
  const pending=aliases.filter(p=>!p.arrived);
  const allArrived=aliases.length>0&&pending.length===0;
  const eta=m=>formatDateTime(new Date(base.getTime()+m*60000));
  return {
   title:String(room.name||'우리의 약속'),date:String(room.date||''),time:String(room.time||''),
   people:aliases.map(p=>({alias:p.alias,arrived:!!p.arrived,eta:p.arrived?'도착 완료':eta(p.minutes)})),
   first:pending.length?pending[0].alias:'—',
   everyone:allArrived?'모두 도착 완료':pending.length?eta(Math.max(...pending.map(p=>p.minutes))):'공유할 도착 정보 없음'
  };
 }
 root.GachigaSocial={PREFIX,DEMO_MESSAGES,key,read,send,demoReply,shareData};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.GachigaSocial;
})(globalThis);
