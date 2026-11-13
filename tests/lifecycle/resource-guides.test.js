const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const shared = require("../../shared/page-data.js");
const data = require("../../shared/opportunity-data.js");
const resources = require("../../data/free-resources.json");
const guides = require("../../data/resource-guides.json");
const { getPublicResourceGuides, getResourceDetailPath, getResourceExitPath } = require("../../scripts/lib/resource-guides.js");
const { createFreeResourceRenderer } = require("../../scripts/lib/free-resource-renderer.js");
const { createResourceGuideRenderer } = require("../../scripts/lib/resource-guide-renderer.js");
const { createEditorialRenderer } = require("../../scripts/lib/editorial-renderer.js");
const { buildMobileCatalog } = require("../../scripts/lib/mobile-feed.js");
const { parseHtml } = require("../../scripts/lib/baseline-utils.js");
const record = resources.find(item => item.detailSlug === "famelack");
const famelackGuides = guides.filter(item => item.resourceId === record.id);
const escapeHtml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

test("detailed resources validate in both contracts and reject unsafe route slugs", () => {
  const ajv = new Ajv({ allErrors: true, strict: false }); addFormats(ajv);
  const validate = ajv.compile(require("../../data/schemas/free-resource.schema.json"));
  assert.equal(validate(record), true, JSON.stringify(validate.errors));
  assert.equal(data.validateFreeResource(record).valid, true);
  for (const detailSlug of ["../private", "/admin/", "famelack?x", "", 1]) {
    const bad = { ...record, detailSlug };
    assert.equal(data.validateFreeResource(bad).valid, false);
    assert.equal(validate(bad), false);
  }
  assert.throws(() => getResourceDetailPath({ detailSlug: "../private" }));
});

test("resource details and exits use the publication gate and require one complete guide", () => {
  assert.equal(getPublicResourceGuides([record], famelackGuides).length, 1);
  assert.equal(getResourceDetailPath(record), "/resources/famelack/");
  assert.equal(getResourceExitPath(record), "/out/resources/famelack/");
  for (const state of [{ verificationStatus: "verification_due" }, { verificationStatus: "source_changed" }, { verificationStatus: "rejected" }, { availability: "retired" }]) {
    assert.equal(getPublicResourceGuides([{ ...record, ...state }], famelackGuides).length, 0);
  }
  assert.throws(() => getPublicResourceGuides([record], []), /no guide/);
  assert.throws(() => getPublicResourceGuides([record], [...famelackGuides, famelackGuides[0]]), /Duplicate/);
  assert.throws(() => getPublicResourceGuides([record], [{ ...famelackGuides[0], steps: [] }]), /practical steps/);
});

test("education resource guides use their own conditions and safe official citations", () => {
  const education = { ...record, id: "learning-fixture", name: "Free learning", detailSlug: "learning-fixture", officialUrl: "https://example.org/learning", bestFor: "Learners", freeDetails: "Free lessons", requirements: "A provider account", watchOut: "Exams can cost extra" };
  const guide = { resourceId: education.id, provider: "Learning Provider", title: "Free learning guide", description: "Free lessons and certificate conditions", intro: "Choose a lesson.", accessNote: "Online lessons are available from South Africa.", accessHeading: "Who can learn", steps: ["Open the course page."], sections: [{ heading: "Certificate conditions", paragraphs: ["Read the selected exam conditions."] }], faq: [], trustItems: ["Free lessons", "Data costs apply", "Exam costs vary"], sourceSummary: "The course and certificate pages were checked.", sourceLinks: [{ label: "Certificate terms", href: "https://example.org/certificates" }], ctaHeading: "Choose a lesson", ctaText: "Check the provider's course conditions.", ctaLabel: "Browse free lessons", exitNote: "The provider manages your learning account.", exitTrustItems: ["External provider", "Data costs apply", "Course conditions apply"] };
  const approved = getPublicResourceGuides([education], [guide])[0];
  const empty = () => "";
  const renderer = createResourceGuideRenderer({ escapeHtml, escapeAttribute: escapeHtml, escapeScript: JSON.stringify, canonicalOrigin: shared.CANONICAL_ORIGIN, images: {}, defaultSocialImage: "https://freehub.co.za/default.png", stylesheetHref: "/styles.css", guestAdsScript: "", outboundHandoffScript: "", renderAnalyticsHead: empty, renderAnalyticsBody: empty, renderTopNavigation: empty, renderSiteFooter: empty, renderHeroImage: empty, renderFaq: empty, renderDatacostPromo: empty, formatDate: value => value, renderModernHero: value => JSON.stringify(value) });
  const html = renderer.renderDetail(approved) + renderer.renderExit(approved);
  assert.match(html, /Browse free lessons/);
  assert.match(html, /Certificate terms/);
  assert.match(html, /The provider manages your learning account/);
  assert.doesNotMatch(html, /streams|watch or hear|viewing|Legal Disclaimer/);
  for (const href of ["javascript:alert(1)", "https://user:password@example.org/", "/local-only"]) {
    assert.throws(() => getPublicResourceGuides([education], [{ ...guide, sourceLinks: [{ label: "Unsafe", href }] }]), /source link/);
  }
});

test("directory and homepage resource links enter the detail flow while legacy resources retain their links", () => {
  const renderer = createFreeResourceRenderer({ escapeHtml, escapeAttribute: escapeHtml, formatDate: shared.formatDate });
  const card = renderer.renderFreeResourceCard(record, { pageType: "free_stuff_parent" });
  assert.match(card, /href="\/resources\/famelack\/"/);
  assert.match(card, /data-discovery-action="card"/);
  assert.match(card, />View details<\/span>/);
  assert.doesNotMatch(card, /href="https:\/\/famelack\.com\//);
  const schema = renderer.buildFreeResourceItemList({ resources: [record], name: "Resources" });
  assert.equal(schema.itemListElement[0].item.url, shared.CANONICAL_ORIGIN + getResourceDetailPath(record));
  assert.match(renderer.renderFreeResourceCard(resources[0]), /href="https:\/\/skillshop/);
  const home = createEditorialRenderer({ escapeHtml, escapeAttribute: escapeHtml, getImage: () => "" }).renderSection([{ record, kind: "resource", recordId: record.id, validThrough: "2026-11-09", reviewedAt: "2026-11-02", reviewDueAt: "2026-11-09", reason: "Test", caution: "Data costs" }], "home");
  assert.match(home, /href="\/resources\/famelack\/"/);
  assert.doesNotMatch(home, /Browse free books|target="_blank"/);
});

test("generated resource pages have crawlable value, provenance and a separate noindex exit", () => {
  const root = path.resolve(__dirname, "../..");
  const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
  const detail = read("resources/famelack/index.html");
  const exit = read("out/resources/famelack/index.html");
  const parsed = parseHtml(detail);
  assert.equal(parsed.h1.length, 1);
  assert.equal(parsed.canonical, "https://freehub.co.za/resources/famelack/");
  assert.match(detail, /user-reported access check/);
  assert.match(detail, /FreeHub editorial illustration/);
  assert.match(detail, /href="\/out\/resources\/famelack\/"/);
  assert.match(detail, /<script[^>]+type="application\/ld\+json"/);
  assert.match(detail, /data-auth-context=/);
  assert.match(exit, /content="noindex, nofollow"/);
  assert.match(exit, /shared\/guest-ads\.js/);
  assert.match(exit, /shared\/outbound-handoff\.js/);
  assert.match(exit, /href="https:\/\/famelack\.com\/"/);
  assert.doesNotMatch(exit, /scriptwrapper\.com|data-auth-context=/);
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /<loc>https:\/\/freehub\.co\.za\/resources\/famelack\/<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/out\/resources\//);
  const app = buildMobileCatalog({ resources: [record] }, { asOfDate: "2026-11-02" });
  assert.equal(app.items[0].officialUrl, "https://famelack.com/");
  assert.doesNotMatch(JSON.stringify(app), /\/out\/|guest-ads/);
});

test("holding the sole entertainment resource rebuilds successfully and removes every public route", context => {
  const root = path.resolve(__dirname, "../..");
  const research = path.join(root, ".research");
  fs.mkdirSync(research, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(research, "resource-withdrawal-build-"));
  context.after(() => {
    assert.equal(path.dirname(path.resolve(fixture)), research);
    assert.ok(path.basename(fixture).startsWith("resource-withdrawal-build-"));
    assert.equal(fs.realpathSync(fixture), fixture);
    fs.rmSync(fixture, { recursive: true, force: true });
  });
  for (const name of ["scripts", "shared", "data", "assets", "functions/airtime-dash/engine.js", "tests/baselines", "404.html", "styles.css", "app.js", "robots.txt"]) {
    fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
  }
  const registryPath = path.join(fixture, "data/free-resources.json");
  const detail = path.join(fixture, "resources/famelack/index.html");
  const exit = path.join(fixture, "out/resources/famelack/index.html");
  const referenceDate = process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || shared.getSouthAfricanDate();
  for (const state of [{ verificationStatus: "verification_due" }, { verificationStatus: "source_changed" }, { verificationStatus: "rejected" }, { availability: "retired" }]) {
    fs.writeFileSync(registryPath, JSON.stringify(resources.map(item => item.id === record.id ? { ...item, ...state } : item)));
    for (const stale of [detail, exit]) {
      fs.mkdirSync(path.dirname(stale), { recursive: true });
      fs.writeFileSync(stale, "Stale generated route");
    }
    const result = spawnSync(process.execPath, ["scripts/generate-pages.js"], {
      cwd: fixture, encoding: "utf8",
      env: { ...process.env, FREEHUB_BUILD_DATE: referenceDate, FREEHUB_AS_OF_DATE: referenceDate, FREEHUB_ENABLE_OFFERS: "true", FREEHUB_ENABLE_OPPORTUNITIES: "true" },
    });
    assert.equal(result.status, 0, `${JSON.stringify(state)}: ${result.stderr}`);
    assert.equal(fs.existsSync(detail), false);
    assert.equal(fs.existsSync(exit), false);
    for (const file of ["index.html", "free-stuff-south-africa/index.html", "sitemap.xml", "app-data/catalog.json"]) {
      assert.doesNotMatch(fs.readFileSync(path.join(fixture, file), "utf8"), /\/resources\/famelack\/|resource-famelack-live-tv-radio-webcams/, `${JSON.stringify(state)} leaked into ${file}`);
    }
  }
});
