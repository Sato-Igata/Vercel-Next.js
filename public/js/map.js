window.initHunterMap = async function () {
  try { window.resetEditState?.(); } catch {}
  // =============================
  // 0) 必須チェック（あなたのまま）
  // =============================
  const mapContainer = document.getElementById('map');
  if (mapContainer && mapContainer._leaflet_id) {
    mapContainer._leaflet_id = null;
  }
  if (!window.API_BASE) {
    console.error("API_BASE is missing. map.js aborted.");
    return;
  }
  const API_BASE = (typeof window !== "undefined" && window.API_BASE) || "";

  // =============================
  // 1) “イベントはここだけ” 最小配線（衝突しない）
  // =============================
  initEventWiringMinimal();

  $(function(){
    const $burger = $('#hamburger');
    const $menu   = $('#header-menu');

    $burger.on('click', function(){
      const opening = !$menu.is(':visible');
      $burger.toggleClass('open').attr('aria-expanded', opening);
      $menu.stop(true,true).slideToggle(160);
    });
  });
  let firstFlag = true;
  let errorId = 0;
  let statusNum = 0;
  const errorpop = document.getElementById('error-pop');
  const errorpopTitle = document.getElementById('errorpop-title');
  const errorpopDesc = document.getElementById('errorpop-desc');
  const errorpopClose = document.getElementById('errorpop-close');
  async function popChange(errortext) {
      errorpopTitle.textContent = '⚠ エラー';
      if (sessionStorage.getItem('mapFlag') != '3') {
        errorpopDesc.textContent = `${errortext}メインメニューへ戻ります。`;
        if (errorId === 1) {
          errorpopClose.textContent = '戻る';
        }
      } else {
        errorpopDesc.textContent = `${errortext}`;
        if (errorId === 1) {
          errorpopClose.textContent = '閉じる';
        }
      }
      if (statusNum === 2) {
        errorpopDesc.textContent = `${errortext}`;
        errorpopClose.textContent = '閉じる';
      }
      const style = document.createElement('style');
      style.id = 'popTrajectory-styles';
      style.textContent = `
        .erroractions {
          align-items: flex-end;
        }
        .errorbtn {
          width: 100px;
          height: 50px;
          font-size: 20px;
        }
      `;
      document.head.appendChild(style);
      openPop();
  }

  function openPop(){
    errorpop.hidden = false;
    // 背景スクロール抑止
    document.body.style.overflow = 'hidden';
    errorpopClose?.focus();
  }

  function closePop(){
    errorpop.hidden = true;
    document.body.style.overflow = '';
    // saveBtn?.focus();
    if (errorId === 1 && sessionStorage.getItem('mapFlag') != '3') {
    }
    if (statusNum === 2) {
      window.dispatchEvent(new CustomEvent('go-signin'));
    } 
  }

  errorpopClose?.addEventListener('click', closePop);

  // 対象ID
  const groupId = Number(sessionStorage.getItem('groupid'));
  const mapFlag = sessionStorage.getItem('mapFlag');
  console.log('groupId:', groupId);
  console.log('mapFlag:', mapFlag);
  sessionStorage.setItem('zoomLevel', 15);
  let usercheck = 0;
  let userNum = 0;
  let userLat = 35.6809591;
  let userLng = 139.7673068;
  let userAcc = 0;
  let userAlt = 1.0;
  let userAltAcc = 0
  let getData = '';
  let baseUrl = '';
  let groupName = '';     //グループ名
  let groupflag = 0;      //グループフラグ
  let userName = [];      //ユーザー名
  let deviceName = [];    //デバイス名
  let deviceNumber = [];  //デバイスナンバー
  let baName = [];        //待ち場名
  let carName = [];       //車名
  let useridList = [];    //ユーザーID
  let deviceidList = [];  //デバイスID
  let baidList = [];      //待ち場ID
  let caridList = [];     //車ID
  let selectDate = '';
  let selectCountTime = 0;
  let bulkInit = false;
  let mapButtonFlag = false; //MAPのボタンの位置変更フラグ
  let gpsFlag = false;       //GPSの許可フラグ
  let eneFlag = false;       //省エネの許可フラグ
  await getDataUserSetting();
  if (sessionStorage.getItem('mapFlag') === '2') {
    // ポイント登録確認
    await Promise.all([ getDataBa(), getDataCar() ]);
    const baLen = baName.length;
    const carLen = carName.length;
    console.log(baLen, carLen);
    const form = document.getElementById('menuForm');
    const borderLine = document.getElementById('borderLine');
    if (form) {
      const detailsHTML = `
        <details>
          <summary class="form-title">待ち場のポイント</summary>
          <div class="form-map">
            ${Array.from({ length: baLen }, (_, i) => {
              const idx = i + 1;
              const line = `<hr class="dashed-line">`;
              const text = `
                <label class="toggle-row ba-back">
                  <input type="text" placeholder="入力してください"
                    class="ba-input is-readonly"
                    id="ba-text${idx}"
                    data-kind="ba"
                    data-pointid="${baidList[i]}"
                    value="${baName[i]}" readonly>
                  <button type="button" class="ba ba-edit-btn" id="car-button${idx}">名前編集</button>
                </label>
              `;
              if (i + 1 == baLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
        <details>
          <summary class="form-title">車のポイント</summary>
          <div class="form-map">
            ${Array.from({ length: carLen }, (_, i) => {
              const idx = i + 1;
              const line = `<hr class="dashed-line">`;
              const text = `
                <label class="toggle-row ba-back">
                  <input type="text" placeholder="入力してください" 
                    class="ba-input is-readonly"
                    id="car-text${idx}"
                    data-kind="car"
                    data-pointid="${caridList[i]}"
                    value="${carName[i]}" readonly>
                  <button type="button" class="ba ba-edit-btn" id="car-button${idx}">名前編集</button>
                </label>
              `;
              if (i + 1 == carLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
      `;

      borderLine.insertAdjacentHTML('beforebegin', detailsHTML);
      resetEditState();
    }
  } else if (sessionStorage.getItem('mapFlag') === '3') {
    popTrajectory()
    document.getElementById('pointNew-pop').hidden = false;
    // 軌跡確認
    await Promise.all([ getDataUserTrajectory(), getDataDeviceTrajectory() ]);
    const userLen = userName.length;
    const deviceLen = deviceNumber.length;

    const form = document.getElementById('menuForm');
    const borderLine = document.getElementById('borderLine');
    if (form) {
      const detailsHTML = `
        <details>
          <summary class="form-title">ユーザー表示</summary>
          <div class="form-map">
            ${Array.from({ length: userLen }, (_, i) => {
              const idx = i + 1;
              const line = `<hr class="dashed-line">`;
              const text = `
                <label class="toggle-row">
                  <span class="toggle-text" id="user-text${idx}">${userName[i]}</span>
                  <label class="switch">
                    <input type="checkbox" id="user-gpsToggle${idx}">
                    <span class="slider"></span>
                  </label>
                </label>
              `;
              if (i + 1 == userLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
        <details>
          <summary class="form-title">犬（デバイスID）表示</summary>
          <div class="form-map">
            ${Array.from({ length: deviceLen }, (_, i) => {
              const idx = i + 1;
              const line = `<hr class="dashed-line">`;
              const text = `
                <label class="toggle-row">
                  <span class="toggle-text" id="device-text${idx}">${deviceName[i]}（${deviceNumber[i]}）</span>
                  <label class="switch">
                    <input type="checkbox" id="device-gpsToggle${idx}">
                    <span class="slider"></span>
                  </label>
                </label>
              `;
              if (i + 1 == deviceLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
      `;

      borderLine.insertAdjacentHTML('beforebegin', detailsHTML);
      document.querySelector('.switch input').checked = true;
      document.getElementById('main-button').insertAdjacentHTML('beforebegin', '<button type="button" class="map-button" id="select-button">検索日付選択</button>');
      // 挿入直後にクリックイベントを付与
      const selectBtn = document.getElementById('select-button');
      selectBtn.addEventListener('click', () => {
        const pop = document.getElementById('pointNew-pop');
        if (pop) {
          pop.hidden = false;
          document.body.style.overflow = 'hidden'; // 背景スクロール抑止（必要なら）
        }
      });
    }
  } else {
    document.getElementById('pointNew-pop').hidden = false;

    // グループ名getSQLで取得
    await getDataGroupUser();
    await getDataUser();
    await getDataDevice();
    await getDataBa();
    await getDataCar();

    let groupText = '';
    if (groupflag == 1) {
      groupText = 'ホスト';
    } else {
      groupText = '参加者';
    }

    const userLen = userName.length;
    const deviceLen = deviceNumber.length;
    const baLen = baName.length;
    const carLen = carName.length;

    const form = document.getElementById('menuForm');
    const borderLine = document.getElementById('borderLine');
    if (form) {
      const detailsHTML = `
        <details>
          <summary class="form-title">グループ名</summary>
          <div class="form-map no-scrollbar">
            <label class="toggle-row">
              <span class="toggle-text">${groupName}</span>
              <span class="right-edge">${groupText}</span>
            </label>
          </div>
        </details>
        <div class="border-line"></div>
        <details>
          <summary class="form-title">ユーザー表示</summary>
          <div class="form-map">
            ${Array.from({ length: userLen }, (_, i) => {
              const idx = i + 1;
              const line = `<hr class="dashed-line">`;
              const text = `
                <label class="toggle-row">
                  <span class="toggle-text" id="user-text${idx}">${userName[i]}</span>
                  <label class="switch">
                    <input type="checkbox" id="user-gpsToggle${idx}">
                    <span class="slider"></span>
                  </label>
                </label>
              `;
              if (i + 1 == userLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
        <details>
          <summary class="form-title">犬（デバイスID）表示</summary>
          <div class="form-map">
            ${Array.from({ length: deviceLen }, (_, i) => {
              const idx = i + 1;
              const line = `<hr class="dashed-line">`;
              const text = `
                <label class="toggle-row">
                  <span class="toggle-text" id="device-text${idx}">${deviceName[i]}（${deviceNumber[i]}）</span>
                  <label class="switch">
                    <input type="checkbox" id="device-gpsToggle${idx}">
                    <span class="slider"></span>
                  </label>
                </label>
              `;
              if (i + 1 == deviceLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
        <details>
          <summary class="form-title">待ち場のポイント</summary>
          <div class="form-map">
            ${Array.from({ length: baLen }, (_, i) => {
              const idx = i + 1;
              const text = `
                <label class="toggle-row">
                  <span class="toggle-text" id="ba-text${idx}">${baName[i]}</span>
                  <label class="switch">
                    <input type="checkbox" id="ba-gpsToggle${idx}">
                    <span class="slider"></span>
                  </label>
                </label>
              `;
              const line = `<hr class="dashed-line">`;
              if (i + 1 == baLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
        <details>
          <summary class="form-title">車のポイント</summary>
          <div class="form-map">
            ${Array.from({ length: carLen }, (_, i) => {
              const idx = i + 1;
              const text = `
                <label class="toggle-row">
                  <span class="toggle-text" id="car-text${idx}">${carName[i]}</span>
                  <label class="switch">
                    <input type="checkbox" id="car-gpsToggle${idx}">
                    <span class="slider"></span>
                  </label>
                </label>
              `;
              const line = `<hr class="dashed-line">`;
              if (i + 1 == carLen) {
                return text;
              } else {
                return text + line;
              }
            }).join('')}
          </div>
        </details>
        <div class="border-line"></div>
        <!-- <details>
          <summary class="form-title">その他表示</summary>
          <div class="form-map">
            <label class="toggle-row">
              <span class="toggle-text">首輪との距離表示</span>
              <label class="switch">
                <input type="checkbox" id="distance-gpsToggle">
                <span class="slider"></span>
              </label>
            </label>
            <hr class="dashed-line">
            <label class="toggle-row">
              <span class="toggle-text">自分の位置表示</span>
              <label class="switch">
                <input type="checkbox" id="location-gpsToggle">
                <span class="slider"></span>
              </label>
            </label>
          </div>
        </details>
        <div class="border-line"></div> -->
      `;

      const etcHTML = `
        <details>
          <summary class="form-title">その他表示</summary>
          <div class="form-map">
            <label class="toggle-row">
              <span class="toggle-text">距離表示</span>
              <label class="switch">
                <input type="checkbox" id="distance-gpsToggle">
                <span class="slider"></span>
              </label>
            </label>
            <hr class="dashed-line">
            <label class="toggle-row">
              <span class="toggle-text">自分の位置表示</span>
              <label class="switch">
                <input type="checkbox" id="location-gpsToggle">
                <span class="slider"></span>
              </label>
            </label>
          </div>
        </details>
        <div class="border-line"></div>
      `;

      borderLine.insertAdjacentHTML('beforebegin', detailsHTML);
      borderLine.insertAdjacentHTML('beforebegin', etcHTML);

      document.getElementById('main-button').insertAdjacentHTML('beforebegin', '<button type="button" class="map-button" id="point-button">ポイント登録</button>');
      const pointBtn = document.getElementById('point-button');
      pointBtn.addEventListener('click', () => {
        const pop = document.getElementById('pointNew-pop');
        if (pop) {
          pop.hidden = false;
          document.body.style.overflow = 'hidden';
        }
      });
    }
  }
  // 中心座標
  window._geoWatchId = null;
  let latestCoords = null;
  let lastSavedAt = 0;
  let lastSavedLatLng = null;
  let saving = false;
  const WATCH_OPT = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 };
  const SAVE_ACCURACY_MAX = 20; // m
  const MIN_MOVE_M = 3;         // m
  const MIN_SAVE_MS = 4500;     // ms

  const isMobile = window.innerWidth <= 768;
  // 通常マーカー
  const largeIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: isMobile ? [40, 60] : [25, 41],
    iconAnchor: isMobile ? [20, 60] : [12, 41],
    popupAnchor: isMobile ? [0, -60] : [0, -41]
  });
  // 絵文字のカスタムアイコン（外部画像不要）
  // const personPng = L.icon({
  //   iconUrl: '/img/person_red.png',
  //   iconSize: [28, 28],
  //   iconAnchor: [14, 24],
  //   popupAnchor: [0, -24]
  // });
  // ユーザーマーカー
  const userIcon = L.divIcon({
    className: 'emoji-marker person-user',
    html: '<span class="emoji">👤</span>',
    iconSize: window.innerWidth <= 768 ? [40, 40] : [28, 28],
    iconAnchor: window.innerWidth <= 768 ? [20, 34] : [14, 24],
    popupAnchor: [0, -28]
  });
  // 人マーカー
  const personIcon = L.divIcon({
    className: 'emoji-marker',
    html: '<span class="emoji">👤</span>',
    iconSize: window.innerWidth <= 768 ? [40, 40] : [28, 28],
    iconAnchor: window.innerWidth <= 768 ? [20, 34] : [14, 24],
    popupAnchor: [0, -28]
  });
  // 人(赤)マーカー
  const personRedIcon = L.divIcon({
    className: 'emoji-marker person-red',
    html: '<span class="emoji">👤</span>',
    iconSize: window.innerWidth <= 768 ? [40, 40] : [28, 28],
    iconAnchor: window.innerWidth <= 768 ? [20, 34] : [14, 24],
    popupAnchor: [0, -28]
  });
  // 犬マーカー
  const dogIcon = L.divIcon({
    className: 'emoji-marker',
    html: '<span class="emoji">🐶</span>',
    iconSize: window.innerWidth <= 768 ? [40, 40] : [28, 28],
    iconAnchor: window.innerWidth <= 768 ? [20, 34] : [14, 24],
    popupAnchor: [0, -28]
  });
  // 車マーカー
  const carIcon = L.divIcon({
    className: 'emoji-marker',
    html: '<span class="emoji">🚗</span>',
    iconSize: window.innerWidth <= 768 ? [40, 40] : [28, 28],
    iconAnchor: window.innerWidth <= 768 ? [20, 34] : [14, 24], // 足元を合わせる
    popupAnchor: [0, -28]
  });
  // 待ち場マーカー
  const satelliteIcon = L.divIcon({
    className: 'emoji-marker',
    html: '<span class="emoji">🛰️</span>',
    iconSize: window.innerWidth <= 768 ? [40, 40] : [28, 28],
    iconAnchor: window.innerWidth <= 768 ? [20, 34] : [14, 24],
    popupAnchor: [0, -28]
  });
  // トグルの状態（再描画でも保持＆再適用したい）
  let distanceToggleOn = false;
  let locationToggleOn = false;
  let myUserId = 0;
  const markersById = new Map();
  const markersByDataId = new Map();
  const markerMetaByMid = new Map();
  const markersByUserId       = new Map(); // user_id -> marker（人）
  const markersByModelNumber  = new Map(); // model_number -> marker（犬/デバイス）
  const baDataIds             = new Set(); // 待ち場の data_id（status_flag=4 & point_nameあり）
  const carDataIds            = new Set(); // 車の data_id（status_flag=5 & point_nameあり)
  const markersByKey = new Map(); // key -> Set<L.Marker>
  const linesByKey   = new Map(); // key -> Set<L.Polyline>
  const latestMarkerByKey = new Map();
  window._markersByDataId = markersByDataId;
  window._markersById = markersById;
  window.markerMetaByMid = markerMetaByMid;
  window.markersByKey = markersByKey;
  window.setVisibilityForKey = setVisibilityForKey;
  window.updateDistanceToggleState = updateDistanceToggleState;
  window.updateLocationToggleState = updateLocationToggleState;
  window.showDeleteConfirmForMarker = showDeleteConfirmForMarker;
  window._latestMarkerByKey = latestMarkerByKey;
  const zoomLevel = sessionStorage.getItem('zoomLevel'); // ズーム（数字が大きいほど拡大）
  
  // 地図を作成
  const map = L.map('map', {
    rotate: true,      // ← 回転機能 ON
    touchRotate: true, // ← 2本指での回転を有効化（ピンチ＋ひねり）
    // shiftKeyRotate: true, //（任意）PCで Shift + ドラッグで回転したい場合
  }).setView([userLat, userLng], zoomLevel);

  L.Marker.mergeOptions({
    rotateWithView: false
  });

  // 回転角の保存
  map.on('rotate', () => {
    const bearing = map.getBearing();  // 度数法
    sessionStorage.setItem('bearing', String(bearing));
  });

  // 初期表示時に bearing を戻す（map 作成後すぐ）
  const savedBearing = Number(sessionStorage.getItem('bearing') || '0');
  if (!Number.isNaN(savedBearing)) {
    // map.setBearing(savedBearing);   // leaflet-rotate が追加した API
  }

  const canRotate =
    typeof map.setBearing === 'function' &&
    typeof map.getBearing === 'function';

  if (canRotate) {
    // 回転角の保存
    map.on('rotate', () => {
      const bearing = map.getBearing();  // 度数法
      sessionStorage.setItem('bearing', String(bearing));
    });

    // 初期表示時に bearing を戻す
    const savedBearing = Number(sessionStorage.getItem('bearing') || '0');
    if (!Number.isNaN(savedBearing)) {
      map.setBearing(savedBearing);
    }
  } else {
    console.warn('leaflet-rotate がまだ有効になっていないため setBearing/getBearing は使えません');
  }

  // OpenTopoMap タイル（等高線付き）
  // L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  //     maxZoom: 17,
  //     attribution: '© OpenTopoMap (CC-BY-SA)'
  // }).addTo(map);

  // 国土地理院タイル（日本国内限定、精密）
  // L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png', {
  //     attribution: '地理院タイル',
  //     maxZoom: 15
  // }).addTo(map);

  // 陰影起伏図（等高線を含む立体感ある地図）
  const relief = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png', {
    attribution: '地理院タイル（陰影起伏図）',
    maxNativeZoom: 15,
    maxZoom: 20,
    opacity: 0.8
  });

  // 標準地図（道路・地名等）
  const std = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
    attribution: '地理院タイル（標準地図）',
    maxNativeZoom: 18,
    maxZoom: 20
  });

  // 地図に追加
  relief.addTo(map);
  std.addTo(map);
  map.attributionControl.addAttribution('地理院タイル（https://maps.gsi.go.jp/development/ichiran.html）');

  // マーカーをまとめて管理するレイヤー
  const markersLayer = L.layerGroup().addTo(map);
  const linesLayer   = L.layerGroup().addTo(map);

  // 距離線専用レイヤ（トグルON/OFFでまとめて制御）
  const distanceLinesLayer = L.layerGroup().addTo(map);
  
  window._map = map;

  window._markersLayer = markersLayer;
  window._linesLayer   = linesLayer;
  window._distanceLinesLayer = distanceLinesLayer;
  
  // ユーザー操作でONにされたものを保持（5秒ごとの再描画で復元）
  const visibleUsers   = new Set(); // user_id
  const visibleModels  = new Set(); // model_number（文字列）
  const visibleBaIds   = new Set(); // data_id（数字）
  const visibleCarIds  = new Set(); // data_id（数字）

  // 表示/非表示の共通関数（remove/add より高速＆復元が簡単）
  function showMarker(m){ 
    if (!m) return;
    m.setOpacity(1);
    const el = m.getElement?.() || m._icon || m._path;
    el?.classList.remove('leaflet-interactive-off');
    m._shadow?.classList.remove('leaflet-interactive-off');
  }
  function hideMarker(m){ 
    if (!m) return;
    m.setOpacity(0);
    const el = m.getElement?.() || m._icon || m._path;
    el?.classList.add('leaflet-interactive-off');
    m._shadow?.classList.add('leaflet-interactive-off');
    m.closePopup?.();
  }

  // === Polyline（直線）を作成して地図に追加 ===
  const distancePopup = L.popup(); // ← ループの外に1つだけ定義
  // 初回描画
  let start = 1;
  if (sessionStorage.getItem('mapFlag') != '3') {
    start = 1;
    await renderMarkers();
  }

  await ensureMyUserId();
  await saveUserData(0);
  const initialCenter = [userLat, userLng];

  document.getElementById('loading').classList.add('hidden');
  setTimeout(initSwitchesAllOn, 0);
  if (sessionStorage.getItem('mapFlag') === '1') {
    // document.getElementById('distance-gpsToggle')?.click();  // 初期ONにしたい場合
    document.getElementById('location-gpsToggle')?.click();  // 初期ONにしたい場合
    map.setView([userLat, userLng], 17, { animate: false });
  } else if (sessionStorage.getItem('mapFlag') === '3') {
    map.setView([userLat, userLng], 17, { animate: false });
  }

  map.on('click', function(e) {
    // e.originalEvent.target.classList.contains('leaflet-interactive') が trueならマーカーなど
    // if (!e.originalEvent.target.classList.contains('leaflet-interactive')) {
    //   sessionStorage.removeItem('selectedMarkerIndex');
    //   console.log('空白クリック → 選択解除');
    // }
    const t = e.originalEvent.target;
    // ポップアップ内のクリックは無視
    if (t.closest && t.closest('.leaflet-popup')) return;

    if (!t.classList.contains('leaflet-interactive')) {
      sessionStorage.removeItem('selectedMarkerKey');
    }
  });

  // 地図生成直後に1回だけ
  map.on('zoomend', () => {
    sessionStorage.setItem('zoomLevel', String(map.getZoom()));
    console.log('zoomLevel更新:', sessionStorage.getItem('zoomLevel'));
  });

  async function ensureMyUserId() {
    if (myUserId) return myUserId;
    await userCheck(0);        // ← ここで userNum が自分になる想定
    myUserId = Number(userNum);
    return myUserId;
  }

  async function userCheck(uid) {
    const setdata = {
      uid:  uid
    };
    try {
      const response = await fetch(`${API_BASE}/api/userCheck`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata),
      });
      const result = await response.json();
      if (response.ok) {
        usercheck = Number(result.check);
        userNum   = Number(result.num);
        console.log('userid=',userNum);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  async function getDataUserSetting(){
    try {
      const response = await fetch(`${API_BASE}/api/setting`, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        mapButtonFlag = result.mapbtn;
        gpsFlag = result.gpsflag;
        eneFlag = result.eneflag;
        console.log('ログイン成功:', result);
      } else {
        console.error('ログイン失敗:', result.error);
        statusNum = result.status;
        await popChange(result.error);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  async function getDataGroupUser() {
    try {
      const response = await fetch(`${API_BASE}/api/getGroupData?groupid=${groupId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        groupName = result.name;
        groupflag = result.flag;
        console.log('グループ情報:', result);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }
  async function getDataUser() {
    try {
      const response = await fetch(`${API_BASE}/api/getMapUser?groupid=${groupId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        userName = result.namelist;
        useridList = result.idlist;
        console.log('グループユーザー:', result);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }
  async function getDataDevice() {
    try {
      const response = await fetch(`${API_BASE}/api/getDevice?groupid=${groupId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        deviceName = result.namelist;
        deviceNumber = result.numberlist;
        deviceidList = result.idlist;
        console.log('グループデバイス:', result);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  async function getDataBa() {
    // 待ち場getSQLで取得
    try {
      const response = await fetch(`${API_BASE}/api/getBa`, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        baName = result.namelist;
        baidList = result.idlist;
        console.log('テスト：', baName);
        console.log('テスト：', baidList);
      } else {
        console.log('テスト：', result.error);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }
  async function getDataCar() {
    // 車getSQLで取得
    try {
      const response = await fetch(`${API_BASE}/api/getCar`, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        carName = result.namelist;
        caridList = result.idlist;
        console.log('テスト：', carName);
        console.log('テスト：', caridList);
      } else {
        console.log('テスト：', result.error);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  //軌跡
  async function getDataUserTrajectory() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        userName = Array.isArray(result.user?.username) ? result.user?.username : [result.user?.username];
        useridList = Array.isArray(result.user?.id) ? result.user?.id : [result.user?.id];
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }
  async function getDataDeviceTrajectory() {
    try {
      const response = await fetch(`${API_BASE}/api/getUserDevice`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        deviceName = result.name;
        deviceNumber = result.number;
        deviceidList = result.id;
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  // Promiseでラップした関数
  async function getCurrentPositionAsync() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        success => {
          resolve(success.coords); // 成功時に座標を返す
        },
        error => {
          reject(error); // エラー時に reject
        }
      );
    });
  }

  async function getCurrentPositionAsyncAccuracy() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        success => {
          resolve(success.coords); // 成功時に座標を返す
        },
        error => {
          reject(error); // エラー時に reject
        }, {enableHighAccuracy: true}
      );
    });
  }

  async function getPosition() {
    const pick = async () => {
      const a = await getCurrentPositionAsync();
      if (a.accuracy < 30) return a;
      const b = await getCurrentPositionAsyncAccuracy();
      return b;
    };
    const coords = await pick();
    userLat    = coords.latitude;
    userLng    = coords.longitude;
    userAcc    = coords.accuracy;
    userAlt    = coords.altitude;
    userAltAcc = coords.altitudeAccuracy;
    updateMyMarkerFromCoords(coords);
    console.log('省エネモード：ON');
  }
  
  // 「1回でも座標が入るまで待つ」(タイムアウト付き)
  function waitForCoords({ timeoutMs = 6000, maxAcc = null } = {}) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const t = setInterval(() => {
        if (latestCoords) {
          if (maxAcc == null || (typeof latestCoords.accuracy === 'number' && latestCoords.accuracy <= maxAcc)) {
            clearInterval(t);
            resolve(latestCoords);
            return;
          }
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(t);
          resolve(latestCoords);
        }
      }, 100);
    });
  }
  
  window.stopHunterMap = function stopHunterMap(reason = '') {
    try {
      // 1) 5秒ループ停止（既存）
      if (window.mapRenderLoopId) {
        clearInterval(window.mapRenderLoopId);
        window.mapRenderLoopId = null;
      }

      // 2) watchPosition停止（追加）
      if (window._geoWatchId != null) {
        navigator.geolocation.clearWatch(window._geoWatchId);
        window._geoWatchId = null;
      }
      
      // 既存 stopHunterMap に追加
      if (window._myLocSaveLoopId) {
        clearInterval(window._myLocSaveLoopId);
        window._myLocSaveLoopId = null;
      }
      
      console.log("HunterMap stopped:", reason);
    } catch (e) {
      console.warn("stopHunterMap error:", e);
    }
  };

  function distanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function updateMyMarkerFromCoords(coords) {
    const ml = window._markersLayer;
    if (!ml) return; // まだ地図/レイヤ未生成なら待つ 
    const myId = Number(myUserId || userNum);
    if (!myId || !markersByUserId) return;
    let marker = markersByUserId.get(myId);
    if (!marker) {
      marker = L.marker([coords.latitude, coords.longitude], {
        icon: locationToggleOn ? userIcon : personIcon
      }).addTo(ml);
      markersByUserId.set(myId, marker);
      // トグル制御してるなら key 側にも登録（任意だけど重要）
      const k = `user:${myId}`;
      if (!markersByKey.has(k)) markersByKey.set(k, new Set());
      markersByKey.get(k).add(marker);
    } else {
      marker.setLatLng([coords.latitude, coords.longitude]);
      marker.setIcon(locationToggleOn ? userIcon : personIcon);
    }
    const latNum = Number(coords.latitude);
    const lngNum = Number(coords.longitude);
    const accNum = Number(coords.accuracy ?? 0);

    // 表示用（文字列）
    const lat = String(latNum);
    const lng = String(lngNum);
    const acc = String(Math.round(accNum));
    const timeId = new Date().toISOString(); // 必要ならあなたの timeId 形式に差し替え

    // ユーザー名（見つからない場合の保険）
    let username = '本人';
    const idx = Array.isArray(useridList) ? useridList.findIndex(v => Number(v) === myId) : -1;
    if (idx >= 0 && Array.isArray(userName) && userName[idx]) username = userName[idx];

    // クリック前に開いてたら維持
    const wasOpen = marker.isPopupOpen?.() ?? false;

    // マーカー更新
    marker.setLatLng([latNum, lngNum]);

    // 自分表示トグルに合わせたアイコン更新
    const iconForMarker = locationToggleOn ? userIcon : personIcon;
    marker.setIcon(iconForMarker);

    // Popup HTML
    const popupHtml = `
      <b>${username}</b><br>
      緯度：${lat}<br>
      経度：${lng}<br>
      精度：${acc} m<br>
      時間：${timeId}
    `;

    const popupObj = marker.getPopup?.();
    if (!popupObj) {
      marker.bindPopup(popupHtml, { autoPan: false });
    } else {
      popupObj.setContent(popupHtml);
      popupObj.setLatLng(marker.getLatLng());
    }

    if (wasOpen) marker.openPopup?.();

    // ==== マーカークリック時の選択状態の保存（1回だけ）====
    if (!marker._hasSelectionHandler) {
      marker.on('click', () => {
        const k = `user:${myId}`;
        const storeKey = 'selectedMarkerKey';
        const cur = sessionStorage.getItem(storeKey);

        if (cur === k) {
          sessionStorage.removeItem(storeKey);
          marker.closePopup?.();
          return;
        }

        sessionStorage.setItem(storeKey, k);

        setTimeout(() => {
          const popupEl = document.querySelector('.leaflet-popup-close-button');
          if (popupEl) popupEl.style.display = 'none';
        }, 200);
      });
      marker._hasSelectionHandler = true;
    }
  }

  function startWatchPositionOnce() {
    if (!("geolocation" in navigator)) {
      throw new Error("このブラウザは位置情報に対応していません");
    }
    if (window._geoWatchId != null) return; // 既に開始済み

    window._geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        latestCoords = pos.coords;

        userLat    = latestCoords.latitude;
        userLng    = latestCoords.longitude;
        userAcc    = latestCoords.accuracy;
        userAlt    = latestCoords.altitude ?? 1.0;
        userAltAcc = latestCoords.altitudeAccuracy ?? 0;
        
        updateMyMarkerFromCoords(latestCoords);
        // デバッグ
        console.log('省エネモード：OFF', latestCoords);
      },
      (err) => {
        console.error("watchPosition error:", err);
        // 権限拒否などはここでフラグを落としても良い（任意）
        // gpsFlag = false;
      },
      WATCH_OPT
    );
  }

  async function saveLatestToServerIfNeeded(pointType = 0) {
    // mapFlag=1（通常）以外は保存しない（ポイント登録モード等で誤保存防止）
    if (sessionStorage.getItem('mapFlag') !== '1') return;

    if (!latestCoords) return;
    if (saving) return;

    const lat = latestCoords.latitude;
    const lng = latestCoords.longitude;
    const acc = latestCoords.accuracy;
    const alt = latestCoords.altitude ?? 1.0;
    const altacc = latestCoords.altitudeAccuracy ?? 0;

    if (typeof acc === "number" && acc > SAVE_ACCURACY_MAX) return;

    if (lastSavedLatLng) {
      const moved = distanceMeters(lastSavedLatLng.lat, lastSavedLatLng.lng, lat, lng);
      if (moved < MIN_MOVE_M) return;
    }

    const now = Date.now();
    if (now - lastSavedAt < MIN_SAVE_MS) return;

    saving = true;
    try {
      const setdata = {
        id: Number(pointType), // 0 / 1 / 2 を合わせる
        lat: Number(lat),
        lng: Number(lng),
        acc: Number(acc),
        alt: Number(alt),
        altacc: Number(altacc),
      };

      const response = await fetch(`${API_BASE}/api/setUserLocationInformation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("現在地保存エラー:", result?.error || result);
        return;
      }

      lastSavedAt = now;
      lastSavedLatLng = { lat, lng };
      // console.log("現在地保存OK:", lat, lng, "acc:", acc);
    } finally {
      saving = false;
    }
  }

  async function saveUserData(pointType) {
    // gpsFlagを確認（取得後に無効なら中断）
    if (!gpsFlag) {
      console.log("GPS：無効");
      return;
    }
    if (!("geolocation" in navigator)) {
      alert("このブラウザは位置情報に対応していません");
      return;
    }
    try {
      if (eneFlag) {
        await getPosition();
      }
      if (!eneFlag) {
        // 現在地を継続監視で取得（1回だけ開始）
        await ensureMyUserId();
        startWatchPositionOnce();

        // 初回だけ「座標が入るまで」少し待つ（任意：すぐUIを反映したい場合）
        await waitForCoords({ timeoutMs: 6000, maxAcc: 80 });
        // watchの最新値を userLat/userLng に反映（wait中に入っていればOK）
        if (latestCoords) {
          userLat    = latestCoords.latitude;
          userLng    = latestCoords.longitude;
          userAcc    = latestCoords.accuracy;
          userAlt    = latestCoords.altitude ?? 1.0;
          userAltAcc = latestCoords.altitudeAccuracy ?? 0;
        }
      }
      console.log("現在地:", userLat, userLng, userAcc);
    } catch (err) {
      alert("現在地の取得に失敗しました: " + err.message);
    }
    if (sessionStorage.getItem('mapFlag') !== '1') return;
    const setdata = {
      id:     Number(pointType),     // 1 or 2
      lat:    Number(userLat),
      lng:    Number(userLng),
      acc:    Number(userAcc),
      alt:    Number(userAlt),
      altacc: Number(userAltAcc),
    };
    try {
      const response = await fetch(`${API_BASE}/api/setUserLocationInformation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify(setdata),
      });
      const result = await response.json();
      if (response.ok) {
        console.log('現在地保存成功:', result);
      } else {
        console.error('通信エラー:', result);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  function initSwitchesAllOn(){
    if (sessionStorage.getItem('mapFlag') !== '1') return;
    if (sessionStorage.getItem('allSwitchesInit') === '1') return; // 多重実行防止

    bulkInit = true;
    // 対象: ユーザー/デバイス/待ち場/車 の各トグル
    const sel = [
      'input[type="checkbox"][id^="user-gpsToggle"]',
      'input[type="checkbox"][id^="device-gpsToggle"]',
      'input[type="checkbox"][id^="ba-gpsToggle"]',
      'input[type="checkbox"][id^="car-gpsToggle"]',
    ].join(',');
    document.querySelectorAll(sel).forEach(chk => { chk.checked = true; });
    applyToggleStates();
    const me = markersByUserId.get(Number(myUserId));
    if (me) showMarker(me);
    bulkInit = false;
    sessionStorage.setItem('allSwitchesInit', '1');
  }

  function keyForRow(user_id, username, model_number, status_flag, data_id){
    // 条件：
    //  ユーザー   → user_id（usernameに記載）
    //  デバイス   → model_number
    //  待ち場(=4) → data_id（point_nameに記載）
    //  車(=5)    → data_id（point_nameに記載）
    if (status_flag == 3 && model_number) return `device:${model_number}`;
    if (status_flag == 4)                  return `ba:${data_id}`;
    if (status_flag == 5)                  return `car:${data_id}`;
    if (status_flag == 2)                  return `user:${user_id}`;
    // 上記に該当しないものはユーザー扱い（自分含む）
    return `user:${user_id}`;
  }

  // 画面上のスイッチの現在値に合わせて可視状態を反映
  function applyToggleStates(){
    // ユーザー
    document.querySelectorAll('input[type="checkbox"][id^="user-gpsToggle"]').forEach((el) => {
      const idx = Number(el.id.replace('user-gpsToggle','')) - 1;
      const uid = useridList[idx];
      if (uid != null) setVisibilityForKey(`user:${uid}`, el.checked);
    });
    // デバイス
    document.querySelectorAll('input[type="checkbox"][id^="device-gpsToggle"]').forEach((el) => {
      const idx = Number(el.id.replace('device-gpsToggle','')) - 1;
      const model = deviceNumber[idx]; // model_number 配列
      if (model) setVisibilityForKey(`device:${model}`, el.checked);
    });
    // 待ち場
    document.querySelectorAll('input[type="checkbox"][id^="ba-gpsToggle"]').forEach((el) => {
      const idx = Number(el.id.replace('ba-gpsToggle','')) - 1;
      const did = baidList[idx];
      if (did != null) setVisibilityForKey(`ba:${did}`, el.checked);
    });
    // 車
    document.querySelectorAll('input[type="checkbox"][id^="car-gpsToggle"]').forEach((el) => {
      const idx = Number(el.id.replace('car-gpsToggle','')) - 1;
      const did = caridList[idx];
      if (did != null) setVisibilityForKey(`car:${did}`, el.checked);
    });
    // --- その他表示（距離線 / 自分の位置表示）の再適用 ---
    (function(){
      const d = document.getElementById('distance-gpsToggle');
      const l = document.getElementById('location-gpsToggle');
      if (d) updateDistanceToggleState(d.checked);
      if (l) updateLocationToggleState(l.checked);
    })();
  }

  // ▼キー（user:, device:, ba:, car:）ごとの表示/非表示
  function setVisibilityForKey(key, visible){
    const mset = markersByKey.get(key);
    if (mset) {
      mset.forEach(m => {
        if (visible) {
          if (!markersLayer.hasLayer(m)) markersLayer.addLayer(m);
          // 既存の表示制御関数を利用
          if (typeof showMarker === 'function') showMarker(m);
          else m.setOpacity?.(1);
        } else {
          if (typeof hideMarker === 'function') hideMarker(m);
          else m.setOpacity?.(0);
          // レイヤから外す必要はないが、外したい場合は↓を有効化
          // markersLayer.removeLayer(m);
        }
      });
    }
    const lset = linesByKey.get(key);
    if (lset) {
      lset.forEach(l => {
        if (visible) {
          if (!linesLayer.hasLayer(l)) linesLayer.addLayer(l);
        } else {
          linesLayer.removeLayer(l); // 線はイベント拾わないようにレイヤから外す
        }
      });
    }
  }

  function clearDistanceLines(){
    distanceLinesLayer.clearLayers();
  }

  async function drawDistanceLines(){
    clearDistanceLines();
    await userCheck(0);
    // 自分のマーカー（人）を取得
    const myMarker = markersByUserId.get(Number(userNum));
    if (!myMarker) return;

    const myLatLng = myMarker.getLatLng();

    // 犬（首輪＝device）全てに対して、自分→犬の線を描く
    markersByModelNumber.forEach((dogMarker, model) => {
      // 非表示中なら飛ばす（opacity 0 の簡易判定）
      const iconEl = dogMarker._icon;
      if (iconEl && iconEl.classList.contains('leaflet-interactive-off')) return;

      const line = L.polyline(
        [ myLatLng, dogMarker.getLatLng() ],
        { weight: 3, opacity: 0.8 } // 色は未指定（あなたのテーマに合わせて）
      ).addTo(distanceLinesLayer);

      // 距離ポップ（クリックした場所に区間距離）
      const segM  = map.distance(myLatLng, dogMarker.getLatLng());
      const segKm = (segM / 1000).toFixed(2);
      line.on('click', (e) => {
        distancePopup
          .setLatLng(e.latlng)
          .setContent(`<b>距離：</b>${segKm} km<br><small>自分 ↔ ${model}</small>`)
          .openOn(map);
      });
    });
    // --- 他ユーザー: 自分 → 他ユーザー ---
    // Map.forEach のシグネチャは (value, key)
    markersByUserId.forEach( async (userMarker, uid) => {
      // 自分自身は線を引かない
      await userCheck(Number(uid));
      if (usercheck === 1) return;

      // 非表示中やレイヤから外れているならスキップ
      const iconEl = userMarker._icon;
      if (!map.hasLayer(userMarker)) return;
      if (iconEl && iconEl.classList.contains('leaflet-interactive-off')) return;

      const toLatLng = userMarker.getLatLng();
      const line = L.polyline([ myLatLng, toLatLng ], { weight: 3, opacity: 0.8 })
        .addTo(distanceLinesLayer);

      const segM  = map.distance(myLatLng, toLatLng);
      const segKm = (segM / 1000).toFixed(2);
      line.on('click', (e) => {
        distancePopup
          .setLatLng(e.latlng)
          .setContent(`<b>距離：</b>${segKm} km<br><small>自分 ↔ ユーザーID:${uid}</small>`)
          .openOn(map);
      });
    });
  }

  function updateDistanceToggleState(on){
    distanceToggleOn = !!on;
    if (distanceToggleOn) {
      drawDistanceLines();
    } else {
      clearDistanceLines();
    }
  }

  async function updateLocationToggleState(on){
    locationToggleOn = !!on;

    // 自分のマーカーを取得
    await userCheck(0);
    const myMarker = markersByUserId.get(Number(userNum));
    if (!myMarker) return;

    if (locationToggleOn) {
      myMarker.setIcon(userIcon);
    } else {
      myMarker.setIcon(personIcon);
    }
  }

  async function renderMarkers() {
    const mapFlagNow = sessionStorage.getItem('mapFlag');
    
    // インデックスは毎回作り直す
    markersById.clear();
    markerMetaByMid.clear?.();
    const myMarker = markersByUserId.get(myUserId);
    markersByUserId.clear();
    if (myMarker) markersByUserId.set(myUserId, myMarker);
    markersByModelNumber.clear();
    baDataIds.clear();
    carDataIds.clear();

    if (mapFlagNow === '3') {
      // 軌跡モードは今まで通り「全部描き直し」
      markersByKey.clear();
      markersByDataId.clear();
      linesByKey.clear();
      markersLayer.clearLayers();
      linesLayer.clearLayers();
      latestMarkerByKey.clear();
    } else {
      // 1,2 のときはマーカーを消さずに再利用する
      // 線だけは毎回リセット
      linesByKey.clear();
      linesLayer.clearLayers();
      // markersByKey / markersByDataId / markersLayer は残す
    }

    const latlngs = [];
    let setdata = [];
    if (sessionStorage.getItem('mapFlag') === '1') {
      await saveUserData(0);
      setdata = {
        groupid: groupId,
        flag: Number(sessionStorage.getItem('mapFlag'))
      };
    } else if (sessionStorage.getItem('mapFlag') === '2') {
      setdata = {
        flag: Number(sessionStorage.getItem('mapFlag'))
      };
    } else {
      setdata = {
        date: selectDate,
        count: selectCountTime,
        flag: Number(sessionStorage.getItem('mapFlag'))
      };
    }
    console.log(Number(sessionStorage.getItem('mapFlag')));
    try {
      const response = await fetch(`${API_BASE}/api/getdata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata)
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('データ取得失敗:', result.error);
        if (firstFlag) {
          firstFlag = false;
          errorId = 1;
        } else {
          errorId = 2;
        }
        console.log(result.data);
        statusNum = result.status;
        await popChange(result.error);
        return;
      }
        console.log(result.dataset);
        let data = result.dataset || {};
        const activeKeys = new Set();
        if (sessionStorage.getItem('mapFlag') != '3') {
          
          const indexToMarker = [];

          // ★ latlngs に追記しない（距離ラインを増殖させないため）
          for (let i = 0; i < data.length; i++) {
            const { user_id, username, model_number, lat, lng, alt, acc, alt_acc, time_id, status_flag, point_name, data_id } = data[i];
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);
            if (isNaN(latNum) || isNaN(lngNum)) continue;
            latlngs.push([latNum, lngNum]);
            const isMe = (Number(user_id) === myUserId);
            // --- アイコン選択（あなたの既存判定をそのまま利用） ---
            let iconForMarker = largeIcon;               // デフォルト
            // if (isMe)                  iconForMarker = userIcon;        // 自分（👤）
            if (status_flag == 4) iconForMarker = satelliteIcon;   // 衛星
            else if (status_flag == 5) iconForMarker = carIcon;         // 車
            else if (status_flag == 2) iconForMarker = personIcon;      // 人（待ち）
            else if (status_flag == 3) iconForMarker = dogIcon;         // 犬（デバイス）
            else iconForMarker = personRedIcon;                         // その他は赤い人
            // この行の「論理キー」（user / device / ba / car）
            const k = keyForRow(user_id, username, model_number, status_flag, data_id);
            activeKeys.add(k);
            // ==== 既存マーカーを探して移動 or 新規作成 ====
            let markerSet = markersByKey.get(k);
            let marker;
            if (markerSet && markerSet.size > 0) {
              // 既にこのキーのマーカーがある → 再利用
              marker = markerSet.values().next().value;
              marker.setLatLng([latNum, lngNum]);
              marker.setIcon(iconForMarker);
            } else {
              // 初回だけ新規作成
              marker = L.marker([latNum, lngNum], { icon: iconForMarker }).addTo(markersLayer);
              if (!markersByKey.has(k)) markersByKey.set(k, new Set());
              markersByKey.get(k).add(marker);
            }
            markersByDataId.set(Number(data_id), marker);

            // ★★ 追加索引（人・犬・待ち場・車）
            if ((status_flag == 1 || status_flag == 2) && username && user_id != null) {
              // 人（usernameが入っている行をユーザー用とみなす）
              markersByUserId.set(Number(user_id), marker);
            }
            if (status_flag == 3 && model_number) {
              // 犬/デバイス
              markersByModelNumber.set(String(model_number), marker);
            }
            if (status_flag == 4 && point_name) {
              // 待ち場
              baDataIds.add(Number(data_id));
            }
            if (status_flag == 5 && point_name) {
              // 車
              carDataIds.add(Number(data_id));
            }
            const timeId = parseYYYYMMDDhhmmss(time_id);
            // --- ポップアップ内容を作成（内容は今まで通り） ---
            let popupHtml = '';
            if (status_flag == 3) {
              popupHtml = `
                <b>${model_number}</b><br>
                緯度：${lat}<br>
                経度：${lng}<br>
                精度：${acc} m<br>
                時間：${timeId}
              `;
            } else if (status_flag == 4 || status_flag == 5) {
              if (sessionStorage.getItem('mapFlag') === '2') {
                const btnId = `del-${i}-${Date.now()}`;
                popupHtml = `
                  <div>
                    <b>${point_name}</b><br>
                    緯度：${lat}<br>
                    経度：${lng}<br>
                    精度：${acc} m<br>
                    時間：${timeId}
                    <button type="button" class="js-del-marker" data-mid="${btnId}">ポイント削除</button>
                  </div>
                `;
                markersById.set(btnId, marker);
                markerMetaByMid.set(btnId, {
                  id: Number(data_id),
                  kind: (status_flag === 4 ? 'ba' : 'car')
                });
              } else {
                popupHtml = `
                  <b>${point_name}</b><br>
                  緯度：${lat}<br>
                  経度：${lng}<br>
                  精度：${acc} m<br>
                  時間：${timeId}
                `;
              }
            } else {
              popupHtml = `
                <b>${username}</b><br>
                緯度：${lat}<br>
                経度：${lng}<br>
                精度：${acc} m<br>
                時間：${timeId}
              `;
            }

            // === ここがポイント：既存ポップアップを「更新」する ===
            const wasOpen =
              typeof marker.isPopupOpen === 'function' && marker.isPopupOpen();

            let popupObj = marker.getPopup();
            if (!popupObj) {
              // 初回だけ bindPopup する
              marker.bindPopup(popupHtml, { autoPan: false });
            } else {
              // 2回目以降は内容だけ差し替え
              popupObj.setContent(popupHtml);
              // 念のため位置も現在のマーカー位置に合わせる
              popupObj.setLatLng(marker.getLatLng());
            }

            // もし再描画前に開いていたなら、開いたままにしておく
            if (wasOpen) {
              marker.openPopup();
            }
            // ==== マーカークリック時の選択状態の保存 ====
            if (!marker._hasSelectionHandler) {
              marker.on('click', () => {
                const storeKey = 'selectedMarkerKey';
                const cur = sessionStorage.getItem(storeKey);
                // 同じマーカーをもう一度クリック → 選択解除してPOPUP閉じる
                if (cur === k) {
                  sessionStorage.removeItem(storeKey);
                  if (marker.isPopupOpen && marker.isPopupOpen()) {
                    marker.closePopup();
                  }
                  return; // ← ここで終了（削除処理などは走らない）
                }
                sessionStorage.setItem(storeKey, k);
                // 少し遅らせてpopupの×を非表示
                setTimeout(() => {
                  const popupEl = document.querySelector('.leaflet-popup-close-button');
                  if (popupEl) popupEl.style.display = 'none';
                }, 200);
              });
              marker._hasSelectionHandler = true;
            }
          }
        } else {
          // 条件を満たすデータを抽出
          const filtered = data.filter( async row => {
            const {user_id, username} = row;
            await userCheck(user_id);
            return usercheck === 1 && username && username.trim() !== '';
          });
          // const myUid = Number(useridList?.[0] ?? 0);
          // const filtered = data.filter(row => Number(row.user_id) === myUid && row.username?.trim());

          // 最大 data_id の行を探す
          const latest = filtered.reduce((maxRow, row) => {
            const data_id = row[9]; // 10番目の要素
            if (!maxRow || data_id > maxRow[9]) return row;
            return maxRow;
          }, null);

          // 結果の確認
          if (latest) {
            const {user_id, username, model_number, lat, lng, alt, acc, alt_acc, time_id, status_flag, point_name, data_id} = latest;
            userLat = lat;
            userLng = lng;
          } else {
            console.log('条件に合うデータがありません');
          }

          const groups = new Map();
          data.forEach((row, idx) => {
            const {user_id, username, model_number, lat, lng, alt, acc, alt_acc, time_id, status_flag, point_name, data_id} = row;

            const entityKey = (model_number && String(model_number).trim() !== '')
                ? `device:${String(model_number)}`
                : `user:${Number(user_id)}`;

            console.log('entityKey：',entityKey);
            if (!groups.has(entityKey)) groups.set(entityKey, []);
            groups.get(entityKey).push({
              idx,
              entityKey,
              user_id,
              username,
              model_number: model_number ? String(model_number) : '',
              lat: +lat,
              lng: +lng,
              alt,
              acc,
              alt_acc,
              time_id: String(time_id),
              status_flag,
              point_name,
              data_id
            });
          });

          // --- グループごとに time_id 昇順 → 連結＆距離POPUP ---
          groups.forEach(async (points, entityKey) => {
            points.sort((a, b) => a.time_id.localeCompare(b.time_id));
          
            let cumulative = 0;
            const markers = [];
          
            // 1) マーカーはこのループで「1回だけ」作る
            for (let i = 0; i < points.length; i++) {
              const p = points[i];
          
              await userCheck(p.user_id);
          
              let iconForMarker = largeIcon;
              if (p.status_flag == 4)      iconForMarker = satelliteIcon;
              else if (p.status_flag == 5) iconForMarker = carIcon;
              else if (p.status_flag == 2) iconForMarker = personIcon;
              else if (p.status_flag == 3) iconForMarker = dogIcon;
              else if (usercheck === 1)    iconForMarker = userIcon;
              else                         iconForMarker = personRedIcon;
          
              const m = L.marker([p.lat, p.lng], { icon: iconForMarker }).addTo(markersLayer);
              markers.push(m);
          
              // key登録（トグル用）
              if (!markersByKey.has(entityKey)) markersByKey.set(entityKey, new Set());
              markersByKey.get(entityKey).add(m);
            }

            // 2) 線と popup（ここも 1回だけ）
            for (let i = 0; i < points.length; i++) {
              const p = points[i];
              const m = markers[i];
              const p_time = parseYYYYMMDDhhmmss(p.time_id);
              
              const displayName =
                p.model_number && String(p.model_number).trim() !== ''
                  ? String(p.model_number)
                  : (p.username || '不明ユーザー');
          
              // 線
              if (i > 0) {
                const prev = points[i - 1];
                const prev_time = parseYYYYMMDDhhmmss(prev.time_id);
                const segM  = map.distance([prev.lat, prev.lng], [p.lat, p.lng]);
                cumulative += segM;
                const segKm = (segM / 1000).toFixed(3);
                const cumKm = (cumulative / 1000).toFixed(2);
          
                const line = L.polyline([[prev.lat, prev.lng], [p.lat, p.lng]], { weight: 3, opacity: 0.9 })
                  .addTo(linesLayer);

                if (!linesByKey.has(entityKey)) linesByKey.set(entityKey, new Set());
                linesByKey.get(entityKey).add(line);
          
                line.on('click', (e) => {
                  distancePopup
                    .setLatLng(e.latlng)
                    .setContent(
                      `<b>${displayName}</b><br>` +
                      `<b>区間距離:</b> ${segKm} km<br>` +
                      `<b>累計距離:</b> ${cumKm} km<br>` +
                      `<small>${prev_time} → ${p_time}</small>`
                    )
                    .openOn(map);
                });
              }
          
              // popup
              const cumKmNow = (cumulative / 1000).toFixed(2);
              const html = `
                <b>${displayName}</b><br>
                緯度：${p.lat}<br>
                経度：${p.lng}<br>
                精度：${p.acc} m<br>
                時間：${p_time}<br>
                <hr>
                <b>累計距離:</b> ${cumKmNow} km
              `;
          
              m.bindPopup(html, { autoPan: false });
          
              // ★ 念のため：クリック時に確実に開く（これで「開かない」を潰せる）
              if (!m._hasTrajClick) {
                m.on('click', () => {
                  m.openPopup();
                });
                m._hasTrajClick = true;
              }
            }
            if (points.length) {
              const lastM = markers[markers.length - 1];
              window._latestMarkerByKey?.set(entityKey, lastM);
            }
          });
        }

        if (sessionStorage.getItem('mapFlag') === '1' && start === 1) {
          // 初期は全部非表示
          markersByUserId.forEach(hideMarker);
          markersByModelNumber.forEach(hideMarker);
          baDataIds.forEach(id => hideMarker(markersByDataId.get(id)));
          carDataIds.forEach(id => hideMarker(markersByDataId.get(id)));
          const me = markersByUserId.get(Number(myUserId));
          if (me) showMarker(me);
          // 直前のトグル状態を再適用（5秒ごとの再描画に対応）
          visibleUsers.forEach(uid => showMarker(markersByUserId.get(Number(uid))));
          visibleModels.forEach(mn => showMarker(markersByModelNumber.get(String(mn))));
          visibleBaIds.forEach(id => showMarker(markersByDataId.get(Number(id))));
          visibleCarIds.forEach(id => showMarker(markersByDataId.get(Number(id))));
          
          start = 0;
        }
        
        // ★ 追加：再描画後に現在のトグル状態を反映（OFFのものは非表示化）
        applyToggleStates();
        const me = markersByUserId.get(Number(myUserId));
        if (me) showMarker(me);
        sessionStorage.removeItem('allSwitchesInit');
    } catch(error) {
      console.error('通信エラー:', error);
      alert('通信エラーが発生しました');
    }
  }

  function parseYYYYMMDDhhmmss(str) {
    const year   = str.slice(0, 4);
    const month  = str.slice(4, 6); // 01-12
    const day    = str.slice(6, 8);
    const hour   = str.slice(8, 10);
    const minute = str.slice(10, 12);
    const second = str.slice(12, 14);

    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  }

  document.addEventListener('click', (e) => {
    // mapFlag==2 の入力だけ反応
    if (sessionStorage.getItem('mapFlag') !== '2') return;

    const inp = e.target.closest('input.ba-input.is-readonly');
    if (!inp) return;

    // ba/carどちらでもOK。data-pointid がキー
    const pointId = Number(inp.dataset.pointid);
    if (!pointId) return;
    
    const m = markersByDataId.get(pointId);
    if (!m) {
      console.warn('対応するマーカーが見つかりません:', pointId);
      return;
    }
    
    const latlng = m.getLatLng();
    // 既存ズームを保つ or ちょい寄る（好みで）
    const targetZoom = Math.max(map.getZoom(), 17);
    map.flyTo(latlng, targetZoom, { animate: true, duration: 0.8 });
    m.openPopup();
    // ついでに左メニューの選択ハイライト更新（任意）
    document.querySelectorAll('.ba-back').forEach(el => el.classList.remove('active'));
    inp.closest('.ba-back')?.classList.add('active');
  });

  // 5秒ごとに一旦削除 → 1秒後に再生成
  if (!window.mapRenderLoopId) {
    window.mapRenderLoopId = setInterval( async () => {
      if (sessionStorage.getItem('mapFlag') === '1') {
        await renderMarkers();
      }
      applyToggleStates();
      const me = markersByUserId.get(Number(myUserId));
      if (me) showMarker(me);
      sessionStorage.removeItem('allSwitchesInit');
      const savedKey = sessionStorage.getItem('selectedMarkerKey');
      if (savedKey) {
        const mset = markersByKey.get(savedKey);
        if (mset && mset.size > 0) {
          // 同じキーに属するマーカーのうち先頭を採用
          const m = [...mset][0];
          m.openPopup();
          setTimeout(() => {
            const btn = document.querySelector('.leaflet-popup-close-button');
            if (btn) btn.style.display = 'none';
          }, 200);
        } else {
          // 対応するマーカーがもう無い場合はセッションをクリアしておく
          sessionStorage.removeItem('selectedMarkerKey');
        }
      }
    }, 5000);
  }

  // ====== 航空写真レイヤ ======
  const orthophoto = L.tileLayer(
    'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    {
      attribution: '地理院タイル（航空写真）',
      maxNativeZoom: 18,
      maxZoom: 20
    }
  );

  // ====== ズーム位置（任意） ======
  const controlPos = mapButtonFlag ? 'topright' : 'topleft';
  map.zoomControl.setPosition(controlPos);

  // ====== カスタムコントロール作成 ======
  const PhotoToggle = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function (map) {
      const container = L.DomUtil.create('div', 'leaflet-bar');
      const link = L.DomUtil.create('a', 'custom-photo', container);
      link.href = '#';
      link.title = '航空機写真に切替';
      link.innerHTML = '🛰️';

      // クリックで地図タイルを切替
      L.DomEvent.on(link, 'click', (e) => {
        L.DomEvent.stop(e);

        // 今のズームを保存
        const currentZoom = map.getZoom();
        sessionStorage.setItem('zoomLevel', String(currentZoom));

        const usingPhoto = map.hasLayer(orthophoto);

        if (usingPhoto) {
          // 航空写真 → 標準地図
          map.removeLayer(orthophoto);
          if (!map.hasLayer(relief)) relief.addTo(map); // relief は15までしか出ないがOK
          if (!map.hasLayer(std))    std.addTo(map);

          link.classList.remove('active');
          link.title = '航空機写真に切替';

          // ★ 標準側は std の上限だけ見る（18）
          const saved = parseInt(sessionStorage.getItem('zoomLevel') || String(currentZoom), 10);
          const maxStd = std.options.maxZoom ?? 18;
          // const desired = Math.min(saved, maxStd);
          const desired = Number(sessionStorage.getItem('zoomLevel'));

          if (map.getZoom() !== desired) {
            const onZoomEnd = () => {
              console.log('ズーム完了:', map.getZoom());
              console.log('sessionStorage:', sessionStorage.getItem('zoomLevel'));
              map.off('zoomend', onZoomEnd); // 一度きり
            };
            map.on('zoomend', onZoomEnd);
            map.setZoom(desired);
          } else {
            console.log('sessionStorage:', sessionStorage.getItem('zoomLevel'));
          }
        } else {
          // 標準地図 → 航空写真
          if (map.hasLayer(relief)) map.removeLayer(relief);
          if (map.hasLayer(std))    map.removeLayer(std);
          orthophoto.addTo(map);

          link.classList.add('active');
          link.title = '標準地図に戻す';

          // 航空写真側は orthophoto の上限
          const saved = parseInt(sessionStorage.getItem('zoomLevel') || String(currentZoom), 10);
          const maxPhoto = orthophoto.options.maxZoom ?? 18;
          // const desired = Math.min(saved, maxStd);
          const desired = Number(sessionStorage.getItem('zoomLevel'));

          if (map.getZoom() !== desired) {
            const onZoomEnd = () => {
              console.log('ズーム完了:', map.getZoom());
              console.log('sessionStorage:', sessionStorage.getItem('zoomLevel'));
              map.off('zoomend', onZoomEnd); // 一度きり
            };
            map.on('zoomend', onZoomEnd);
            map.setZoom(desired);
          } else {
            console.log('sessionStorage:', sessionStorage.getItem('zoomLevel'));
          }
        }
      });

      // モバイルでの誤スクロールを防ぐ
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });

  map.addControl(new PhotoToggle({ position: controlPos }));

  // ====== 既存のポップ要素参照を用意 ======
  const pointPop   = document.getElementById('pointNew-pop');
  const popTitleEl = document.getElementById('pop-title');
  const popDescEl  = document.getElementById('pop-desc');
  const popActions = pointPop?.querySelector('.pop-actions');
  const closeBtn   = document.getElementById('pop-close');


  // 「ポイント登録」時の元テキストを保持（復元用）
  const ORIG_TITLE = popTitleEl?.textContent || 'ポイント登録';
  const ORIG_DESC  = popDescEl?.innerHTML   || 'ポイント登録の内容を選択してください。';

  // 元からある「持ち場」「車」ボタン（selectモード用）
  const selectButtons = pointPop ? pointPop.querySelectorAll('.select-btn') : [];

  // 動的に追加する「削除する」ボタン（必要時に作成）
  let confirmDeleteBtn = null;

  // 便利関数: ポップ開閉
  function openPointPop(){
    pointPop?.removeAttribute('hidden');
    document.body.style.overflow = 'hidden'; // 背景スクロール抑止
  }
  function closePointPop(){
    pointPop?.setAttribute('hidden','');
    pointPop.hidden = true;
    document.body.style.overflow = '';
  }
  if (closeBtn) {
    if (!window._pointPopCloseAttached) {
      window._pointPopCloseAttached = true;
    }
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePointPop();
      resetPopToRegisterMode?.();
    });
  }
  
  // 便利関数: ポイント登録表示にリセット
  function resetPopToRegisterMode(){
    // タイトル/説明を元に戻す
    if (popTitleEl) popTitleEl.textContent = ORIG_TITLE;
    if (popDescEl)  popDescEl.innerHTML   = ORIG_DESC;

    // 「持ち場」「車」を再表示
    selectButtons.forEach(btn => btn.hidden = false);

    // 動的「削除する」ボタンを隠す/削除（どちらでもOK）
    if (confirmDeleteBtn) {
      confirmDeleteBtn.remove();
      confirmDeleteBtn = null;
    }
  }

  // 便利関数: 削除確認モードへ切り替え & 表示
  function showDeleteConfirmForMarker(mid, marker, popupToClose){
    if (!pointPop) return;

    // タイトル/説明を差し替え
    if (popTitleEl) popTitleEl.textContent = 'ポイント削除';
    if (popDescEl)  popDescEl.innerHTML = 'ポイントを一度削除すると復元できません。<br>このポイントを削除しますか？';

    // 「持ち場」「車」ボタンを非表示
    selectButtons.forEach(btn => btn.hidden = true);

    // 動的に「削除する」ボタン作成（なければ）
    if (!confirmDeleteBtn) {
      confirmDeleteBtn = document.createElement('button');
      confirmDeleteBtn.type = 'button';
      confirmDeleteBtn.id = 'pop-confirm-delete';
      confirmDeleteBtn.className = 'pop-btn pop-danger';
      confirmDeleteBtn.textContent = '削除する';
      // 「閉じる」ボタンの左側に追加
      popActions?.insertBefore(confirmDeleteBtn, closeBtn || null);
    }

    const onConfirm = async () => {
      const meta = markerMetaByMid.get(mid);
      if (!meta) {
        alert('削除対象の情報を特定できませんでした。');
        return;
      }
      // 二重クリック防止＆状態表示
      confirmDeleteBtn.disabled = true;
      const prevText = confirmDeleteBtn.textContent;
      confirmDeleteBtn.textContent = '削除中…';
      const gateName = meta.kind === 'car'
                     ? 'carDelete'
                     : 'baDelete';
      const setdata = {
        id: meta.id,
      }
      try {
        const res = await fetch(`${API_BASE}/api/${gateName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify(setdata)
        });
        const j = await res.json();
        console.log(j);
        if (!res.ok || j.ok === false) {
          throw new Error(j?.error || '削除に失敗しました');
        }
        // 地図から削除 & Map から参照削除
        if (marker) {
          marker.remove(); // または map.removeLayer(marker)
        }
        if (mid && markersById.has(mid)) {
          markersById.delete(mid);
        }
        
        markersByDataId.delete(meta.id);
        if (meta.kind === 'ba') {
          baDataIds.delete(meta.id);
        } else {
          carDataIds.delete(meta.id);
        }

        // マーカーのポップアップも閉じる
        if (popupToClose) {
          const closePopupBtn = popupToClose.querySelector('.leaflet-popup-close-button');
          closePopupBtn?.click();
        }

        // ポップを閉じて元表示に戻す
        closePointPop();
        resetPopToRegisterMode();
        removeBaItemById(meta.id);
      } catch (err) {
        console.error(err);
        alert(err.message || '通信エラーが発生しました');
        // エラー時はボタン状態を戻す
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = prevText;
        return; // リスナー解除はせず、ユーザーに再試行させる
      }

      // 後始末（このハンドラは一度きり）
      confirmDeleteBtn?.removeEventListener('click', onConfirm);
      closeBtn?.removeEventListener('click', onCancel);
    };

    const onCancel = () => {
      // キャンセル＝閉じる → 元に戻す
      closePointPop();
      resetPopToRegisterMode();

      confirmDeleteBtn?.removeEventListener('click', onConfirm);
      closeBtn?.removeEventListener('click', onCancel);
    };

    confirmDeleteBtn.addEventListener('click', onConfirm, { 
      once: true
      // TODO: サーバ保存fetch
    });
    // 既にcloseBtnに他のリスナーがあってもOK。ここでは復元処理を追加で実行。
    closeBtn?.addEventListener('click', onCancel, { once: true });

    // 最後にポップ表示
    openPointPop();
  }

  function popTrajectory(){
    // ---- スタイル注入（重複防止）----
    (function ensurePopStyles(){
      if (document.getElementById('popTrajectory-styles')) return;
      const style = document.createElement('style');
      style.id = 'popTrajectory-styles';
      style.textContent = `
        .pop-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pop-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pop-row .grow { flex: 1; }

        .pop-select {
          width: 215px;
          min-height: 50px;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 20px;
        }

        .pop-btn {
          width: 80px;
          height: 50px;
          font-size: 20px;
        }

        .pop-modal {
          max-height: 90vh;
          overflow: auto;
          overscroll-behavior: contain;
        }
      `;
      document.head.appendChild(style);
    })();
    // ---- /スタイル注入 ----

    const pop = document.getElementById('pointNew-pop');
    if (!pop || sessionStorage.getItem('mapFlag') !== '3') return;

    // タイトル/説明
    const title = pop.querySelector('#pop-title');
    const desc  = pop.querySelector('#pop-desc');
    if (title) title.textContent = '日付選択';
    if (desc)  desc.textContent  = '選択した日付の軌跡が表示されます。';

    // 既存の「持ち場」「車」ボタンは消す
    pop.querySelectorAll('.select-btn').forEach(b => b.remove());

    // 閉じるボタンは非表示
    const closeBtn = pop.querySelector('#pop-close');
    if (closeBtn) {
      closeBtn.hidden = true;
      closeBtn.setAttribute('aria-hidden','true');
      closeBtn.tabIndex = -1;
    }

    // --- ドロップダウン生成 ---
    const dateSelect = document.createElement('select');
    dateSelect.id = 'search-date';
    dateSelect.className = 'pop-select';

    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      const opt = document.createElement('option');
      opt.value = `${y}${m}${day}`;
      opt.textContent = `${y}年${m}月${day}日`;
      dateSelect.appendChild(opt);
    }

    const intervalSelect = document.createElement('select');
    intervalSelect.id = 'search-interval';
    intervalSelect.className = 'pop-select grow';
    [
      { v:5,    t:'5秒 間隔' },
      { v:10,   t:'10秒 間隔' },
      { v:60,   t:'60秒（1分）間隔' },
      { v:600,  t:'10分 間隔' },
      { v:1800, t:'30分 間隔' },
      { v:3600, t:'1時間 間隔' },
    ].forEach(({v,t}) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = t;
      intervalSelect.appendChild(opt);
    });

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.id = 'pop-ok';
    okBtn.className = 'pop-btn pop-primary';
    okBtn.textContent = '検索';
    okBtn.addEventListener('click', async () => {
      selectDate = dateSelect.value;
      selectCountTime = Number(intervalSelect.value);
      // 例：値を使って再描画
      const center = map.getCenter();
      const zoom   = map.getZoom();
      await renderMarkers();
      map.setView(center, zoom, { animate: false });
      if (errorId === 0) {
        pop.hidden = true;
      } else {
        errorId = 0;
      }
      document.body.style.overflow = '';
    });

    // レイアウト：1行目=日付、2行目=時間間隔 + OK（右）
    const actions = pop.querySelector('.pop-actions');
    const row1 = document.createElement('div');
    row1.className = 'pop-row';
    row1.appendChild(dateSelect);

    const row2 = document.createElement('div');
    row2.className = 'pop-row';
    row2.appendChild(intervalSelect);
    row2.appendChild(okBtn);

    actions.prepend(row2);
    actions.prepend(row1);

    dateSelect.focus();
  }

  const pnb   = document.getElementById('pop-next-ba');
  const pnc   = document.getElementById('pop-next-car');

  pnb?.addEventListener('click', async () => {
    await saveUserData(1);
  });
  pnc?.addEventListener('click', async () => { 
    await saveUserData(2);
  });

  const mainbtn = document.getElementById('main-button');

  mainbtn?.addEventListener('click', () => {
    window.stopHunterMap('to mainMenu');
    location.href = "/mainMenu";
  });

  function removeBaItemById(pointId) {
    // 指定の data-pointid を持つ input 要素を取得
    const input = document.querySelector(`input[data-pointid="${pointId}"]`);
    if (!input) {
      console.warn(`pointId=${pointId} の要素が見つかりません`);
      return;
    }
    
    // 親の <label> 要素を取得
    const label = input.closest('label.toggle-row');
    if (!label) {
      console.warn('親の <label> が見つかりません');
      return;
    }
    // label の直後の兄弟要素を確認
    const nextEl = label.nextElementSibling;
    // <hr class="dashed-line"> があれば削除
    if (nextEl && nextEl.matches('hr.dashed-line')) {
      nextEl.remove();
      console.log('対応する <hr> を削除しました');
    }
    // label 自体を削除
    label.remove();
    console.log(`pointId=${pointId} の行を削除しました`);
  }

  // window.attachMapListeners = function () {
  //   if (window._mapListenersAttached) return;
  //   window._mapListenersAttached = true;

  //   document.addEventListener('click', onDocClick);
  //   document.addEventListener('change', onDocChange);
  // };

  // window.detachMapListeners = function () {
  //   if (!window._mapListenersAttached) return;
  //   window._mapListenersAttached = false;

  //   document.removeEventListener('click', onDocClick);
  //   document.removeEventListener('change', onDocChange);
  // };

  window.stopMapRenderLoop = function () {
    if (window.mapRenderLoopId) {
      clearInterval(window.mapRenderLoopId);
      window.mapRenderLoopId = null;
      console.log("map render loop stopped");
    }
  };

  // =============================
  // 3) ===== 最小イベント構成で必要な共有関数群 =====
  // =============================

  // ---- イベント配線（1回だけ） ----
  function initEventWiringMinimal() {
    // pageshow(BFCache)対策：戻ってきたら編集状態を必ずリセット
    if (!window._pageshowResetAttached) {
      window._pageshowResetAttached = true;
      window.addEventListener('pageshow', (e) => {
        try { window.resetEditState?.(); } catch {}
        if (e.persisted) {
          window.stopHunterMap('pageshow persisted');
        }
      }, { capture: true });
    }

    // resetEditState を公開（pageshowから呼べる）
    window.resetEditState = resetEditState;

    // 名前編集/保存（ba-edit-btn） クリック委譲は1本だけ
    if (!window._editBtnHandlerAttached) {
      window._editBtnHandlerAttached = true;
      document.addEventListener('click', onEditButtonDocClick);
    }

    // mapFlag=2：readonly input クリックで対応マーカーへflyTo（必要なら）
    if (!window._readonlyInputFlyToAttached) {
      window._readonlyInputFlyToAttached = true;
      document.addEventListener('click', onReadonlyInputFlyToClick);
    }

    // 削除（popup内 .js-del-marker）クリック委譲は1本だけ
    if (!window._deleteMarkerHandlerAttached) {
      window._deleteMarkerHandlerAttached = true;
      document.addEventListener('click', onDeleteMarkerClick);
    }

    // toggle change は1本に統合（使うなら）
    if (!window._toggleChangeHandlerAttached) {
      window._toggleChangeHandlerAttached = true;
      document.addEventListener('change', onToggleChangeUnified);
    }

    // editShield click：下に伝播させない（要素がある時だけ）
    const editShield = document.getElementById('edit-shield');
    if (editShield && !window._editShieldStopAttached) {
      window._editShieldStopAttached = true;
      editShield.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
    }

    // lock/unlock を公開（編集開始/終了で使用）
    window._lockPageForEditing = lockPageForEditing;
    window._unlockPage = unlockPage;

    // scroll block を公開（lockPageForEditing から呼ぶ）
    window.attachMapScrollBlock = attachMapScrollBlock;
    window.detachMapScrollBlock = detachMapScrollBlock;
  }


  // =============================
  // スクロール抑止（1セットだけ）
  // =============================
  const _blockScroll = (e) => e.preventDefault();
  function _blockKeyScroll(e) {
    const keys = ['Space','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'];
    if (keys.includes(e.code)) e.preventDefault();
  }

  function attachMapScrollBlock() {
    if (window._scrollBlockAttached) return;
    window._scrollBlockAttached = true;
    window.addEventListener('wheel', _blockScroll, { passive: false });
    window.addEventListener('touchmove', _blockScroll, { passive: false });
    window.addEventListener('keydown', _blockKeyScroll, { passive: false });
  }

  function detachMapScrollBlock() {
    if (!window._scrollBlockAttached) return;
    window._scrollBlockAttached = false;
    window.removeEventListener('wheel', _blockScroll);
    window.removeEventListener('touchmove', _blockScroll);
    window.removeEventListener('keydown', _blockKeyScroll);
  }

  // =============================
  // lock/unlock（あなたのを最小で残す）
  // =============================
  function getEditShield(){
    return document.getElementById('edit-shield');
  }
  var currentEditingRow = null;

  function lockPageForEditing(row) {
    currentEditingRow = row;
    const editShield = getEditShield();
    editShield?.removeAttribute('hidden');
    editShield?.setAttribute('aria-hidden', 'false');

    row.classList.add('edit-active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('edit-lock');

    attachMapScrollBlock();
    trapFocusToRow(row, true);
  }

  function unlockPage() {
    if (currentEditingRow) {
      currentEditingRow.classList.remove('edit-active');
      trapFocusToRow(currentEditingRow, false);
      currentEditingRow = null;
    }
    const editShield = getEditShield();
    editShield?.setAttribute('hidden', '');
    editShield?.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';
    document.body.classList.remove('edit-lock');

    detachMapScrollBlock();
  }

  function trapFocusToRow(row, enable) {
    if (!row) return;

    if (enable) {
      const focusables = row.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      row._trapHandler = (e) => {
        if (e.key !== 'Tab') return;
        if (focusables.length === 0) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      };
      document.addEventListener('keydown', row._trapHandler);

      const input = row.querySelector('.ba-input');
      input?.focus({ preventScroll: true });
    } else {
      if (row._trapHandler) {
        document.removeEventListener('keydown', row._trapHandler);
        delete row._trapHandler;
      }
    }
  }

  // =============================
  // 編集状態リセット（1個だけ）
  // =============================
  function resetEditState() {
    document.querySelectorAll('input.ba-input').forEach(inp => {
      inp.readOnly = true;
      inp.classList.add('is-readonly');
      inp.removeAttribute('aria-invalid');
    });

    document.querySelectorAll('.ba-edit-btn').forEach(btn => {
      btn.textContent = '名前編集';
      btn.classList.remove('text-gray', 'ba-edit-btn--danger');
    });

    document.getElementById('point-button')?.classList.remove('text-gray');
    document.getElementById('main-button')?.classList.remove('text-gray');

    window._unlockPage?.();
  }


  // =============================
  // 名前編集/保存（click委譲1本）
  // =============================
  const _renameInFlight = new Set();
  function onEditButtonDocClick(e) {
    const btn = e.target.closest('.ba-edit-btn');
    if (!btn) return;
    if (sessionStorage.getItem('mapFlag') !== '2') return;

    e.preventDefault();

    const row = btn.closest('.toggle-row');
    const input = row?.querySelector('.ba-input');
    if (!row || !input) return;

    // ここで「編集状態」を決める（classで判定する方が堅い）
    const isEditing = !input.readOnly;

    // -------- 編集開始 --------
    if (!isEditing) {
      input.readOnly = false;
      input.classList.remove('is-readonly');
      btn.textContent = '保存';

      document.querySelectorAll('.ba-edit-btn').forEach(el => el.classList.add('text-gray'));
      btn.classList.remove('text-gray');
      btn.classList.add('ba-edit-btn--danger');
      document.getElementById('point-button')?.classList.add('text-gray');
      document.getElementById('main-button')?.classList.add('text-gray');

      input.focus();
      const v = input.value; input.value = ''; input.value = v;

      window._lockPageForEditing?.(row);
      return;
    }

    // -------- 保存 --------
    const pointId = Number(input.dataset.pointid);
    const kind = String(input.dataset.kind || 'ba');
    const name = input.value.trim();

    if (!pointId) { alert('IDが取得できませんでした'); return; }
    if (!name) { alert('名前を入力してください'); return; }

    // 多重送信防止
    const inflightKey = `${kind}:${pointId}`;
    if (_renameInFlight.has(inflightKey)) return;
    _renameInFlight.add(inflightKey);

    // 先にUIを固定（保存中に戻されないように）
    btn.disabled = true;

    (async () => {
      try {
        const gateName = kind === 'car' ? 'carRename' : 'baRename';
        const res = await fetch(`${API_BASE}/api/${gateName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ id: pointId, name }),
        });

        // 404の時にHTMLが返ると res.json() で落ちるので保険
        let j = null;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) j = await res.json();
        else j = { error: await res.text() };

        if (!res.ok) {
          throw new Error(j?.error || `保存エラー（HTTP ${res.status}）`);
        }

        // 成功：UIを戻す
        input.readOnly = true;
        input.classList.add('is-readonly');
        btn.textContent = '名前編集';

        document.querySelectorAll('.ba-edit-btn').forEach(el => el.classList.remove('text-gray'));
        btn.classList.remove('ba-edit-btn--danger');
        document.getElementById('point-button')?.classList.remove('text-gray');
        document.getElementById('main-button')?.classList.remove('text-gray');

        // popup更新
        const marker = window._markersByDataId?.get(pointId);
        if (marker?.getPopup?.()) {
          const popup = marker.getPopup();
          const oldHtml = String(popup.getContent() ?? '');
          popup.setContent(oldHtml.replace(/<b>.*?<\/b>/, `<b>${name}</b>`));
          if (marker.isPopupOpen?.()) marker.openPopup();
        }

        window._unlockPage?.();
      } catch (err) {
        console.error(err);
        alert(err?.message || '通信エラーが発生しました');

        // 失敗：編集状態に戻す
        input.readOnly = false;
        input.classList.remove('is-readonly');
        btn.textContent = '保存';
      } finally {
        btn.disabled = false;
        _renameInFlight.delete(inflightKey);
      }
    })();
  }


  // =============================
  // mapFlag=2 readonly input click -> flyTo（click委譲1本）
  // =============================
  function onReadonlyInputFlyToClick(e) {
    if (sessionStorage.getItem('mapFlag') !== '2') return;

    const inp = e.target.closest('input.ba-input.is-readonly');
    if (!inp) return;

    const pointId = Number(inp.dataset.pointid);
    if (!pointId) return;

    const marker = window._markersByDataId?.get(pointId);
    if (!marker) return;

    const map = window._map; // ★あなたの map 生成後に window._map = map; を必ず入れてください
    if (!map?.flyTo) return;

    const latlng = marker.getLatLng();
    const targetZoom = Math.max(map.getZoom?.() ?? 17, 17);
    map.flyTo(latlng, targetZoom, { animate: true, duration: 0.8 });

    marker.openPopup?.();
    document.querySelectorAll('.ba-back').forEach(el => el.classList.remove('active'));
    inp.closest('.ba-back')?.classList.add('active');
  }


  // =============================
  // popup内 削除ボタン（click委譲1本）
  // =============================
  function onDeleteMarkerClick(e) {
    const delBtn = e.target.closest('.js-del-marker');
    if (!delBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const mid = delBtn.dataset.mid;
    const targetMarker = window._markersById?.get?.(mid) || null;
    const popupEl = delBtn.closest('.leaflet-popup');

    // あなたの showDeleteConfirmForMarker を呼ぶ（既存のを残す）
    window.showDeleteConfirmForMarker?.(mid, targetMarker, popupEl);
  }

  // =============================
  // toggle change 統合（使う場合）
  // =============================
  function onToggleChangeUnified(e) {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.type !== 'checkbox') return;

    if (el.id === 'distance-gpsToggle') {
      updateDistanceToggleState(el.checked);
      return;
    }
    if (el.id === 'location-gpsToggle') {
      updateLocationToggleState(el.checked);
      return;
    }
    
    const flagNow = sessionStorage.getItem('mapFlag');
    // bulkInit中は flyTo しない（全ON初期化で暴れない）
    const allowFly = (flagNow === '1' || flagNow === '3') && !bulkInit;

    let key = null;

    if (el.id.startsWith('user-gpsToggle')) {
      const idx = Number(el.id.replace('user-gpsToggle','')) - 1;
      const uid = useridList[idx];
      if (uid != null) key = `user:${uid}`;
    } else if (el.id.startsWith('device-gpsToggle')) {
      const idx = Number(el.id.replace('device-gpsToggle','')) - 1;
      const model = deviceNumber[idx];
      if (model) key = `device:${model}`;
    } else if (el.id.startsWith('ba-gpsToggle')) {
      const idx = Number(el.id.replace('ba-gpsToggle','')) - 1;
      const pid = baidList[idx];
      if (pid != null) key = `ba:${pid}`;
    } else if (el.id.startsWith('car-gpsToggle')) {
      const idx = Number(el.id.replace('car-gpsToggle','')) - 1;
      const pid = caridList[idx];
      if (pid != null) key = `car:${pid}`;
    } else {
      return;
    }

    setVisibilityForKey(key, el.checked);

    // ★ここが「ONになったら中心へ」の本体
    if (allowFly && el.checked && flagNow === '1') {
      const mset = markersByKey.get(key);
      const marker = mset && [...mset][0];
      if (marker) {
        const targetZoom = Math.max(map.getZoom(), 17);
        map.flyTo(marker.getLatLng(), targetZoom, { animate: true, duration: 0.6 });
      }
    }
    if (allowFly && el.checked && flagNow === '3') {
      // ★軌跡モードは「最新マーカー」を優先
      let marker = null;
    
      if (flagNow === '3') {
        marker = window._latestMarkerByKey?.get(key) || null;
      }
      if (!marker) {
        const mset = markersByKey.get(key);
        marker = mset && [...mset][0];
      }
    
      if (marker) {
        const targetZoom = Math.max(map.getZoom(), 17);
        map.flyTo(marker.getLatLng(), targetZoom, { animate: true, duration: 0.6 });
        marker.openPopup?.(); // 任意：ON時にpopupも開く
      }
    }
  }
  //「画面更新/遷移/戻る」で継続監視停止
  function attachStopOnLeaveOnce() {
    if (window._stopOnLeaveAttached) return;
    window._stopOnLeaveAttached = true;

    // ページ離脱（遷移・更新・タブ閉じる）
    window.addEventListener('pagehide', () => window.stopHunterMap('pagehide'), { capture: true });

    // iOS/一部ブラウザで pagehide が弱い時
    window.addEventListener('beforeunload', () => window.stopHunterMap('beforeunload'), { capture: true });

    // SPAやhistory操作、URLが変わる系の保険
    window.addEventListener('popstate', () => window.stopHunterMap('popstate'), { capture: true });

    // タブ非表示時
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.stopHunterMap('hidden');
    }, { capture: true });
  }
  attachStopOnLeaveOnce();
  if (!window._myLocSaveLoopId) {
    window._myLocSaveLoopId = setInterval(() => {
      // mapFlag=1の時だけ内部で保存される
      saveLatestToServerIfNeeded(0).catch(console.error);
    }, 5000);
  }
};
