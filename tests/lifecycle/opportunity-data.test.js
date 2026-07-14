const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const opportunityData = require("../../shared/opportunity-data.js");

const rootDir = path.resolve(__dirname, "..", "..");
const fixtures = JSON.parse(
  fs.readFileSync(path.join(rootDir, "tests", "fixtures", "opportunity-contracts.json"), "utf8")
);
const publicOptions = {
  asOfDate: "2026-07-14",
  allowedSourceHosts: ["example.org"],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, "data", "schemas", name), "utf8"));
}

test("committed JSON schemas compile and accept every strict contract fixture", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  const requirementSchema = loadSchema("requirement.schema.json");
  const resourceSchema = loadSchema("free-resource.schema.json");
  const summarySchema = loadSchema("discovery-summary.schema.json");
  const opportunitySchema = loadSchema("opportunity.schema.json");
  [requirementSchema, resourceSchema, summarySchema, opportunitySchema].forEach((schema) => ajv.addSchema(schema));

  assert.equal(ajv.getSchema(requirementSchema.$id)(fixtures.requirement), true);
  assert.equal(ajv.getSchema(resourceSchema.$id)(fixtures.freeResource), true);
  [
    fixtures.publishedSample,
    fixtures.publishedProductTesting,
    fixtures.publishedBirthday,
    fixtures.publishedCourse,
    fixtures.unsupportedDraft,
  ].forEach((fixture) => assert.equal(ajv.getSchema(opportunitySchema.$id)(fixture), true));

  const summary = opportunityData.createDiscoverySummary({
    id: "fixture-summary",
    entityKind: "opportunity",
    contentType: "Free sample",
    title: "Fixture summary",
    summary: "A summary created only from supplied facts.",
    path: "/free-samples-south-africa/",
    labels: ["Verified"],
  });
  assert.equal(ajv.getSchema(summarySchema.$id)(summary), true);

  const invalid = clone(fixtures.publishedSample);
  invalid.details.unexpected = true;
  assert.equal(ajv.getSchema(opportunitySchema.$id)(invalid), false);
  const unsupportedDetails = clone(fixtures.unsupportedDraft);
  unsupportedDetails.details.unreviewed = true;
  assert.equal(ajv.getSchema(opportunitySchema.$id)(unsupportedDetails), false);
  assert.equal(opportunityData.validateOpportunity(unsupportedDetails).valid, false);
});

test("runtime validators enforce strict contracts and legacy FreeResource compatibility", () => {
  assert.equal(opportunityData.validateRequirement(fixtures.requirement).valid, true);
  assert.equal(opportunityData.validateFreeResource(fixtures.freeResource).valid, true);
  assert.equal(opportunityData.validateOpportunity(fixtures.publishedSample).valid, true);
  assert.equal(opportunityData.validateOpportunity(fixtures.publishedProductTesting).valid, true);
  assert.equal(opportunityData.validateOpportunity(fixtures.publishedBirthday).valid, true);
  assert.equal(opportunityData.validateOpportunity(fixtures.publishedCourse).valid, true);

  const unsupported = opportunityData.validateOpportunity(fixtures.unsupportedDraft);
  assert.equal(unsupported.valid, true);
  assert.equal(unsupported.typeSupported, false);

  const legacyResources = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "free-resources.json"), "utf8"));
  assert.equal(legacyResources.length, 18);
  assert.equal(opportunityData.validateFreeResourceRegistry(legacyResources, { legacy: true }).valid, true);
  assert.equal(opportunityData.validateFreeResource(legacyResources[0]).valid, false);

  const unexpected = clone(fixtures.freeResource);
  unexpected.unreviewedField = true;
  assert.equal(opportunityData.validateFreeResource(unexpected).valid, false);
});

test("type-specific details reject missing, contradictory, and misspelled facts", () => {
  const sample = clone(fixtures.publishedSample);
  sample.details.selectionRequired = true;
  assert.equal(opportunityData.validateOpportunity(sample).valid, false);

  const testing = clone(fixtures.publishedProductTesting);
  testing.details.stockState = "maybe";
  assert.equal(opportunityData.validateOpportunity(testing).valid, false);

  const birthday = clone(fixtures.publishedBirthday);
  birthday.details.birthdayWindow.beforeDays = -1;
  assert.equal(opportunityData.validateOpportunity(birthday).valid, false);

  const course = clone(fixtures.publishedCourse);
  course.details.extraClaim = "invented";
  assert.equal(opportunityData.validateOpportunity(course).valid, false);

  const impossibleDates = clone(fixtures.publishedSample);
  impossibleDates.reviewDueAt = "2026-07-01";
  assert.equal(opportunityData.validateOpportunity(impossibleDates).valid, false);
});

test("the public gate admits only current, verified, supported official-source records", () => {
  assert.equal(opportunityData.isPublicOpportunity(fixtures.publishedSample, publicOptions), true);
  assert.equal(opportunityData.isPublicOpportunity(fixtures.publishedProductTesting, publicOptions), true);
  assert.equal(opportunityData.isPublicOpportunity(fixtures.publishedBirthday, publicOptions), true);
  assert.equal(opportunityData.isPublicOpportunity(fixtures.publishedCourse, publicOptions), true);
  assert.equal(opportunityData.isPublicOpportunity(fixtures.unsupportedDraft, publicOptions), false);

  ["draft", "review", "held", "expired", "rejected"].forEach((publicationStatus) => {
    const record = clone(fixtures.publishedSample);
    record.publicationStatus = publicationStatus;
    assert.equal(opportunityData.isPublicOpportunity(record, publicOptions), false);
  });

  ["unverified", "source_found", "requirements_checked", "verification_due", "source_changed", "expired", "rejected"].forEach(
    (verificationStatus) => {
      const record = clone(fixtures.publishedSample);
      record.verificationStatus = verificationStatus;
      assert.equal(opportunityData.isPublicOpportunity(record, publicOptions), false);
    }
  );
});

test("publication dates and availability are deterministic and inclusive", () => {
  assert.equal(
    opportunityData.isPublicOpportunity(fixtures.publishedSample, { ...publicOptions, asOfDate: "2026-07-17" }),
    true
  );
  assert.equal(
    opportunityData.isPublicOpportunity(fixtures.publishedSample, { ...publicOptions, asOfDate: "2026-07-18" }),
    false
  );
  const expiryBoundary = clone(fixtures.publishedSample);
  expiryBoundary.reviewDueAt = "2026-08-01";
  assert.equal(opportunityData.isPublicOpportunity(expiryBoundary, { ...publicOptions, asOfDate: "2026-07-31" }), true);
  assert.equal(opportunityData.isPublicOpportunity(expiryBoundary, { ...publicOptions, asOfDate: "2026-08-01" }), false);

  const future = clone(fixtures.publishedSample);
  future.startsAt = "2026-07-20";
  assert.equal(opportunityData.isPublicOpportunity(future, publicOptions), false);

  const recurring = clone(fixtures.publishedBirthday);
  recurring.expiresAt = "2026-01-01";
  assert.equal(opportunityData.isPublicOpportunity(recurring, publicOptions), true);
  assert.equal(opportunityData.isPublicOpportunity(recurring, { ...publicOptions, asOfDate: "not-a-date" }), false);
  assert.equal(opportunityData.isPublicOpportunity(recurring, { allowedSourceHosts: ["example.org"] }), false);
});

test("cost and requirement mismatches fail closed, including strict free-only collections", () => {
  assert.equal(
    opportunityData.isPublicOpportunity(fixtures.publishedSample, { ...publicOptions, strictFreeOnly: true }),
    true
  );
  assert.equal(
    opportunityData.isPublicOpportunity(fixtures.publishedProductTesting, { ...publicOptions, strictFreeOnly: true }),
    false
  );

  const unclear = clone(fixtures.publishedSample);
  unclear.costClassification = "unclear";
  assert.equal(opportunityData.isPublicOpportunity(unclear, publicOptions), false);

  const competitionOnlyCost = clone(fixtures.publishedSample);
  competitionOnlyCost.costClassification = "free_entry";
  assert.equal(opportunityData.isPublicOpportunity(competitionOnlyCost, publicOptions), false);

  const missingAccountRequirement = clone(fixtures.publishedProductTesting);
  missingAccountRequirement.requirements = missingAccountRequirement.requirements.filter((item) => item.kind !== "account");
  assert.equal(opportunityData.isPublicOpportunity(missingAccountRequirement, publicOptions), false);

  const missingBirthdayIdentity = clone(fixtures.publishedBirthday);
  missingBirthdayIdentity.requirements = missingBirthdayIdentity.requirements.filter((item) => item.kind !== "identity");
  assert.equal(opportunityData.isPublicOpportunity(missingBirthdayIdentity, publicOptions), false);

  const paidDelivery = clone(fixtures.publishedSample);
  paidDelivery.costClassification = "delivery_fee";
  paidDelivery.details.deliveryCharge = 49;
  paidDelivery.requirements.push({ kind: "delivery", required: true, label: "R49 delivery fee" });
  assert.equal(opportunityData.isPublicOpportunity(paidDelivery, publicOptions), true);
  assert.equal(opportunityData.isPublicOpportunity(paidDelivery, { ...publicOptions, strictFreeOnly: true }), false);

  const unclearCertificate = clone(fixtures.publishedCourse);
  unclearCertificate.details.certificateCost = "unclear";
  assert.equal(opportunityData.isPublicOpportunity(unclearCertificate, publicOptions), false);
});

test("official-source policy rejects previews, shorteners, affiliates, and non-allowlisted hosts", () => {
  const preview = clone(fixtures.publishedSample);
  preview.sourceUrl = "https://samples.example.org/preview/current-sample";
  assert.equal(opportunityData.isPublicOpportunity(preview, publicOptions), false);

  const affiliate = clone(fixtures.publishedSample);
  affiliate.sourceUrl = "https://samples.example.org/current-sample?affiliate=123";
  assert.equal(opportunityData.isPublicOpportunity(affiliate, publicOptions), false);

  const shortener = clone(fixtures.publishedSample);
  shortener.sourceUrl = "https://bit.ly/sample";
  assert.equal(
    opportunityData.isPublicOpportunity(shortener, { ...publicOptions, allowedSourceHosts: ["bit.ly"] }),
    false
  );

  const aggregator = clone(fixtures.publishedSample);
  aggregator.sourceUrl = "https://offers-aggregator.example.net/sample";
  assert.equal(opportunityData.isPublicOpportunity(aggregator, publicOptions), false);
  assert.equal(opportunityData.isPublicOpportunity(fixtures.publishedSample, { ...publicOptions, allowedSourceHosts: [] }), false);
});

test("stock closure, unsupported types, and invalid details cannot leak through publication fields", () => {
  const closed = clone(fixtures.publishedProductTesting);
  closed.details.stockState = "closed";
  assert.equal(opportunityData.validateOpportunity(closed).valid, true);
  assert.equal(opportunityData.isPublicOpportunity(closed, publicOptions), false);

  const unsupported = clone(fixtures.unsupportedDraft);
  unsupported.publicationStatus = "published";
  unsupported.verificationStatus = "verified";
  unsupported.publishedAt = "2026-07-10";
  unsupported.costClassification = "completely_free";
  assert.equal(opportunityData.isPublicOpportunity(unsupported, publicOptions), false);

  const invalid = clone(fixtures.publishedSample);
  delete invalid.details.stockState;
  assert.equal(opportunityData.isPublicOpportunity(invalid, publicOptions), false);
});

test("feature parsing is disabled unless the exact environment value is true", () => {
  assert.equal(opportunityData.isOpportunityFeatureEnabled(undefined), false);
  assert.equal(opportunityData.isOpportunityFeatureEnabled("false"), false);
  assert.equal(opportunityData.isOpportunityFeatureEnabled("TRUE"), false);
  assert.equal(opportunityData.isOpportunityFeatureEnabled(true), false);
  assert.equal(opportunityData.isOpportunityFeatureEnabled("true"), true);
});

test("DiscoverySummary copies supplied facts and invents no optional metadata", () => {
  const input = {
    id: "fixture-summary",
    entityKind: "resource",
    contentType: "Product-testing panel",
    title: "Fixture panel",
    summary: "A durable panel rather than a current sample.",
    path: "/free-samples-south-africa/",
    labels: ["Resource"],
  };
  const summary = opportunityData.createDiscoverySummary(input);
  assert.deepEqual(summary, input);
  assert.equal("expiresAt" in summary, false);
  assert.equal("lastVerifiedAt" in summary, false);
  assert.equal("imageUrl" in summary, false);
  assert.equal(opportunityData.validateDiscoverySummary(summary).valid, true);
  assert.throws(() => opportunityData.createDiscoverySummary({ ...input, path: "free-samples" }), /Invalid DiscoverySummary/);
  assert.throws(() => opportunityData.createDiscoverySummary({ ...input, labelz: [] }), /not allowed/);
});

test("the tracked Opportunity registry is empty and valid", () => {
  const registry = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "opportunities.json"), "utf8"));
  assert.deepEqual(registry, []);
  assert.equal(opportunityData.validateOpportunityRegistry(registry).valid, true);
});
