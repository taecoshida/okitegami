const entriesContainer = document.querySelector("#entries");
const entryCount = document.querySelector("#entry-count");
const toggleOrderButton = document.querySelector("#toggle-order");

// entries.js は「新しいものを先頭に足す」運用にする。
// そのため、表示順は日付ソートではなく、配列の順番をそのまま使う。
let newestFirst = true;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDisplayEntries(items) {
  return newestFirst ? [...items] : [...items].reverse();
}

function renderEntries() {
  if (!Array.isArray(entries) || entries.length === 0) {
    entriesContainer.innerHTML = '<p class="empty">まだ置き手紙がありません。</p>';
    entryCount.textContent = "0 entries";
    return;
  }

  const displayEntries = getDisplayEntries(entries);

  entriesContainer.innerHTML = displayEntries.map((entry) => {
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
  }).join("");

  entryCount.textContent = `${entries.length} entries`;
  toggleOrderButton.textContent = newestFirst ? "古い順にする" : "新しい順にする";
}

toggleOrderButton.addEventListener("click", () => {
  newestFirst = !newestFirst;
  renderEntries();
});

renderEntries();
