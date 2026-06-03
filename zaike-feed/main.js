const feedList = document.querySelector("#feed-list");
const feedSummary = document.querySelector("#feed-summary");
const filterButtons = document.querySelectorAll(".filter-button");

let items = [];
let activeFilter = "all";

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

function normalizeClass(value) {
  if (["読む", "保留", "読まない"].includes(value)) return value;
  return "保留";
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

function renderItem(item) {
  const label = normalizeClass(item.class);
  const title = escapeHtml(item.title || "untitled");
  const url = escapeHtml(item.url || item.link || "#");
  const source = escapeHtml(item.source || "unknown");
  const published = escapeHtml(formatDate(item.published || item.date));
  const memo = item.memo ? `<p class="feed-memo">${escapeHtml(item.memo)}</p>` : "";
  const summary = item.summary ? `<p class="feed-summary-text">${escapeHtml(item.summary)}</p>` : "";
  const tags = renderTags(item.tags);

  return `
    <article class="feed-card" data-class="${escapeHtml(label)}">
      <header>
        <p class="feed-meta">${escapeHtml(label)} / ${source} / ${published}</p>
        <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
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
    const response = await fetch("data/feed.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`feed.json could not be loaded: ${response.status}`);

    const data = await response.json();
    items = Array.isArray(data.items) ? data.items : [];
    renderItems();
  } catch (error) {
    feedSummary.textContent = "feedを読み込めませんでした。";
    feedList.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
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
