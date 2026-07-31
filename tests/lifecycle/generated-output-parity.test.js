const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { isExactReviewedDifference } = require("../../scripts/lib/generated-output-review.js");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const COMPARATOR = path.join(ROOT_DIR, "scripts", "compare-generated-output.js");
const COMPETITIONS = '          <a class="site-topbar__link" href="/competitions/">Competitions</a>';
const FREE_STUFF = '          <a class="site-topbar__link" href="/free-stuff-south-africa/">Free Stuff</a>';
const ENDING = '          <a class="site-topbar__link" href="/competitions-ending-soon/">Ending soon</a>';

function createPair(baseHtml, actualHtml, relative = "index.html") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "freehub-parity-"));
  const base = path.join(root, "base");
  const actual = path.join(root, "actual");
  [base, actual].forEach((directory) => fs.mkdirSync(path.join(directory, path.dirname(relative)), { recursive: true }));
  fs.writeFileSync(path.join(base, relative), baseHtml);
  fs.writeFileSync(path.join(actual, relative), actualHtml);
  fs.writeFileSync(path.join(base, "sitemap.xml"), "<urlset></urlset>");
  fs.writeFileSync(path.join(actual, "sitemap.xml"), "<urlset></urlset>");
  return { root, base, actual };
}

function compare(pair, extraArgs = []) {
  return spawnSync(process.execPath, [COMPARATOR, `--base-dir=${pair.base}`, `--actual-dir=${pair.actual}`, ...extraArgs], {
    encoding: "utf8",
  });
}

test("parity permits only the exact navigation fragment in the exact position", (context) => {
  const baseHtml = `${COMPETITIONS}\n${ENDING}`;
  const approved = createPair(baseHtml, `${COMPETITIONS}\n${FREE_STUFF}\n${ENDING}`);
  context.after(() => fs.rmSync(approved.root, { recursive: true, force: true }));
  assert.equal(compare(approved).status, 0);

  const wrongPosition = createPair(baseHtml, `${FREE_STUFF}\n${COMPETITIONS}\n${ENDING}`);
  context.after(() => fs.rmSync(wrongPosition.root, { recursive: true, force: true }));
  assert.notEqual(compare(wrongPosition).status, 0);

  const changedFragment = createPair(baseHtml, `${COMPETITIONS}\n${FREE_STUFF.replace('class="site-topbar__link"', 'class="site-topbar__link extra"')}\n${ENDING}`);
  context.after(() => fs.rmSync(changedFragment.root, { recursive: true, force: true }));
  assert.notEqual(compare(changedFragment).status, 0);
});

test("version markers alone cannot approve Free Stuff output", (context) => {
  const relative = "free-stuff-south-africa/index.html";
  const transition = createPair('<body data-free-stuff-parent-version="2">v2</body>', '<body data-free-stuff-parent-version="3">v3</body>', relative);
  context.after(() => fs.rmSync(transition.root, { recursive: true, force: true }));
  assert.notEqual(compare(transition, ["--allow-discovery-content-v1"]).status, 0);

  const laterChange = createPair(
    '<body data-free-stuff-parent-version="3">v3</body>',
    '<body data-free-stuff-parent-version="3">unreviewed change</body>',
    relative
  );
  context.after(() => fs.rmSync(laterChange.root, { recursive: true, force: true }));
  assert.notEqual(compare(laterChange, ["--allow-discovery-content-v1"]).status, 0);
});

test("version markers alone cannot approve Samples output", (context) => {
  const relative = "free-samples-south-africa/index.html";
  const transition = createPair('<body data-free-samples-page-version="3">samples v3</body>', '<body data-free-samples-page-version="4">samples v4</body>', relative);
  context.after(() => fs.rmSync(transition.root, { recursive: true, force: true }));
  assert.notEqual(compare(transition, ["--allow-discovery-content-v1"]).status, 0);

  const laterChange = createPair(
    '<body data-free-samples-page-version="4">samples v4</body>',
    '<body data-free-samples-page-version="4">unreviewed samples change</body>',
    relative
  );
  context.after(() => fs.rmSync(laterChange.root, { recursive: true, force: true }));
  assert.notEqual(compare(laterChange, ["--allow-discovery-content-v1"]).status, 0);
});

test("version markers alone cannot approve voucher output", (context) => {
  const relative = "category/vouchers/index.html";
  const transition = createPair("<body>voucher v1</body>", '<body data-voucher-hub-version="2">voucher v2</body>', relative);
  context.after(() => fs.rmSync(transition.root, { recursive: true, force: true }));
  assert.notEqual(compare(transition, ["--allow-discovery-content-v1"]).status, 0);

  const laterChange = createPair(
    '<body data-voucher-hub-version="2">voucher v2</body>',
    '<body data-voucher-hub-version="2">unreviewed voucher change</body>',
    relative
  );
  context.after(() => fs.rmSync(laterChange.root, { recursive: true, force: true }));
  assert.notEqual(compare(laterChange, ["--allow-discovery-content-v1"]).status, 0);
});

test("detail-flow parity rejects lookalike or tampered Coloplast fragments", (context) => {
  const relative = "free-samples-south-africa/index.html";
  const id = "coloplast-speedicath-short-sample";
  const base = `<head>\n    \n    <script id="faq"></script>\n</head>\n        \n\n        <section class="next"></section>`;
  const actual = `<head>\n    <script id="structured-data-opportunities" type="application/ld+json">{"identifier":"${id}"}</script>\n    <script id="faq"></script>\n</head>\n        <section class="opportunity-section"><article data-opportunity-id="${id}"></article>\n        </section>\n\n        <section class="next"></section>`;
  const lookalike = createPair(base, actual, relative);
  context.after(() => fs.rmSync(lookalike.root, { recursive: true, force: true }));
  assert.notEqual(compare(lookalike, ["--allow-opportunity-detail-flow"]).status, 0);

  const tampered = createPair(base, actual.replace("<article", "<p>Invented claim</p><article"), relative);
  context.after(() => fs.rmSync(tampered.root, { recursive: true, force: true }));
  assert.notEqual(compare(tampered, ["--allow-opportunity-detail-flow"]).status, 0);

  const source = fs.readFileSync(COMPARATOR, "utf8");
  assert.match(source, /OPPORTUNITY_OUTPUT_BASELINE/);
  assert.match(source, /reviewedOpportunityFileHash/);
  assert.match(source, /reviewedSurface\.flagOff/);
  assert.match(source, /reviewedSurface\.flagOn/);
});

test("discovery review requires the exact path and expected-to-actual hash pair", () => {
  const manifest = {
    files: {
      "category/vouchers/index.html": {
        expected: "base-hash",
        actual: "candidate-hash",
      },
      "competition/held/index.html": {
        expected: "held-hash",
        actual: "missing",
      },
    },
  };

  assert.equal(
    isExactReviewedDifference(
      manifest,
      "category/vouchers/index.html",
      { hash: "base-hash" },
      { hash: "candidate-hash" }
    ),
    true
  );
  assert.equal(
    isExactReviewedDifference(
      manifest,
      "category/vouchers/index.html",
      { hash: "base-hash" },
      { hash: "tampered" }
    ),
    false
  );
  assert.equal(
    isExactReviewedDifference(
      manifest,
      "competition/held/index.html",
      { hash: "held-hash" },
      undefined
    ),
    true
  );
});

test("outbound ad removal is exact and rejects extra content", (context) => {
  const relative = "out/example/index.html";
  const adScript = '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084410613829318" crossorigin="anonymous"></script>\n';
  const adZones = '\n\n        <section class="ad-slot ad-slot--reserved" id="ad-top" data-placement="outbound-top" aria-label="Sponsored placement"></section>\n\n        <section class="ad-slot ad-slot--compact ad-slot--reserved" id="ad-middle" data-placement="outbound-middle" aria-label="Sponsored placement"></section>\n';
  const base = `<link rel="stylesheet" href="/styles.css?v=old" />\n${adScript}<main>handoff${adZones}</main>`;
  const candidate = '<link rel="stylesheet" href="/styles.css?v=new" />\n<main>handoff\n</main>';
  const approved = createPair(base, candidate, relative);
  context.after(() => fs.rmSync(approved.root, { recursive: true, force: true }));
  assert.equal(compare(approved, ["--allow-discovery-content-v1"]).status, 0);

  const tampered = createPair(base, candidate.replace("handoff", "handoff with invented claim"), relative);
  context.after(() => fs.rmSync(tampered.root, { recursive: true, force: true }));
  assert.notEqual(compare(tampered, ["--allow-discovery-content-v1"]).status, 0);
});
