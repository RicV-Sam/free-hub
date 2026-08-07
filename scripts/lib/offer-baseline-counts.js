const offerData = require("../../shared/offer-data.js");

function getOfferBaselineCounts({ offers, enabled, asOfDate, minimumLandingSize = 2 }) {
  const activeOffers = enabled
    ? offers.filter((offer) => offerData.isPublicOffer(offer, { asOfDate }))
    : [];
  const categories = [...new Set(activeOffers.map((offer) => offer.category))];
  const brands = [...new Set(activeOffers.map((offer) => offer.brandSlug))];
  const types = offerData.OFFER_TYPES.filter((type) => activeOffers.some((offer) => offer.type === type));
  const indexableCategories = categories.filter((category) => (
    offerData.CATEGORY_DEFINITIONS[category]?.indexable !== false
    && activeOffers.filter((offer) => offer.category === category).length >= minimumLandingSize
  ));
  const indexableBrands = brands.filter((brandSlug) => (
    activeOffers.filter((offer) => offer.brandSlug === brandSlug).length >= minimumLandingSize
  ));

  return {
    activeOffers,
    generatedFileCount: enabled ? 4 + categories.length + brands.length + (activeOffers.length * 2) : 0,
    sitemapUrlCount: enabled
      ? 1 + (activeOffers.length === 0
        ? 0
        : activeOffers.length + 1 + types.length + indexableCategories.length + indexableBrands.length)
      : 0,
  };
}

module.exports = { getOfferBaselineCounts };
