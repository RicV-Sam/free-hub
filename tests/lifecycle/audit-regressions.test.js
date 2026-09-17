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
