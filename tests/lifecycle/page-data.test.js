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

test("an explicit reference date makes lifecycle checks deterministic", () => {
  shared.setReferenceDate("2026-08-06");

  try {
    assert.equal(shared.getDaysUntilClosing("2026-08-06"), 0);
    assert.equal(shared.getDaysUntilClosing("2026-08-07"), 1);
    assert.equal(shared.isClosingWithinDays("2026-08-13", 7), true);
    assert.equal(shared.isClosingWithinDays("2026-08-14", 7), false);
  } finally {
    shared.setReferenceDate();
  }
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

test("voucher discovery accepts voucher value and rejects category-only hamper matches", () => {
  assert.equal(shared.isVoucherPrizeCompetition({ prizeName: "R500 Clicks cashback" }), true);
  assert.equal(shared.isVoucherPrizeCompetition({ prizeName: "Airtime and data bundles" }), true);
  assert.equal(shared.isVoucherPrizeCompetition({ title: "Win a R2,000 gift card" }), true);
  assert.equal(shared.isVoucherPrizeCompetition({ prizeName: "R500 eVoucher" }), true);
  assert.equal(shared.isVoucherPrizeCompetition({ prizeName: "R1,000 gift-card" }), true);
  assert.equal(shared.isVoucherPrizeCompetition({ prizeName: "Montblanc Explorer gift set" }), false);
  assert.equal(shared.isVoucherPrizeCompetition({ prizeName: "Beauty product hamper" }), false);
});

test("grocery discovery matches the prize rather than the entry retailer", () => {
  assert.equal(
    shared.isGroceryPrizeCompetition({ prizeName: "R500 digital SPAR voucher" }),
    true
  );
  assert.equal(
    shared.isGroceryPrizeCompetition({ prizeName: "Checkers vouchers and an air fryer" }),
    true
  );
  assert.equal(
    shared.isGroceryPrizeCompetition({ prizeName: "A trolley of groceries" }),
    true
  );
  assert.equal(
    shared.isGroceryPrizeCompetition({
      brand: "Shoprite",
      prizeName: "R1,500 UNIQ fashion voucher",
      tags: ["purchase-required"],
    }),
    false
  );
  assert.equal(
    shared.isGroceryPrizeCompetition({
      brand: "Denny",
      prizeName: "R100,000 cash",
      tags: ["food", "purchase-required"],
    }),
    false
  );
});

test("win-a-car discovery matches vehicle prizes rather than automotive entry context", () => {
  assert.equal(shared.isVehicleRelatedCompetition({ prizeType: "car" }), true);
  assert.equal(shared.isVehicleRelatedCompetition({ prizeName: "Toyota Hilux Single Cab bakkie" }), true);
  assert.equal(
    shared.isVehicleRelatedCompetition({
      title: "Volkswagen EasyDrive Maintenance Plan Competition",
      summary: "Buy a Volkswagen maintenance plan for a chance to win fuel and retailer vouchers.",
      prizeName: "Fuel, merchandise, retailer, travel and spa vouchers",
      prizeType: "voucher",
      requiredProduct: "Volkswagen EasyDrive Maintenance Plan",
      tags: ["vouchers", "cars", "purchase-required"],
    }),
    false
  );
});

test("experience discovery uses explicit prize classification", () => {
  assert.equal(shared.isExperiencePrizeCompetition({ prizeType: "experience" }), true);
  assert.equal(shared.isExperiencePrizeCompetition({ tags: ["experience-prize"] }), true);
  assert.equal(
    shared.isExperiencePrizeCompetition({
      prizeType: "voucher",
      prizeName: "Travel voucher",
      category: "Holidays",
    }),
    false
  );
});

test("evergreen grocery and experience routes keep only active public prize matches", () => {
  const activeBase = {
    verificationStatus: "published",
    closingDate: "2999-12-31",
  };
  const records = [
    {
      ...activeBase,
      id: "active-groceries",
      title: "Active groceries",
      category: "Vouchers",
      prizeName: "R1,000 Checkers voucher",
    },
    {
      ...activeBase,
      id: "active-experience",
      title: "Active experience",
      category: "Sports",
      prizeType: "experience",
    },
    {
      ...activeBase,
      id: "held-groceries",
      title: "Held groceries",
      category: "Vouchers",
      prizeName: "A grocery basket",
      publicationStatus: "held",
    },
    {
      ...activeBase,
      id: "private-experience",
      title: "Private experience",
      category: "Lifestyle",
      prizeType: "experience",
      doNotPublish: true,
    },
    {
      ...activeBase,
      id: "expired-groceries",
      title: "Expired groceries",
      category: "Vouchers",
      prizeName: "A supermarket voucher",
      closingDate: "2000-01-01",
    },
  ];

  const groceryRoute = shared.getRouteContext("/category/groceries/");
  const experienceRoute = shared.getRouteContext("/category/experiences/");

  assert.deepEqual(
    shared.filterCompetitionsByRoute(records, groceryRoute).map((competition) => competition.id),
    ["active-groceries"]
  );
  assert.deepEqual(
    shared.filterCompetitionsByRoute(records, experienceRoute).map((competition) => competition.id),
    ["active-experience"]
  );
  assert.equal(shared.getPageCopy(groceryRoute).canonical, "https://freehub.co.za/category/groceries/");
  assert.equal(shared.getPageCopy(experienceRoute).canonical, "https://freehub.co.za/category/experiences/");
  assert.equal(
    shared.getPageCopy(shared.getRouteContext("/category/cars/")).canonical,
    "https://freehub.co.za/win-a-car/"
  );
});

test("unapproved paid-entry records stay noindex", () => {
  const raffle = {
    id: "unapproved-raffle",
    title: "Unapproved raffle",
    verificationStatus: "published",
    closingDate: "2999-12-31",
    entryCostType: "paid-entry",
    entryFeeLabel: "R100 per ticket",
    tags: ["paid-entry", "raffle"],
  };

  assert.equal(shared.isPaidEntryCompetition(raffle), true);
  assert.equal(shared.isVerifiedPaidEntryCompetition(raffle), false);
  assert.equal(shared.getCompetitionVisibility(raffle), "noindex");
  assert.equal(shared.isActiveCompetition(raffle), false);
});

test("approved paid-entry records are indexed only in the verified paid-entry collection", () => {
  const raffle = {
    id: "approved-raffle",
    title: "Approved raffle",
    verificationStatus: "published",
    closingDate: "2999-12-31",
    visibility: "public",
    entryCostType: "paid-entry",
    entryFeeLabel: "R100 per ticket",
    tags: ["paid-entry", "raffle"],
    paidEntryReviewStatus: "approved",
  };
  const freeCompetition = {
    id: "free-competition",
    title: "Free competition",
    verificationStatus: "published",
    closingDate: "2999-12-31",
    entryCostType: "free-entry",
  };
  const records = [raffle, freeCompetition];

  assert.equal(shared.isVerifiedPaidEntryCompetition(raffle), true);
  assert.equal(shared.isCoreCompetition(raffle), false);
  assert.equal(shared.isActiveCompetition(raffle), true);
  assert.deepEqual(
    shared.getPublishedCoreActiveCompetitions(records).map((competition) => competition.id),
    ["free-competition"]
  );
  assert.deepEqual(
    shared
      .filterCompetitionsByRoute(records, shared.getRouteContext("/paid-entry-competitions/"))
      .map((competition) => competition.id),
    ["approved-raffle"]
  );
  assert.deepEqual(
    shared
      .filterCompetitionsByRoute(records, shared.getRouteContext("/competitions/"))
      .map((competition) => competition.id),
    ["free-competition"]
  );
  assert.match(
    shared.getPageCopy(shared.getRouteContext("/paid-entry-competitions/")).heading,
    /Verified Paid-Entry/
  );
});

test("a free newsletter signup is not treated as a paid subscription", () => {
  const newsletterCompetition = {
    title: "Newsletter getaway",
    verificationStatus: "published",
    closingDate: "2999-12-31",
    entryCostType: "free-entry",
    entryFeeLabel: "No fee; newsletter subscription required",
    entryChannel: "Subscribe to the free newsletter",
    tags: [],
  };
  const paidSubscriptionCompetition = {
    ...newsletterCompetition,
    title: "Paid subscription prize",
    tags: ["subscription-required"],
  };

  assert.equal(shared.isGreyAreaCompetition(newsletterCompetition), false);
  assert.equal(shared.getCompetitionVisibility(newsletterCompetition), "public");
  assert.equal(shared.isGreyAreaCompetition(paidSubscriptionCompetition), true);
  assert.equal(shared.getCompetitionVisibility(paidSubscriptionCompetition), "noindex");
});
