const fs = require("fs");
const path = require("path");
const shared = require("../../shared/page-data.js");

const MOBILE_FEED_SCHEMA_VERSION = 1;
const MOBILE_CATALOG_SCHEMA_VERSION = 1;
const ALLOWED_ITEM_KEYS = Object.freeze([
  "id",
  "title",
  "brand",
  "summary",
  "imageUrl",
  "closingDate",
  "category",
  "prizeName",
  "entryCostType",
  "entryCostLabel",
  "purchaseRequired",
  "entryMethod",
  "eligibility",
  "entrySteps",
  "officialUrl",
  "termsUrl",
  "lastChecked",
  "isHighValue",
  "isClosingSoon",
]);

function buildMobileFeed(competitions, { asOfDate } = {}) {
  if (!Array.isArray(competitions)) {
    throw new TypeError("Mobile feed input must be an array of competitions.");
  }

  if (asOfDate) {
    shared.setReferenceDate(asOfDate);
  }

  const publishedActive = shared.sortCompetitions(
    shared.getPublishedActiveCompetitions(competitions)
  );
  const items = publishedActive.map(toMobileFeedItem);

  validateMobileFeedItems(items);

  return {
    schemaVersion: MOBILE_FEED_SCHEMA_VERSION,
    asOfDate: String(asOfDate || ""),
    count: items.length,
    competitions: items,
  };
}

function writeMobileFeed(outputPath, competitions, options = {}) {
  const feed = buildMobileFeed(competitions, options);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(feed, null, 2)}\n`);
  return feed;
}

function buildMobileCatalog({ resources = [], opportunities = [], offers = [] }, { asOfDate } = {}) {
  if (![resources, opportunities, offers].every(Array.isArray)) {
    throw new TypeError("Mobile catalog inputs must be arrays.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(asOfDate || ""))) {
    throw new TypeError("Mobile catalog requires an asOfDate in YYYY-MM-DD format.");
  }

  const resourceItems = resources.filter((resource) => isCurrentMobileResource(resource, asOfDate)).map(toMobileResource);
  const opportunityItems = opportunities.map(toMobileOpportunity);
  const offerItems = offers.map(toMobileOffer);
  const items = [...resourceItems, ...opportunityItems, ...offerItems];
  validateMobileCatalogItems(items);

  return {
    schemaVersion: MOBILE_CATALOG_SCHEMA_VERSION,
    asOfDate,
    count: items.length,
    counts: {
      freeStuff: resourceItems.length + opportunityItems.length,
      resources: resourceItems.length,
      opportunities: opportunityItems.length,
      offers: offerItems.length,
    },
    items,
  };
}

function writeMobileCatalog(outputPath, content, options = {}) {
  const catalog = buildMobileCatalog(content, options);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  return catalog;
}

function isCurrentMobileResource(resource, asOfDate) {
  if (!resource || typeof resource !== "object") return false;
  const hasStrictLifecycle = Object.prototype.hasOwnProperty.call(resource, "verificationStatus");
  if (!hasStrictLifecycle) return Boolean(resource.name && resource.officialUrl);
  return (
    resource.verificationStatus === "verified" &&
    ["active", "manual_check"].includes(resource.availability) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(resource.reviewDueAt || "")) &&
    resource.reviewDueAt >= asOfDate
  );
}

function toMobileResource(resource) {
  return compactObject({
    id: String(resource.id || `resource-${slugify(resource.category)}-${slugify(resource.name)}`),
    kind: "resource",
    title: requiredText(resource.name, "resource name", resource),
    provider: requiredText(resource.name, "resource provider", resource),
    summary: requiredText(resource.freeDetails, "resource freeDetails", resource),
    category: requiredText(resource.category, "resource category", resource),
    categoryLabel: requiredText(resource.categoryLabel, "resource categoryLabel", resource),
    officialUrl: externalUrl(resource.officialUrl, "resource official URL"),
    bestFor: requiredText(resource.bestFor, "resource bestFor", resource),
    requirements: [requiredText(resource.requirements, "resource requirements", resource)],
    watchOut: requiredText(resource.watchOut, "resource watchOut", resource),
    lastChecked: String(resource.lastReviewed || "").trim(),
  });
}

function toMobileOpportunity(opportunity) {
  const requirementLabels = Array.isArray(opportunity.requirements)
    ? opportunity.requirements.filter((entry) => entry && entry.required === true).map((entry) => String(entry.label || "").trim()).filter(Boolean)
    : [];
  return compactObject({
    id: requiredText(opportunity.id, "opportunity id", opportunity),
    kind: "opportunity",
    title: requiredText(opportunity.title, "opportunity title", opportunity),
    provider: requiredText(opportunity.provider, "opportunity provider", opportunity),
    summary: requiredText(opportunity.summary, "opportunity summary", opportunity),
    category: requiredText(opportunity.type, "opportunity type", opportunity),
    categoryLabel: opportunity.type === "birthday_freebie" ? "Birthday freebies" : opportunity.type === "product_testing" ? "Product testing" : "Free samples",
    officialUrl: externalUrl(opportunity.sourceUrl, "opportunity official URL"),
    imageUrl: optionalHttpsUrl(opportunity.imageUrl),
    requirements: requirementLabels,
    watchOut: opportunity.type === "product_testing" ? "Applying does not guarantee selection. Check every creator task before applying." : "Availability and provider approval can change.",
    expiresAt: String(opportunity.expiresAt || "").trim(),
    lastChecked: String(opportunity.lastVerifiedAt || "").trim(),
  });
}

function toMobileOffer(offer) {
  return compactObject({
    id: requiredText(offer.id, "offer id", offer),
    kind: offer.type,
    title: requiredText(offer.title, "offer title", offer),
    provider: requiredText(offer.brand, "offer brand", offer),
    summary: requiredText(offer.summary, "offer summary", offer),
    category: requiredText(offer.category, "offer category", offer),
    categoryLabel: String(offer.category).split("-").map(capitalize).join(" & "),
    officialUrl: externalUrl(offer.destinationUrl, "offer destination URL"),
    termsUrl: externalUrl(offer.termsUrl || offer.sourceUrl, "offer terms URL"),
    couponCode: String(offer.couponCode || "").trim(),
    requirements: [requiredText(offer.terms, "offer terms", offer)],
    watchOut: "Confirm the current price, availability and terms with the provider before buying.",
    expiresAt: String(offer.expiresAt || "").trim(),
    lastChecked: String(offer.lastChecked || "").trim(),
    isAffiliate: offer.affiliate === true,
    isSponsored: offer.sponsored === true,
  });
}

function validateMobileCatalogItems(items) {
  const ids = new Set();
  items.forEach((item) => {
    if (!["resource", "opportunity", "coupon", "deal"].includes(item.kind)) throw new Error(`Mobile catalog has invalid kind: ${item.kind}`);
    if (ids.has(item.id)) throw new Error(`Mobile catalog contains duplicate id: ${item.id}`);
    ids.add(item.id);
    [item.officialUrl, item.termsUrl].filter(Boolean).forEach((value) => {
      const url = new URL(value);
      if (isFreehubHost(url.hostname)) throw new Error(`Mobile catalog must not route through Freehub: ${url.href}`);
    });
  });
}

function externalUrl(value, label) {
  const url = parseHttpUrl(value, label);
  if (isFreehubHost(url.hostname)) throw new Error(`Mobile catalog ${label} must not route through Freehub.`);
  return url.href;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== "" && entry !== null && entry !== undefined));
}

function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function capitalize(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function toMobileFeedItem(competition) {
  const officialUrl = getRequiredOfficialUrl(competition);
  const item = {
    id: shared.getCompetitionSlug(competition),
    title: requiredText(competition.title, "title", competition),
    brand: requiredText(competition.brand, "brand", competition),
    summary: requiredText(competition.summary, "summary", competition),
    imageUrl: optionalHttpsUrl(competition.image),
    closingDate: requiredText(competition.closingDate, "closingDate", competition),
    category: requiredText(competition.category, "category", competition),
    prizeName: requiredText(competition.prizeName, "prizeName", competition),
    entryCostType: shared.getEntryCostClassification(competition),
    entryCostLabel: shared.getEntryCostLabel(competition),
    purchaseRequired: competition.purchaseRequired === true,
    entryMethod: shared.getEntryMethodLabel(competition.entryType || competition.entryChannel),
    eligibility: String(competition.eligibilitySummary || competition.eligibility || "Check the official terms.").trim(),
    entrySteps: Array.isArray(competition.entrySteps)
      ? competition.entrySteps.map((step) => String(step).trim()).filter(Boolean)
      : [],
    officialUrl,
    termsUrl: optionalExternalUrl(competition.termsUrl, officialUrl),
    lastChecked: String(competition.lastChecked || "").trim(),
    isHighValue: shared.isHighValueCompetition(competition),
    isClosingSoon: shared.isClosingWithinDays(competition.closingDate, 7),
  };

  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== "" && value !== null));
}

function validateMobileFeedItems(items) {
  const ids = new Set();

  items.forEach((item) => {
    const extraKeys = Object.keys(item).filter((key) => !ALLOWED_ITEM_KEYS.includes(key));
    if (extraKeys.length > 0) {
      throw new Error(`Mobile feed item ${item.id || "unknown"} contains forbidden fields: ${extraKeys.join(", ")}`);
    }
    Object.entries(item).forEach(([key, value]) => {
      if (key === "entrySteps") {
        if (!Array.isArray(value) || value.some((step) => typeof step !== "string")) {
          throw new Error(`Mobile feed item ${item.id || "unknown"} has invalid entrySteps.`);
        }
        return;
      }
      if (!["string", "boolean"].includes(typeof value)) {
        throw new Error(`Mobile feed item ${item.id || "unknown"} has non-primitive field: ${key}`);
      }
    });
    if (ids.has(item.id)) {
      throw new Error(`Mobile feed contains duplicate id: ${item.id}`);
    }
    ids.add(item.id);
  });
}

function getRequiredOfficialUrl(competition) {
  const value = competition.url || competition.sourceUrl;
  const url = parseHttpUrl(value, `official URL for ${competition.id || competition.title || "competition"}`);
  if (isFreehubHost(url.hostname)) {
    throw new Error(`Mobile feed official URL must not route through Freehub: ${url.href}`);
  }
  return url.href;
}

function optionalExternalUrl(value, fallbackUrl) {
  if (!value) {
    return fallbackUrl;
  }
  const url = parseHttpUrl(value, "terms URL");
  return isFreehubHost(url.hostname) ? fallbackUrl : url.href;
}

function optionalHttpsUrl(value) {
  if (!value) {
    return "";
  }
  const url = parseHttpUrl(value, "image URL");
  if (url.protocol !== "https:") {
    throw new Error(`Mobile feed image URL must use HTTPS: ${url.href}`);
  }
  return url.href;
}

function parseHttpUrl(value, label) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    throw new Error(`Mobile feed ${label} is invalid.`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Mobile feed ${label} must use HTTP or HTTPS.`);
  }
  return url;
}

function requiredText(value, field, competition) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`Mobile feed ${field} is missing for ${competition.id || competition.title || "competition"}.`);
  }
  return text;
}

function isFreehubHost(hostname) {
  return hostname === "freehub.co.za" || hostname.endsWith(".freehub.co.za");
}

module.exports = {
  ALLOWED_ITEM_KEYS,
  MOBILE_CATALOG_SCHEMA_VERSION,
  MOBILE_FEED_SCHEMA_VERSION,
  buildMobileCatalog,
  buildMobileFeed,
  writeMobileCatalog,
  writeMobileFeed,
};
