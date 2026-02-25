function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

(async () => {
  const box = document.getElementById("news-list");
  try {
    const res = await fetch("/data/news.json", { cache: "no-store" });
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      box.textContent = "Nessuna pillola pubblicata per ora.";
      return;
    }

    box.innerHTML = items.slice(0, 12).map(n => {
      const date = escapeHtml(n.date ?? "");
      const title = escapeHtml(n.title ?? "");
      const body = escapeHtml(n.body ?? "");
      const tags = Array.isArray(n.tags) ? n.tags.map(escapeHtml) : [];

      return `
        <article style="padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,.08);">
          <div style="opacity:.7; font-size:.92em;">
            ${date}${tags.length ? " · " + tags.join(", ") : ""}
          </div>
          <h2 style="margin: 10px 0 10px; font-size: 1.35em;">${title}</h2>
          <div style="white-space: pre-wrap; line-height: 1.75; opacity:.92;">${body}</div>
        </article>
      `;
    }).join("");
  } catch (e) {
    box.textContent = "Errore nel caricamento delle pillole.";
  }
})();
