(function opportunityAnalytics(global) {
  "use strict";

  function sendEvent(name, payload) {
    if (typeof global.gtag === "function") {
      global.gtag("event", name, payload);
      return;
    }
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({ event: name, ...payload });
  }

  function getContext(body) {
    return {
      entity_kind: "opportunity",
      content_id: body.dataset.opportunityId,
      content_type: body.dataset.opportunityType,
      lifecycle_state: body.dataset.opportunityLifecycle,
      page_type: body.dataset.opportunityPageType,
    };
  }

  function init() {
    const body = global.document && global.document.body;
    if (!body || !body.dataset.opportunityPageType) return;
    const context = getContext(body);

    if (body.dataset.opportunityPageType === "opportunity_detail") {
      sendEvent("opportunity_detail_view", context);
      global.document.addEventListener("click", (event) => {
        const link = event.target.closest('[data-opportunity-action="exit"]');
        if (!link) return;
        sendEvent("opportunity_exit_click", {
          ...context,
          destination_path: link.getAttribute("href") || "",
        });
      });
      return;
    }

    if (body.dataset.opportunityPageType !== "opportunity_exit") return;
    sendEvent("opportunity_exit_view", context);
    const manualLink = global.document.querySelector('[data-opportunity-action="handoff"]');
    const targetUrl = body.dataset.opportunityTargetUrl;
    let handoffRecorded = false;
    let redirectTimer;

    function recordHandoff(method) {
      if (handoffRecorded) return;
      handoffRecorded = true;
      sendEvent("opportunity_exit_handoff", {
        ...context,
        source_domain: body.dataset.opportunitySourceDomain,
        destination_path: body.dataset.opportunityDestinationPath,
        handoff_method: method,
        transport_type: "beacon",
      });
    }

    if (manualLink) {
      manualLink.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (redirectTimer) global.clearTimeout(redirectTimer);
        sendEvent("official_source_click", {
          entity_kind: "opportunity",
          content_id: context.content_id,
          content_type: context.content_type,
          page_type: context.page_type,
          source_domain: body.dataset.opportunitySourceDomain,
          destination_path: body.dataset.opportunityDestinationPath,
          link_role: "manual_fallback",
        });
        recordHandoff("manual");
        global.location.assign(manualLink.href);
      });
    }

    redirectTimer = global.setTimeout(() => {
      recordHandoff("automatic");
      global.location.replace(targetUrl);
    }, 2000);
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
