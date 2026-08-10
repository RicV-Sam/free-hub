(function (global) {
  const ENTITY_KINDS = Object.freeze(["competition", "offer", "opportunity", "resource"]);
  const CONTENT_TYPES = Object.freeze([
    "competition",
    "promotion",
    "coupon",
    "free_sample",
    "product_testing",
    "birthday_freebie",
    "free_course",
    "free_resource",
  ]);
  const CORE_FIELDS = Object.freeze([
    "id", "entityKind", "contentType", "title", "summary", "path", "labels",
    "imageUrl", "merchantId", "category", "startsAt", "expiresAt", "lastVerifiedAt",
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

  function isRootRelativePath(value) {
    return isNonEmptyString(value) && value.startsWith("/") && !value.startsWith("//") && !/[?#]/.test(value);
  }

  function validateDiscoverySummary(summary) {
    const errors = [];
    if (!isPlainObject(summary)) return { valid: false, errors: ["summary must be an object."] };
    Object.keys(summary).filter((field) => !CORE_FIELDS.includes(field)).sort().forEach((field) => {
      errors.push(`summary.${field} is not allowed.`);
    });
    ["id", "title", "summary", "path"].forEach((field) => {
      if (!isNonEmptyString(summary[field])) errors.push(`${field} must be a non-empty string.`);
    });
    if (!ENTITY_KINDS.includes(summary.entityKind)) errors.push(`entityKind must be one of: ${ENTITY_KINDS.join(", ")}.`);
    if (!CONTENT_TYPES.includes(summary.contentType)) errors.push(`contentType must be one of: ${CONTENT_TYPES.join(", ")}.`);
    if (!isRootRelativePath(summary.path)) errors.push("path must be a root-relative Freehub path without a query or fragment.");
    if (!Array.isArray(summary.labels) || summary.labels.some((label) => !isNonEmptyString(label))) {
      errors.push("labels must be an array of non-empty strings.");
    }
    if (summary.imageUrl !== undefined && !isHttpUrl(summary.imageUrl)) errors.push("imageUrl must be an HTTP(S) URL without credentials.");
    ["merchantId", "category"].forEach((field) => {
      if (summary[field] !== undefined && !isNonEmptyString(summary[field])) errors.push(`${field} must be a non-empty string when present.`);
    });
    ["startsAt", "expiresAt", "lastVerifiedAt"].forEach((field) => {
      if (summary[field] !== undefined && !isIsoDate(summary[field])) errors.push(`${field} must be a valid YYYY-MM-DD date when present.`);
    });
    if (isIsoDate(summary.startsAt) && isIsoDate(summary.expiresAt) && summary.expiresAt < summary.startsAt) {
      errors.push("expiresAt cannot be before startsAt.");
    }
    return { valid: errors.length === 0, errors };
  }

  function createDiscoverySummary(input) {
    if (!isPlainObject(input)) throw new Error("Invalid DiscoverySummary: input must be an object.");
    const summary = {};
    CORE_FIELDS.forEach((field) => {
      if (input[field] !== undefined && input[field] !== "") {
        summary[field] = Array.isArray(input[field]) ? input[field].slice() : input[field];
      }
    });
    Object.keys(input).filter((field) => !CORE_FIELDS.includes(field)).sort().forEach((field) => {
      summary[field] = input[field];
    });
    const validation = validateDiscoverySummary(summary);
    if (!validation.valid) throw new Error(`Invalid DiscoverySummary: ${validation.errors.join(" ")}`);
    return Object.freeze(summary);
  }

  function validateDiscoveryRegistry(summaries) {
    if (!Array.isArray(summaries)) return { valid: false, errors: ["summaries must be an array."] };
    const errors = [];
    const ids = new Set();
    const paths = new Set();
    summaries.forEach((summary, index) => {
      validateDiscoverySummary(summary).errors.forEach((error) => errors.push(`summaries[${index}].${error}`));
      [["id", ids], ["path", paths]].forEach(([field, seen]) => {
        const value = String(summary && summary[field] || "").trim().toLowerCase();
        if (value && seen.has(value)) errors.push(`summaries[${index}].${field} is duplicated.`);
        if (value) seen.add(value);
      });
    });
    return { valid: errors.length === 0, errors };
  }

  const api = { ENTITY_KINDS, CONTENT_TYPES, createDiscoverySummary, validateDiscoverySummary, validateDiscoveryRegistry };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.FreeHubDiscoveryData = api;
})(typeof window !== "undefined" ? window : globalThis);
