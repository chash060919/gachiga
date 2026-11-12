/* 실제 GPS 좌표를 사용하지 않는 2단계 전용 목업 지도 렌더러입니다. */
(function (root) {
  'use strict';
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function render(participants) {
    const markers = participants.map(person => `<button type="button" class="map-person ${person.color}" style="left:${person.x}%;top:${person.y}%" data-person="${escapeHtml(person.id)}" aria-label="${escapeHtml(person.name)} 위치 정보 보기"><span class="person-face">${escapeHtml(person.name.slice(0,1))}</span><span class="person-name">${escapeHtml(person.name)}</span>${person.id==='me'&&person.bubble?`<span class="person-bubble">${escapeHtml(person.bubble)}</span>`:''}</button>`).join('');
    return `<div class="mock-map" aria-label="실제 위치가 아닌 예시 지도"><div class="map-block block-a"></div><div class="map-block block-b"></div><div class="map-block block-c"></div><div class="map-block block-d"></div><div class="map-park">🌳 공원</div><div class="road road-horizontal one"></div><div class="road road-horizontal two"></div><div class="road road-vertical one"></div><div class="road road-vertical two"></div><div class="road road-diagonal"></div><div class="destination"><span>📍</span><strong>약속 장소</strong></div>${markers}<div class="map-scale">데모 지도 · 실제 좌표 아님</div></div>`;
  }
  root.GachigaMap = {render};
})(globalThis);
