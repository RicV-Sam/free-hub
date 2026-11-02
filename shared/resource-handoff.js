(function resourceHandoff(global) {
  "use strict";
  const page = global.document?.querySelector("[data-resource-exit]");
  const destination = page?.querySelector("[data-resource-destination]");
  if (!destination) return;
  let timer = null;
  let cancelWait = null;
  let navigating = false;
  function send(name, extra = {}) {
    const payload = { entity_kind: "resource", content_id: page.dataset.resourceId,
      content_type: page.dataset.resourceContentType, source_domain: page.dataset.resourceSourceDomain,
      page_type: "resource_exit", destination_path: new URL(destination.href).pathname, ...extra };
    if (typeof global.gtag === "function") global.gtag("event", name, { ...payload, send_to: ["G-23P37R20FY", "G-P13C4QZYRG"], transport_type: "beacon" });
    else { global.dataLayer = global.dataLayer || []; global.dataLayer.push({ event: name, ...payload }); }
  }
  function recordNavigation(method) {
    if (navigating) return;
    navigating = true;
    if (timer !== null) global.clearTimeout(timer);
    if (cancelWait) cancelWait();
    send("resource_outbound_navigation", { navigation_method: method });
  }
  // A modified click opens another tab, so preserve this page's normal handoff.
  destination.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    recordNavigation("manual");
  });
  send("resource_handoff_view");
  function beginCountdown() {
    if (navigating) return;
    timer = global.setTimeout(() => {
      recordNavigation("automatic");
      global.location.replace(destination.href);
    }, 2000);
  }
  if (global.FreeHubOutboundHandoff) cancelWait = global.FreeHubOutboundHandoff.afterGuestAdDecision(beginCountdown);
  else beginCountdown();
})(typeof window !== "undefined" ? window : globalThis);
