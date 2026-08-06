(function (global) {
  "use strict";

  const TERMINAL_AD_STATES = new Set(["guest", "member", "unavailable"]);
  const DEFAULT_MAX_WAIT_MS = 3000;

  function afterGuestAdDecision(callback, options = {}) {
    if (typeof callback !== "function") {
      throw new TypeError("A handoff callback is required.");
    }

    const documentElement = global.document?.documentElement;
    const guestAdGate = global.document?.querySelector('script[src^="/shared/guest-ads.js"]');
    const requestedWait = Number(options.maxWaitMs);
    const maxWaitMs = Number.isFinite(requestedWait) && requestedWait >= 0
      ? requestedWait
      : DEFAULT_MAX_WAIT_MS;
    let finished = false;
    let waitTimer = null;

    function cleanup() {
      global.removeEventListener("freehub:guest-ads-state", handleStateChange);
      if (waitTimer !== null) {
        global.clearTimeout(waitTimer);
        waitTimer = null;
      }
    }

    function finish(reason) {
      if (finished) return;
      finished = true;
      cleanup();
      if (documentElement) {
        documentElement.dataset.freehubHandoffAuthResolution = reason;
      }
      callback({
        adState: documentElement?.dataset.freehubAdState || "not-applicable",
        reason,
      });
    }

    function handleStateChange(event) {
      const nextState = event?.detail?.state || documentElement?.dataset.freehubAdState;
      if (TERMINAL_AD_STATES.has(nextState)) {
        finish("resolved");
      }
    }

    if (!guestAdGate) {
      finish("not-required");
      return () => {};
    }

    if (TERMINAL_AD_STATES.has(documentElement?.dataset.freehubAdState)) {
      finish("resolved");
      return () => {};
    }

    if (documentElement) {
      documentElement.dataset.freehubHandoffState = "waiting-for-ad-state";
    }
    global.addEventListener("freehub:guest-ads-state", handleStateChange);
    waitTimer = global.setTimeout(() => finish("timeout"), maxWaitMs);

    return () => {
      if (finished) return;
      finished = true;
      cleanup();
      if (documentElement) {
        documentElement.dataset.freehubHandoffState = "cancelled";
      }
    };
  }

  global.FreeHubOutboundHandoff = Object.freeze({ afterGuestAdDecision });
})(typeof window !== "undefined" ? window : globalThis);
