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

function visual(place) {
  if (place.image) {
    return `<img src="${place.image}" alt="${place.name}">`;
  }

  return `<span>${place.name}<br>image slot</span>`;
}

function placeCard(place) {
  const tags = (place.tags || [])
    .map((tag) => `<li>${tag}</li>`)
    .join("");

  const buttons = routeModes
    .map(([mode, label]) => `<a href="${mapUrl(place, mode)}" target="_blank" rel="noopener">${label}</a>`)
    .join("");

  return `
    <article class="place-card" id="${place.id}">
      <div class="place-visual">${visual(place)}</div>
      <h3>${place.name}</h3>
      <p class="place-role">${place.role}</p>
      <p class="place-state">向いている状態：${place.state}</p>
      <p class="place-meta">おすすめ：${place.bestTime}</p>
      <p class="place-meta">距離感：${place.distanceFeel}</p>
      <p class="place-caution">注意：${place.caution}</p>
      <ul class="place-tags">${tags}</ul>
      <nav class="route-buttons" aria-label="${place.name}へのルート">
        ${buttons}
      </nav>
    </article>
  `;
}

if (grid) {
  grid.innerHTML = places.map(placeCard).join("");
}
