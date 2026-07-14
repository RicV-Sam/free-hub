const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const shared = require("../../shared/page-data.js");
const { createFreeResourceRenderer } = require("../../scripts/lib/free-resource-renderer.js");
const { createOpportunityRenderer } = require("../../scripts/lib/opportunity-renderer.js");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const fixtures = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "tests", "fixtures", "opportunity-contracts.json"), "utf8"));
const legacyResources = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "free-resources.json"), "utf8"));
const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const escapeAttribute = escapeHtml;
const freeResources = createFreeResourceRenderer({ escapeHtml, escapeAttribute, formatDate: shared.formatDate });
const opportunities = createOpportunityRenderer({ escapeHtml, escapeAttribute, formatDate: shared.formatDate });

test("FreeResource renderer uses explicit inputs and preserves legacy analytics facts", () => {
  assert.equal(freeResources.renderFreeResourceSection({ resources: [], heading: "Resources", description: "None", pageType: "free_stuff_parent" }), "");
  const html = freeResources.renderFreeResourceSection({
    resources: [legacyResources[0]],
    heading: "Official programmes",
    description: "Durable resources.",
    pageType: "free_stuff_parent",
  });
  assert.match(html, /<h2>Official programmes<\/h2>/);
  assert.match(html, /data-discovery-action="official-source"/);
  assert.match(html, new RegExp(`data-content-id="${legacyResources[0].name}"`));
  assert.match(html, new RegExp(`data-content-type="${legacyResources[0].category}"`));
  const itemList = freeResources.buildFreeResourceItemList({ resources: [legacyResources[0]], name: "Resources" });
  assert.equal(itemList.itemListElement.length, 1);
});

test("Opportunity renderer accepts approved inputs and emits no empty section or schema", () => {
  assert.equal(opportunities.renderOpportunitySection({ opportunities: [], heading: "Current verified opportunities", pageType: "free_stuff_parent" }), "");
  assert.equal(opportunities.buildOpportunityItemList({ opportunities: [], name: "Current verified opportunities" }), null);
  const html = opportunities.renderOpportunitySection({
    opportunities: [fixtures.publishedSample],
    heading: "Current verified opportunities",
    pageType: "free_stuff_parent",
  });
  assert.match(html, /data-opportunity-id="fixture-current-sample"/);
  assert.match(html, /data-entity-kind="opportunity"/);
  assert.match(html, /data-content-type="free_sample"/);
  assert.match(html, /Completely free/);
  assert.equal(opportunities.buildOpportunityItemList({ opportunities: [fixtures.publishedSample], name: "Current" }).itemListElement.length, 1);
});

test("Opportunity renderer asserts approved publication state without importing the public gate", () => {
  assert.throws(
    () => opportunities.renderOpportunitySection({ opportunities: [fixtures.unsupportedDraft], heading: "Current", pageType: "free_stuff_parent" }),
    /ineligible record/
  );
  const source = fs.readFileSync(path.join(ROOT_DIR, "scripts", "lib", "opportunity-renderer.js"), "utf8");
  assert.doesNotMatch(source, /isPublicOpportunity|opportunity-data/);
});

test("PR 3 controller keeps the reviewed host allowlist empty and owns eligibility", () => {
  const source = fs.readFileSync(path.join(ROOT_DIR, "scripts", "generate-pages.js"), "utf8");
  assert.match(source, /OPPORTUNITY_ALLOWED_SOURCE_HOSTS = Object\.freeze\(\[\]\)/);
  assert.match(source, /opportunityData\.isPublicOpportunity/);
  assert.match(source, /allowedSourceHosts: OPPORTUNITY_ALLOWED_SOURCE_HOSTS/);
});
