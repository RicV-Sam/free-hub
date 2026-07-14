const fs = require("fs");
const path = require("path");

const LEGACY_ARCHIVE_COST_TYPE = Symbol.for("freehub.legacyArchiveCostType");
const ALLOWED_COMPATIBILITY_TYPES = new Set([
  "free-entry",
  "purchase-required",
  "paid-entry",
  "sms-rate",
  "app-required",
  "account-required",
  "membership-required",
]);
const DEFAULT_MANIFEST_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "archive",
  "legacy-cost-classifications.json"
);

function loadLegacyArchiveCostManifest(manifestPath = DEFAULT_MANIFEST_PATH) {
  const entries = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(entries)) {
    throw new Error("Legacy archive cost manifest must be an array.");
  }

  const seenIds = new Set();
  entries.forEach((entry, index) => {
    const id = String(entry && entry.id ? entry.id : "").trim();
    const entryCostType = String(entry && entry.entryCostType ? entry.entryCostType : "").trim();
    if (!id || seenIds.has(id)) {
      throw new Error(`Legacy archive cost manifest has a missing or duplicate id at index ${index}.`);
    }
    if (!ALLOWED_COMPATIBILITY_TYPES.has(entryCostType)) {
      throw new Error(`Legacy archive cost manifest has invalid entryCostType for ${id}: ${entryCostType || "missing"}.`);
    }
    if (Object.keys(entry).sort().join(",") !== "entryCostType,id") {
      throw new Error(`Legacy archive cost manifest has unexpected fields for ${id}.`);
    }
    seenIds.add(id);
  });

  return entries.slice().sort((left, right) => left.id.localeCompare(right.id));
}

function applyLegacyArchiveCostCompatibility(records, options = {}) {
  const manifest = options.manifest || loadLegacyArchiveCostManifest(options.manifestPath);
  const manifestById = new Map(manifest.map((entry) => [entry.id, entry.entryCostType]));
  const matchedIds = new Set();

  const compatibleRecords = records.map((record) => {
    const entryCostType = manifestById.get(record.id);
    if (!entryCostType) {
      return record;
    }

    if (record.entryCostType) {
      throw new Error(`Legacy archive cost compatibility entry already has entryCostType: ${record.id}.`);
    }
    if (record.archiveReason !== "expired" || record.verificationStatus !== "published") {
      throw new Error(`Legacy archive cost compatibility entry is not a published expired archive: ${record.id}.`);
    }

    const compatibleRecord = { ...record };
    Object.defineProperty(compatibleRecord, LEGACY_ARCHIVE_COST_TYPE, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: entryCostType,
    });
    matchedIds.add(record.id);
    return compatibleRecord;
  });

  const missingIds = [...manifestById.keys()].filter((id) => !matchedIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(`Legacy archive cost compatibility records are missing: ${missingIds.join(", ")}.`);
  }

  return compatibleRecords;
}

module.exports = {
  ALLOWED_COMPATIBILITY_TYPES,
  LEGACY_ARCHIVE_COST_TYPE,
  applyLegacyArchiveCostCompatibility,
  loadLegacyArchiveCostManifest,
};
