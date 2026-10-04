(function () {
  "use strict";
  function refreshFreshness() {
    const shared = window.FreeHubShared;
    if (!shared) return;
    const today = shared.getSouthAfricanDate();
    const removedPaths = new Set();
    document.querySelectorAll("[data-valid-through]").forEach((node) => {
      if (node.dataset.validThrough < today) {
        node.querySelectorAll('a[href^="/"]').forEach((link) => removedPaths.add(link.getAttribute("href")));
        node.remove();
      }
    });
    document.querySelectorAll("[data-editorial-surface]").forEach((section) => {
      const fallback = section.querySelector("[data-editorial-fallback]");
      if (fallback) fallback.hidden = !!section.querySelector("[data-editorial-pick]");
    });
    document.querySelectorAll("[data-current-listing], article.competition-card[data-competition-closing-date]").forEach((node) => {
      const closing = node.dataset.closingDate || node.dataset.competitionClosingDate;
      if (closing && closing < today) node.remove();
    });
    document.querySelectorAll("[data-current-comparison]").forEach((table) => {
      const empty = !table.querySelector("[data-current-listing]");
      table.hidden = empty;
      const fallback = table.parentElement.querySelector("[data-comparison-empty]");
      if (fallback) fallback.hidden = !empty;
    });
    document.querySelectorAll("[data-urgency-date]").forEach((node) => { node.textContent = ` · ${shared.getUrgencyLabel(node.dataset.urgencyDate)}`; });
    const closing = document.body.dataset.detailClosingDate;
    if (closing && closing < today) {
      document.querySelectorAll("[data-active-entry]").forEach((link) => { link.hidden = true; });
      const closed = document.querySelector("[data-runtime-closed]");
      if (closed) closed.hidden = false;
      const notice = document.querySelector(".hero__closing");
      if (notice) notice.textContent = `Closed ${shared.formatDate(closing)}`;
      const title = document.querySelector("#pageTitle");
      if (title && !/closed/i.test(title.textContent)) title.textContent += " — Competition closed";
      document.querySelectorAll(".competition-detail__cta-note").forEach((node) => { node.hidden = true; });
    }
    if (removedPaths.size) document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        if (data["@type"] !== "ItemList" || !Array.isArray(data.itemListElement)) return;
        data.itemListElement = data.itemListElement.filter((item) => {
          const url = item.url || item.item?.url || item.item?.["@id"];
          return !url || !removedPaths.has(new URL(url, location.origin).pathname);
        }).map((item, index) => ({ ...item, position: index + 1 }));
        data.numberOfItems = data.itemListElement.length;
        script.textContent = JSON.stringify(data);
      } catch { /* Preserve unrelated structured data. */ }
    });
    document.dispatchEvent(new CustomEvent("freehub:freshness-refreshed"));
  }
  function init() {
    const header = document.querySelector(".site-topbar");
    const button = header && header.querySelector(".site-topbar__menu");
    if (button) {
      button.hidden = false;
      header.dataset.menuReady = "true";
      const close = () => { button.setAttribute("aria-expanded", "false"); header.classList.remove("is-menu-open"); };
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        header.classList.toggle("is-menu-open", open);
      });
      header.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") { close(); button.focus(); }
      });
      window.matchMedia("(max-width: 900px)").addEventListener("change", close);
    }
    refreshFreshness();
    window.addEventListener("pageshow", refreshFreshness);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshFreshness(); });
    window.setInterval(refreshFreshness, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
