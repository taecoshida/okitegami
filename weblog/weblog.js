const postsContainer = document.querySelector("#weblog-posts");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderWeblogPosts() {
  if (!Array.isArray(weblogPosts) || weblogPosts.length === 0) {
    postsContainer.innerHTML = '<p class="empty">まだweblogがありません。</p>';
    return;
  }

  postsContainer.innerHTML = weblogPosts.map((post) => {
    const date = escapeHtml(post.date || "");
    const title = escapeHtml(post.title || "untitled");
    const description = escapeHtml(post.description || "");
    const href = escapeHtml(post.href || "#");
    const image = post.image ? `<a href="${href}"><img src="${escapeHtml(post.image)}" alt="${title}"></a>` : "";
    const tags = Array.isArray(post.tags) && post.tags.length
      ? `<div class="tags">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
      : "";

    return `
      <article class="entry ${image ? "" : "no-image"}">
        <p class="date">${date}</p>
        ${image}
        <h2><a href="${href}">${title}</a></h2>
        <p class="body-text">${description}</p>
        ${tags}
      </article>
    `;
  }).join("");
}

renderWeblogPosts();
