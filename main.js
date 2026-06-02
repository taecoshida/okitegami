const entriesContainer = document.querySelector("#entries");
const entryCount = document.querySelector("#entry-count");
const prevEntryButton = document.querySelector("#prev-entry");
const nextEntryButton = document.querySelector("#next-entry");

// entries.js は「新しいものを先頭に足す」運用にする。
// トップページでは、常に1枚だけ表示して、ボタンで前後にめくる。
let currentIndex = 0;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEntry(entry) {
  const title = escapeHtml(entry.title || "untitled");
  const date = escapeHtml(entry.date || "");
  const text = escapeHtml(entry.text || "");
  const image = entry.image ? `<img src="${escapeHtml(entry.image)}" alt="${title}">` : "";
  const tags = Array.isArray(entry.tags) && entry.tags.length
    ? `<div class="tags">${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  return `
    <article class="entry ${image ? "" : "no-image"}">
      <p class="date">${date}</p>
      ${image}
      <h2>${title}</h2>
      <p class="body-text">${text}</p>
      ${tags}
    </article>
  `;
}

function normalizeIndex() {
  if (!Array.isArray(entries) || entries.length === 0) return;

  if (currentIndex < 0) {
    currentIndex = entries.length - 1;
  }

  if (currentIndex >= entries.length) {
    currentIndex = 0;
  }
}

function renderEntries() {
  if (!Array.isArray(entries) || entries.length === 0) {
    entriesContainer.innerHTML = '<p class="empty">まだ置き手紙がありません。</p>';
    entryCount.textContent = "0 entries";
    prevEntryButton.disabled = true;
    nextEntryButton.disabled = true;
    return;
  }

  normalizeIndex();

  entriesContainer.innerHTML = renderEntry(entries[currentIndex]);
  entryCount.textContent = `${currentIndex + 1} / ${entries.length}`;

  const hasMultipleEntries = entries.length > 1;
  prevEntryButton.disabled = !hasMultipleEntries;
  nextEntryButton.disabled = !hasMultipleEntries;
}

prevEntryButton.addEventListener("click", () => {
  currentIndex -= 1;
  renderEntries();
});

nextEntryButton.addEventListener("click", () => {
  currentIndex += 1;
  renderEntries();
});

renderEntries();
