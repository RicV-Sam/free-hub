(function promotionRuntime(global) {
  "use strict";
  if (global.FreeHubPromotionRuntime) return;
  const document = global.document;
  const meta = document.querySelector('meta[name="freehub-promotion-window"]');
  const bounds = meta ? meta.content.split(",").map(Number) : [];
  let timer;
  function isActive() {
    return bounds.length === 2 && Number.isFinite(bounds[0]) && Number.isFinite(bounds[1]) && Date.now() >= bounds[0] && Date.now() < bounds[1];
  }
  function refresh() {
    const active = isActive();
    document.documentElement.dataset.freehubPromotionActive = String(active);
    global.clearTimeout(timer);
    if (active) timer = global.setTimeout(refresh, Math.min(bounds[1] - Date.now() + 1, 2147483647));
    return active;
  }
  global.FreeHubPromotionRuntime = Object.freeze({ isActive });
  refresh();
  global.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", refresh);
  ["click", "auxclick"].forEach((type) => document.addEventListener(type, (event) => {
    if (event.target.closest?.("[data-freehub-promotion] [data-promotion-link]") && !refresh()) event.preventDefault();
  }, true));
})(window);
