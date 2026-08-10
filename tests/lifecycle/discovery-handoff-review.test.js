const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildReviewRegistry,
  summarizeRegistry,
  validateHandoff,
} = require("../../scripts/lib/discovery-handoff-review.js");

function row(overrides = {}) {
  return {
    localCandidateId: 1,
    vertical: "promotion",
    candidateKey: "fixture-promotion",
    reviewStatus: "approved_for_handoff",
    reviewerNotes: "Official source reviewed.",
    candidate: {
      vertical: "promotion",
      candidateKey: "fixture-promotion",
      merchantId: "fixture-store",
      merchantName: "Fixture Store",
      title: "Fixture promotion",
      summary: "Fixture summary.",
      sourceUrl: "https://example.co.za/promotion",
      destinationUrl: "https://example.co.za/promotion",
      checkedAt: "2026-08-10",
      country: "ZA",
      evidenceNotes: "Official page reviewed.",
    },
    ...overrides,
  };
}

function handoff(rows = [row()]) {
  return {
    handoffVersion: 1,
    generatedAt: "2026-08-10T12:00:00.000Z",
    asOfDate: "2026-08-10",
    rows,
    warnings: [],
  };
}

test("validates all four Discovery verticals and rejects publication authority", () => {
  const rows = ["promotion", "coupon", "free_sample", "product_testing"].map((vertical, index) => {
    const candidateKey = `fixture-${vertical}`;
    const candidate = { ...row().candidate, vertical, candidateKey };
    if (["free_sample", "product_testing"].includes(vertical)) {
      delete candidate.merchantId;
      delete candidate.merchantName;
      candidate.providerId = "fixture-provider";
      candidate.providerName = "Fixture Provider";
    }
    return row({ localCandidateId: index + 1, vertical, candidateKey, candidate });
  });
  assert.equal(validateHandoff(handoff(rows)).valid, true);
  const unsafe = handoff([{ ...row(), candidate: { ...row().candidate, publicationStatus: "published" } }]);
  assert.match(validateHandoff(unsafe).errors.join(" "), /FreeHub-controlled field/);
});

test("stages candidates privately and identifies an existing public URL match", () => {
  const registry = buildReviewRegistry({
    handoff: handoff(),
    offers: [{ id: "existing-offer", title: "Existing", sourceUrl: "https://example.co.za/promotion" }],
    opportunities: [],
    nowIso: "2026-08-10T13:00:00.000Z",
  });
  assert.equal(registry.publicationPolicy, "private_editorial_review_only");
  assert.equal(registry.records[0].matchState, "existing_public_match");
  assert.equal(registry.records[0].editorialStatus, "pending_review");
  assert.equal(registry.records[0].publicationDecision, false);
  assert.equal("publicationStatus" in registry.records[0], false);
  assert.deepEqual(summarizeRegistry(registry), {
    records: 1,
    newCandidates: 0,
    existingPublicMatches: 1,
    pendingReview: 1,
    byVertical: { promotion: 1 },
  });
});

test("re-import preserves FreeHub editorial decisions while refreshing source evidence", () => {
  const first = buildReviewRegistry({ handoff: handoff(), nowIso: "2026-08-10T13:00:00.000Z" });
  first.records[0].editorialStatus = "accepted_for_curation";
  first.records[0].editorialNotes = "Map into an offer only after a fresh expiry check.";
  const changed = handoff([{ ...row(), reviewerNotes: "Official source reviewed again." }]);
  const second = buildReviewRegistry({
    handoff: changed,
    existingRegistry: first,
    nowIso: "2026-08-11T13:00:00.000Z",
  });
  assert.equal(second.records[0].editorialStatus, "accepted_for_curation");
  assert.equal(second.records[0].editorialNotes, "Map into an offer only after a fresh expiry check.");
  assert.equal(second.records[0].firstImportedAt, "2026-08-10T13:00:00.000Z");
  assert.equal(second.records[0].sourceReviewerNotes, "Official source reviewed again.");
  assert.equal(second.records[0].publicationDecision, false);
});
