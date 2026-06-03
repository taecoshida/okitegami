const feedList = document.querySelector("#feed-list");
const feedSummary = document.querySelector("#feed-summary");
const filterButtons = document.querySelectorAll(".filter-button");

const FORECAST_DAYS = 3;
const WEATHER_CODES = {
  0: "快晴",
  1: "晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "霧氷",
  51: "弱い霧雨",
  53: "霧雨",
  55: "強い霧雨",
  56: "弱い着氷性霧雨",
  57: "強い着氷性霧雨",
  61: "弱い雨",
  63: "雨",
  65: "強い雨",
  66: "弱い着氷性雨",
  67: "強い着氷性雨",
  71: "弱い雪",
  73: "雪",
  75: "強い雪",
  77: "雪粒",
  80: "弱いにわか雨",
  81: "にわか雨",
  82: "強いにわか雨",
  85: "弱いにわか雪",
  86: "強いにわか雪",
  95: "雷雨",
  96: "雷雨と弱い雹",
  99: "雷雨と強い雹",
};

let items = [];
let activeFilter = "all";
let generatedAt = "";
let dataMode = "saved";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "日付不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "更新時刻不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeClass(value) {
  if (["読む", "保留", "読まない"].includes(value)) return value;
  return "保留";
}

function isRawApiUrl(value) {
  return String(value ?? "").includes("api.open-meteo.com");
}

function itemHash(source, title, url) {
  // Small deterministic hash for browser-side weather cards.
  const raw = `${source}|${title}|${url}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function weatherCodeLabel(code) {
  const numericCode = Number(code);
  if (Number.isNaN(numericCode)) return "天気不明";
  return WEATHER_CODES[numericCode] || `天気コード${code}`;
}

function weatherLabel(maxTemp, precipitationSum) {
  const temp = Number(maxTemp);
  const precipitation = Number(precipitationSum);

  if (!Number.isNaN(precipitation) && precipitation >= 5) return "保留";
  if (!Number.isNaN(temp) && temp >= 32) return "保留";
  return "読む";
}

function formatWeatherNumber(value, unit) {
  if (value === null || value === undefined || value === "") return "不明";
  const number = Number(value);
  if (Number.isNaN(number)) return `${value}${unit}`;
  return Number.isInteger(number) ? `${number}${unit}` : `${number.toFixed(1)}${unit}`;
}

function listValue(values, index, fallback = null) {
  if (!Array.isArray(values)) return fallback;
  if (index < 0 || index >= values.length) return fallback;
  return values[index];
}

function buildWeatherUrl(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
    ].join(","),
    timezone: location.timezone || "Asia/Tokyo",
    forecast_days: String(FORECAST_DAYS),
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function normalizeLocation(location) {
  return {
    name: location.name || "local weather",
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: location.timezone || "Asia/Tokyo",
  };
}

function weatherItemsFromApi(location, data, url) {
  const daily = data.daily || {};
  const dates = Array.isArray(daily.time) ? daily.time : [];

  return dates.slice(0, FORECAST_DAYS).map((date, index) => {
    const code = listValue(daily.weather_code, index);
    const maxTemp = listValue(daily.temperature_2m_max, index);
    const minTemp = listValue(daily.temperature_2m_min, index);
    const precipitation = listValue(daily.precipitation_sum, index);
    const probability = listValue(daily.precipitation_probability_max, index);
    const weatherText = weatherCodeLabel(code);
    const label = weatherLabel(maxTemp, precipitation);
    const title = `${location.name}: ${date} の天気 — ${weatherText}`;

    return {
      id: itemHash("weather", title, url),
      title,
      source: "weather",
      url,
      published: String(date),
      class: label,
      memo: "生活シーケンス用の外界条件。外出・洗濯・買い物・作業場所の判断に使う。",
      summary: [
        `最高${formatWeatherNumber(maxTemp, "℃")} / 最低${formatWeatherNumber(minTemp, "℃")}。`,
        `降水量${formatWeatherNumber(precipitation, "mm")}、降水確率最大${formatWeatherNumber(probability, "%")}。`,
      ].join(""),
      tags: ["weather", weatherText, label],
    };
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { cache: "reload", ...options });
  if (!response.ok) throw new Error(`${url} could not be loaded: ${response.status}`);
  return response.json();
}

async function loadWeatherConfig() {
  const cacheBuster = new Date().toISOString().slice(0, 16);
  const config = await fetchJson(`feeds.json?v=${encodeURIComponent(cacheBuster)}`);
  const locations = config.weather?.locations || [];
  const firstEnabledLocation = locations.find((location) => location.enabled !== false);

  if (!config.weather?.enabled || !firstEnabledLocation) {
    throw new Error("weather location is not enabled");
  }

  return normalizeLocation(firstEnabledLocation);
}

async function loadLiveWeather() {
  const location = await loadWeatherConfig();
  const url = buildWeatherUrl(location);
  const data = await fetchJson(url);
  const liveItems = weatherItemsFromApi(location, data, url);

  if (liveItems.length === 0) {
    throw new Error("weather forecast returned no daily items");
  }

  generatedAt = new Date().toISOString();
  dataMode = "live";
  items = liveItems;
}

async function loadSavedFeed() {
  const cacheBuster = new Date().toISOString().slice(0, 16);
  const data = await fetchJson(`data/feed.json?v=${encodeURIComponent(cacheBuster)}`);
  generatedAt = data.generated_at || "";
  dataMode = "saved";
  items = Array.isArray(data.items) ? data.items : [];
}

function renderSummary() {
  const counts = {
    all: items.length,
    読む: 0,
    保留: 0,
    読まない: 0,
  };

  items.forEach((item) => {
    const label = normalizeClass(item.class);
    counts[label] += 1;
  });

  feedSummary.innerHTML = `
    <span class="summary-pill">mode: ${escapeHtml(dataMode)}</span>
    <span class="summary-pill">updated: ${escapeHtml(formatDateTime(generatedAt))}</span>
    <span class="summary-pill">all: ${counts.all}</span>
    <span class="summary-pill">読む: ${counts["読む"]}</span>
    <span class="summary-pill">保留: ${counts["保留"]}</span>
    <span class="summary-pill">読まない: ${counts["読まない"]}</span>
  `;
}

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return `
    <div class="feed-tags">
      ${tags.map((tag) => `<span class="feed-tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderTitle(title, url) {
  if (!url || url === "#" || isRawApiUrl(url)) {
    return title;
  }

  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`;
}

function renderItem(item) {
  const label = normalizeClass(item.class);
  const title = escapeHtml(item.title || "untitled");
  const url = item.url || item.link || "#";
  const source = escapeHtml(item.source || "unknown");
  const published = escapeHtml(formatDate(item.published || item.date));
  const memo = item.memo ? `<p class="feed-memo">${escapeHtml(item.memo)}</p>` : "";
  const summary = item.summary ? `<p class="feed-summary-text">${escapeHtml(item.summary)}</p>` : "";
  const tags = renderTags(item.tags);

  return `
    <article class="feed-card" data-class="${escapeHtml(label)}">
      <header>
        <p class="feed-meta">${escapeHtml(label)} / ${source} / ${published}</p>
        <h3>${renderTitle(title, url)}</h3>
      </header>
      ${memo}
      ${summary}
      ${tags}
    </article>
  `;
}

function renderItems() {
  renderSummary();

  const visibleItems = activeFilter === "all"
    ? items
    : items.filter((item) => normalizeClass(item.class) === activeFilter);

  if (visibleItems.length === 0) {
    feedList.innerHTML = '<p class="empty">この棚にはまだ項目がありません。</p>';
    return;
  }

  feedList.innerHTML = visibleItems.map(renderItem).join("");
}

async function loadFeed() {
  try {
    await loadLiveWeather();
  } catch (liveError) {
    console.warn("live weather failed, falling back to saved feed", liveError);
    try {
      await loadSavedFeed();
    } catch (savedError) {
      feedSummary.textContent = "天気を読み込めませんでした。";
      feedList.innerHTML = `<p class="error">${escapeHtml(savedError.message)}</p>`;
      return;
    }
  }

  renderItems();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter || "all";
    renderItems();
  });
});

loadFeed();
