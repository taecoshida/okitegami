const grid = document.querySelector("#place-grid");

const routeModes = [
  ["walking", "徒歩"],
  ["bicycling", "チャリ"],
  ["transit", "電車/バス"]
];

function mapUrl(place, mode) {
  const destination = encodeURIComponent(place.query || place.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

if (grid && window.places) {
  grid.innerHTML = window.places.map(placeCard).join("");
}
