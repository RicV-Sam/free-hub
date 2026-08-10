(function (global) {
  const MERCHANT_KINDS = Object.freeze([
    "merchant",
    "loyalty_program",
    "financial_provider",
    "travel_provider",
  ]);
  const CORE_FIELDS = Object.freeze(["id", "name", "kind", "officialUrl", "country", "active"]);

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isSlug(value) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || ""));
  }

  function isHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
    } catch (_error) {
      return false;
    }
  }

  function validateMerchant(merchant) {
    const errors = [];
    if (!isPlainObject(merchant)) return { valid: false, errors: ["merchant must be an object."] };
    Object.keys(merchant).filter((field) => !CORE_FIELDS.includes(field)).sort().forEach((field) => {
      errors.push(`merchant.${field} is not allowed.`);
    });
    if (!isSlug(merchant.id)) errors.push("id must contain lowercase letters, numbers, and single hyphens only.");
    if (!isNonEmptyString(merchant.name)) errors.push("name must be a non-empty string.");
    if (!MERCHANT_KINDS.includes(merchant.kind)) errors.push(`kind must be one of: ${MERCHANT_KINDS.join(", ")}.`);
    if (!isHttpUrl(merchant.officialUrl)) errors.push("officialUrl must be an HTTP(S) URL without credentials.");
    if (merchant.country !== "ZA") errors.push("country must be ZA.");
    if (typeof merchant.active !== "boolean") errors.push("active must be a boolean.");
    return { valid: errors.length === 0, errors };
  }

  function validateMerchantRegistry(merchants) {
    if (!Array.isArray(merchants)) return { valid: false, errors: ["merchants must be an array."] };
    const errors = [];
    const ids = new Set();
    merchants.forEach((merchant, index) => {
      validateMerchant(merchant).errors.forEach((error) => errors.push(`merchants[${index}].${error}`));
      const id = String(merchant && merchant.id || "").trim().toLowerCase();
      if (id && ids.has(id)) errors.push(`merchants[${index}].id is duplicated.`);
      if (id) ids.add(id);
    });
    return { valid: errors.length === 0, errors };
  }

  function validateOfferMerchantReferences(offers, merchants) {
    const errors = [];
    const merchantById = new Map((Array.isArray(merchants) ? merchants : []).map((merchant) => [merchant.id, merchant]));
    (Array.isArray(offers) ? offers : []).forEach((offer, index) => {
      const merchant = merchantById.get(offer && offer.brandSlug);
      if (!merchant) {
        errors.push(`offers[${index}].brandSlug does not reference a merchant entity: ${offer && offer.brandSlug}.`);
        return;
      }
      if (!merchant.active) errors.push(`offers[${index}].brandSlug references an inactive merchant entity: ${merchant.id}.`);
      if (merchant.name !== offer.brand) {
        errors.push(`offers[${index}].brand must match merchant ${merchant.id}: expected ${merchant.name}.`);
      }
    });
    return { valid: errors.length === 0, errors };
  }

  const api = { MERCHANT_KINDS, validateMerchant, validateMerchantRegistry, validateOfferMerchantReferences };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.FreeHubMerchantData = api;
})(typeof window !== "undefined" ? window : globalThis);
