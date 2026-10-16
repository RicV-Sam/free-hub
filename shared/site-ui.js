(function () {
  "use strict";
  function initAirtimeDashPromotionTracking() {
    if (window.FreeHubAirtimeDashPromotionTrackingReady) return;
    window.FreeHubAirtimeDashPromotionTrackingReady = true;
    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.("a[data-airtime-dash-placement]");
      if (!link) return;
      let destination;
      try { destination = new URL(link.getAttribute("href"), window.location.href); }
      catch { return; }
      if (destination.origin !== window.location.origin || destination.pathname !== "/play/airtime-dash/") return;
      const payload = {
        placement: link.dataset.airtimeDashPlacement,
        destination_path: destination.pathname,
        source_path: window.location.pathname,
      };
      if (typeof window.gtag === "function") {
        // Match discovery analytics delivery to the primary and Journey streams.
        window.gtag("event", "airtime_dash_promo_click", { ...payload, send_to: ["G-23P37R20FY", "G-P13C4QZYRG"] });
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "airtime_dash_promo_click", ...payload });
      }
    });
  }
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
      const heading = section.querySelector("[data-editorial-heading]");
      if (heading && fallback && !fallback.hidden) heading.textContent = "Keep exploring Freehub";
    });
    document.querySelectorAll("[data-current-listing], article.competition-card[data-competition-closing-date]").forEach((node) => {
      const closing = node.dataset.competitionActiveUntil || node.dataset.closingDate || node.dataset.competitionClosingDate;
      if (closing && closing < today) {
        node.querySelectorAll('a[href^="/"]').forEach((link) => removedPaths.add(link.getAttribute("href")));
        node.remove();
      }
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
      const editorialCutoff = document.body.dataset.detailEditorialCutoff === "true";
      if (notice) notice.textContent = editorialCutoff ? "FreeHub promotion has ended" : `Closed ${shared.formatDate(closing)}`;
      const title = document.querySelector("#pageTitle");
      if (title && !/closed|promotion ended/i.test(title.textContent)) title.textContent += editorialCutoff ? " — FreeHub promotion ended" : " — Competition closed";
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
    initAirtimeDashPromotionTracking();
    refreshFreshness();
    window.addEventListener("pageshow", refreshFreshness);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshFreshness(); });
    window.setInterval(refreshFreshness, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
