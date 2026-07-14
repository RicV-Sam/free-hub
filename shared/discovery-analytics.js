(function discoveryAnalytics(global) {
  "use strict";

  function sendEvent(name, payload) {
    if (typeof global.gtag === "function") {
      global.gtag("event", name, payload);
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
      page_type: "free_stuff_parent",
    };

    if (link.dataset.discoveryAction === "card") {
      sendEvent("discovery_card_click", {
        ...common,
        destination_path: link.dataset.destinationPath,
      });
      return;
    }

    if (link.dataset.discoveryAction === "official-source") {
      sendEvent("official_source_click", {
        ...common,
        content_id: link.dataset.contentId,
        source_domain: link.dataset.sourceDomain,
      });
    }
  }

  if (global.document) {
    global.document.addEventListener("click", handleClick);
  }
})(typeof window !== "undefined" ? window : globalThis);
