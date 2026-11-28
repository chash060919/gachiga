/* Firebase 연결: 로그인한 참여자만 채팅을 읽고 쓸 수 있습니다. */
(function(root){
'use strict';
const config={apiKey:'AIzaSyBTMrFLOBvfs6FASWhRAppuso-zBmiHgjE',authDomain:'gachiga-52765.firebaseapp.com',projectId:'gachiga-52765',storageBucket:'gachiga-52765.firebasestorage.app',messagingSenderId:'519752912571',appId:'1:519752912571:web:73f309c7953a297884e39e',measurementId: 'G-RJQHJGS2D6'};
const state={ready:false,uid:null,error:null};let db,auth,api;
const base='https://www.gstatic.com/firebasejs/10.14.1/'; 
const ready=(async()=>{
 try{
  const [a,b,c]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  const app=a.initializeApp(config);auth=b.getAuth(app);db=c.getFirestore(app);api={...b,...c};
 await b.setPersistence(auth, b.browserLocalPersistence);
 await auth.authStateReady();
 b.onAuthStateChanged(auth, user => {
  state.uid = user && !user.isAnonymous ? user.uid : null;
  state.user = user && !user.isAnonymous ? user : null;
 });

state.ready = true;
 }catch(e){state.error=e;console.error('Firebase 연결 실패',e);}return state;
})();
async function register(email, password, name) {
  await ready;
  if (!state.ready) throw Error('Firebase 연결 실패');

  name = String(name || '').trim();
  if (!name || name.length > 12) {
    throw Error('이름은 1~12자로 입력해 주세요.');
  }

  const cred = await api.createUserWithEmailAndPassword(
    auth, email.trim(), password
  );

  await api.updateProfile(cred.user, {
    displayName: name
  });

  state.uid = cred.user.uid;
  state.user = cred.user;
  return cred.user;
}

async function login(email, password) {
  await ready;
  if (!state.ready) throw Error('Firebase 연결 실패');

  const cred = await api.signInWithEmailAndPassword(
    auth, email.trim(), password
  );

  state.uid = cred.user.uid;
  state.user = cred.user;
  return cred.user;
}

async function logout() {
  await ready;
  await api.signOut(auth);
  state.uid = null;
  state.user = null;
}
function requireReady() {
  if (!state.ready) {
    throw Error('Firebase 연결에 실패했어요.');
  }

  if (!state.uid || !auth.currentUser || auth.currentUser.isAnonymous) {
    throw Error('먼저 로그인해 주세요.');
  }
}
const ref=code=>api.doc(db,'rooms',code);
const member=(code,uid=state.uid)=>api.doc(db,'rooms',code,'members',uid);
const userRoom = (code, uid = state.uid) =>
  api.doc(db, 'users', uid, 'rooms', code);
async function create(room) {
  await ready;
  requireReady();

  const code = room.code;
  const displayName = String(room.displayName || '').trim();

  if (!displayName || displayName.length > 12) {
    throw Error('이름은 1~12자로 입력해 주세요.');
  }

  await api.setDoc(ref(code), {
    name: room.name,
    date: room.date,
    time: room.time,
    place: room.place,
    owner: state.uid,
    createdAt: api.serverTimestamp()
  });

  await api.setDoc(member(code), {
    joinedAt: api.serverTimestamp(),
    displayName
  });
  await api.setDoc(userRoom(code), {
    code: code,
    displayName: displayName
  });
  return { ...room, id: code, remote: true };
}
async function join(code, displayName) {
  await ready;
  requireReady();

  const name = String(displayName || '').trim();

  if (!name) {
    throw Error('지도에 표시할 이름을 입력해 주세요.');
  }

  if (name.length > 12) {
    throw Error('이름은 12자 이하로 입력해 주세요.');
  }

  const snap = await api.getDoc(ref(code));

  if (!snap.exists()) {
    throw Error('초대 코드에 해당하는 방이 없어요.');
  }

  await api.setDoc(member(code), {
    joinedAt: api.serverTimestamp(),
    displayName: name
  });
    
  await api.setDoc(userRoom(code), {
    code: code,
    displayName: name
  });

  return {
  id: code,
  code,
  ...snap.data(),
  displayName: name,
  remote: true
};
}
  async function leave(code) {
    await ready;
    requireReady();

    const batch = api.writeBatch(db);
    batch.delete(api.doc(db, 'rooms', code, 'locations', state.uid));
    batch.delete(userRoom(code));
    batch.delete(member(code));
    await batch.commit();
  }
    async function getMyRooms() {
    await ready;
    requireReady();

    const snapshot = await api.getDocs(
      api.collection(db, 'users', state.uid, 'rooms')
    );

    const result = [];

    for (const item of snapshot.docs) {
      const code = item.id;
      const roomSnap = await api.getDoc(ref(code));
      const memberSnap = await api.getDoc(member(code));

      if (roomSnap.exists() && memberSnap.exists()) {
        result.push({
          ...roomSnap.data(),
          id: code,
          code: code,
          displayName: memberSnap.data().displayName,
          remote: true
        });
      }
    }

    return result;
  }
async function send(code,text){await ready;requireReady();const clean=String(text).trim();if(!clean||clean.length>1000)throw Error('메시지는 1~1000자로 입력해 주세요.');
 await api.addDoc(api.collection(db,'rooms',code,'messages'),{sender:state.uid,name:'친구',text:clean,at:api.serverTimestamp()});
}
function listen(code,onData,onError){let unsub=()=>{},cancelled=false;ready.then(()=>{
 if(cancelled)return;try{requireReady();unsub=api.onSnapshot(api.query(api.collection(db,'rooms',code,'messages'),api.orderBy('at','asc'),api.limitToLast(200)),snap=>{
 onData(snap.docs.map(d=>{const v=d.data();return {id:d.id,sender:v.sender===state.uid?'me':v.sender,name:v.sender===state.uid?'나':'친구',text:v.text,at:v.at?.toDate?.()?.toISOString()||new Date().toISOString()};}));
 },onError);}catch(e){onError(e);}
 });return ()=>{cancelled=true;unsub();};}
 
// 내 현재 위치를 Firebase에 저장
async function setLocation(code, latitude, longitude, displayName) {
  await ready;
  requireReady();

  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    throw Error('올바르지 않은 위치 정보입니다.');
  }

  await api.setDoc(
    api.doc(db, 'rooms', code, 'locations', state.uid),
    {
      latitude,
      longitude,
      displayName: String(displayName || '참여자').trim(),
      updatedAt: api.serverTimestamp()
    }
  );
}

// 약속방 참여자들의 위치를 실시간으로 받기
function listenLocations(code,onData,onError){
 let unsub=()=>{},cancelled=false;

 ready.then(()=>{
  if(cancelled)return;

  try{
   requireReady();

   unsub=api.onSnapshot(
    api.collection(db,'rooms',code,'locations'),
    snap=>{
     onData(snap.docs.map(d=>{
      const v=d.data();
      return {
  uid: d.id,
  latitude: v.latitude,
  longitude: v.longitude,
  displayName: v.displayName || '참여자'
};
     }));
    },
    onError
   );
  }catch(e){
   onError(e);
  }
 });

 return ()=>{
  cancelled=true;
  unsub();
 };
}

// 내 위치 공유 중지 및 위치 정보 삭제
async function deleteLocation(code){
 await ready;
 requireReady();

 await api.deleteDoc(
  api.doc(db,'rooms',code,'locations',state.uid)
 );
}

root.GachigaFirebase={
 state,ready,create,join,leave,send,listen,
 setLocation,listenLocations,deleteLocation,
 register,login,logout,getMyRooms
};
})(globalThis);
