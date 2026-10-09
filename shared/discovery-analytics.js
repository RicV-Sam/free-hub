(function discoveryAnalytics(global) {
  "use strict";

  function sendEvent(name, payload) {
    if (typeof global.gtag === "function") {
      // GTM configures the primary stream outside gtag's default group.
      // Preserve Journey delivery while also reaching the Analytics Hub stream.
      global.gtag("event", name, { ...payload, send_to: ["G-23P37R20FY", "G-P13C4QZYRG"] });
      return;
    }
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({ event: name, ...payload });
  }

  function handleClick(event) {
    const link = event.target.closest("[data-discovery-action]");
    if (!link) {
      return;
    }

    const common = {
      entity_kind: link.dataset.entityKind,
      content_type: link.dataset.contentType,
      page_type: link.dataset.pageType,
    };

    if (link.dataset.discoveryAction === "card") {
      sendEvent("discovery_card_click", {
        ...common,
        ...(link.dataset.contentId ? { content_id: link.dataset.contentId } : {}),
        destination_path: link.dataset.destinationPath,
      });
      return;
    }

    if (link.dataset.discoveryAction === "official-source") {
      sendEvent("official_source_click", {
        ...common,
        content_id: link.dataset.contentId,
        source_domain: link.dataset.sourceDomain,
        ...(link.dataset.destinationPath ? { destination_path: link.dataset.destinationPath } : {}),
        ...(link.dataset.linkRole ? { link_role: link.dataset.linkRole } : {}),
      });
    }
  }

  if (global.document) {
    global.document.addEventListener("click", handleClick);
  }
})(typeof window !== "undefined" ? window : globalThis);
