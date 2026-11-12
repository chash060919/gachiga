/* 같이가 2단계: 1단계 저장 데이터 유지 + 로컬 코드 참여 + 데모 지도/ETA */
(() => {
  'use strict';
  const KEY = 'gachiga.rooms.v1'; // 1단계의 기존 저장 키를 그대로 사용합니다.
  const DEMO_ID = 'gachiga-demo-room';
  const LEFT_KEY = globalThis.GachigaRoomLeave.LEFT_KEY; // 나간 데모 약속방을 이 브라우저에서 숨깁니다.
  const leftDemo = (()=>{try{return localStorage.getItem(LEFT_KEY)==='true';}catch{return false;}})();
  let demoLeft = leftDemo;
  const app = document.querySelector('#app');
  const {DEMO_BASE, DEMO_PARTICIPANTS} = globalThis.GachigaArrival;
  const T=globalThis.GachigaTransport;
  const P=globalThis.GachigaPrivacy;
  const S=globalThis.GachigaSocial;
  const I=globalThis.GachigaShareImage;
  const V=globalThis.GachigaInvite;
  const M=globalThis.GachigaMemory;
  let shareSelection={};
  const privacySessions={}; // 현재 탭에서만 활성화. 새로고침하면 공유 중지.
  let consentRoomId=null;
  const demoPeople=DEMO_PARTICIPANTS.map(p=>({...p,arrived:p.id==='soyeon',initialMinutes:p.minutes,progress:p.id==='soyeon'?100:10,mode:p.id==='subin'?'bus':p.id==='jimin'?'subway':'walk'}));
  const ownPeople={}; // 새 약속방에는 사용자가 직접 설정한 본인만 추가합니다.
  const demoClock=new Date(DEMO_BASE);
  const simOffsets={};
  let transportMode=null;
  let editingPerson=null;
  let rooms = loadRooms();
  let screen = 'home';
  let selectedId = null;
  let selectedPerson = null;
  let toastTimer;
  let privacyReturn='home';
  let pendingInviteCode=V.codeFromSearch(window.location.search);
  // 데모 모드에서는 실제 GPS나 외부 지도 API를 호출하지 않습니다.
  const liveGps={roomId:null};
  function stopGps(){} // 기존 화면 전환 코드와의 호환성 유지
  function updateGpsMap(room){} // HTML/CSS 데모 지도만 사용


  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function demoRoom() {
    return {id:DEMO_ID, code:'DEMO24', name:'🌷 성수에서 만나는 우리', date:'2026-11-11',time:'14:00',place:'성수역 2번 출구',demo:true};
  }
  function loadRooms() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(r=>r && typeof r.id==='string') : [];
    } catch {return [];}
  }
  function saveRooms() {
    try {localStorage.setItem(KEY,JSON.stringify(rooms));return true;}
    catch {notify('저장 공간을 사용할 수 없어 현재 화면에서만 유지돼요.');return false;}
  }
  function notify(message) {
    const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3000);
  }
  function formatDate(date,time) {return `${escapeHtml(date)} · ${escapeHtml(time)}`;}
  function roomCard(room) {
    return `<button type="button" class="room-card" data-room="${escapeHtml(room.id)}"><span class="tag">${room.demo?'시연 전용 · 예시 참여자':'우리의 약속 ✨'}</span><h3>${escapeHtml(room.name)}</h3><p>📅 ${formatDate(room.date,room.time)}</p><p>📍 ${escapeHtml(room.place)}</p><span class="card-arrow">상세 보기 →</span></button>`;
  }
  function joinPanel() {
    return `<section class="join-panel"><div class="join-title"><span>💌</span><div><h2>초대 코드로 참여하기</h2><p>친구에게 받은 6자리 코드를 입력해요.</p></div></div><form id="join-form" class="join-form"><label class="sr-only" for="join-code">약속방 초대 코드</label><input id="join-code" name="code" maxlength="6" minlength="6" autocomplete="off" placeholder="예: ABC123" required><button type="submit" class="button primary">참여하기</button></form><p class="hint">현재는 같은 브라우저의 약속방 또는 데모방 DEMO24만 열 수 있어요. 다른 기기와 실제 참여·채팅 동기화는 지원하지 않아요.</p><p id="join-error" class="error" role="alert" hidden></p></section>`;
  }
  function renderHome() {
    const latest=[...rooms].reverse().slice(0,2);
    app.innerHTML=`<section class="hero"><div class="eyebrow">MEET UP, TOGETHER ♡</div><h1>우리, 얼마나<br>가까워졌을까?</h1><p>친구들과의 약속을 한곳에 모으고<br>만나는 순간까지 함께해요.</p><div class="hero-art" aria-hidden="true">🍑 🍋 🌿 💜</div><button class="button primary" data-go="create">새 약속 만들기 ＋</button></section>${joinPanel()}<section class="section-title"><h2>다가오는 우리의 약속</h2><button class="text-button" data-go="rooms">전체 보기 →</button></section>${demoLeft?'':roomCard(demoRoom())}${latest.map(roomCard).join('')}<div class="actions"><button class="button ghost full" data-go="privacy">🔒 개인정보 보호 안내</button></div>`;
  }
  function renderCreate() {
    app.innerHTML=`<div class="page-head"><div class="eyebrow">NEW MEETUP</div><h1>새로운 약속 만들기 ✨</h1><p>언제, 어디서 만날지 정해볼까요?<br>위도·경도 대신 장소 이름만 적으면 돼요.</p></div><form id="create-form" class="form-card"><div class="field"><label for="meeting-name">약속 이름</label><input id="meeting-name" name="name" maxlength="50" placeholder="예: 성수에서 만나는 토요일" required></div><div class="form-grid"><div class="field"><label for="meeting-date">날짜</label><input id="meeting-date" name="date" type="date" required></div><div class="field"><label for="meeting-time">시간</label><input id="meeting-time" name="time" type="time" required></div></div><div class="field"><label for="meeting-place">약속 장소</label><input id="meeting-place" name="place" maxlength="100" placeholder="예: 성수역 2번 출구" required><p class="hint">장소 이름을 저장해요. 지도 배경은 실제 지도이며 목적지 검색·경로 안내는 아직 연결하지 않았어요.</p></div><p id="form-error" class="error" role="alert" hidden></p><button class="button primary full" type="submit">약속방 생성하기 ✨</button></form>`;
    const date=document.querySelector('#meeting-date');
    const now=new Date();const today=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    date.min=today;date.value=today;
  }
  function renderRooms() {
    app.innerHTML=`<div class="page-head"><div class="eyebrow">OUR MEETUPS</div><h1>내 약속방 🌿</h1><p>우리가 만든 약속을 한눈에 확인해요.</p></div>${joinPanel()}<div class="section-title"><h2>약속방 목록</h2></div>${demoLeft?'':roomCard(demoRoom())}${[...rooms].reverse().map(roomCard).join('')}<div class="actions"><button class="button ghost full" data-go="privacy">🔒 개인정보 보호 안내</button></div><div class="actions"><button class="button secondary full" data-go="create">＋ 새 약속 만들기</button></div>`;
  }
  function codeBox(room) {
    return `<div class="code-box"><div class="subtle">친구 초대 코드</div><div class="code">${escapeHtml(room.code)}</div><button class="button ghost" data-copy="${escapeHtml(room.code)}">📋 코드 복사하기</button></div>`;
  }
  function renderSuccess(room) {
    app.innerHTML=`<section class="success-burst"><div class="emoji">🎉</div><h1>약속방 완성!</h1><p>친구들에게 초대 코드를 알려주세요.</p></section><section class="detail-card"><span class="tag">함께 만나는 날</span><h2>${escapeHtml(room.name)}</h2><div class="info-row"><span>📅 날짜와 시간</span><strong>${formatDate(room.date,room.time)}</strong></div><div class="info-row"><span>📍 약속 장소</span><strong>${escapeHtml(room.place)}</strong></div>${codeBox(room)}<p class="hint">초대 코드는 같은 브라우저에서만 확인할 수 있어요. 실제 기기 간 초대는 추후 서버 연동이 필요해요.</p></section><div class="actions"><button class="button primary full" data-open-detail="${escapeHtml(room.id)}">약속방 상세 보기 →</button><button class="button secondary full" data-go="rooms">내 약속방 보기</button></div>`;
  }
  function currentRoom(){return selectedId===DEMO_ID?demoRoom():rooms.find(r=>r.id===selectedId);}
  function privacyFor(room){return {...P.get(localStorage,room.id),active:privacySessions[room.id]===true};}
  function peopleFor(room){
    // 실제 GPS가 아닌 데모 좌표. 이동수단 설정 전에도 공유 동의 후 내 마커를 표시합니다.
    const me=room.demo ? demoPeople.find(p=>p.id==='me') : ownPeople[room.id];
    const people=room.demo?[...demoPeople]:[];
    if(!me && privacySessions[room.id]){
      const placeholder={id:'me',name:'나',transport:'이동수단 미설정',minutes:0,arrived:false,progress:0,color:'mint',x:51,y:57};
      if(room.demo)demoPeople.push(placeholder);else ownPeople[room.id]=placeholder;
      people.push(placeholder);
    } else if(me && !room.demo)people.push(me);
    const currentMe=people.find(p=>p.id==='me');
    if(currentMe)currentMe.bubble=M.getBubble(localStorage,room.id);
    return people;
  }
  function baseFor(room){return new Date((room.demo?demoClock:new Date()).getTime()+(simOffsets[room.id]||0)*60000);}
  function timeLabel(base,p){return T.formatDateTime(T.eta(base,p.minutes));}
  function personCard(p,room,base){
    const late=!p.arrived&&T.isLate(base,p.minutes,room);
    return `<button type="button" class="participant-card ${p.arrived?'arrived':''}" data-person="${escapeHtml(p.id)}"><span class="avatar ${p.color}">${escapeHtml(p.name[0])}</span><span class="participant-main"><strong>${escapeHtml(p.name)} ${p.id==='me'?'<small>(나)</small>':''}</strong><small>${escapeHtml(p.transport)}</small><small>${p.arrived?'도착 확인':`예상 도착 ${timeLabel(base,p)}`}</small><small>${p.arrived?'도착 완료':late?'⚠️ 지각 예상':p.minutes===0?'도착 여부 확인 필요':'이동 중'}</small><span class="progress-track"><span class="progress-fill" style="width:${Math.max(0,Math.min(100,p.progress||0))}%"></span></span></span><span class="participant-eta"><strong>${p.arrived?'도착':`${p.minutes}분`}</strong><small>${p.arrived?'완료':`${p.progress||0}% 진행`}</small></span></button>`;
  }
  // 동의 전에는 본인 데모 마커를 숨기고, 공유 종료된 방에서는 모든 마커를 숨깁니다.
  function renderDetail(room){
    const state=privacyFor(room),people=peopleFor(room),base=baseFor(room);
    const visible=P.visiblePeople(people,state);
    const status=state.ended?'데모 위치 공유 종료':state.active?'데모 위치 공유 중':'데모 위치 공유 중지';
    const result=T.summarizePeople(visible,base);
    const current=visible.find(p=>p.id===selectedPerson);
    const lastText=state.ended?'위치 공유가 종료되어 ETA를 표시하지 않아요.':result.allArrived?'🎉 모두 도착 완료':result.everyoneAt?`✨ 모두 도착 예상 <strong>${T.formatDateTime(result.everyoneAt)}</strong>`:'아직 도착 정보를 계산할 수 없어요.';
    const masked=people.filter(p=>p.id==='me'&&!state.active || state.ended);
    const show=state.ended?[]:people.filter(p=>p.id!=='me'||state.active);
    const summary=state.ended?T.summarizePeople([],base):T.summarizePeople(show,base);
    const invite=room.demo?'<p class="hint">초대 코드는 기본 화면에서 숨겨져 있어요. 시연 코드 DEMO24는 공개된 예시 코드예요.</p>':'<p class="hint">초대 코드는 기본 화면에서 숨겨져 있어요. 필요할 때만 펼쳐 복사해 주세요.</p>';
    app.innerHTML=`<div class="detail-heading"><button class="back-link" data-go="rooms">← 내 약속방</button><span class="demo-badge">실제 지도 · 친구 위치는 데모</span></div>
      <div class="page-head detail-head"><div class="eyebrow">MEETUP DETAILS</div><h1>${escapeHtml(room.name)}</h1><p>📅 ${formatDate(room.date,room.time)}<br>📍 ${escapeHtml(room.place)}<br>👥 참여자 ${people.length}명${room.demo?' (시연 데이터)':''}</p></div>
      <section class="share-panel ${state.active?'sharing':''}" aria-label="위치 공유 상태"><div class="share-status"><span class="status-dot"></span><div><strong>${status}</strong><p>${state.active?'예시 위치를 지도에 표시하고 있어요. 실제 GPS는 사용하지 않아요.':state.ended?'이 약속방의 데모 공유가 종료됐어요.':'동의 전에는 내 위치 마커를 표시하지 않아요.'}</p></div></div><div class="share-buttons">${state.ended?'':state.active?'<button class="button stop-share" data-share-stop>■ 위치 공유 중지</button>':'<button class="button primary" data-share-start>📍 내 위치 공유 시작</button>'}</div><p class="hint">데모 모드 · 예시 위치만 표시해요. 실제 GPS를 수집하거나 다른 기기로 전송하지 않아요.</p></section>
      <section class="map-section"><div class="section-title compact"><h2>우리 지금 어디쯤? 🗺️</h2></div><div id="gps-mock-map">${globalThis.GachigaMap.render(visible)}</div><p class="hint" id="gps-status" aria-live="polite">데모 모드 · 예시 위치 · 실제 GPS 및 지도 API 미사용</p><div class="map-bubble-editor"><label for="map-bubble-text">💬 내 지도 프로필 한 줄 말풍선</label><form id="map-bubble-form" class="bubble-form"><input id="map-bubble-text" name="bubble" maxlength="35" placeholder="예: 5분 뒤 도착해!" ><button type="submit" class="button secondary">적용</button></form><p class="hint">최대 35자 · Enter로 적용하면 입력칸이 비워져요. 저장된 말풍선은 내 위치 공유 중에 지도에 보여요.</p></div>${current?`<div class="map-person-info"><strong>${escapeHtml(current.name)}</strong><span>${escapeHtml(current.transport)} · ${current.arrived?'도착 완료':`${current.minutes}분 남음 · ${timeLabel(base,current)}`}</span></div>`:`<p class="hint">${state.ended?'약속방 공유가 종료되어 모든 마커가 숨겨졌어요.':!state.active?'내 데모 마커는 공유 동의 후 표시돼요.':''} ${room.demo&&!state.ended?'다른 친구들은 시연용 가상 데이터예요.':''}</p>`}</section>
      <section class="arrival-section"><div class="section-title compact"><h2>도착 시간 한눈에 ⏰</h2></div><div class="summary-card"><div class="summary-place">📍 ${escapeHtml(room.place)}</div><p class="hint">${room.demo?'시연용 가상 기준 시각':'현재 시각 기준'} ${T.formatDateTime(base)} · 실제 GPS/ETA 아님</p><div class="summary-grid"><div><small>가장 먼저 도착 예정</small><strong>${escapeHtml(summary.first?.name||'—')}</strong><span>${summary.first?timeLabel(base,summary.first):'—'}</span></div><div><small>가장 늦게 도착 예정</small><strong>${escapeHtml(summary.last?.name||'—')}</strong><span>${summary.last?timeLabel(base,summary.last):'—'}</span></div></div><div class="all-arrival">${state.ended?'공유 종료':summary.allArrived?'🎉 모두 도착 완료':summary.everyoneAt?`✨ 모두 도착 예상 <strong>${T.formatDateTime(summary.everyoneAt)}</strong>`:'아직 도착 정보를 계산할 수 없어요.'}</div></div></section>
      <section class="participants-section"><div class="section-title compact"><h2>친구들의 도착 현황</h2><span class="subtle">${people.length}명</span></div>${summary.pending.map(p=>personCard(p,room,base)).join('')}${summary.arrived.length?`<div class="arrived-label">✓ 도착 완료</div>${summary.arrived.map(p=>personCard(p,room,base)).join('')}`:''}${masked.map(p=>`<div class="participant-card private-person"><span class="avatar ${escapeHtml(p.color)}">${escapeHtml(p.name[0])}</span><span class="participant-main"><strong>${escapeHtml(p.name)}</strong><small>${state.ended?'약속방 공유 종료':'위치 공유 중지'}</small><small>위치 및 ETA 비공개</small></span>🔒</div>`).join('')}${!people.length?'<div class="empty small-empty"><h3>아직 참여자가 없어요</h3><p>내 이동수단을 설정하면 본인의 정보만 추가돼요.</p></div>':''}</section>
      <section class="detail-card detail-invite"><h2>친구를 초대해요 💌</h2>${invite}<button class="button ghost full" data-reveal-code aria-expanded="false">🔒 초대 코드 보기</button><div id="private-code" hidden>${codeBox(room)}</div></section>
      <div class="detail-actions"><button class="button secondary" data-transport="open">🚌 내 이동수단 설정</button><button class="button secondary" data-invite>💌 친구 초대</button><button class="button secondary" data-chat>💬 채팅</button><button class="button secondary" data-memory>📒 우리 모임의 만남 도감</button></div><div class="simulation-actions"><button class="button ghost" data-simulate="5">⏱ 5분 경과</button><button class="button ghost" data-arrive>✓ 도착 완료</button></div><div class="actions"><button class="button ghost full" data-go="privacy">🔒 개인정보 보호 안내</button><button class="button ghost full" data-go="home">홈으로 돌아가기</button><button class="button leave-room-button full" data-leave-room>🚪 약속방 나가기</button></div>`;
    updateGpsMap(room);
  }

  // 5번 아이디어: 같은 약속방에 기록을 쌓아 만남 횟수와 자주 간 장소를 확인합니다.
  function renderMemory(room){
    const demoEntries=room.demo?[
      {id:'sample-1',date:'2026-10-25',place:'성수동',note:'다 같이 카페에 간 날',sample:true},
      {id:'sample-2',date:'2026-09-12',place:'성수동',note:'오랜만에 모인 토요일',sample:true},
      {id:'sample-3',date:'2026-08-03',place:'건대입구',note:'맛집 탐방',sample:true}
    ]:[];
    const saved=M.read(localStorage,room.id);
    const records=[...saved,...demoEntries].sort((a,b)=>b.date.localeCompare(a.date));
    const stat=M.stats(records);
    const cards=records.map(r=>`<article class="memory-entry">${r.photo?`<img src="${escapeHtml(r.photo)}" alt="만남 기록 사진" class="memory-photo">`:''}<div class="memory-entry-body"><div class="memory-entry-top"><span class="tag">${escapeHtml(r.date)}</span>${r.sample?'<span class="demo-badge">예시 기록</span>':`<button class="memory-delete" data-memory-delete="${escapeHtml(r.id)}" aria-label="기록 삭제">삭제</button>`}</div><h3>📍 ${escapeHtml(r.place)}</h3>${r.note?`<p>${escapeHtml(r.note)}</p>`:''}</div></article>`).join('');
    app.innerHTML=`<div class="detail-heading"><button class="back-link" data-back-detail>← 약속방으로</button><span class="demo-badge">로컬 기록 · 데모</span></div><div class="page-head"><div class="eyebrow">OUR MEETUP ARCHIVE</div><h1>우리 모임의 만남 도감 📒</h1><p>${escapeHtml(room.name)}<br>함께한 순간을 하나씩 모아봐요.</p></div>
    <section class="memory-stats"><div><small>우리의 만남</small><strong>${stat.count}<em>번</em></strong></div><div><small>가장 많이 만난 장소</small><strong class="memory-place">${escapeHtml(stat.topPlace||'아직 없어요')}</strong><span>${stat.topCount?`${stat.topCount}회 방문`: '기록을 추가해 주세요'}</span></div></section>
    ${room.demo?'<p class="hint">데모 약속방의 예시 기록 3개가 포함돼 있어요. 새로 추가한 기록과 구분해서 표시해요.</p>':''}
    <section class="detail-card memory-create"><h2>＋ 새로운 만남 기록하기</h2><form id="memory-form"><div class="form-grid"><div class="field"><label for="memory-date">만난 날짜</label><input type="date" id="memory-date" name="date" required></div><div class="field"><label for="memory-place">만난 장소</label><input id="memory-place" name="place" maxlength="80" placeholder="예: 성수동" required></div></div><div class="field"><label for="memory-note">우리의 한 줄 추억</label><input id="memory-note" name="note" maxlength="160" placeholder="예: 비 오는 날 같이 먹은 떡볶이"></div><div class="field"><label for="memory-photo">사진 한 장 (선택)</label><input id="memory-photo" type="file" accept="image/*"><p class="hint">사진은 작게 압축해 이 브라우저에만 저장돼요. 큰 사진이나 저장 공간 부족 시 저장이 제한될 수 있어요.</p></div><button class="button primary full" type="submit">만남 도감에 추가하기</button></form></section>
    <section class="memory-list"><div class="section-title compact"><h2>우리의 만남 기록</h2><span class="subtle">${records.length}개</span></div>${cards||'<div class="empty small-empty">아직 기록이 없어요. 첫 만남을 남겨봐요 🌱</div>'}</section>`;
    const date=document.querySelector('#memory-date');const now=new Date();date.value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }
  function resizeMemoryPhoto(file){
    return new Promise((resolve,reject)=>{if(!file){resolve('');return;}if(!file.type.startsWith('image/')){reject(Error('이미지 파일만 선택해 주세요.'));return;}
      const img=new Image(),url=URL.createObjectURL(file);
      img.onload=()=>{try{const scale=Math.min(1,900/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.65);URL.revokeObjectURL(url);resolve(data);}catch(e){URL.revokeObjectURL(url);reject(e);}};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('사진을 읽을 수 없어요.'));};img.src=url;
    });
  }
  async function saveMemory(form){const room=currentRoom();if(!room)return;const submit=form.querySelector('button[type=submit]');submit.disabled=true;
    try{const photo=await resizeMemoryPhoto(document.querySelector('#memory-photo').files[0]);const data=new FormData(form);M.add(localStorage,room.id,{date:data.get('date'),place:data.get('place'),note:data.get('note'),photo});renderMemory(room);notify('만남 도감에 기록을 추가했어요!');}
    catch(e){notify(e?.name==='QuotaExceededError'?'저장 공간이 부족해요. 사진 없이 다시 시도해 주세요.':e.message||'기록 저장에 실패했어요.');submit.disabled=false;}
  }
  // 채팅은 약속방 ID별로 localStorage에 저장되며, 다른 기기와 동기화되지 않습니다.
  function renderChat(room){
    const people=peopleFor(room),messages=S.read(localStorage,room.id);
    app.innerHTML=`<div class="detail-heading"><button class="back-link" data-back-detail>← 약속방으로</button><span class="demo-badge">로컬 데모 채팅</span></div>
      <div class="page-head"><div class="eyebrow">OUR CHAT</div><h1>💬 ${escapeHtml(room.name)}</h1><p>👥 참여자 ${people.length}명 · 이 브라우저에서만 저장돼요.</p></div>
      <section class="chat-panel"><div class="chat-messages" id="chat-messages" aria-label="약속방 메시지">${messages.length?messages.map(m=>`<div class="chat-row ${m.sender==='me'?'mine':''}">${m.sender==='me'?'':`<span class="chat-avatar">${escapeHtml(m.name.slice(0,1))}</span>`}<div class="chat-content"><small>${escapeHtml(m.sender==='me'?'나':m.name)}</small><div class="chat-bubble">${escapeHtml(m.text)}</div><time>${escapeHtml(chatTime(m.at))}</time></div></div>`).join(''):'<div class="chat-empty">아직 대화가 없어요. 첫 메시지를 보내보세요! 🌱</div>'}</div>
      <form id="chat-form" class="chat-compose"><label class="sr-only" for="chat-input">메시지 입력</label><input id="chat-input" name="message" maxlength="1000" placeholder="메시지를 입력해 주세요" autocomplete="off" required><button class="button primary" type="submit">전송</button></form></section>
      ${room.demo?'<button type="button" class="button secondary full" data-demo-reply>💬 데모 친구 답장 받아보기</button>':''}<p class="hint">서버 없는 데모 채팅이에요. 다른 휴대폰으로 전송되지 않으며, 데모 친구 답장은 시뮬레이션입니다.</p>`;
    const box=document.querySelector('#chat-messages');box.scrollTop=box.scrollHeight;
  }
  // 데모방에만 예시 친구의 답장을 직접 추가해 채팅 UI를 시험할 수 있습니다.
  function demoReply(){
    const room=currentRoom();if(!room?.demo)return;
    const options=[['수빈','나도 지금 출발했어! 🚌'],['지민','우리 어디서 만날까? 💚'],['하영','조금만 기다려 줘! ☺️'],['소연','도착하면 톡 남겨줘 🙌']];
    const [name,text]=options[Math.floor(Math.random()*options.length)];
    S.demoReply(localStorage,room.id,name,text);
    renderChat(room);notify(`${name}의 시뮬레이션 답장을 추가했어요.`);
  }
  // 초대 코드 공유는 문자/메신저 공유 시트로 전달합니다. 실제 방 동기화는 아닙니다.
  function inviteModal(room){
    const host=document.querySelector('#modal-root');
    const message=V.message(room),url=V.link(room,window.location);
    host.innerHTML=`<div class="modal-backdrop"><section class="consent-modal invite-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title"><div class="invite-emoji">💌</div><h2 id="invite-title">친구를 초대해요!</h2><p><strong>${escapeHtml(room.name)}</strong></p><div class="invite-code"><small>초대 코드</small><strong>${escapeHtml(room.code)}</strong></div><p class="hint">카카오톡 등 메신저로 초대 문구를 보낼 수 있어요. 현재는 서버가 없어 다른 기기에서 실제로 같은 방에 참여하거나 채팅할 수는 없어요.</p><div class="invite-actions"><button class="button primary full" data-invite-share>📤 카카오톡·메시지 등으로 공유</button><button class="button secondary full" data-invite-copy>📋 초대 문구 복사</button><button class="button ghost full" data-invite-code>🔑 코드만 복사</button><button class="button ghost full" data-invite-close>닫기</button></div>${url?'<p class="hint">앱이 웹 서버에 게시되어 있다면 초대 링크도 함께 전송돼요. 실제 참여는 별도 서버 구현이 필요해요.</p>':''}</section></div>`;
  }
  function closeInvite(){document.querySelector('#modal-root').innerHTML='';}
  async function copyInvite(value){
    try{await navigator.clipboard.writeText(value);notify('복사했어요! 카카오톡이나 인스타 DM에 붙여넣어 주세요.');}
    catch{window.prompt('아래 내용을 복사해 주세요.',value);}
  }
  async function shareInvite(room){
    const message=V.message(room),url=V.link(room,window.location);
    if(navigator.share){
      try{await navigator.share({title:'같이가 약속방 초대',text:message,...(url?{url}:{})});notify('공유 메뉴를 닫았어요.');}
      catch(e){if(e.name==='AbortError')notify('공유를 취소했어요.');else {await copyInvite(message+(url?'\n'+url:''));notify('공유할 수 없어 초대 문구를 복사했어요.');}}
    }else{await copyInvite(message+(url?'\n'+url:''));}
  }
  function chatTime(at){const d=new Date(at);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d);}
  function sendChat(form){
    const room=currentRoom();if(!room)return;
    try{S.send(localStorage,room.id,new FormData(form).get('message'));renderChat(room);document.querySelector('#chat-input').focus();}
    catch(e){notify(e.message.includes('quota')?'저장 공간이 부족해 메시지를 저장하지 못했어요.':e.message);}
  }
  // 공유 정보는 화이트리스트 기반으로 구성해 코드·좌표·경로가 이미지로 전달되지 않습니다.
  function availableForShare(room){const state=privacyFor(room);return state.ended?[]:peopleFor(room).filter(p=>p.id!=='me'||state.active);}
  function sharePayload(room){
    const allowed=new Set(availableForShare(room).map(p=>p.id));
    const people=availableForShare(room).filter(p=>allowed.has(p.id)&&shareSelection[p.id]!==false);
    return S.shareData(room,people,baseFor(room),T.formatDateTime);
  }
  function renderSns(room){
    const people=availableForShare(room),data=sharePayload(room);
    app.innerHTML=`<div class="detail-heading"><button class="back-link" data-back-detail>← 약속방으로</button><span class="demo-badge">데모 모드 · 익명 공유</span></div>
      <div class="page-head"><div class="eyebrow">SHARE OUR MOMENT</div><h1>📸 도착 현황 공유</h1><p>공유할 친구를 선택한 뒤 이미지로 저장하거나 공유해요.</p></div>
      <section class="detail-card"><h2>공유할 도착 현황 선택</h2><p class="hint">닉네임은 친구 1, 친구 2처럼 익명 처리해요. 좌표·경로·초대 코드는 포함하지 않아요.</p>
      ${people.length?people.map((p,i)=>`<label class="sns-check"><input type="checkbox" data-share-person="${escapeHtml(p.id)}" ${shareSelection[p.id]===false?'':'checked'}><span>${escapeHtml(p.name)} → 익명 별칭 · ${p.arrived?'도착 완료':`${p.minutes}분 남음`}</span></label>`).join(''):'<p class="hint">공유 가능한 도착 현황이 없어요. 본인의 위치 공유를 시작하거나 이동수단을 설정해 주세요.</p>'}</section>
      <section class="sns-preview-wrap"><div class="section-title compact"><h2>스토리 미리보기</h2><span class="subtle">9:16 · 1080×1920</span></div>
      <div class="sns-story" aria-label="인스타그램 스토리 비율 미리보기"><div class="sns-story-inner"><span class="sns-brand">✳ 같이가 GATIGA</span><h2>우리, 거의 다 왔어!</h2><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.date)} · ${escapeHtml(data.time)}</p><div class="sns-summary"><small>모두 도착 예정</small><strong>${escapeHtml(data.everyone)}</strong></div><h4>친구들의 도착 현황</h4>${data.people.slice(0,7).map(p=>`<div class="sns-person"><span>${escapeHtml(p.alias)}</span><strong>${escapeHtml(p.eta)}</strong></div>`).join('')}${data.people.length>7?`<p>외 ${data.people.length-7}명</p>`:''}<div class="sns-first">가장 먼저 도착 예정 · ${escapeHtml(data.first)}</div><small class="sns-footer">데모 모드 · 예시 도착 현황</small></div></div></section>
      <div class="actions"><button class="button primary full" data-save-image>⬇ PNG 이미지 저장</button><button class="button secondary full" data-web-share>↗ 공유하기</button></div>
      <p class="hint">공유 전 확인 창이 나타나요. 실제 SNS 업로드는 브라우저의 공유 기능에서 선택해야 해요.</p>`;
  }
  async function exportShare(useShare){
    const room=currentRoom();if(!room)return;
    const data=sharePayload(room);
    if(!data.people.length){notify('공유할 도착 현황을 한 명 이상 선택해 주세요.');return;}
    if(!confirm(`익명 별칭으로 ${data.people.length}명의 도착 현황을 ${useShare?'공유':'이미지로 저장'}할까요?\n초대 코드, GPS 좌표, 이동 경로는 포함하지 않아요.`))return;
    try{
      // 캔버스 렌더링 직전에 시스템 글꼴 로드를 기다려 한글 잘림을 줄입니다.
      if(document.fonts?.ready)await document.fonts.ready;
      const canvas=document.createElement('canvas');I.draw(canvas,data);const blob=await I.toBlob(canvas);
      const filename=`gatiga-story-${room.date||'demo'}.png`;
      if(useShare){
        const file=new File([blob],filename,{type:'image/png'});
        if(!navigator.share||!navigator.canShare?.({files:[file]})){notify('이 브라우저에서는 이미지 공유를 지원하지 않아요. 이미지 저장 버튼을 이용해 주세요.');return;}
        try{await navigator.share({files:[file],title:'같이가 도착 현황'});notify('공유 메뉴를 닫았어요.');}
        catch(e){notify(e.name==='AbortError'?'공유를 취소했어요.':'공유하지 못했어요. 이미지 저장을 이용해 주세요.');}
      }else{I.saveBlob(blob,filename);notify('PNG 저장을 요청했어요. 브라우저 다운로드 목록을 확인해 주세요.');}
    }catch(e){notify('이미지를 만들지 못했어요. 다른 브라우저에서 다시 시도해 주세요.');}
  }

  function renderPrivacy(){
    app.innerHTML=`<div class="page-head"><div class="eyebrow">PRIVACY · PROTOTYPE</div><h1>🔒 개인정보 보호 안내</h1><p><strong>프로토타입 개인정보 안내</strong> · 법적 검토가 완료된 개인정보 처리방침이 아닙니다.</p></div><section class="detail-card privacy-info"><h2>위치 정보 사용 목적</h2><p>약속방 참여자 간 위치, 이동수단, 도착 예상 시간을 공유하여 만남을 돕도록 설계했어요. 현재는 실제 위치를 수집하지 않고 데모 지도만 사용해요.</p><h2>공유 범위</h2><p>향후 실제 서비스에서는 인증된 해당 약속방 참여자에게만 공개하도록 설계할 예정이에요. 현재는 서버·사용자 인증·접근 권한 검증이 없어요.</p><h2>동의 및 철회</h2><p>약속방에서 ‘내 위치 공유 시작’을 누르고 동의하면 데모 마커가 표시돼요. ‘위치 공유 중지’로 언제든 표시를 중단할 수 있어요. 공유를 다시 시작할 때는 저장된 동의 여부를 확인해요.</p><h2>약속방 나가기</h2><p>약속방 상세 화면의 ‘약속방 나가기’를 누르면 확인 후 이 브라우저의 약속 목록에서 해당 방이 제거되고 로컬 채팅 및 공유 동의 기록이 삭제돼요. 실제 다른 친구에게는 알림이 전달되지 않아요.</p><h2>데이터 관리 및 삭제</h2><p>약속방과 동의 여부는 브라우저 로컬 저장소에 남을 수 있어요. 데이터 조회·삭제 및 보존기간 관리 기능은 추후 개발할 예정이에요. 브라우저 사이트 데이터 삭제로 로컬 기록을 지울 수 있어요.</p><h2>실서비스 전 검토 사항</h2><p>위치정보 관련 법령, 개인정보 보호법, 동의·제공 절차, 사용자 인증, 방별 접근 권한, 통신·저장 암호화, 보존 및 삭제 정책, 미성년자 보호 등을 전문가와 검토해야 해요.</p><p class="hint">SNS 공유 시 초대 코드, 정확한 좌표, 이동 경로를 포함하지 않도록 설계할 예정이에요. SNS 공유 시 익명 별칭과 선택한 도착 현황만 이미지에 포함해요.</p></section><div class="actions"><button class="button primary full" data-privacy-back>이전 화면으로 돌아가기</button></div>`;
  }
  // 카카오톡 방 나가기처럼 확인 후에만 목록에서 제거합니다.
  function showLeaveModal(room){
    const host=document.querySelector('#modal-root');
    host.innerHTML=`<div class="modal-backdrop"><section class="consent-modal leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-title"><div class="leave-icon">🚪</div><h2 id="leave-title">정말 약속방을 나갈까요?</h2><p><strong>${escapeHtml(room.name)}</strong>에서 나가면 이 브라우저의 약속 목록에서 사라져요.</p><p class="hint">이 방의 로컬 채팅·만남 도감·말풍선 기록과 내 이동·공유 설정도 삭제돼요. 서버가 없는 데모라 다른 친구에게 퇴장 알림이 전달되지는 않아요.</p><div class="modal-actions"><button class="button leave-confirm full" data-leave-confirm>네, 약속방 나가기</button><button class="button secondary full" data-leave-cancel>취소하고 머무르기</button></div></section></div>`;
    host.querySelector('[data-leave-cancel]').focus();
  }
  function closeLeaveModal(){document.querySelector('#modal-root').innerHTML='';}
  function leaveRoom(room){
    if(liveGps.roomId===room.id)stopGps();
    // 저장 실패 시 방이 목록에서 사라졌다고 안내하지 않습니다.
    try{
      rooms=globalThis.GachigaRoomLeave.leave(localStorage,room,rooms,P.KEY,S.key);
      // 나간 약속방의 만남 기록과 말풍선도 정리합니다.
      localStorage.removeItem(M.key(room.id));localStorage.removeItem(M.bubbleKey(room.id));
      if(room.demo)demoLeft=true;
      delete privacySessions[room.id];delete ownPeople[room.id];delete simOffsets[room.id];
      if(room.demo){const index=demoPeople.findIndex(p=>p.id==='me');if(index!==-1)demoPeople.splice(index,1);}
      selectedId=null;selectedPerson=null;transportMode=null;shareSelection={};screen='rooms';
      closeLeaveModal();render();notify('약속방에서 나왔어요.');
    }catch{notify('약속방 나가기를 저장하지 못했어요. 다시 시도해 주세요.');}
  }
  function consentModal(room){
    consentRoomId=room.id;
    const host=document.querySelector('#modal-root');
    host.innerHTML=`<div class="modal-backdrop"><section class="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-title"><span class="demo-badge">데모 위치 공유 · 실제 GPS 수집 없음</span><h2 id="consent-title">📍 위치 공유 동의</h2><p>위치 공유를 시작하기 전에 내용을 확인해 주세요.</p><dl><dt>수집·이용 목적</dt><dd>약속방 참여자 간 위치와 도착 현황 공유</dd><dt>공유 대상</dt><dd>현재 약속방 참여자 (실제 접근 통제는 미구현)</dd><dt>공유 정보</dt><dd>위치, 이동수단, 예상 도착 시간</dd><dt>공유 기간</dt><dd>공유를 중지하거나 약속방 공유가 종료될 때까지</dd></dl><p class="hint">동의를 거부할 수 있으며, 거부해도 위치 공유 이외의 기능은 사용할 수 있어요. 이 동의는 데모 마커 표시만 제어하며 실제 GPS 권한을 요청하지 않아요.</p><label class="consent-check"><input type="checkbox" id="consent-check"><span>위치 정보 수집·이용 및 약속방 참여자에게 제공하는 데 동의합니다.</span></label><div class="modal-actions"><button class="button primary full" id="consent-confirm" disabled>동의하고 위치 공유 시작</button><button class="button ghost full" data-consent-decline>동의하지 않음</button></div></section></div>`;
    document.querySelector('#consent-check').focus();
  }
  function closeConsent(){document.querySelector('#modal-root').innerHTML='';consentRoomId=null;}
  function myPerson(room){return room.demo?demoPeople.find(p=>p.id==='me'):ownPeople[room.id];}
  function renderTransport(room){
    const person=myPerson(room);
    app.innerHTML=`<div class="detail-heading"><button class="back-link" data-back-detail>← 약속방으로</button><span class="demo-badge">데모 모드 · 예시 교통 정보</span></div><div class="page-head"><div class="eyebrow">MY ROUTE</div><h1>내 이동수단 설정 🧭</h1><p>${escapeHtml(room.name)}<br>실제 노선 조회나 위치 수집은 하지 않아요.</p></div><div class="transport-grid">${Object.entries(T.LABEL).map(([id,label])=>`<button type="button" class="transport-choice ${transportMode===id?'selected':''}" data-mode="${id}"><span>${T.ICON[id]}</span><strong>${label}</strong></button>`).join('')}</div>${transportMode?renderTransportForm(room,person):'<p class="hint">이동수단 카드를 선택하면 세부 설정이 열려요.</p>'}`;
  }
  function renderTransportForm(room,person){
    const mode=transportMode;
    const statuses=`<div class="field"><label for="route-status">이동 상태</label><select id="route-status" name="status"><option value="before">탑승 전 / 출발 전</option><option value="riding" selected>탑승 중 / 이동 중</option><option value="after">하차 후 / 마지막 구간</option></select></div>`;
    let specific='';
    if(mode==='bus')specific=`<div class="field"><label for="bus-search">버스 번호 검색</label><input id="bus-search" placeholder="예: 2000" autocomplete="off"><div id="bus-results" class="route-results">${T.BUSES.map(b=>`<label class="route-option"><input type="radio" name="bus" value="${b.id}" ${b.id==='2000'?'checked':''}> ${b.id}번 · ${b.stop} · 약 ${b.minutes}분</label>`).join('')}</div></div><p class="hint">정류장과 남은 시간은 데모 데이터예요.</p>`;
    if(mode==='subway')specific=`<div class="field"><label for="line-id">지하철 노선</label><select id="line-id" name="line">${T.SUBWAYS.map(l=>`<option value="${l.id}">${l.name}</option>`).join('')}</select></div><div class="form-grid"><div class="field"><label for="station-from">현재 역</label><select id="station-from" name="from"></select></div><div class="field"><label for="station-to">목적지 역</label><select id="station-to" name="to"></select></div></div><p class="hint" id="subway-preview">역을 선택하면 남은 역 수와 ETA를 계산해요.</p>`;
    if(mode==='walk'||mode==='car')specific=`<div class="field"><label for="manual-minutes">예상 이동 시간 (분)</label><input type="number" id="manual-minutes" name="minutes" min="0" max="1440" value="${person?.mode===mode?person.minutes:15}" required></div>`;
    return `<form id="transport-form" class="form-card"><h2 class="transport-subtitle">${T.ICON[mode]} ${T.LABEL[mode]} 세부 설정</h2>${specific}${statuses}<p class="hint">저장하면 약속방의 지도·도착 카드·ETA가 즉시 바뀌어요.</p><p class="error" id="transport-error" role="alert" hidden></p><button type="submit" class="button primary full">이동 정보 저장하기</button></form>`;
  }
  function updateStations(){
    const line=document.querySelector('#line-id');if(!line)return;
    const data=T.SUBWAYS.find(l=>l.id===line.value);
    for(const [id,idx] of [['station-from',0],['station-to',Math.min(3,data.stations.length-1)]]){
      const el=document.getElementById(id),old=el.value;el.innerHTML=data.stations.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');el.value=data.stations.includes(old)?old:data.stations[idx];
    }
    previewSubway();
  }
  function previewSubway(){const line=document.querySelector('#line-id');if(!line)return;const from=document.querySelector('#station-from').value,to=document.querySelector('#station-to').value,status=document.querySelector('#route-status').value;const el=document.querySelector('#subway-preview');try{const r=T.subwayJourney(line.value,from,to,status);el.textContent=`남은 ${r.stops}역 · 예상 ${r.minutes}분 · 진행률 ${r.progress}% (예시)`;}catch(e){el.textContent=e.message;}}
  function saveTransport(form){
    const room=currentRoom(),values=new FormData(form),mode=transportMode,status=String(values.get('status'));
    let minutes,transport,progress=0,stops=0,stop='';
    try{
      if(mode==='bus'){
        const bus=T.BUSES.find(b=>b.id===values.get('bus'));if(!bus)throw Error('버스 노선을 선택해 주세요.');
        minutes=Math.max(0,bus.minutes+(status==='before'?5:status==='after'?-5:0));progress=status==='before'?0:status==='after'?85:30;stop=bus.stop;transport=`🚌 ${bus.id}번 버스 · ${stop} · ${status==='before'?'탑승 전':status==='after'?'하차 후':'탑승 중'}`;
      }else if(mode==='subway'){
        const line=String(values.get('line')),from=String(values.get('from')),to=String(values.get('to'));const r=T.subwayJourney(line,from,to,status);
        minutes=r.minutes;progress=r.progress;stops=r.stops;transport=`🚇 ${line}호선 · ${from} → ${to} · ${stops}역 남음 · ${status==='before'?'탑승 전':status==='after'?'하차 후':'탑승 중'}`;
      }else{
        const raw=String(values.get('minutes'));minutes=Number(raw);
        if(!raw||!Number.isInteger(minutes)||minutes<0||minutes>1440)throw Error('예상 시간은 0~1440분의 정수로 입력해 주세요.');
        progress=status==='before'?0:status==='after'?85:20;transport=`${T.ICON[mode]} ${T.LABEL[mode]} · ${status==='before'?'출발 전':status==='after'?'마지막 구간':'이동 중'}`;
      }
      const existing=myPerson(room),id='me';
      const person={id,name:'나',color:existing?.color||'mint',x:existing?.x??24,y:existing?.y??65,mode,transport,minutes,initialMinutes:Math.max(minutes,1),progress,arrived:false,status,stops,stop};
      if(room.demo){const index=demoPeople.findIndex(p=>p.id===id);if(index<0)demoPeople.push(person);else demoPeople[index]=person;}else ownPeople[room.id]=person;
      selectedPerson=id;screen='detail';transportMode=null;render();notify('이동 정보가 반영됐어요!');
    }catch(e){const el=document.querySelector('#transport-error');el.textContent=e.message;el.hidden=false;}
  }
  function simulate(minutes){const room=currentRoom(),people=peopleFor(room);if(privacyFor(room).ended){notify('공유가 종료된 약속방이에요.');return;}if(!people.length){notify('이동 정보를 먼저 설정해 주세요.');return;}simOffsets[room.id]=(simOffsets[room.id]||0)+minutes;for(const p of people){if(!p.arrived&&(p.id!=='me'||privacyFor(room).active)){Object.assign(p,T.applyProgress(p,minutes));}}render();}
  function confirmArrival(){const room=currentRoom(),person=peopleFor(room).find(p=>p.id===selectedPerson);if(privacyFor(room).ended || (person?.id==='me'&&!privacyFor(room).active)){notify('위치 공유 중에는 도착 확인을 할 수 있어요.');return;}if(!person){notify('먼저 참여자를 선택해 주세요.');return;}person.arrived=true;person.minutes=0;person.progress=100;render();notify(`${person.name} 도착 완료로 표시했어요.`);}
  function newCode() {
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;
    do {
      const nums=new Uint32Array(6);
      if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(nums);
      else for(let i=0;i<6;i++)nums[i]=Math.floor(Math.random()*0xffffffff);
      code=Array.from(nums,n=>alphabet[n%alphabet.length]).join('');
    }while(rooms.some(r=>r.code===code)||code==='DEMO24');
    return code;
  }
  function createRoom(form) {
    const values=new FormData(form),name=String(values.get('name')||'').trim(),date=String(values.get('date')||''),time=String(values.get('time')||''),place=String(values.get('place')||'').trim();
    const error=document.querySelector('#form-error');
    if(!name||!date||!time||!place||name.length>50||place.length>100||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||!/^[0-9]{2}:[0-9]{2}$/.test(time)) {
      error.textContent='약속 이름, 날짜, 시간, 장소를 올바르게 입력해 주세요.';error.hidden=false;return;
    }
    const room={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,name,date,time,place,code:newCode()};
    rooms.push(room);saveRooms();selectedId=room.id;screen='success';render();
  }
  function joinRoom(form) {
    const code=String(new FormData(form).get('code')||'').trim().toUpperCase();
    const room=code==='DEMO24'&&!demoLeft?demoRoom():rooms.find(r=>String(r.code||'').toUpperCase()===code);
    if(!room){const error=form.querySelector('#join-error');error.textContent='이 브라우저에서 찾을 수 없는 코드예요. 실제 친구 간 참여는 서버 연동 후 가능해요.';error.hidden=false;return;}
    selectedId=room.id;selectedPerson=null;screen='detail';render();
  }
  function render() {
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.go===(screen==='create'?'create':['rooms','detail','success','chat','sns','memory','transport'].includes(screen)?'rooms':'home')));
    if(screen==='privacy')renderPrivacy();else if(screen==='home')renderHome();else if(screen==='create')renderCreate();else if(screen==='rooms')renderRooms();
    else {
      const room=selectedId===DEMO_ID?demoRoom():rooms.find(r=>r.id===selectedId);
      if(!room){screen='rooms';renderRooms();}else if(screen==='success')renderSuccess(room);else if(screen==='chat')renderChat(room);else if(screen==='sns')renderSns(room);else if(screen==='memory')renderMemory(room);else if(screen==='transport'){renderTransport(room);if(transportMode==='subway')updateStations();}else renderDetail(room);
    }
    window.scrollTo(0,0);
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('[data-consent-decline]')){closeConsent();notify('동의하지 않아도 다른 기능은 사용할 수 있어요.');return;}
    if(event.target.closest('#consent-confirm')){
      const room=currentRoom(),checked=document.querySelector('#consent-check')?.checked;
      if(!room||room.id!==consentRoomId||!checked||!P.canStart(privacyFor(room),checked))return;
      try{P.save(localStorage,room.id,{consented:true,ended:false});privacySessions[room.id]=true;closeConsent();render();notify('데모 위치 공유를 시작했어요.');}catch{notify('동의 상태를 저장할 수 없어 공유를 시작하지 않았어요.');}return;
    }
    if(event.target.closest('[data-share-start]')){const room=currentRoom(),state=privacyFor(room);if(state.ended)return;if(state.consented){privacySessions[room.id]=true;render();notify('기존 동의를 확인하고 데모 공유를 시작했어요.');}else consentModal(room);return;}
    if(event.target.closest('[data-share-stop]')){const room=currentRoom();stopGps();privacySessions[room.id]=false;selectedPerson=null;render();notify('데모 위치 공유를 중지했어요.');return;}
    if(event.target.closest('[data-leave-room]')){const room=currentRoom();if(room)showLeaveModal(room);return;}
    if(event.target.closest('[data-leave-cancel]')){closeLeaveModal();return;}
    if(event.target.closest('[data-leave-confirm]')){const room=currentRoom();if(room)leaveRoom(room);return;}
    if(event.target.closest('[data-reveal-code]')){const el=document.querySelector('#private-code');el.hidden=!el.hidden;event.target.setAttribute('aria-expanded',String(!el.hidden));event.target.textContent=el.hidden?'🔒 초대 코드 보기':'🔓 초대 코드 숨기기';return;}
    if(event.target.closest('[data-privacy-back]')){screen=privacyReturn;render();return;}
    const copy=event.target.closest('[data-copy]');
    if(copy){const value=copy.dataset.copy;try{await navigator.clipboard.writeText(value);notify('초대 코드를 복사했어요!');}catch{notify(`초대 코드: ${value} (직접 복사해 주세요)`);}return;}
    if(event.target.closest('[data-invite-close]')){closeInvite();return;}
    if(event.target.closest('[data-invite-share]')){const room=currentRoom();if(room)await shareInvite(room);return;}
    if(event.target.closest('[data-invite-copy]')){const room=currentRoom();if(room)await copyInvite(V.message(room));return;}
    if(event.target.closest('[data-invite-code]')){const room=currentRoom();if(room)await copyInvite(room.code);return;}
    if(event.target.closest('[data-invite]')){const room=currentRoom();if(room)inviteModal(room);return;}
    if(event.target.closest('[data-demo-reply]')){demoReply();return;}
    if(event.target.closest('[data-memory]')){screen='memory';render();return;}
    const del=event.target.closest('[data-memory-delete]');if(del){const room=currentRoom();if(room&&window.confirm('이 만남 기록을 삭제할까요?')){M.remove(localStorage,room.id,del.dataset.memoryDelete);renderMemory(room);notify('기록을 삭제했어요.');}return;}
    if(event.target.closest('[data-chat]')){screen='chat';render();return;}
    // 도착 현황 SNS 공유 진입 버튼은 사용자 요청에 따라 제거했습니다.
    if(event.target.closest('[data-save-image]')){await exportShare(false);return;}
    if(event.target.closest('[data-web-share]')){await exportShare(true);return;}
    if(event.target.closest('[data-back-detail]')){screen='detail';transportMode=null;render();return;}
    const mode=event.target.closest('[data-mode]');if(mode){transportMode=mode.dataset.mode;render();return;}
    if(event.target.closest('[data-transport]')){const room=currentRoom();editingPerson='me';transportMode=null;screen='transport';render();return;}
    if(event.target.closest('[data-simulate]')){simulate(5);return;}
    if(event.target.closest('[data-arrive]')){confirmArrival();return;}
    const coming=event.target.closest('[data-coming]');
    if(coming){notify(`${coming.dataset.coming} 기능은 다음 단계에서 구현 예정이에요.`);return;}
    const person=event.target.closest('[data-person]');
    if(person){selectedPerson=person.dataset.person;render();return;}
    const open=event.target.closest('[data-open-detail]');
    if(open){if(liveGps.roomId&&liveGps.roomId!==open.dataset.openDetail)stopGps();selectedId=open.dataset.openDetail;selectedPerson=null;screen='detail';render();return;}
    const room=event.target.closest('[data-room]');
    if(room){if(liveGps.roomId&&liveGps.roomId!==room.dataset.room)stopGps();selectedId=room.dataset.room;selectedPerson=null;screen='detail';render();return;}
    const go=event.target.closest('[data-go]');
    if(go){if(go.dataset.go!=='detail'&&liveGps.roomId)stopGps();if(go.dataset.go==='privacy')privacyReturn=screen;screen=go.dataset.go;selectedPerson=null;render();}
  });
  document.addEventListener('change',event=>{if(event.target.matches('[data-share-person]')){shareSelection[event.target.dataset.sharePerson]=event.target.checked;const scroll=window.scrollY;renderSns(currentRoom());window.scrollTo(0,scroll);return;}if(event.target.id==='consent-check'){document.querySelector('#consent-confirm').disabled=!event.target.checked;}});
  document.addEventListener('input',event=>{
    if(event.target.id==='join-code')event.target.value=event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(event.target.id==='bus-search'){const q=event.target.value.trim();document.querySelectorAll('.route-option').forEach(el=>{el.hidden=!el.textContent.includes(q);});}
  });
  document.addEventListener('change',event=>{if(['line-id','station-from','station-to','route-status'].includes(event.target.id)){if(event.target.id==='line-id')updateStations();else previewSubway();}});
  document.addEventListener('submit',event=>{
    if(event.target.id==='create-form'){event.preventDefault();createRoom(event.target);}
    if(event.target.id==='join-form'){event.preventDefault();joinRoom(event.target);}
    if(event.target.id==='transport-form'){event.preventDefault();saveTransport(event.target);}
    if(event.target.id==='chat-form'){event.preventDefault();sendChat(event.target);}
    if(event.target.id==='map-bubble-form'){event.preventDefault();const room=currentRoom();if(room){try{const input=event.target.querySelector('#map-bubble-text');const message=input.value.trim();if(!message){notify('말풍선 내용을 입력해 주세요.');return;}M.setBubble(localStorage,room.id,message);input.value='';renderDetail(room);notify('말풍선을 저장했어요. 위치 공유 중에 지도에 표시돼요.');}catch{notify('말풍선 저장에 실패했어요.');}}}
    if(event.target.id==='memory-form'){event.preventDefault();saveMemory(event.target);}
  });
  window.addEventListener('pagehide',stopGps);
  render();
  // 공유된 URL에 초대 코드가 있다면 홈 입력란에 미리 채웁니다. 자동 입장은 하지 않습니다.
  if(pendingInviteCode){const field=document.querySelector('#join-code');if(field){field.value=pendingInviteCode;notify('초대 코드를 입력해 두었어요. 참여하기를 눌러 확인해 주세요.');}}
})();
