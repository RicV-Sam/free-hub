const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const shared = require("../../shared/page-data.js");

const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "fixtures", "competition-lifecycle.json"), "utf8")
);

test("active public competitions are published, public, and sitemap-eligible", () => {
  assert.equal(shared.isPublishedCompetition(fixtures.activePublic), true);
  assert.equal(shared.isPublicCompetition(fixtures.activePublic), true);
  assert.equal(shared.isActiveCompetition(fixtures.activePublic), true);
  assert.equal(shared.isNoindexActiveCompetition(fixtures.activePublic), false);
});

test("active noindex and Club competitions stay outside public active collections", () => {
  assert.equal(shared.isPublishedCompetition(fixtures.activeNoindex), true);
  assert.equal(shared.isNoindexActiveCompetition(fixtures.activeNoindex), true);
  assert.equal(shared.isActiveCompetition(fixtures.activeNoindex), false);
  assert.equal(shared.isClubOnlyCompetition(fixtures.clubOnly), true);
  assert.equal(shared.isActiveCompetition(fixtures.clubOnly), false);
});

test("expired published records retain verified detail eligibility but not active status", () => {
  assert.equal(shared.isExpiredCompetition(fixtures.expiredPublished), true);
  assert.equal(shared.isExpiredArchiveEligibleCompetition(fixtures.expiredPublished), true);
  assert.equal(shared.isActiveCompetition(fixtures.expiredPublished), false);
  assert.equal(shared.isExpiredArchiveEligibleCompetition(fixtures.expiredMissingEvidence), false);
});

test("archived-low-value, held, rejected, and doNotPublish states remain isolated", () => {
  assert.equal(shared.isArchivedLowValueCompetition(fixtures.archivedLowValue), true);
  assert.equal(shared.isPublishedCompetition(fixtures.archivedLowValue), false);
  assert.equal(shared.isPublishedCompetition(fixtures.held), false);
  assert.equal(shared.isActiveCompetition(fixtures.held), false);
  assert.equal(shared.isPublishedCompetition(fixtures.rejected), false);
  assert.equal(shared.isActiveCompetition(fixtures.rejected), false);
});

test("known cost types keep their current display labels", () => {
  assert.equal(shared.getEntryCostLabel(fixtures.freeCost), "Free entry");
  assert.equal(shared.getEntryCostLabel(fixtures.purchaseCost), "Purchase required");
  assert.equal(shared.getEntryCostLabel(fixtures.paidCost), "Paid entry");
  assert.equal(shared.getEntryCostLabel(fixtures.unknownCost), "Entry requirements unclear");
});

test("missing and unrecognized cost values fail closed", () => {
  assert.equal(shared.getEntryCostClassification(fixtures.missingCost), "unclear");
  assert.equal(shared.getEntryCostClassification(fixtures.unrecognizedCost), "unclear");
  assert.equal(shared.getEntryCostLabel(fixtures.missingCost), "Entry requirements unclear");
  assert.equal(shared.getEntryCostLabel(fixtures.unrecognizedCost), "Entry requirements unclear");
});

test("explicit legacy cost evidence remains exhaustive without a free default", () => {
  assert.equal(shared.getEntryCostLabel(fixtures.missingWithFreeEvidence), "Free entry");
  assert.equal(shared.getEntryCostLabel(fixtures.missingWithPurchaseEvidence), "Purchase required");
  assert.equal(shared.getEntryCostLabel(fixtures.legacyTillSlipCost), "Purchase required");
  assert.equal(shared.getEntryCostLabel(fixtures.legacyLoyaltyCost), "Purchase required");
  assert.equal(shared.getEntryCostLabel(fixtures.conditionalFreeCost), "Free entry");
  assert.equal(shared.getEntryCostLabel(fixtures.conditionalUnclearCost), "Entry requirements unclear");
});
