const sequencesContainer = document.querySelector("#sequence-posts");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSequences() {
  if (!Array.isArray(sequences) || sequences.length === 0) {
    sequencesContainer.innerHTML = '<p class="empty">まだsequenceがありません。</p>';
    return;
  }

  sequencesContainer.innerHTML = sequences.map(function(sequence) {
    const date = escapeHtml(sequence.date || "");
    const title = escapeHtml(sequence.title || "untitled");
    const description = escapeHtml(sequence.description || "");
    const href = escapeHtml(sequence.href || "#");
    const poster = sequence.poster ? escapeHtml(sequence.poster) : "";
    const video = sequence.video ? escapeHtml(sequence.video) : "";
    let media = "";

    if (video) {
      media = '<a href="' + href + '"><video muted loop playsinline preload="metadata"' + (poster ? ' poster="' + poster + '"' : '') + '><source src="' + video + '" type="video/mp4"></video></a>';
    } else if (poster) {
      media = '<a href="' + href + '"><img src="' + poster + '" alt="' + title + '"></a>';
    }

    const tags = Array.isArray(sequence.tags) && sequence.tags.length
      ? '<div class="tags">' + sequence.tags.map(function(tag) { return '<span class="tag">' + escapeHtml(tag) + '</span>'; }).join("") + '</div>'
      : "";

    return '<article class="entry ' + (media ? "" : "no-image") + '">' +
      '<p class="date">' + date + '</p>' +
      media +
      '<h2><a href="' + href + '">' + title + '</a></h2>' +
      '<p class="body-text">' + description + '</p>' +
      tags +
      '</article>';
  }).join("");
}

renderSequences();
