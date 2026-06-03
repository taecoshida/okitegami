const topWeather = document.querySelector("#top-weather");

const TOP_WEATHER_CODES = {
  0: { label: "快晴", icon: "☀️" },
  1: { label: "晴れ", icon: "☀️" },
  2: { label: "一部曇り", icon: "🌤️" },
  3: { label: "曇り", icon: "☁️" },
  45: { label: "霧", icon: "🌫️" },
  48: { label: "霧氷", icon: "🌫️" },
  51: { label: "弱い霧雨", icon: "🌦️" },
  53: { label: "霧雨", icon: "🌦️" },
  55: { label: "強い霧雨", icon: "🌧️" },
  56: { label: "弱い着氷性霧雨", icon: "🌧️" },
  57: { label: "強い着氷性霧雨", icon: "🌧️" },
  61: { label: "弱い雨", icon: "🌧️" },
  63: { label: "雨", icon: "🌧️" },
  65: { label: "強い雨", icon: "🌧️" },
  66: { label: "弱い着氷性雨", icon: "🌧️" },
  67: { label: "強い着氷性雨", icon: "🌧️" },
  71: { label: "弱い雪", icon: "🌨️" },
  73: { label: "雪", icon: "🌨️" },
  75: { label: "強い雪", icon: "🌨️" },
  77: { label: "雪粒", icon: "🌨️" },
  80: { label: "弱いにわか雨", icon: "🌦️" },
  81: { label: "にわか雨", icon: "🌦️" },
  82: { label: "強いにわか雨", icon: "🌧️" },
  85: { label: "弱いにわか雪", icon: "🌨️" },
  86: { label: "強いにわか雪", icon: "🌨️" },
  95: { label: "雷雨", icon: "⛈️" },
  96: { label: "雷雨と弱い雹", icon: "⛈️" },
  99: { label: "雷雨と強い雹", icon: "⛈️" },
};

function topWeatherEscapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function topWeatherNumber(value, unit) {
  if (value === null || value === undefined || value === "") return "不明";
  const number = Number(value);
  if (Number.isNaN(number)) return `${value}${unit}`;
  return Number.isInteger(number) ? `${number}${unit}` : `${number.toFixed(1)}${unit}`;
}

function topWeatherCode(code) {
  const numericCode = Number(code);
  if (Number.isNaN(numericCode)) return { label: "天気不明", icon: "○" };
  return TOP_WEATHER_CODES[numericCode] || { label: `天気コード${code}`, icon: "○" };
}

async function topWeatherFetchJson(url) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(`${url} could not be loaded: ${response.status}`);
  return response.json();
}

function topWeatherBuildUrl(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
    ].join(","),
    timezone: location.timezone || "Asia/Tokyo",
    forecast_days: "3",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function topWeatherRender(state) {
  if (!topWeather) return;

  const href = "zaike-feed/index.html";
  topWeather.classList.remove("is-loading", "is-error");

  if (state.status === "loading") {
    topWeather.classList.add("is-loading");
    topWeather.innerHTML = `
      <a class="top-weather-card" href="${href}" aria-label="天気を読み込み中">
        <span class="top-weather-icon" aria-hidden="true">○</span>
        <span class="top-weather-main">
          <span class="top-weather-title">天気を取得中</span>
          <span class="top-weather-detail">local weather</span>
        </span>
      </a>
    `;
    return;
  }

  if (state.status === "error") {
    topWeather.classList.add("is-error");
    topWeather.innerHTML = `
      <a class="top-weather-card" href="${href}" aria-label="天気を確認する">
        <span class="top-weather-icon" aria-hidden="true">○</span>
        <span class="top-weather-main">
          <span class="top-weather-title">天気未取得</span>
          <span class="top-weather-detail">詳細を見る</span>
        </span>
      </a>
    `;
    return;
  }

  topWeather.innerHTML = `
    <a class="top-weather-card" href="${href}" aria-label="${topWeatherEscapeHtml(state.label)}、最高${topWeatherEscapeHtml(state.maxTemp)}、最低${topWeatherEscapeHtml(state.minTemp)}">
      <span class="top-weather-icon" aria-hidden="true">${topWeatherEscapeHtml(state.icon)}</span>
      <span class="top-weather-main">
        <span class="top-weather-title">${topWeatherEscapeHtml(state.label)} / ${topWeatherEscapeHtml(state.maxTemp)}</span>
        <span class="top-weather-detail">最低${topWeatherEscapeHtml(state.minTemp)}・雨${topWeatherEscapeHtml(state.precipitation)}</span>
      </span>
    </a>
  `;
}

async function topWeatherLoad() {
  if (!topWeather) return;
  topWeatherRender({ status: "loading" });

  try {
    const cacheBuster = new Date().toISOString().slice(0, 16);
    const config = await topWeatherFetchJson(`zaike-feed/feeds.json?v=${encodeURIComponent(cacheBuster)}`);
    const locations = config.weather?.locations || [];
    const location = locations.find((item) => item.enabled !== false);
    if (!config.weather?.enabled || !location) throw new Error("weather location is not enabled");

    const data = await topWeatherFetchJson(topWeatherBuildUrl(location));
    const daily = data.daily || {};
    const code = Array.isArray(daily.weather_code) ? daily.weather_code[0] : null;
    const maxTemp = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null;
    const minTemp = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null;
    const precipitation = Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum[0] : null;
    const weather = topWeatherCode(code);

    topWeatherRender({
      status: "ok",
      icon: weather.icon,
      label: weather.label,
      maxTemp: topWeatherNumber(maxTemp, "℃"),
      minTemp: topWeatherNumber(minTemp, "℃"),
      precipitation: topWeatherNumber(precipitation, "mm"),
    });
  } catch (error) {
    console.warn("top weather failed", error);
    topWeatherRender({ status: "error" });
  }
}

topWeatherLoad();
