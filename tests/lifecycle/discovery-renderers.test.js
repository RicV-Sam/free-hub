const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const shared = require("../../shared/page-data.js");
const opportunityData = require("../../shared/opportunity-data.js");
const { createFreeResourceRenderer } = require("../../scripts/lib/free-resource-renderer.js");
const { createOpportunityRenderer } = require("../../scripts/lib/opportunity-renderer.js");
const { createOpportunityRouteRenderer } = require("../../scripts/lib/opportunity-route-renderer.js");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const fixtures = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "tests", "fixtures", "opportunity-contracts.json"), "utf8"));
const legacyResources = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "free-resources.json"), "utf8"));
const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const escapeAttribute = escapeHtml;
const freeResources = createFreeResourceRenderer({ escapeHtml, escapeAttribute, formatDate: shared.formatDate });
const opportunities = createOpportunityRenderer({
  escapeHtml,
  escapeAttribute,
  formatDate: shared.formatDate,
  canonicalOrigin: shared.CANONICAL_ORIGIN,
  getDetailPath: opportunityData.getOpportunityDetailPath,
});
const opportunityRoutes = createOpportunityRouteRenderer({
  escapeHtml,
  escapeAttribute,
  formatDate: shared.formatDate,
  canonicalOrigin: shared.CANONICAL_ORIGIN,
  getDetailPath: opportunityData.getOpportunityDetailPath,
  getExitPath: opportunityData.getOpportunityExitPath,
});

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
    cardVariant: "compact",
  });
  assert.match(html, /data-opportunity-id="fixture-current-sample"/);
  assert.match(html, /data-entity-kind="opportunity"/);
  assert.match(html, /data-discovery-action="card"/);
  assert.match(html, /data-content-type="free_sample"/);
  assert.match(html, /href="\/opportunity\/fixture-current-sample\/"/);
  assert.match(html, /Completely free/);
  assert.match(html, /Medical product sample request/);
  assert.match(html, /Suitability approval required/);
  assert.match(html, /Freehub does not receive or assess your application/);
  assert.match(html, /data-page-type="free_stuff_parent"/);
  const itemList = opportunities.buildOpportunityItemList({ opportunities: [fixtures.publishedSample], name: "Current" });
  assert.equal(itemList.itemListElement.length, 1);
  assert.equal(itemList.itemListElement[0].item.url, "https://freehub.co.za/opportunity/fixture-current-sample/");
});

test("full Opportunity cards expose sample facts and privacy without inventing product schema", () => {
  const record = { ...fixtures.publishedSample, provider: "Provider <unsafe>" };
  const html = opportunities.renderOpportunitySection({
    opportunities: [record],
    heading: "Current verified samples",
    pageType: "free_samples_vertical",
    cardVariant: "full",
  });
  assert.match(html, /Provider &lt;unsafe&gt;/);
  assert.match(html, /Application only/);
  assert.match(html, /No delivery charge/);
  assert.match(html, /Freehub does not provide medical suitability advice/);
  assert.match(html, /data-page-type="free_samples_vertical"/);
  assert.throws(
    () => opportunities.renderOpportunitySection({ opportunities: [record], heading: "Current", pageType: "test", cardVariant: "invented" }),
    /Unsupported Opportunity card variant/
  );
  const itemList = opportunities.buildOpportunityItemList({ opportunities: [record], name: "Samples" });
  assert.equal(itemList.itemListElement[0].item["@type"], "Thing");
  assert.equal(JSON.stringify(itemList).includes('"Product"'), false);
});

test("Opportunity renderer asserts approved publication state without importing the public gate", () => {
  assert.throws(
    () => opportunities.renderOpportunitySection({ opportunities: [fixtures.unsupportedDraft], heading: "Current", pageType: "free_stuff_parent" }),
    /ineligible record/
  );
  const source = fs.readFileSync(path.join(ROOT_DIR, "scripts", "lib", "opportunity-renderer.js"), "utf8");
  assert.doesNotMatch(source, /isPublicOpportunity|opportunity-data/);
});

test("PR 4 controller uses the exact reviewed Coloplast host and owns eligibility", () => {
  const source = fs.readFileSync(path.join(ROOT_DIR, "scripts", "generate-pages.js"), "utf8");
  assert.match(source, /OPPORTUNITY_ALLOWED_SOURCE_HOSTS = Object\.freeze\(\["products\.coloplast\.co\.za"\]\)/);
  assert.match(source, /opportunityData\.isPublicOpportunity/);
  assert.match(source, /allowedSourceHosts: OPPORTUNITY_ALLOWED_SOURCE_HOSTS/);
});

test("active Opportunity details expose trust facts and only the measured exit CTA", () => {
  const html = opportunityRoutes.renderDetailContent(fixtures.publishedSample, "active");
  assert.match(html, /What Coloplast requires/);
  assert.match(html, /Freehub does not receive, store or assess your application/);
  assert.match(html, /href="\/out\/opportunity\/fixture-current-sample\/"/);
  assert.doesNotMatch(html, new RegExp(`href="${fixtures.publishedSample.sourceUrl}"`));
  assert.match(html, /data-link-role="terms"/);
  const schemas = opportunityRoutes.buildStructuredData(fixtures.publishedSample, "active");
  assert.equal(schemas.webPage["@type"], "WebPage");
  assert.equal(schemas.breadcrumb["@type"], "BreadcrumbList");
  assert.equal(schemas.thing["@type"], "Thing");
  assert.equal(JSON.stringify(schemas).includes('"Product"'), false);
  assert.equal(JSON.stringify(schemas).includes('"Offer"'), false);
});

test("Opportunity tombstones retain safe facts without campaign paths or active schema", () => {
  ["verification_due", "expired", "withdrawn"].forEach((lifecycleState) => {
    const html = opportunityRoutes.renderDetailContent(fixtures.publishedSample, lifecycleState);
    assert.match(html, /Historical listing summary/);
    assert.match(html, /No campaign or application link is available/);
    assert.doesNotMatch(html, /\/out\/opportunity\//);
    assert.doesNotMatch(html, new RegExp(fixtures.publishedSample.sourceUrl));
    assert.equal(opportunityRoutes.buildStructuredData(fixtures.publishedSample, lifecycleState).thing, null);
  });
});

test("Opportunity exit content is explicit, manual, and free of automatic-click semantics", () => {
  const html = opportunityRoutes.renderExitContent(fixtures.publishedSample);
  assert.match(html, /data-opportunity-action="handoff"/);
  assert.match(html, /data-link-role="manual_fallback"/);
  assert.match(html, /Freehub does not receive, store or assess it/);
  assert.doesNotMatch(html, /handoff_method/);
});
