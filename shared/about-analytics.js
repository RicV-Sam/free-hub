(function setupAboutAnalytics(global) {
  "use strict";

  const allowedEvents = new Set([
    "about_browse_competitions_click",
    "about_join_club_click",
    "about_whatsapp_click",
    "about_safety_guide_click",
    "about_submit_competition_click",
  ]);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-about-event]");

    if (!link) {
      return;
    }

    const eventName = link.dataset.aboutEvent;

    if (!allowedEvents.has(eventName)) {
      return;
    }

    const payload = {
      page_type: "about",
      placement: link.dataset.aboutPlacement || "unknown",
      link_url: link.href,
    };

    if (typeof global.gtag === "function") {
      global.gtag("event", eventName, payload);
      return;
    }

    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({ event: eventName, ...payload });
  });
})(window);
