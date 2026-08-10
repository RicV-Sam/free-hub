(function () {
  function track(eventName, payload) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...payload });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-offer-card] a");
    const card = link?.closest("[data-offer-card]");
    if (!link || !card) return;
    track("offer_card_click", {
      content_type: card.dataset.contentType,
      content_id: card.dataset.contentId,
      merchant_id: card.dataset.merchantId,
      category: card.dataset.category,
      destination_path: link.getAttribute("href") || "",
      page_type: "offer_collection",
    });
  });
})();
