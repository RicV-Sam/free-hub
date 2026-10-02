const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createLocalImageDimensionWriter } = require("../../scripts/lib/local-image-dimensions.js");

const root = path.resolve(__dirname, "../..");
const origin = "https://freehub.co.za";

test("generated sitemap pages never link to unpublished internal collections", () => {
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.ok(urls.length > 0);
  for (const address of urls) {
    const route = new URL(address).pathname;
    if (!route.endsWith("/")) continue;
    const html = fs.readFileSync(path.join(root, route, "index.html"), "utf8");
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (!href.startsWith("/") && !href.startsWith(`${origin}/`)) continue;
      const target = new URL(href.replace(/&amp;/g, "&"), origin);
      if (target.origin !== origin || !target.pathname.endsWith("/")) continue;
      assert.ok(fs.existsSync(path.join(root, decodeURIComponent(target.pathname), "index.html")),
        `${route} links to missing ${target.pathname}`);
    }
  }
});

test("image dimensions come from local files and preserve decorative alt text", () => {
  const addDimensions = createLocalImageDimensionWriter(root, origin);
  const page = path.join(root, "competition", "example", "index.html");
  const local = '/assets/competitions/curaprox-house-of-mouth-competition-2026.webp';
  for (const src of [local, `${origin}${local}`, `../../${local.slice(1)}?v=1`]) {
    const actual = addDimensions(`<img src="${src}" alt="" aria-hidden="true">`, page);
    assert.match(actual, /width="468" height="775"/);
    assert.match(actual, /alt="" aria-hidden="true"/);
  }
  for (const tag of [
    `<img src="${local}" width="20" height="30" alt="Existing size">`,
    `<img src="https://example.com${local}" alt="External">`,
    '<img src="/missing.webp" alt="Missing">',
  ]) assert.equal(addDimensions(tag, page), tag);
});


test("expired competition videos are removed while active and unrelated files survive rebuilds", () => {
  const os = require("node:os");
  const { removeExpiredVideoPages } = require("../../scripts/lib/inventory-routes.js");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "freehub-video-cleanup-"));
  try {
    for (const slug of ["active", "expired", "evergreen"]) {
      fs.mkdirSync(path.join(directory, slug));
      fs.writeFileSync(path.join(directory, slug, "index.html"), slug);
    }
    fs.writeFileSync(path.join(directory, "expired", "editorial.txt"), "preserve");
    const known = new Set(["active", "expired"]);
    removeExpiredVideoPages(directory, known, known);
    assert.ok(fs.existsSync(path.join(directory, "expired", "index.html")));
    removeExpiredVideoPages(directory, known, new Set(["active"]));
    assert.ok(!fs.existsSync(path.join(directory, "expired", "index.html")));
    assert.ok(fs.existsSync(path.join(directory, "active", "index.html")));
    assert.ok(fs.existsSync(path.join(directory, "evergreen", "index.html")));
    assert.equal(fs.readFileSync(path.join(directory, "expired", "editorial.txt"), "utf8"), "preserve");
    assert.throws(() => removeExpiredVideoPages(directory, new Set(["../escape"]), new Set()), /Unsafe/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("sitemap expectations follow tag thresholds and active competition videos", () => {
  const { inventorySitemapCount } = require("../../scripts/lib/inventory-routes.js");
  const shared = require("../../shared/page-data.js");
  const fixture = require("../fixtures/competition-lifecycle.json").activePublic;
  const aliases = require("../baselines/seo-baseline.json").canonicalAliases;
  const base = { ...fixture, tags: ["ussd-entry"], closingDate: "2026-10-31", isEndingSoon: false, isHighValue: false };
  const ending = { ...base, id: "ending", closingDate: "2026-09-30",
    featuredVideo: { youtubeId: "example", slug: "ending-video", durationSeconds: 20 } };
  try {
    shared.setReferenceDate("2026-09-24");
    assert.equal(inventorySitemapCount(shared.getPublishedActiveCompetitions([base, ending]), aliases), 2);
    shared.setReferenceDate("2026-10-02");
    assert.equal(inventorySitemapCount(shared.getPublishedActiveCompetitions([base, ending]), aliases), 0);
    assert.equal(inventorySitemapCount(shared.getPublishedActiveCompetitions([base, { ...base, id: "second" }]), aliases), 1);
    assert.equal(inventorySitemapCount(shared.getPublishedActiveCompetitions([base, { ...base, publicationStatus: "held" }]), aliases), 0);
  } finally { shared.setReferenceDate(); }
});
