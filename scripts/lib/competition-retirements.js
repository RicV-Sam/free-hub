const crypto = require("node:crypto");
const shared = require("../../shared/page-data.js");
const registry = require("../../data/competition-retirements.json");

const CHECKS = ["traffic", "backlinks", "claims", "results"];
const HASH = /^[a-f0-9]{64}$/;
const DAY = 86400000;
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}

// Bind approval to every version in both collections. Routine archive-copy metadata
// does not change facts; any other edit requires a new review.
function sourceHash(records) {
  const versions = records.map(({ archivedAt, archiveReason, ...facts }) => JSON.stringify(stable(facts)));
  return crypto.createHash("sha256").update(JSON.stringify([...new Set(versions)].sort())).digest("hex");
}

function hasResultEvidence(record) {
  return ["resultStatus", "resultSourceUrl", "resultSummary", "winnerDisplayName", "resultPrize", "resultFulfilmentStatus"]
    .some(key => String(record[key] || "").trim());
}

function reviewBlockers(review, records, asOfDate) {
  const blockers = [];
  if (!records.length) return ["Listing is missing from the source collections."];
  if (!validDate(asOfDate)) throw new Error("Archive review requires a valid South African calendar date.");
  if (!validDate(review.reviewedAt) || review.reviewedAt > asOfDate) blockers.push("Review date is missing, invalid or in the future.");
  if (review.sourceHash !== sourceHash(records)) blockers.push("Source records have changed since review.");
  if (records.some(record => !validDate(record.closingDate) || record.closingDate >= asOfDate)) blockers.push("Competition is active or its closing date is invalid.");
  if (records.some(hasResultEvidence)) blockers.push("Result evidence must be preserved and reviewed separately.");
  for (const check of CHECKS) {
    const evidence = review[check];
    if (!evidence || evidence.status !== "clear" || !validDate(evidence.reviewedAt)
      || evidence.reviewedAt > review.reviewedAt || !HASH.test(evidence.evidenceHash || "")
      || typeof evidence.note !== "string" || evidence.note.trim().length < 20) {
      blockers.push(`${check} review is incomplete.`);
    }
  }
  const traffic = review.traffic || {};
  if (!validDate(traffic.startDate) || !validDate(traffic.endDate) || traffic.endDate > review.reviewedAt
    || (Date.parse(traffic.endDate) - Date.parse(traffic.startDate)) / DAY !== 27
    || traffic.complete !== true || traffic.googleClicks !== 0 || traffic.landingSessions !== 0) {
    blockers.push("Complete, aligned 28-day zero-click and zero-session evidence is required.");
  }
  if (validDate(review.reviewedAt) && validDate(traffic.endDate)
    && (Date.parse(review.reviewedAt) - Date.parse(traffic.endDate)) / DAY > 7) blockers.push("Traffic evidence is older than the latest review window.");
  if (records.some(record => validDate(record.closingDate)
    && (Date.parse(traffic.endDate) - Date.parse(record.closingDate)) / DAY < 90)) blockers.push("Archive is less than 90 days old at the traffic cutoff.");
  for (const check of ["claims", "results"]) {
    const evidence = review[check] || {};
    if (!Array.isArray(evidence.sourceUrls) || !evidence.sourceUrls.length || evidence.sourceUrls.some(url => {
      try { const source = new URL(url); return source.protocol !== "https:" || !!source.username || !!source.password; } catch { return true; }
    })) blockers.push(`${check} review needs official source references.`);
  }
  if (review.claims?.retainUntil && (!validDate(review.claims.retainUntil) || review.claims.retainUntil >= review.reviewedAt)) blockers.push("Prize use or claim period is unresolved or ongoing.");
  if (review.results?.usefulResult !== false) blockers.push("Useful results have not been ruled out.");
  if (review.backlinks?.preserve !== false) blockers.push("Backlink preservation is unresolved.");
  return [...new Set(blockers)];
}

// Only this compact receipt is committed. Analytics, link exports and snapshots
// stay in ignored private research storage.
function approvalFromReview(review, records, asOfDate) {
  if (typeof review.id !== "string" || records.some(record => record.id !== review.id)) throw new Error("Review ID does not match the source records.");
  const blockers = reviewBlockers(review, records, asOfDate);
  if (blockers.length) throw new Error(`Cannot retire ${review.id}: ${blockers.join(" ")}`);
  if (!validDate(review.effectiveAt) || review.effectiveAt < review.reviewedAt) throw new Error("Retirement effective date must be on or after review.");
  return { id: review.id, sourceHash: review.sourceHash, reviewedAt: review.reviewedAt,
    effectiveAt: review.effectiveAt, evidenceHash: crypto.createHash("sha256").update(JSON.stringify(stable(review))).digest("hex"),
    checks: Object.fromEntries(CHECKS.map(check => [check, "clear"])),
    reason: "Reviewed closed archive with no preservation need identified." };
}

function applyCompetitionRetirements(primary, archive, { asOfDate = shared.getReferenceDate(), retirementRegistry = registry } = {}) {
  if (!validDate(asOfDate)) throw new Error("Retirement filtering requires a valid calendar date.");
  if (retirementRegistry?.schemaVersion !== 1 || !Array.isArray(retirementRegistry.retirements)) throw new Error("Invalid competition retirement registry.");
  const byId = new Map();
  for (const record of [...primary, ...archive]) {
    const records = byId.get(record.id) || [];
    records.push(record);
    byId.set(record.id, records);
  }
  const seen = new Set();
  const retiredIds = new Set();
  for (const receipt of retirementRegistry.retirements) {
    if (!receipt || typeof receipt.id !== "string" || seen.has(receipt.id) || !HASH.test(receipt.sourceHash || "")
      || !HASH.test(receipt.evidenceHash || "") || !validDate(receipt.reviewedAt) || !validDate(receipt.effectiveAt)
      || receipt.effectiveAt < receipt.reviewedAt || CHECKS.some(check => receipt.checks?.[check] !== "clear")) {
      throw new Error("Incomplete or duplicate competition retirement approval.");
    }
    seen.add(receipt.id);
    if (receipt.effectiveAt > asOfDate) continue; // Historical builds retain the original archives.
    const records = byId.get(receipt.id) || [];
    if (!records.length || sourceHash(records) !== receipt.sourceHash || records.some(record => !validDate(record.closingDate)
      || record.closingDate >= receipt.reviewedAt || hasResultEvidence(record))) {
      throw new Error(`Retirement approval for ${receipt.id} is stale or conflicts with active/result evidence; re-review it.`);
    }
    retiredIds.add(receipt.id);
  }
  const keep = record => !retiredIds.has(record.id);
  const retiredSlugs = new Set([...primary, ...archive].filter(record => retiredIds.has(record.id)).map(shared.getCompetitionSlug));
  if ([...primary, ...archive].some(record => keep(record) && retiredSlugs.has(shared.getCompetitionSlug(record)))) {
    throw new Error("Retired and retained records share a detail URL; review the duplicate group before retirement.");
  }
  return { primary: primary.filter(keep), archive: archive.filter(keep), retiredIds };
}

module.exports = { sourceHash, reviewBlockers, approvalFromReview, applyCompetitionRetirements };
