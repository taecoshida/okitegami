const entriesContainer = document.querySelector("#entries");
const entryCount = document.querySelector("#entry-count");
const toggleOrderButton = document.querySelector("#toggle-order");

let newestFirst = true;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortEntries(items) {
  return [...items].sort((a, b) => {
    const result = new Date(b.date) - new Date(a.date);
    return newestFirst ? result : -result;
  });
}

function renderEntries() {
  if (!Array.isArray(entries) || entries.length === 0) {
    entriesContainer.innerHTML = '<p class="empty">まだ置き手紙がありません。</p>';
    entryCount.textContent = "0 entries";
    return;
  }

  const sortedEntries = sortEntries(entries);

  entriesContainer.innerHTML = sortedEntries.map((entry) => {
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
