/* Firebase 연결: 로그인한 참여자만 채팅을 읽고 쓸 수 있습니다. */
(function(root){
'use strict';
const config={apiKey:'AIzaSyBtMrFLOBvfs6FASWhRApupso-zBmiHgjE',authDomain:'gachiga-52765.firebaseapp.com',projectId:'gachiga-52765',storageBucket:'gachiga-52765.firebasestorage.app',messagingSenderId:'519752912571',appId:'1:519752912571:web:73f309c7953a297884e39e'};
const state={ready:false,uid:null,error:null};let db,auth,api;
const base='https://www.gstatic.com/firebasejs/10.14.1/';
const ready=(async()=>{
 try{
  const [a,b,c]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  const app=a.initializeApp(config);auth=b.getAuth(app);db=c.getFirestore(app);api={...b,...c};
  const cred=await b.signInAnonymously(auth);state.uid=cred.user.uid;state.ready=true;
 }catch(e){state.error=e;console.error('Firebase 연결 실패',e);}return state;
})();
function requireReady(){if(!state.ready)throw Error('Firebase 연결에 실패했어요. 인터넷 연결과 Firebase 설정을 확인해 주세요.');}
const ref=code=>api.doc(db,'rooms',code);
const member=(code,uid=state.uid)=>api.doc(db,'rooms',code,'members',uid);
async function create(room){await ready;requireReady();const code=room.code;
 await api.setDoc(ref(code),{name:room.name,date:room.date,time:room.time,place:room.place,owner:state.uid,createdAt:api.serverTimestamp()});
 await api.setDoc(member(code),{joinedAt:api.serverTimestamp()});return {...room,id:code,remote:true};
}
async function join(code){await ready;requireReady();const snap=await api.getDoc(ref(code));if(!snap.exists())throw Error('초대 코드에 해당하는 방이 없어요.');
 await api.setDoc(member(code),{joinedAt:api.serverTimestamp()});return {id:code,code,...snap.data(),remote:true};
}
async function leave(code){await ready;requireReady();await api.deleteDoc(member(code));}
async function send(code,text){await ready;requireReady();const clean=String(text).trim();if(!clean||clean.length>1000)throw Error('메시지는 1~1000자로 입력해 주세요.');
 await api.addDoc(api.collection(db,'rooms',code,'messages'),{sender:state.uid,name:'친구',text:clean,at:api.serverTimestamp()});
}
function listen(code,onData,onError){let unsub=()=>{},cancelled=false;ready.then(()=>{
 if(cancelled)return;try{requireReady();unsub=api.onSnapshot(api.query(api.collection(db,'rooms',code,'messages'),api.orderBy('at','asc'),api.limitToLast(200)),snap=>{
 onData(snap.docs.map(d=>{const v=d.data();return {id:d.id,sender:v.sender===state.uid?'me':v.sender,name:v.sender===state.uid?'나':'친구',text:v.text,at:v.at?.toDate?.()?.toISOString()||new Date().toISOString()};}));
 },onError);}catch(e){onError(e);}
 });return ()=>{cancelled=true;unsub();};}
root.GachigaFirebase={state,ready,create,join,leave,send,listen};
})(globalThis);
