(function promotionAnalytics(global) {
  "use strict";
  if (global.FreeHubPromotionAnalytics) return;
  const document = global.document;
  const modules = [...document.querySelectorAll("[data-freehub-promotion]")];
  if (!modules.length) return;
  const states = new Map();
  const keyFor = (element) => [element.dataset.campaignId, element.dataset.placementId, element.dataset.creativeId].join(":");
  modules.forEach((element) => states.set(keyFor(element), { element, ratio: 0, since: null, viewed: false, clicked: false }));

  // Read existing public consent signals only. Never set consent, patch gtag/dataLayer,
  // load another CMP, or equate legitimate interest / consentExists with permission.
  function hasAnalyticsConsent() {
    let cmp = null;
    let google = null;
    let cmpEvent = null;
    const layer = Array.isArray(global.dataLayer) ? global.dataLayer : [];
    for (let i = layer.length - 1; i >= 0; i -= 1) {
      const row = layer[i];
      if (!row) continue;
      if (google === null && row[0] === "consent" && ["default", "update"].includes(row[1]) && row[2] && !row[2].region && ["granted", "denied"].includes(row[2].analytics_storage)) google = row[2].analytics_storage === "granted";
      if (cmpEvent === null && row.event === "cmpEvent" && typeof row.cmpConsentVendors === "string") cmpEvent = row.cmpConsentVendors.includes(",s26,");
    }
    if (typeof global.__cmp === "function") {
      try {
        const status = global.__cmp("consentStatus");
        const data = global.__cmp("getCMPData");
        if (status && typeof status.consentExists === "boolean") {
          cmp = status.consentExists && (data?.vendorConsents?.s26 === true || data?.vendorConsents?.s26 === 1);
        }
      } catch (_) { return false; }
    }
    const signals = [cmp === null ? cmpEvent : cmp, google].filter((value) => value !== null);
    return signals.length > 0 && signals.every((value) => value === true);
  }

  function active(element) {
    return element.isConnected && global.FreeHubPromotionRuntime?.isActive() === true
      && element.dataset.promotionKind === "house" && document.visibilityState === "visible";
  }
  function visible(state) {
    const element = state.element;
    if (!active(element) || state.ratio < 0.5) return false;
    if (typeof element.checkVisibility === "function" && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const style = global.getComputedStyle(element);
    if (style.visibility !== "visible" || style.display === "none" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    const width = Math.max(0, Math.min(rect.right, global.innerWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, global.innerHeight) - Math.max(rect.top, 0));
    return rect.width > 0 && rect.height > 0 && (width * height) / (rect.width * rect.height) >= 0.5;
  }
  function send(name, element, extra = {}) {
    if (!active(element) || !hasAnalyticsConsent() || typeof global.gtag !== "function") return false;
    const data = element.dataset;
    const payload = {};
    ["campaignId", "sponsorId", "creativeId", "placementId", "promotionKind", "pageType", "format", "destinationId", "destinationHost", "destinationPath", "sourcePath", "configVersion"].forEach((key) => {
      payload[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = data[key];
    });
    // Primary FreeHub property only; do not duplicate into Journey's GA stream.
    global.gtag("event", name, { ...payload, ...extra, send_to: "G-23P37R20FY", transport_type: "beacon" });
    return true;
  }
  function sample() {
    const consent = hasAnalyticsConsent();
    for (const state of states.values()) {
      if (!consent || !visible(state)) { state.since = null; continue; }
      if (state.viewed) continue;
      if (state.since === null) state.since = performance.now();
      if (performance.now() - state.since >= 1000 && send("promotion_view", state.element)) state.viewed = true;
    }
  }
  if (typeof global.IntersectionObserver === "function") {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = states.get(keyFor(entry.target));
        if (state) { state.ratio = entry.intersectionRatio; if (state.ratio < 0.5) state.since = null; }
      });
      sample();
    }, { threshold: [0, 0.5, 1] });
    modules.forEach((element) => observer.observe(element));
  }
  function handleClick(event) {
    if (event.defaultPrevented || (event.type === "click" && event.button !== 0) || (event.type === "auxclick" && event.button !== 1)) return;
    const link = event.target.closest?.("[data-freehub-promotion] [data-promotion-link]");
    if (!link) return;
    const element = link.closest("[data-freehub-promotion]");
    const state = states.get(keyFor(element));
    if (!state) return;
    if (send("promotion_click", element, { was_viewable: state.viewed ? 1 : 0, first_click: state.clicked ? 0 : 1 })) state.clicked = true;
  }
  document.addEventListener("click", handleClick);
  document.addEventListener("auxclick", handleClick);
  document.addEventListener("visibilitychange", () => { states.forEach((state) => { state.since = null; }); sample(); });
  global.addEventListener("pagehide", () => states.forEach((state) => { state.since = null; }));
  // Polling observes existing consent updates without modifying either provider's API.
  // Hidden documents do not query the CMP. No cookie, storage, identity or pre-consent queue.
  global.setInterval(() => { if (document.visibilityState === "visible") sample(); }, 250);
  global.FreeHubPromotionAnalytics = Object.freeze({ hasAnalyticsConsent });
})(window);
