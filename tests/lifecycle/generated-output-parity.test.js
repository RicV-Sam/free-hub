const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { isExactReviewedDifference } = require("../../scripts/lib/generated-output-review.js");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const COMPARATOR = path.join(ROOT_DIR, "scripts", "compare-generated-output.js");
const ADSTERRA_EVERGREEN_MANIFEST = path.join(
  ROOT_DIR,
  "tests",
  "baselines",
  "adsterra-evergreen-generated-output.json"
);
const FIXED_DATE_REGISTER = path.join(ROOT_DIR, "scripts", "lib", "fixed-date-register.js");
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

test("Adsterra and evergreen output review is an exact, fixed-date hash manifest", () => {
  const manifest = JSON.parse(fs.readFileSync(ADSTERRA_EVERGREEN_MANIFEST, "utf8"));
  const entries = Object.entries(manifest.files);

  assert.equal(manifest.version, 1);
  assert.equal(manifest.buildDate, "2026-07-31");
  assert.equal(manifest.asOfDate, "2026-08-06");
  assert.equal(entries.length, 316);
  assert.equal(manifest.files["category/experiences/index.html"].expected, "missing");
  assert.equal(manifest.files["category/groceries/index.html"].expected, "missing");
  entries.forEach(([file, pair]) => {
    assert.match(file, /^(?:[a-z0-9-]+\/)*[a-z0-9.-]+$/);
    assert.match(pair.expected, /^(?:missing|[a-f0-9]{64})$/);
    assert.match(pair.actual, /^(?:missing|[a-f0-9]{64})$/);
    assert.notEqual(pair.expected, pair.actual);
  });

  const [reviewedFile, reviewedPair] = entries.find(([, pair]) => pair.expected !== "missing");
  assert.equal(
    isExactReviewedDifference(
      manifest,
      reviewedFile,
      { hash: reviewedPair.expected },
      { hash: reviewedPair.actual }
    ),
    true
  );
  assert.equal(
    isExactReviewedDifference(
      manifest,
      reviewedFile,
      { hash: reviewedPair.expected },
      { hash: "0".repeat(64) }
    ),
    false
  );

  const source = fs.readFileSync(COMPARATOR, "utf8");
  assert.match(source, /--allow-adsterra-evergreen-v1/);
  assert.match(source, /ADSTERRA_EVERGREEN_OUTPUT_BASELINE/);
});

test("fixed-date preload freezes only implicit time and preserves the Date API", () => {
  const script = `
    const implicit = new Date();
    const explicit = new Date("2020-02-03T04:05:06.000Z");
    process.stdout.write(JSON.stringify({
      year: implicit.getFullYear(),
      month: implicit.getMonth() + 1,
      day: implicit.getDate(),
      hour: implicit.getHours(),
      now: Date.now(),
      implicitTime: implicit.getTime(),
      called: Date(),
      implicitString: implicit.toString(),
      explicit: explicit.toISOString(),
      parsed: Date.parse("2020-02-03T04:05:06.000Z"),
      utc: Date.UTC(2020, 1, 3, 4, 5, 6),
      isDate: implicit instanceof Date,
      tag: Object.prototype.toString.call(implicit),
    }));
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      FREEHUB_AS_OF_DATE: "2026-08-06",
      NODE_OPTIONS: `--require=${FIXED_DATE_REGISTER}`,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(result.stdout);
  assert.deepEqual(
    { year: observed.year, month: observed.month, day: observed.day, hour: observed.hour },
    { year: 2026, month: 8, day: 6, hour: 12 }
  );
  assert.equal(observed.now, observed.implicitTime);
  assert.equal(observed.called, observed.implicitString);
  assert.equal(observed.explicit, "2020-02-03T04:05:06.000Z");
  assert.equal(observed.parsed, 1580702706000);
  assert.equal(observed.utc, 1580702706000);
  assert.equal(observed.isDate, true);
  assert.equal(observed.tag, "[object Date]");
});

test("fixed-date preload rejects a missing or invalid lifecycle date", () => {
  for (const value of [undefined, "2026-02-30", "06-08-2026"]) {
    const env = { ...process.env, NODE_OPTIONS: `--require=${FIXED_DATE_REGISTER}` };
    if (value === undefined) {
      delete env.FREEHUB_AS_OF_DATE;
    } else {
      env.FREEHUB_AS_OF_DATE = value;
    }

    const result = spawnSync(process.execPath, ["-e", "process.stdout.write('unreachable')"], {
      encoding: "utf8",
      env,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /FREEHUB_AS_OF_DATE must be set to a valid YYYY-MM-DD date/);
  }
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
