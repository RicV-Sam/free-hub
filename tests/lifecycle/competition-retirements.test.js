const assert = require("node:assert/strict");
const test = require("node:test");
const { sourceHash, reviewBlockers, approvalFromReview, applyCompetitionRetirements } = require("../../scripts/lib/competition-retirements.js");
const { buildMobileFeed } = require("../../scripts/lib/mobile-feed.js");
const shared = require("../../shared/page-data.js");

// Synthetic review evidence, deliberately separate from real campaigns.
const record = { id: "synthetic-retirement-test", title: "Synthetic closed competition", brand: "Test promoter",
  closingDate: "2026-06-01", url: "https://example.org/synthetic-test", verificationStatus: "published" };
const archived = { ...record, archivedAt: "2026-06-02", archiveReason: "expired" };
const evidence = { status: "clear", reviewedAt: "2026-10-04", evidenceHash: "a".repeat(64),
  note: "Synthetic evidence for the retirement regression tests only." };
function review(records = [record, archived]) {
  return { id: record.id, sourceHash: sourceHash(records), reviewedAt: "2026-10-04", effectiveAt: "2026-10-04",
    traffic: { ...evidence, startDate: "2026-09-02", endDate: "2026-09-29", complete: true, googleClicks: 0, landingSessions: 0 },
    backlinks: { ...evidence, preserve: false }, claims: { ...evidence, sourceUrls: [record.url] },
    results: { ...evidence, sourceUrls: [record.url], usefulResult: false } };
}
const approval = input => ({ schemaVersion: 1, retirements: [approvalFromReview(input, [record, archived], "2026-10-04")] });

test("a cleared retirement removes both collections, retains raw facts and stays out of the mobile feed", () => {
  const input = review();
  const state = applyCompetitionRetirements([record], [archived], { asOfDate: "2026-10-04", retirementRegistry: approval(input) });
  assert.deepEqual(state.primary, []);
  assert.deepEqual(state.archive, []);
  assert.deepEqual([...state.retiredIds], [record.id]);
  assert.equal(record.title, "Synthetic closed competition");
  assert.deepEqual(buildMobileFeed(state.primary, { asOfDate: "2026-10-04" }).competitions, []);
  shared.setReferenceDate();
});

test("no approval or a date before retirement preserves an ordinary closed archive", () => {
  for (const options of [{ asOfDate: "2026-10-04", retirementRegistry: { schemaVersion: 1, retirements: [] } },
    { asOfDate: "2026-09-08", retirementRegistry: approval(review()) }]) {
    const state = applyCompetitionRetirements([record], [archived], options);
    assert.equal(state.primary.length, 1);
    assert.equal(state.archive.length, 1);
  }
});

test("unknown backlinks, incomplete traffic, prize obligations and useful results each block approval", () => {
  const changes = [
    input => { input.backlinks.status = "unavailable"; },
    input => { input.backlinks.preserve = true; },
    input => { input.traffic.complete = false; },
    input => { input.traffic.googleClicks = null; },
    input => { input.traffic.landingSessions = 1; },
    input => { input.traffic.startDate = "2026-09-03"; },
    input => { input.traffic.startDate = "2026-08-30"; input.traffic.endDate = "2026-09-26"; },
    input => { input.claims.retainUntil = "2027-03-31"; },
    input => { input.results.usefulResult = true; },
    input => { input.results.sourceUrls = []; },
    input => { input.reviewedAt = "2026-02-30"; },
    input => { input.reviewedAt = "2026-10-05"; },
  ];
  for (const change of changes) {
    const input = review(); change(input);
    assert.ok(reviewBlockers(input, [record, archived], "2026-10-04").length);
    assert.throws(() => approval(input), /Cannot retire/);
  }
});

test("new or altered facts, duplicate approvals and added result evidence stop stale retirement", () => {
  const options = { asOfDate: "2026-10-04", retirementRegistry: approval(review()) };
  for (const change of [{ closingDate: "2026-12-01" }, { resultSourceUrl: "https://example.org/results" },
    { title: "Corrected campaign title" }, { lastChecked: "2026-10-04" }]) {
    assert.throws(() => applyCompetitionRetirements([{ ...record, ...change }], [archived], options), /stale/);
  }
  const duplicate = { ...options.retirementRegistry, retirements: [...options.retirementRegistry.retirements, ...options.retirementRegistry.retirements] };
  assert.throws(() => applyCompetitionRetirements([record], [archived], { ...options, retirementRegistry: duplicate }), /duplicate/);
  assert.throws(() => applyCompetitionRetirements([], [], options), /stale/);
  assert.throws(() => applyCompetitionRetirements([record, { ...record, id: record.id.toUpperCase() }], [archived], options), /share a detail URL/);
});

test("the gate protects result evidence even if other checks are mistakenly cleared", () => {
  const withResult = { ...record, resultStatus: "confirmed", resultSummary: "Synthetic result evidence" };
  assert.match(reviewBlockers(review([withResult]), [withResult], "2026-10-04").join(" "), /Result evidence/);
  const recent = { ...record, closingDate: "2026-09-01" };
  assert.match(reviewBlockers(review([recent]), [recent], "2026-10-04").join(" "), /90 days/);
});

test("source fingerprints ignore archive-copy bookkeeping and bind every distinct version", () => {
  assert.equal(sourceHash([record]), sourceHash([record, archived]));
  assert.notEqual(sourceHash([record]), sourceHash([record, { ...archived, prizeName: "Different prize" }]));
  assert.equal(sourceHash([record]), sourceHash([Object.fromEntries(Object.entries(record).reverse())]));
});
