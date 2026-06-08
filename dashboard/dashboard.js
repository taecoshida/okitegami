const config = window.OKITEGAMI_CONFIG || null;
const statusList = document.getElementById("status-list");
const configView = document.getElementById("config-view");
const checkList = document.getElementById("check-list");
const links = document.getElementById("dashboard-links");
const appsContainer = document.getElementById("connection-apps");
const placeGrid = document.getElementById("place-grid");
const connectionDeckGroup = document.getElementById("connection-deck-group");
const placesDeckGroup = document.getElementById("places-deck-group");
const deckOrderToggle = document.getElementById("deck-order-toggle");

const APP_STATUS_STORAGE_KEY = "okitegami-dashboard-connect-status";
const DECK_ORDER_STORAGE_KEY = "okitegami-dashboard-deck-order";
const DECK_ORDER_TOGGLE_LABEL = "deck の重心を切り替える";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(items) {
  if (!statusList) return;
  statusList.innerHTML = items
    .map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
}

function setChecks(items) {
  if (!checkList) return;
  checkList.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function addLink(label, href) {
  if (!links) return;
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = label;
  links.appendChild(anchor);
}

function localStorageAvailable() {
  try {
    const key = "okitegami-dashboard-test";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

function getDeckOrder() {
  try {
    return localStorage.getItem(DECK_ORDER_STORAGE_KEY) || "connection-first";
  } catch (error) {
    return "connection-first";
  }
}

function saveDeckOrder(order) {
  try {
    localStorage.setItem(DECK_ORDER_STORAGE_KEY, order);
  } catch (error) {
    console.warn("dashboard deck order could not be saved", error);
  }
}

function applyDeckOrder(order) {
  if (!connectionDeckGroup || !placesDeckGroup || !deckOrderToggle) return;

  const placeFirst = order === "place-first";

  if (placeFirst) {
    connectionDeckGroup.parentNode.insertBefore(placesDeckGroup, connectionDeckGroup);
  } else {
    placesDeckGroup.parentNode.insertBefore(connectionDeckGroup, placesDeckGroup);
  }

  deckOrderToggle.textContent = DECK_ORDER_TOGGLE_LABEL;
  deckOrderToggle.setAttribute("aria-pressed", String(placeFirst));
}

function initializeDeckOrderToggle() {
  if (!deckOrderToggle) return;

  applyDeckOrder(getDeckOrder());

  deckOrderToggle.addEventListener("click", () => {
    const nextOrder = getDeckOrder() === "place-first" ? "connection-first" : "place-first";
    saveDeckOrder(nextOrder);
    applyDeckOrder(nextOrder);
  });
}

function renderConfig() {
  if (!config) {
    if (configView) configView.textContent = "config not found";
    setStatus([["config", "missing"]]);
    setChecks(["config.js が読み込めませんでした。"]); 
    return;
  }

  if (configView) configView.textContent = JSON.stringify(config, null, 2);

  const apps = window.OKITEGAMI_CONNECTION_APPS || [];
  const places = window.OKITEGAMI_PLACES || [];
  const deckCount = apps.length + places.length;
  const deckOrder = getDeckOrder() === "place-first" ? "place first" : "connection first";

  setStatus([
    ["site", config.siteTitle || "unknown"],
    ["mode", config.mode || "unknown"],
    ["weather", config.weather && config.weather.enabled ? "ON" : "OFF"],
    ["entries", config.entriesSource || "not set"],
    ["deck", `${deckCount} cards`],
    ["deck order", deckOrder],
    ["places", `${places.length} cards`]
  ]);

  const checks = [
    "config.js loaded",
    config.weather && config.weather.enabled ? "weather is ON" : "weather is OFF",
    config.entriesSource ? `entries source: ${config.entriesSource}` : "entries source not set",
    localStorageAvailable() ? "localStorage available" : "localStorage unavailable",
    `deck order: ${deckOrder}`,
    `connection cards: ${apps.length}`,
    `place cards: ${places.length}`
  ];

  if (Array.isArray(config.shelves)) {
    checks.push(`shelves: ${config.shelves.length}`);
    config.shelves.forEach((shelf) => {
      if (shelf.path && shelf.label) {
        addLink(shelf.label, `../${shelf.path}`);
      }
    });
  }

  setChecks(checks);
}

function loadStatusMap() {
  try {
    return JSON.parse(localStorage.getItem(APP_STATUS_STORAGE_KEY)) || {};
  } catch (error) {
    console.warn("dashboard connection status could not be loaded", error);
    return {};
  }
}

function saveStatusMap(statusMap) {
  localStorage.setItem(APP_STATUS_STORAGE_KEY, JSON.stringify(statusMap));
}

function getAppStatus(app, statusMap) {
  return statusMap[app.id] || app.defaultStatus || "off";
}

function setAppStatus(appId, status) {
  const statusMap = loadStatusMap();
  statusMap[appId] = status;
  saveStatusMap(statusMap);
  renderConnectionApps();
}

function renderConnectionApp(app, status) {
  const statusLabel = status === "on" ? "ON" : "OFF";
  const nextStatus = status === "on" ? "off" : "on";
  const link = app.href
    ? `<a class="app-link" href="${escapeHtml(app.href)}">開く</a>`
    : `<span class="app-link is-disabled">入口なし</span>`;

  return `
    <article class="connection-card is-${escapeHtml(status)}" data-app-id="${escapeHtml(app.id)}">
      <div class="connection-card-head">
        <p class="app-kind">${escapeHtml(app.kind)}</p>
        <button class="status-switch" type="button" data-app-id="${escapeHtml(app.id)}" data-next-status="${escapeHtml(nextStatus)}" aria-label="${escapeHtml(app.name)}を${nextStatus === "on" ? "ON" : "OFF"}にする">
          ${statusLabel}
        </button>
      </div>
      <h3>${escapeHtml(app.name)}</h3>
      <p class="app-description">${escapeHtml(app.description)}</p>
      <dl class="app-meta">
        <div><dt>接続圧</dt><dd>${escapeHtml(app.pressure)}</dd></div>
        <div><dt>モード</dt><dd>${escapeHtml(app.mode)}</dd></div>
      </dl>
      <p class="app-rule">${escapeHtml(app.rule)}</p>
      <div class="app-actions">${link}</div>
    </article>
  `;
}

function renderConnectionApps() {
  if (!appsContainer) return;
  const apps = window.OKITEGAMI_CONNECTION_APPS || [];

  if (!apps.length) {
    appsContainer.innerHTML = '<p class="empty">接続カードはまだありません。</p>';
    return;
  }

  const statusMap = loadStatusMap();
  appsContainer.innerHTML = apps
    .map((app) => renderConnectionApp(app, getAppStatus(app, statusMap)))
    .join("");
}

appsContainer?.addEventListener("click", (event) => {
  const button = event.target.closest(".status-switch");
  if (!button) return;
  setAppStatus(button.dataset.appId, button.dataset.nextStatus);
});

const routeModes = [
  ["walking", "徒歩"],
  ["bicycling", "チャリ"],
  ["transit", "電車/バス"]
];

function mapUrl(place, mode) {
  const destination = encodeURIComponent(place.query || place.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`;
}

function visual(place) {
  if (place.image) {
    return `<img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}">`;
  }

  return `<span>${escapeHtml(place.name)}<br>image slot</span>`;
}

function placeCard(place) {
  const tags = (place.tags || [])
    .map((tag) => `<li>${escapeHtml(tag)}</li>`)
    .join("");

  const buttons = routeModes
    .map(([mode, label]) => `<a href="${mapUrl(place, mode)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`)
    .join("");

  return `
    <article class="place-card" id="${escapeHtml(place.id)}">
      <div class="place-visual">${visual(place)}</div>
      <h3>${escapeHtml(place.name)}</h3>
      <p class="place-role">${escapeHtml(place.role)}</p>
      <p class="place-state">向いている状態：${escapeHtml(place.state)}</p>
      <p class="place-meta">おすすめ：${escapeHtml(place.bestTime)}</p>
      <p class="place-meta">距離感：${escapeHtml(place.distanceFeel)}</p>
      <p class="place-caution">注意：${escapeHtml(place.caution)}</p>
      <ul class="place-tags">${tags}</ul>
      <nav class="route-buttons" aria-label="${escapeHtml(place.name)}へのルート">
        ${buttons}
      </nav>
    </article>
  `;
}

function renderPlaceDeck() {
  if (!placeGrid) return;
  const places = window.OKITEGAMI_PLACES || [];

  if (!places.length) {
    placeGrid.innerHTML = '<p class="empty">場所カードはまだありません。</p>';
    return;
  }

  placeGrid.innerHTML = places.map(placeCard).join("");
}

initializeDeckOrderToggle();
renderConfig();
renderConnectionApps();
renderPlaceDeck();
