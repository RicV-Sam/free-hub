const shared = require("../../shared/page-data.js");
const offerData = require("../../shared/offer-data.js");
const { isPublishedFreeResource } = require("./free-resource-publication.js");

function validateEditorialPicks(picks, collections) {
  if (!Array.isArray(picks)) throw new Error("Editorial picks must be an array.");
  const keys = new Set();
  for (const pick of picks) {
    const key = `${pick.surface}:${pick.kind}:${pick.recordId}`;
    if (keys.has(key)) throw new Error(`Duplicate editorial pick: ${key}`);
    keys.add(key);
    if (!["home", "monthly"].includes(pick.surface) || !["competition", "resource", "offer"].includes(pick.kind)) throw new Error(`Invalid editorial destination: ${key}`);
    if (pick.surface === "monthly" && pick.kind !== "competition") throw new Error("The monthly shortlist contains competitions only.");
    for (const field of ["recordId", "reason", "caution", "reviewedAt", "reviewDueAt"]) {
      if (!String(pick[field] || "").trim()) throw new Error(`Editorial pick missing ${field}: ${key}`);
    }
    const days = shared.getCalendarDay(pick.reviewDueAt) - shared.getCalendarDay(pick.reviewedAt);
    if (!Number.isFinite(days) || days < 1 || days > 7) throw new Error(`Editorial review must be due within seven days: ${key}`);
    if (!collections[pick.kind].some((item) => item.id === pick.recordId)) throw new Error(`Unknown editorial record: ${key}`);
  }
}

function getEligibleEditorialPicks(picks, collections, surface, today = shared.getReferenceDate()) {
  return picks.filter((pick) => pick.surface === surface && pick.reviewedAt <= today && pick.reviewDueAt >= today).flatMap((pick) => {
    const record = collections[pick.kind].find((item) => item.id === pick.recordId);
    if (!record) return [];
    if (record.doNotPublish || ["held", "withdrawn", "expired", "rejected", "archived-low-value"].includes(record.publicationStatus) || ["retired", "withdrawn", "expired", "unavailable"].includes(record.availability)) return [];
    let eligible = false;
    if (pick.kind === "competition") eligible = shared.isPublicCompetition(record) && record.closingDate >= today;
    if (pick.kind === "resource") eligible = isPublishedFreeResource(record) && !["held", "withdrawn", "expired"].includes(record.publicationStatus) && !["withdrawn", "expired", "unavailable"].includes(record.availability);
    if (pick.kind === "offer") eligible = offerData.isPublicOffer(record, { asOfDate: today });
    if (record.reviewDueAt && record.reviewDueAt < today) eligible = false;
    if (!eligible) return [];
    const validThrough = [pick.reviewDueAt, record.reviewDueAt, record.closingDate, record.expiresAt].filter(Boolean).sort()[0];
    return [{ ...pick, record, validThrough }];
  });
}

module.exports = { validateEditorialPicks, getEligibleEditorialPicks };
