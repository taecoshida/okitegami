const config = window.OKITEGAMI_CONFIG || null;
const statusList = document.getElementById("status-list");
const configView = document.getElementById("config-view");
const checkList = document.getElementById("check-list");
const links = document.getElementById("dashboard-links");

function setStatus(items) {
  statusList.innerHTML = items
    .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`)
    .join("");
}

function setChecks(items) {
  checkList.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function addLink(label, href) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = label;
  links.appendChild(anchor);
}

function renderConfig() {
  if (!config) {
    configView.textContent = "config not found";
    setStatus([["config", "missing"]]);
    setChecks(["config.js が読み込めませんでした。"]);
    return;
  }

  configView.textContent = JSON.stringify(config, null, 2);

  setStatus([
    ["site", config.siteTitle || "unknown"],
    ["mode", config.mode || "unknown"],
    ["weather", config.weather && config.weather.enabled ? "ON" : "OFF"],
    ["entries", config.entriesSource || "not set"],
    ["dashboard", config.dashboardPath || "dashboard/"]
  ]);

  const checks = [
    "config.js loaded",
    config.weather && config.weather.enabled ? "weather is ON" : "weather is OFF",
    config.entriesSource ? `entries source: ${config.entriesSource}` : "entries source not set"
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

renderConfig();
