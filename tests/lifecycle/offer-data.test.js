const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const offerData = require("../../shared/offer-data.js");
const { getOfferBaselineCounts } = require("../../scripts/lib/offer-baseline-counts.js");

function fixture(overrides = {}) {
  return {
    id: "fixture-coupon", slug: "fixture-coupon", type: "coupon", brand: "Fixture Store", brandSlug: "fixture-store",
    title: "Fixture development coupon", summary: "Test-only fixture.", couponCode: "TESTONLY",
    destinationUrl: "https://example.co.za/offer", sourceUrl: "https://example.co.za/terms", category: "groceries",
    startsAt: "2026-08-01", expiresAt: "2026-08-31", lastChecked: "2026-08-07", reviewDueAt: "2026-08-14",
    terms: "Test fixture only.", publicationStatus: "published", verificationStatus: "verified", country: "ZA",
    affiliate: false, sponsored: false, publishedAt: "2026-08-07", updatedAt: "2026-08-07", ...overrides,
  };
}

test("coupon and deal records validate with distinct code rules", () => {
  assert.equal(offerData.validateOffer(fixture()).valid, true);
  const deal = fixture({ id: "fixture-deal", slug: "fixture-deal", type: "deal" });
  delete deal.couponCode;
  assert.equal(offerData.validateOffer(deal).valid, true);
  assert.match(offerData.validateOffer(fixture({ couponCode: undefined })).errors.join(" "), /couponCode/);
  assert.match(offerData.validateOffer({ ...deal, couponCode: "NOT-ALLOWED" }).errors.join(" "), /must not include/);
});

test("offer categories use the controlled portal taxonomy", () => {
  assert.deepEqual(offerData.CATEGORIES, [
    "groceries", "restaurants-takeaways", "fashion", "beauty-health",
    "electronics-appliances", "home-garden", "baby-kids", "pets", "travel",
    "entertainment", "mobile-data", "banking-rewards", "sports-outdoors", "other",
  ]);
  assert.equal(offerData.CATEGORY_DEFINITIONS.groceries.label, "Groceries");
  assert.equal(offerData.CATEGORY_DEFINITIONS.other.indexable, false);
  assert.equal(offerData.validateOffer(fixture({ category: "electronics" })).valid, false);
});

test("public offers fail closed on lifecycle and review dates", () => {
  assert.equal(offerData.isPublicOffer(fixture(), { asOfDate: "2026-08-07" }), true);
  assert.equal(offerData.isPublicOffer(fixture(), {}), false);
  assert.equal(offerData.isPublicOffer(fixture({ publicationStatus: "review" }), { asOfDate: "2026-08-07" }), false);
  assert.equal(offerData.isPublicOffer(fixture({ reviewDueAt: "2026-08-06" }), { asOfDate: "2026-08-07" }), false);
  assert.equal(offerData.isPublicOffer(fixture({ expiresAt: "2026-08-06" }), { asOfDate: "2026-08-07" }), false);
});

test("offer routes and exact feature flag are safe", () => {
  assert.equal(offerData.getOfferPath(fixture()), "/coupon/fixture-coupon/");
  assert.equal(offerData.getOfferExitPath(fixture()), "/out/coupon/fixture-coupon/");
  assert.equal(offerData.isOfferFeatureEnabled("true"), true);
  assert.equal(offerData.isOfferFeatureEnabled("TRUE"), false);
  assert.throws(() => offerData.getOfferPath("../unsafe"), /valid offer/);
});

test("registry rejects duplicate identifiers and production records are validated", () => {
  assert.equal(offerData.validateOfferRegistry([fixture(), fixture()]).valid, false);
  const registry = require("../../data/offers.json");
  assert.equal(registry.length, 26);
  assert.equal(offerData.validateOfferRegistry(registry).valid, true);
  assert.deepEqual(
    registry.reduce((counts, offer) => ({ ...counts, [offer.type]: counts[offer.type] + 1 }), { coupon: 0, deal: 0 }),
    { coupon: 4, deal: 22 }
  );
  const allowedSourceHosts = new Set([
    "www.capitecbank.co.za", "www.gadventures.com", "ucount.standardbank.co.za",
    "www.discovery.co.za", "www.unionpayintl.com", "www.mrp.com",
    "www.woolworths.co.za", "www.fnb.co.za", "www.1life.co.za",
    "www.dischem.co.za", "support.multiply.co.za", "citylodgehotels.com",
    "www.andbeyond.com", "www.bookmundi.com", "steers.co.za", "play.google.com",
    "www.cellc.co.za", "www.hirschs.co.za", "www.makro.co.za",
    "www.dunloptyres.co.za", "www.clarins.co.za",
  ]);
  assert.equal(registry.every((offer) => allowedSourceHosts.has(new URL(offer.sourceUrl).hostname)), true);
});

test("the committed offer schema compiles and matches runtime code rules", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/schemas/offer.schema.json"), "utf8"));
  const validate = ajv.compile(schema);
  assert.equal(validate(fixture()), true);
  const deal = fixture({ id: "fixture-deal", slug: "fixture-deal", type: "deal" });
  delete deal.couponCode;
  assert.equal(validate(deal), true);
  assert.equal(validate({ ...deal, couponCode: "NOT-ALLOWED" }), false);
});

test("offer baseline counts distinguish generated routes from indexable routes", () => {
  const registry = require("../../data/offers.json");
  const counts = getOfferBaselineCounts({ offers: registry, enabled: true, asOfDate: "2026-08-07" });
  assert.equal(counts.activeOffers.length, 23);
  assert.equal(counts.generatedFileCount, 79);
  assert.equal(counts.sitemapUrlCount, 36);
  assert.deepEqual(
    getOfferBaselineCounts({ offers: registry, enabled: false, asOfDate: "2026-08-07" }),
    { activeOffers: [], generatedFileCount: 0, sitemapUrlCount: 0 }
  );
});
