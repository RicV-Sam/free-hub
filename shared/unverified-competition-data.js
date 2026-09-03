const PUBLICATION_STATUS = "public-under-review";
const VERIFICATION_STATUS = "not-verified";
const PUBLIC_PATH = "/unverified-competitions/";

const REQUIRED_FIELDS = Object.freeze([
  "id",
  "brand",
  "title",
  "prize",
  "closingDate",
  "entrySummary",
  "costSummary",
  "officialSourceUrl",
  "reviewGap",
  "lastChecked",
  "publicationStatus",
  "verificationStatus",
]);

function normalizeDate(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? "" : text;
}

function validateRegistry(records) {
  const errors = [];
  const ids = new Set();

  if (!Array.isArray(records)) return { valid: false, errors: ["Registry must be an array."] };

  records.forEach((record, index) => {
    const label = record && record.id ? record.id : `row ${index + 1}`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`${label}: must be an object.`);
      return;
    }

    REQUIRED_FIELDS.forEach((field) => {
      if (typeof record[field] !== "string" || !record[field].trim()) {
        errors.push(`${label}: missing ${field}.`);
      }
    });

    if (ids.has(record.id)) errors.push(`${label}: duplicate id.`);
    ids.add(record.id);

    if (!normalizeDate(record.closingDate)) errors.push(`${label}: invalid closingDate.`);
    if (!normalizeDate(record.lastChecked)) errors.push(`${label}: invalid lastChecked.`);
    if (record.publicationStatus !== PUBLICATION_STATUS) {
      errors.push(`${label}: publicationStatus must be ${PUBLICATION_STATUS}.`);
    }
    if (record.verificationStatus !== VERIFICATION_STATUS) {
      errors.push(`${label}: verificationStatus must be ${VERIFICATION_STATUS}.`);
    }
    if (record.doNotPublish !== true) errors.push(`${label}: doNotPublish must be true.`);

    try {
      const source = new URL(record.officialSourceUrl);
      if (source.protocol !== "https:") errors.push(`${label}: officialSourceUrl must use https.`);
      if (/(^|\.)freehub\.co\.za$/i.test(source.hostname)) {
        errors.push(`${label}: officialSourceUrl must lead to an external source.`);
      }
    } catch (_error) {
      errors.push(`${label}: invalid officialSourceUrl.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function isPublicUnderReview(record, options = {}) {
  const asOfDate = normalizeDate(options.asOfDate) || new Date().toISOString().slice(0, 10);
  return Boolean(
    record &&
    record.publicationStatus === PUBLICATION_STATUS &&
    record.verificationStatus === VERIFICATION_STATUS &&
    record.doNotPublish === true &&
    normalizeDate(record.closingDate) &&
    record.closingDate >= asOfDate
  );
}

function getPublicUnderReview(records, options = {}) {
  return records
    .filter((record) => isPublicUnderReview(record, options))
    .sort((a, b) => a.closingDate.localeCompare(b.closingDate) || a.brand.localeCompare(b.brand));
}

module.exports = {
  PUBLICATION_STATUS,
  VERIFICATION_STATUS,
  PUBLIC_PATH,
  validateRegistry,
  isPublicUnderReview,
  getPublicUnderReview,
};
