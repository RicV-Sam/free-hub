const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const shared = require("../../shared/page-data.js");
const discoveryData = require("../../shared/discovery-data.js");
const adapters = require("../../scripts/lib/discovery-adapters.js");
const competitionFixtures = require("../fixtures/competition-lifecycle.json");
const opportunityFixtures = require("../fixtures/opportunity-contracts.json");

function offerFixture(overrides = {}) {
  return {
    id: "fixture-deal", slug: "fixture-deal", type: "deal", brand: "Fixture Store", brandSlug: "fixture-store",
    title: "Fixture promotion", summary: "A fixture promotion for contract testing.",
    destinationUrl: "https://example.co.za/promotion", sourceUrl: "https://example.co.za/terms", category: "groceries",
    startsAt: "2026-08-01", expiresAt: "2026-08-31", lastChecked: "2026-08-07", reviewDueAt: "2026-08-14",
    terms: "Test fixture only.", publicationStatus: "published", verificationStatus: "verified", country: "ZA",
    affiliate: false, sponsored: false, publishedAt: "2026-08-07", updatedAt: "2026-08-07", ...overrides,
  };
}

test("cross-vertical summaries preserve type identity and canonical paths", () => {
  shared.setReferenceDate("2026-08-10");
  const competition = {
    ...competitionFixtures.activePublic,
    summary: "A public competition fixture.", category: "Cash", lastChecked: "2026-08-07",
  };
  const offer = offerFixture();
  const opportunity = opportunityFixtures.publishedSample;
  const summaries = adapters.createDiscoveryProjection({
    competitions: [competition],
    offers: [offer],
    opportunities: [opportunity],
    offerOptions: { asOfDate: "2026-08-10" },
    opportunityOptions: { asOfDate: "2026-07-14", allowedSourceHosts: ["samples.example.org"] },
  });
  assert.deepEqual(summaries.map((summary) => summary.contentType), ["competition", "promotion", "free_sample"]);
  assert.deepEqual(summaries.map((summary) => summary.path), [
    "/competition/fixture-active-public/", "/deal/fixture-deal/", "/opportunity/fixture-current-sample/",
  ]);
  assert.equal(discoveryData.validateDiscoveryRegistry(summaries).valid, true);
  assert.equal(Object.isFrozen(summaries[0]), true);
});

test("adapters cannot project private, expired, or overdue source records", () => {
  shared.setReferenceDate("2026-08-10");
  assert.throws(() => adapters.createCompetitionSummary(competitionFixtures.held), /public and active gates/);
  assert.throws(() => adapters.createOfferSummary(offerFixture({ reviewDueAt: "2026-08-09" }), { asOfDate: "2026-08-10" }), /public gate/);
  assert.throws(() => adapters.createOpportunitySummary(opportunityFixtures.publishedSample, {
    asOfDate: "2026-07-18", allowedSourceHosts: ["samples.example.org"],
  }), /public gate/);
});

test("registry rejects duplicate cross-vertical IDs and paths", () => {
  const summary = discoveryData.createDiscoverySummary({
    id: "promotion:fixture", entityKind: "offer", contentType: "promotion", title: "Fixture",
    summary: "Fixture summary.", path: "/deal/fixture/", labels: ["Verified"], merchantId: "fixture-store",
  });
  assert.equal(discoveryData.validateDiscoveryRegistry([summary, summary]).valid, false);
  assert.throws(() => discoveryData.createDiscoverySummary({ ...summary, path: "https://example.com/" }), /root-relative/);
});

test("the committed Discovery schema compiles and matches runtime summaries", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/schemas/discovery-item.schema.json"), "utf8"));
  const validate = ajv.compile(schema);
  const summary = discoveryData.createDiscoverySummary({
    id: "coupon:fixture", entityKind: "offer", contentType: "coupon", title: "Fixture coupon",
    summary: "Fixture summary.", path: "/coupon/fixture/", labels: ["Verified", "Coupon code"],
    merchantId: "fixture-store", category: "groceries", lastVerifiedAt: "2026-08-07",
  });
  assert.equal(validate(summary), true);
});
