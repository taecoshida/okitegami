const recipesContainer = document.querySelector("#recipe-posts");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRecipes() {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    recipesContainer.innerHTML = '<p class="empty">まだrecipeがありません。</p>';
    return;
  }

  recipesContainer.innerHTML = recipes.map((recipe) => {
    const date = escapeHtml(recipe.date || "");
    const title = escapeHtml(recipe.title || "untitled");
    const description = escapeHtml(recipe.description || "");
    const href = escapeHtml(recipe.href || "#");
    const image = recipe.image ? `<a href="${href}"><img src="${escapeHtml(recipe.image)}" alt="${title}"></a>` : "";
    const tags = Array.isArray(recipe.tags) && recipe.tags.length
      ? `<div class="tags">${recipe.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
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

renderRecipes();
