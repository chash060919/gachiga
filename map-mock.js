
/* 같이가: 카카오맵 실제 지도 렌더러 */
(function (root) {
  'use strict';

  let renderToken = 0;

  function render(participants, room) {
    const token = ++renderToken;

    // 지도가 들어갈 영역을 만듭니다.
    requestAnimationFrame(() => {
      if (token !== renderToken) return;

      const container = document.getElementById('gachiga-kakao-map');
      const status = document.getElementById('gps-status');

      if (!container) return;

      if (!root.kakao || !root.kakao.maps) {
        if (status) {
          status.textContent =
            '카카오맵을 불러오지 못했어요. JavaScript 키와 도메인 설정을 확인해 주세요.';
        }
        return;
      }

      const defaultPosition = new root.kakao.maps.LatLng(
        37.5665,
        126.9780
      );

      const map = new root.kakao.maps.Map(container, {
        center: defaultPosition,
        level: 5
      });
      root.GachigaMap.currentMap = map;

      const place = String(room?.place || '').trim();

      if (!place) {
        if (status) status.textContent = '약속 장소가 아직 입력되지 않았어요.';
        return;
      }

      if (!root.kakao.maps.services) {
        if (status) status.textContent = '장소 검색 기능을 불러오지 못했어요.';
        return;
      }

      const places = new root.kakao.maps.services.Places();
      const geocoder = new root.kakao.maps.services.Geocoder();

      function showPlace(position, placeName) {
        if (token !== renderToken) return;

        map.setCenter(position);

        new root.kakao.maps.Marker({
          map: map,
          position: position,
          title: placeName
        });

        if (status) {
          status.textContent = `약속 장소: ${placeName}`;
        }
      }

      // 먼저 장소 이름으로 검색합니다.
      places.keywordSearch(place, (data, resultStatus) => {
        if (token !== renderToken) return;

        if (
          resultStatus === root.kakao.maps.services.Status.OK &&
          data.length > 0
        ) {
          const result = data[0];
          const position = new root.kakao.maps.LatLng(
            Number(result.y),
            Number(result.x)
          );

          showPlace(position, result.place_name);
          return;
        }

        // 장소 검색에 실패하면 주소로 검색합니다.
        geocoder.addressSearch(place, (results, addressStatus) => {
          if (token !== renderToken) return;

          if (
            addressStatus === root.kakao.maps.services.Status.OK &&
            results.length > 0
          ) {
            const result = results[0];
            const position = new root.kakao.maps.LatLng(
              Number(result.y),
              Number(result.x)
            );

            showPlace(position, place);
          } else if (status) {
            status.textContent =
              '장소를 찾지 못했어요. 약속 장소를 더 구체적으로 입력해 주세요.';
          }
        });
      });
    });

    return `
  <button
    type="button"
    id="gachiga-my-location"
    class="button secondary"
    style="margin-bottom:12px;"
  >
    📍 내 위치 표시
  </button>

  <div
    id="gachiga-kakao-map"
    aria-label="카카오 실제 지도"
    style="width:100%; height:360px; border-radius:18px;"
  ></div>
`;
  }
function showMyLocation() {
  const map = root.GachigaMap.currentMap;
  const status = document.getElementById('gps-status');

  if (!navigator.geolocation) {
    if (status) status.textContent = '이 브라우저는 위치 기능을 지원하지 않아요.';
    return;
  }

  if (status) status.textContent = '현재 위치를 확인하고 있어요.';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const myPosition = new root.kakao.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );

      map.setCenter(myPosition);

      new root.kakao.maps.Marker({
        map: map,
        position: myPosition,
        title: '내 현재 위치'
      });

      if (status) status.textContent = '내 현재 위치를 지도에 표시했어요.';
    },
    () => {
      if (status) status.textContent = '위치 권한을 허용해야 내 위치를 표시할 수 있어요.';
    }
  );
}
    root.GachigaMap = { render, showMyLocation };
})(globalThis);
