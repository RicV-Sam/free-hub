(function () {
  "use strict";
  const page = document.body;
  if (!page.hasAttribute("data-out-closing-date")) return;
  const shared = window.FreeHubShared;
  const record = { closingDate: page.dataset.outClosingDate };
  if (page.dataset.outClosingAt !== undefined) record.closingAt = page.dataset.outClosingAt;
  const links = [...document.querySelectorAll("[data-outbound-destination]")];
  let redirectTimer = null;
  let expiryTimer = null;
  let cancelAdWait = null;
  let closed = false;

  function checkEntry() {
    if (!closed && shared?.isCompetitionEntryOpen(record)) return true;
    closed = true;
    if (redirectTimer !== null) window.clearTimeout(redirectTimer);
    if (expiryTimer !== null) window.clearTimeout(expiryTimer);
    if (cancelAdWait) cancelAdWait();
    links.forEach(link => { link.hidden = true; link.removeAttribute("href"); });
    document.documentElement.dataset.freehubHandoffState = "closed";
    const notice = document.querySelector("[data-outbound-closed]");
    if (notice) notice.hidden = false;
    document.querySelectorAll("[data-outbound-open]").forEach(node => { node.hidden = true; });
    const title = document.querySelector(".hero h1");
    if (title) title.textContent = "Entry is no longer available";
    const intro = document.querySelector(".hero__text");
    if (intro) intro.textContent = "Return to the listing for the closing details, or browse current competitions.";
    return false;
  }

  function beginRedirectCountdown() {
    if (!checkEntry() || redirectTimer !== null) return;
    document.documentElement.dataset.freehubHandoffState = "countdown";
    redirectTimer = window.setTimeout(() => {
      if (!checkEntry()) return;
      document.documentElement.dataset.freehubHandoffState = "redirecting";
      window.location.replace(page.dataset.outTarget);
    }, 2000);
  }

  // Capture runs before analytics and default navigation, including after sleep.
  const guardEntryAction = event => {
    if (!event.target.closest?.("[data-outbound-destination]")) return;
    if (!checkEntry()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  ["click", "auxclick", "contextmenu"].forEach(type => document.addEventListener(type, guardEntryAction, true));
  window.addEventListener("pageshow", checkEntry);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkEntry(); });

  if (!checkEntry()) return;
  links.forEach(link => { link.href = page.dataset.outTarget; link.hidden = false; });
  // Recheck long deadlines daily to stay below the browser's timer limit.
  function scheduleExpiry() {
    if (!checkEntry()) return;
    const remaining = shared.getCompetitionClosingTimestamp(record) - Date.now();
    expiryTimer = window.setTimeout(scheduleExpiry, Math.max(1, Math.min(remaining, 86400000)));
  }
  scheduleExpiry();
  if (typeof window.gtag === "function") window.gtag("event", "outbound_click", {
    competition_slug: page.dataset.outSlug,
    competition_title: page.dataset.outTitle,
    competition_category: page.dataset.outCategory,
    source_domain: page.dataset.outSourceDomain,
    destination_url: page.dataset.outTarget,
    page_type: "out",
    transport_type: "beacon",
  });
  if (window.FreeHubOutboundHandoff) {
    cancelAdWait = window.FreeHubOutboundHandoff.afterGuestAdDecision(beginRedirectCountdown, { maxWaitMs: 3000 });
  } else {
    beginRedirectCountdown();
  }
})();
