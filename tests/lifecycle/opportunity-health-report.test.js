const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { buildOpportunityHealthReport } = require("../../scripts/lib/opportunity-health-report.js");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

test("Opportunity health report fails closed for disabled flags and active route leakage", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "freehub-opportunity-health-"));
  writeJson(path.join(rootDir, "tests", "baselines", "seo-baseline.json"), {
    opportunityAllowedSourceHosts: ["samples.example.org"],
  });
  writeJson(path.join(rootDir, "data", "opportunities.json"), [
    {
      id: "fixture-current-sample",
      slug: "fixture-current-sample",
      type: "free_sample",
      title: "Fixture Current Sample",
      summary: "A verified fixture sample with explicit fulfilment and cost information.",
      provider: "Fixture Samples",
      sourceUrl: "https://samples.example.org/offers/current-sample",
      termsUrl: "https://samples.example.org/terms/current-sample",
      publicationStatus: "published",
      verificationStatus: "verified",
      country: "ZA",
      regions: ["National"],
      lastVerifiedAt: "2026-07-20",
      reviewDueAt: "2026-07-27",
      publishedAt: "2026-07-14",
      updatedAt: "2026-07-20",
      availabilityKind: "ongoing",
      costClassification: "completely_free",
      requirements: [{ kind: "location", required: true, label: "South African delivery address" }],
      categories: ["samples"],
      tags: ["direct-sample"],
      details: {
        fulfilmentMethod: "delivery",
        deliveryCharge: "none",
        stockState: "application_only",
        householdLimit: null,
        selectionStatus: "selected_participants",
        expectedFulfilmentWindow: "Approved samples dispatch within three business days.",
      },
    },
  ]);
  writeJson(path.join(rootDir, "data", "opportunity-source-evidence.json"), [
    {
      recordId: "fixture-current-sample",
      field: "sourceUrl",
      hostname: "samples.example.org",
      url: "https://samples.example.org/offers/current-sample",
      reason: "official_source_verified_despite_automated_access_block",
      verifiedAt: "2026-07-20",
      expiresAt: "2026-07-27",
      evidenceSummary: "Reviewed fixture source evidence.",
    },
    {
      recordId: "fixture-current-sample",
      field: "termsUrl",
      hostname: "samples.example.org",
      url: "https://samples.example.org/terms/current-sample",
      reason: "official_source_verified_despite_automated_access_block",
      verifiedAt: "2026-07-20",
      expiresAt: "2026-07-27",
      evidenceSummary: "Reviewed fixture terms evidence.",
    },
  ]);
  writeText(
    path.join(rootDir, "free-samples-south-africa", "index.html"),
    '<html><head><script type="application/ld+json">{"name":"Current verified samples","itemListElement":[]}</script></head><body><article class="opportunity-card" data-opportunity-id="fixture-current-sample"></article></body></html>'
  );
  writeText(
    path.join(rootDir, "free-stuff-south-africa", "index.html"),
    '<html><head><script type="application/ld+json">{"name":"Current verified opportunities","itemListElement":[]}</script></head><body></body></html>'
  );
  writeText(
    path.join(rootDir, "opportunity", "fixture-current-sample", "index.html"),
    "<html><head></head><body></body></html>"
  );
  writeText(path.join(rootDir, "sitemap.xml"), "<urlset></urlset>");

  const report = buildOpportunityHealthReport({
    rootDir,
    asOfDate: "2026-07-20",
    rawFeatureValue: "false",
    allowedSourceHosts: ["samples.example.org"],
  });

  assert.equal(report.featureFlag.parsedEnabled, false);
  assert.equal(report.counts.renderedCards, 1);
  assert.equal(report.ok, false);
  assert.match(report.actionableErrors.join("\n"), /disabled/);
});

test("Opportunity health report accepts a clean active enabled state", () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "freehub-opportunity-health-"));
  writeJson(path.join(rootDir, "tests", "baselines", "seo-baseline.json"), {
    opportunityAllowedSourceHosts: ["samples.example.org"],
  });
  writeJson(path.join(rootDir, "data", "opportunities.json"), [
    {
      id: "fixture-current-sample",
      slug: "fixture-current-sample",
      type: "free_sample",
      title: "Fixture Current Sample",
      summary: "A verified fixture sample with explicit fulfilment and cost information.",
      provider: "Fixture Samples",
      sourceUrl: "https://samples.example.org/offers/current-sample",
      termsUrl: "https://samples.example.org/terms/current-sample",
      publicationStatus: "published",
      verificationStatus: "verified",
      country: "ZA",
      regions: ["National"],
      lastVerifiedAt: "2026-07-20",
      reviewDueAt: "2026-07-27",
      publishedAt: "2026-07-14",
      updatedAt: "2026-07-20",
      availabilityKind: "ongoing",
      costClassification: "completely_free",
      requirements: [{ kind: "location", required: true, label: "South African delivery address" }],
      categories: ["samples"],
      tags: ["direct-sample"],
      details: {
        fulfilmentMethod: "delivery",
        deliveryCharge: "none",
        stockState: "application_only",
        householdLimit: null,
        selectionStatus: "selected_participants",
        expectedFulfilmentWindow: "Approved samples dispatch within three business days.",
      },
    },
  ]);
  writeJson(path.join(rootDir, "data", "opportunity-source-evidence.json"), [
    {
      recordId: "fixture-current-sample",
      field: "sourceUrl",
      hostname: "samples.example.org",
      url: "https://samples.example.org/offers/current-sample",
      reason: "official_source_verified_despite_automated_access_block",
      verifiedAt: "2026-07-20",
      expiresAt: "2026-07-27",
      evidenceSummary: "Reviewed fixture source evidence.",
    },
    {
      recordId: "fixture-current-sample",
      field: "termsUrl",
      hostname: "samples.example.org",
      url: "https://samples.example.org/terms/current-sample",
      reason: "official_source_verified_despite_automated_access_block",
      verifiedAt: "2026-07-20",
      expiresAt: "2026-07-27",
      evidenceSummary: "Reviewed fixture terms evidence.",
    },
  ]);
  writeText(
    path.join(rootDir, "free-samples-south-africa", "index.html"),
    '<html><head><script type="application/ld+json">{"name":"Current verified samples","itemListElement":[{"position":1}]}</script></head><body><article class="opportunity-card" data-opportunity-id="fixture-current-sample"></article></body></html>'
  );
  writeText(
    path.join(rootDir, "free-stuff-south-africa", "index.html"),
    '<html><head><script type="application/ld+json">{"name":"Current verified opportunities","itemListElement":[{"position":1}]}</script></head><body><article class="opportunity-card" data-opportunity-id="fixture-current-sample"></article></body></html>'
  );
  writeText(
    path.join(rootDir, "opportunity", "fixture-current-sample", "index.html"),
    "<html><head></head><body></body></html>"
  );
  writeText(
    path.join(rootDir, "out", "opportunity", "fixture-current-sample", "index.html"),
    "<html><head></head><body></body></html>"
  );
  writeText(
    path.join(rootDir, "sitemap.xml"),
    "<urlset><loc>https://freehub.co.za/opportunity/fixture-current-sample/</loc></urlset>"
  );

  const report = buildOpportunityHealthReport({
    rootDir,
    asOfDate: "2026-07-20",
    rawFeatureValue: "true",
    allowedSourceHosts: ["samples.example.org"],
  });

  assert.equal(report.featureFlag.parsedEnabled, true);
  assert.equal(report.counts.renderedCards, 2);
  assert.equal(report.records[0].lifecycle.lifecycle, "active");
  assert.equal(report.ok, true);
  assert.match(report.reviewedWarnings.join("\n"), /manual evidence/);
});
