(function (global) {
  const OFFER_TYPES = Object.freeze(["coupon", "deal"]);
  const PUBLICATION_STATUSES = Object.freeze(["draft", "review", "published", "expired", "withdrawn", "rejected"]);
  const VERIFICATION_STATUSES = Object.freeze(["unverified", "verified", "verification_due", "source_changed", "expired", "withdrawn", "rejected"]);
  const CATEGORY_DEFINITIONS = Object.freeze({
    groceries: Object.freeze({ label: "Groceries", description: "Supermarket, food-box and everyday grocery savings." }),
    "restaurants-takeaways": Object.freeze({ label: "Restaurants & Takeaways", description: "Restaurant, takeaway, coffee and food-delivery offers." }),
    fashion: Object.freeze({ label: "Fashion & Accessories", description: "Clothing, footwear, jewellery and accessory offers." }),
    "beauty-health": Object.freeze({ label: "Beauty & Health", description: "Skincare, beauty, wellness and personal-care savings." }),
    "electronics-appliances": Object.freeze({ label: "Electronics & Appliances", description: "Technology, gaming, phones and household-appliance offers." }),
    "home-garden": Object.freeze({ label: "Home & Garden", description: "Furniture, decor, DIY, garden and household offers." }),
    "baby-kids": Object.freeze({ label: "Baby & Kids", description: "Baby essentials, children's products, toys and family offers." }),
    pets: Object.freeze({ label: "Pets", description: "Pet food, care, accessories and animal-supply offers." }),
    travel: Object.freeze({ label: "Travel & Accommodation", description: "Hotels, accommodation, transport and South African travel offers." }),
    entertainment: Object.freeze({ label: "Entertainment & Experiences", description: "Events, attractions, dining experiences and leisure offers." }),
    "mobile-data": Object.freeze({ label: "Mobile & Data", description: "Mobile, airtime, data and connectivity offers." }),
    "banking-rewards": Object.freeze({ label: "Banking & Rewards", description: "Bank-customer, loyalty-programme and member-only savings." }),
    "sports-outdoors": Object.freeze({ label: "Sports & Outdoors", description: "Fitness, sportswear, camping and outdoor offers." }),
    other: Object.freeze({ label: "Other", description: "Verified offers that do not yet fit a dedicated category.", indexable: false }),
  });
  const CATEGORIES = Object.freeze(Object.keys(CATEGORY_DEFINITIONS));
  const CORE_FIELDS = Object.freeze([
    "id", "slug", "type", "brand", "brandSlug", "title", "summary", "couponCode",
    "destinationUrl", "sourceUrl", "termsUrl", "category", "startsAt", "expiresAt",
    "lastChecked", "reviewDueAt", "terms", "publicationStatus", "verificationStatus",
    "country", "affiliate", "sponsored", "affiliateNetwork", "publishedAt", "updatedAt",
  ]);

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function isHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
    } catch (_error) {
      return false;
    }
  }

  function validateOffer(offer) {
    const errors = [];
    if (!isPlainObject(offer)) return { valid: false, errors: ["offer must be an object."] };

    Object.keys(offer).filter((field) => !CORE_FIELDS.includes(field)).sort().forEach((field) => {
      errors.push(`offer.${field} is not allowed.`);
    });
    ["id", "slug", "brand", "brandSlug", "title", "summary", "destinationUrl", "sourceUrl", "terms"].forEach((field) => {
      if (!isNonEmptyString(offer[field])) errors.push(`${field} must be a non-empty string.`);
    });
    ["slug", "brandSlug"].forEach((field) => {
      if (isNonEmptyString(offer[field]) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(offer[field])) {
        errors.push(`${field} must contain lowercase letters, numbers, and single hyphens only.`);
      }
    });
    if (!OFFER_TYPES.includes(offer.type)) errors.push(`type must be one of: ${OFFER_TYPES.join(", ")}.`);
    if (!CATEGORIES.includes(offer.category)) errors.push(`category must be one of: ${CATEGORIES.join(", ")}.`);
    if (!PUBLICATION_STATUSES.includes(offer.publicationStatus)) errors.push(`publicationStatus must be one of: ${PUBLICATION_STATUSES.join(", ")}.`);
    if (!VERIFICATION_STATUSES.includes(offer.verificationStatus)) errors.push(`verificationStatus must be one of: ${VERIFICATION_STATUSES.join(", ")}.`);
    if (offer.country !== "ZA") errors.push("country must be ZA.");
    ["destinationUrl", "sourceUrl"].forEach((field) => {
      if (!isHttpUrl(offer[field])) errors.push(`${field} must be an HTTP(S) URL without credentials.`);
    });
    if (offer.termsUrl !== undefined && !isHttpUrl(offer.termsUrl)) errors.push("termsUrl must be an HTTP(S) URL without credentials when present.");
    ["lastChecked", "reviewDueAt", "updatedAt"].forEach((field) => {
      if (!isIsoDate(offer[field])) errors.push(`${field} must be a valid YYYY-MM-DD date.`);
    });
    ["startsAt", "expiresAt", "publishedAt"].forEach((field) => {
      if (offer[field] !== undefined && !isIsoDate(offer[field])) errors.push(`${field} must be a valid YYYY-MM-DD date when present.`);
    });
    if (offer.type === "coupon" && !isNonEmptyString(offer.couponCode)) errors.push("coupon offers require couponCode.");
    if (offer.type === "deal" && offer.couponCode !== undefined) errors.push("deal offers must not include couponCode.");
    if (typeof offer.affiliate !== "boolean") errors.push("affiliate must be a boolean.");
    if (typeof offer.sponsored !== "boolean") errors.push("sponsored must be a boolean.");
    if (offer.affiliate === true && !isNonEmptyString(offer.affiliateNetwork)) errors.push("affiliateNetwork is required for affiliate offers.");
    if (offer.affiliate === false && offer.affiliateNetwork !== undefined) errors.push("affiliateNetwork is allowed only for affiliate offers.");
    if (isIsoDate(offer.lastChecked) && isIsoDate(offer.reviewDueAt) && offer.reviewDueAt < offer.lastChecked) errors.push("reviewDueAt cannot be before lastChecked.");
    if (isIsoDate(offer.startsAt) && isIsoDate(offer.expiresAt) && offer.expiresAt < offer.startsAt) errors.push("expiresAt cannot be before startsAt.");

    return { valid: errors.length === 0, errors };
  }

  function validateOfferRegistry(offers) {
    if (!Array.isArray(offers)) return { valid: false, errors: ["offers must be an array."] };
    const errors = [];
    const ids = new Set();
    const slugs = new Set();
    offers.forEach((offer, index) => {
      validateOffer(offer).errors.forEach((error) => errors.push(`offers[${index}].${error}`));
      [["id", ids], ["slug", slugs]].forEach(([field, seen]) => {
        const value = String(offer && offer[field] || "").trim().toLowerCase();
        if (value && seen.has(value)) errors.push(`offers[${index}].${field} is duplicated.`);
        if (value) seen.add(value);
      });
    });
    return { valid: errors.length === 0, errors };
  }

  function isOfferFeatureEnabled(value) {
    return value === "true";
  }

  function isPublicOffer(offer, options = {}) {
    const { asOfDate } = options;
    if (!validateOffer(offer).valid || !isIsoDate(asOfDate)) return false;
    if (offer.publicationStatus !== "published" || offer.verificationStatus !== "verified") return false;
    if (!isIsoDate(offer.publishedAt) || offer.publishedAt > asOfDate) return false;
    if (offer.startsAt && offer.startsAt > asOfDate) return false;
    if (offer.expiresAt && offer.expiresAt < asOfDate) return false;
    if (offer.reviewDueAt < asOfDate) return false;
    return true;
  }

  function getOfferPath(offer) {
    const type = typeof offer === "string" ? "coupon" : offer.type;
    const slug = typeof offer === "string" ? offer : offer.slug;
    if (!OFFER_TYPES.includes(type) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || ""))) throw new Error("A valid offer type and slug are required.");
    return `/${type}/${slug}/`;
  }

  function getOfferExitPath(offer) {
    const path = getOfferPath(offer);
    return `/out${path}`;
  }

  function getOfferContentType(offer) {
    if (!offer || !OFFER_TYPES.includes(offer.type)) throw new Error("A valid offer is required.");
    return offer.type === "coupon" ? "coupon" : "promotion";
  }

  const api = { OFFER_TYPES, CATEGORY_DEFINITIONS, CATEGORIES, PUBLICATION_STATUSES, VERIFICATION_STATUSES, validateOffer, validateOfferRegistry, isOfferFeatureEnabled, isPublicOffer, getOfferPath, getOfferExitPath, getOfferContentType };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.FreeHubOfferData = api;
})(typeof window !== "undefined" ? window : globalThis);
