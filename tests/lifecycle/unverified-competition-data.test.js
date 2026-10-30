const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const unverifiedData = require("../../shared/unverified-competition-data.js");

const ROOT_DIR = path.resolve(__dirname, "../..");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "unverified-competitions.json"), "utf8"));
const localNow = new Date();
localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
const asOfDate = process.env.FREEHUB_AS_OF_DATE || localNow.toISOString().slice(0, 10);

test("under-review registry is valid and explicitly fail-closed", () => {
  const validation = unverifiedData.validateRegistry(registry);
  assert.deepEqual(validation.errors, []);
  assert.ok(registry.length >= 3);
  registry.forEach((record) => {
    assert.equal(record.publicationStatus, unverifiedData.PUBLICATION_STATUS);
    assert.equal(record.verificationStatus, unverifiedData.VERIFICATION_STATUS);
    assert.equal(record.doNotPublish, true);
  });
});

test("only current records enter the public under-review collection", () => {
  const current = unverifiedData.getPublicUnderReview(registry, { asOfDate: "2026-09-03" });
  assert.ok(current.length > 0);
  assert.ok(current.every((record) => record.closingDate >= "2026-09-03"));
  assert.equal(
    unverifiedData.isPublicUnderReview({ ...registry[0], closingDate: "2026-09-02" }, { asOfDate: "2026-09-03" }),
    false
  );
});

test("generated page discloses status and bypasses verified detail and redirect routes", () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, "unverified-competitions", "index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, "sitemap.xml"), "utf8");
  const mobileFeed = fs.readFileSync(path.join(ROOT_DIR, "app-data", "competitions.json"), "utf8");
  const current = unverifiedData.getPublicUnderReview(registry, { asOfDate });

  assert.match(html, /Competitions under review in South Africa/);
  if (current.length > 0) {
    assert.match(html, /Not verified/);
    assert.match(html, /Why Freehub has not verified it/);
  } else {
    assert.match(html, /No current leads under review/);
  }
  if (current.length >= 3) {
    assert.match(sitemap, /https:\/\/freehub\.co\.za\/unverified-competitions\//);
  } else {
    assert.doesNotMatch(sitemap, /https:\/\/freehub\.co\.za\/unverified-competitions\//);
  }

  registry.forEach((record) => {
    const idPattern = new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (unverifiedData.isPublicUnderReview(record, { asOfDate })) assert.match(html, idPattern);
    else assert.doesNotMatch(html, idPattern);
    assert.doesNotMatch(sitemap, new RegExp(`/competition/${record.id}/`));
    assert.equal(fs.existsSync(path.join(ROOT_DIR, "competition", record.id)), false);
    assert.equal(fs.existsSync(path.join(ROOT_DIR, "out", record.id)), false);
    assert.equal(mobileFeed.includes(record.id), false);
  });
});

test("under-review page links directly to sources without verified competition schema", () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, "unverified-competitions", "index.html"), "utf8");
  const current = unverifiedData.getPublicUnderReview(registry, { asOfDate });
  current.filter(record => record.officialSourceUrl).forEach((record) => assert.ok(html.includes(record.officialSourceUrl.replace(/&/g, "&amp;"))));
  assert.doesNotMatch(html, /"@type":"ItemList"/);
  assert.doesNotMatch(html, /Verified listing/);
  assert.doesNotMatch(html, /href="\/out\//);
});

test("unknown deadlines expire at their review boundary and cannot appear before listedAt", () => {
  const lead = { ...registry[0], closingDate: "", closingDateText: "Not confirmed", listedAt: "2026-10-30", reviewDueAt: "2026-11-06" };
  assert.equal(unverifiedData.validateRegistry([lead]).valid, true);
  assert.equal(unverifiedData.isPublicUnderReview(lead, { asOfDate: "2026-10-29" }), false);
  assert.equal(unverifiedData.isPublicUnderReview(lead, { asOfDate: "2026-11-06" }), true);
  assert.equal(unverifiedData.isPublicUnderReview(lead, { asOfDate: "2026-11-07" }), false);
  assert.equal(unverifiedData.validateRegistry([{ ...lead, reviewDueAt: "" }]).valid, false);
  assert.throws(() => unverifiedData.getDetailPath({ id: "../escape" }));
});

test("each current lead has an indexable self-canonical detail page with disclosure and incoming link", () => {
  const hub = fs.readFileSync(path.join(ROOT_DIR, "unverified-competitions/index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, "sitemap.xml"), "utf8");
  for (const record of unverifiedData.getPublicUnderReview(registry, { asOfDate })) {
    const route = unverifiedData.getDetailPath(record);
    const html = fs.readFileSync(path.join(ROOT_DIR, route, "index.html"), "utf8");
    assert.ok(hub.includes(`href="${route}"`));
    assert.ok(sitemap.includes(`https://freehub.co.za${route}</loc>`));
    assert.ok(html.includes(`rel="canonical" href="https://freehub.co.za${route}"`));
    assert.match(html, /name="robots" content="index, follow/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /Why Freehub has not verified it/);
    assert.doesNotMatch(html, /href="\/out\//);
    assert.doesNotMatch(html, /"@type":"ItemList"/);
    if (!record.officialSourceUrl) {
      assert.match(html, /Official campaign source not located/);
      assert.doesNotMatch(html, />Open source on /);
      assert.doesNotMatch(html, />Read promoter terms</);
    }
  }
});

test("source-missing leads require an explicit disclosure rather than a fabricated source", () => {
  const lead = { ...registry[0], officialSourceUrl: "" };
  assert.equal(unverifiedData.validateRegistry([lead]).valid, false);
  assert.equal(unverifiedData.validateRegistry([{ ...lead, sourceCheckStatus: "not-located", sourceNote: "Supplied research report; exact campaign not located." }]).valid, true);
});
