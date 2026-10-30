const PUBLICATION_STATUS = "public-under-review";
const VERIFICATION_STATUS = "not-verified";
const PUBLIC_PATH = "/unverified-competitions/";

const REQUIRED_FIELDS = Object.freeze([
  "id",
  "brand",
  "title",
  "prize",
  "entrySummary",
  "costSummary",
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
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id || "")) errors.push(`${label}: invalid id.`);

    if (record.closingDate && !normalizeDate(record.closingDate)) errors.push(`${label}: invalid closingDate.`);
    if (!record.closingDate && (!record.closingDateText || !normalizeDate(record.reviewDueAt))) {
      errors.push(`${label}: unknown closing date requires closingDateText and reviewDueAt.`);
    }
    if (record.reviewDueAt && !normalizeDate(record.reviewDueAt)) errors.push(`${label}: invalid reviewDueAt.`);
    if (record.listedAt && !normalizeDate(record.listedAt)) errors.push(`${label}: invalid listedAt.`);
    if (!normalizeDate(record.lastChecked)) errors.push(`${label}: invalid lastChecked.`);
    if (record.publicationStatus !== PUBLICATION_STATUS) {
      errors.push(`${label}: publicationStatus must be ${PUBLICATION_STATUS}.`);
    }
    if (record.verificationStatus !== VERIFICATION_STATUS) {
      errors.push(`${label}: verificationStatus must be ${VERIFICATION_STATUS}.`);
    }
    if (record.doNotPublish !== true) errors.push(`${label}: doNotPublish must be true.`);

    if (!record.officialSourceUrl && record.sourceCheckStatus === "not-located" && typeof record.sourceNote === "string" && record.sourceNote.trim()) {
      // Explicit source-missing discovery pages offer no entry or source CTA.
      return;
    }
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
    (!record.listedAt || record.listedAt <= asOfDate) &&
    (!record.reviewDueAt || record.reviewDueAt >= asOfDate) &&
    (normalizeDate(record.closingDate)
      ? record.closingDate >= asOfDate
      : Boolean(record.closingDateText && normalizeDate(record.reviewDueAt)))
  );
}

function getPublicUnderReview(records, options = {}) {
  return records
    .filter((record) => isPublicUnderReview(record, options))
    .sort((a, b) => (a.closingDate || "9999").localeCompare(b.closingDate || "9999") || a.brand.localeCompare(b.brand));
}

function getDetailPath(record) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id || "")) throw new Error("Invalid under-review id");
  return `${PUBLIC_PATH}${record.id}/`;
}

module.exports = {
  PUBLICATION_STATUS,
  VERIFICATION_STATUS,
  PUBLIC_PATH,
  validateRegistry,
  isPublicUnderReview,
  getPublicUnderReview,
  getDetailPath,
};
