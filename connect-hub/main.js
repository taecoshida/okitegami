const appsContainer = document.querySelector("#connection-apps");
const carryLineInput = document.querySelector("#carry-line-input");
const saveCarryLineButton = document.querySelector("#save-carry-line");
const clearCarryLineButton = document.querySelector("#clear-carry-line");
const carryLineStatus = document.querySelector("#carry-line-status");

const APP_STATUS_STORAGE_KEY = "okitegami-connect-hub-status";
const CARRY_LINE_STORAGE_KEY = "okitegami-connect-hub-carry-line";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadStatusMap() {
  try {
    return JSON.parse(localStorage.getItem(APP_STATUS_STORAGE_KEY)) || {};
  } catch (error) {
    console.warn("connect hub status could not be loaded", error);
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
  renderApps();
}

function renderApp(app, status) {
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
        <div>
          <dt>接続圧</dt>
          <dd>${escapeHtml(app.pressure)}</dd>
        </div>
        <div>
          <dt>モード</dt>
          <dd>${escapeHtml(app.mode)}</dd>
        </div>
      </dl>

      <p class="app-rule">${escapeHtml(app.rule)}</p>
      <div class="app-actions">${link}</div>
    </article>
  `;
}

function renderApps() {
  if (!appsContainer) return;

  if (!Array.isArray(connectionApps) || connectionApps.length === 0) {
    appsContainer.innerHTML = '<p class="empty">接続アプリはまだありません。</p>';
    return;
  }

  const statusMap = loadStatusMap();
  appsContainer.innerHTML = connectionApps
    .map((app) => renderApp(app, getAppStatus(app, statusMap)))
    .join("");
}

function loadCarryLine() {
  if (!carryLineInput) return;
  carryLineInput.value = localStorage.getItem(CARRY_LINE_STORAGE_KEY) || "";
}

function setCarryStatus(message) {
  if (!carryLineStatus) return;
  carryLineStatus.textContent = message;
}

appsContainer?.addEventListener("click", (event) => {
  const button = event.target.closest(".status-switch");
  if (!button) return;

  setAppStatus(button.dataset.appId, button.dataset.nextStatus);
});

saveCarryLineButton?.addEventListener("click", () => {
  localStorage.setItem(CARRY_LINE_STORAGE_KEY, carryLineInput.value.trim());
  setCarryStatus("保存しました。ブラウザ内にだけ残ります。");
});

clearCarryLineButton?.addEventListener("click", () => {
  localStorage.removeItem(CARRY_LINE_STORAGE_KEY);
  carryLineInput.value = "";
  setCarryStatus("消しました。");
});

renderApps();
loadCarryLine();
