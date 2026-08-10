const shared = require("../../shared/page-data.js");
const offerData = require("../../shared/offer-data.js");
const opportunityData = require("../../shared/opportunity-data.js");
const discoveryData = require("../../shared/discovery-data.js");

function optionalFields(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

function createCompetitionSummary(competition) {
  if (!shared.isPublicCompetition(competition) || !shared.isActiveCompetition(competition)) {
    throw new Error("Competition must pass the existing public and active gates before Discovery projection.");
  }
  return discoveryData.createDiscoverySummary({
    id: `competition:${competition.id}`,
    entityKind: "competition",
    contentType: "competition",
    title: competition.title,
    summary: competition.summary || competition.quickAnswer || shared.buildCompetitionDescription(competition),
    path: shared.getCompetitionPath(competition),
    labels: ["Published competition", shared.getEntryCostLabel(competition)],
    ...optionalFields({
      imageUrl: shared.getCompetitionPrimaryImageUrl(competition),
      merchantId: shared.getBrandSlugForCompetition(competition),
      category: competition.category,
      expiresAt: competition.closingDate,
      lastVerifiedAt: competition.lastChecked,
    }),
  });
}

function createOfferSummary(offer, options) {
  if (!offerData.isPublicOffer(offer, options)) {
    throw new Error("Offer must pass the existing public gate before Discovery projection.");
  }
  const contentType = offer.type === "coupon" ? "coupon" : "promotion";
  return discoveryData.createDiscoverySummary({
    id: `${contentType}:${offer.id}`,
    entityKind: "offer",
    contentType,
    title: offer.title,
    summary: offer.summary,
    path: offerData.getOfferPath(offer),
    labels: ["Verified", offer.type === "coupon" ? "Coupon code" : "No code needed"],
    merchantId: offer.brandSlug,
    category: offer.category,
    ...optionalFields({ startsAt: offer.startsAt, expiresAt: offer.expiresAt, lastVerifiedAt: offer.lastChecked }),
  });
}

function createOpportunitySummary(opportunity, options) {
  if (!opportunityData.isPublicOpportunity(opportunity, options)) {
    throw new Error("Opportunity must pass the existing public gate before Discovery projection.");
  }
  return discoveryData.createDiscoverySummary({
    id: `${opportunity.type}:${opportunity.id}`,
    entityKind: "opportunity",
    contentType: opportunity.type,
    title: opportunity.title,
    summary: opportunity.summary,
    path: opportunityData.getOpportunityDetailPath(opportunity),
    labels: ["Verified", opportunity.costClassification === "completely_free" ? "Completely free" : "Requirements apply"],
    category: opportunity.categories[0],
    ...optionalFields({
      imageUrl: opportunity.imageUrl,
      startsAt: opportunity.startsAt,
      expiresAt: opportunity.expiresAt,
      lastVerifiedAt: opportunity.lastVerifiedAt,
    }),
  });
}

function createDiscoveryProjection({ competitions = [], offers = [], opportunities = [], offerOptions, opportunityOptions }) {
  const summaries = [
    ...competitions.map(createCompetitionSummary),
    ...offers.map((offer) => createOfferSummary(offer, offerOptions)),
    ...opportunities.map((opportunity) => createOpportunitySummary(opportunity, opportunityOptions)),
  ];
  const validation = discoveryData.validateDiscoveryRegistry(summaries);
  if (!validation.valid) throw new Error(`[Discovery projection failed]\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
  return Object.freeze(summaries);
}

module.exports = { createCompetitionSummary, createOfferSummary, createOpportunitySummary, createDiscoveryProjection };
