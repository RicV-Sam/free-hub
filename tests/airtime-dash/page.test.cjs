const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "../..");
test("production deployment cannot publish emulator rules and the first competition uses the confirmed South African deadline", () => {
  const production = require("../../firebase.airtime-dash.json");
  const emulators = require("../../firebase.airtime-dash.emulators.json");
  assert.equal(production.firestore, undefined); assert.equal(production.emulators, undefined);
  assert.equal(emulators.firestore.rules, "tests/airtime-dash/firestore.rules");
  assert.equal(production.functions[0].codebase, "airtime-dash");
  const first = require("../../data/airtime-dash-first-competition.json");
  assert.equal(first.endAt, Date.parse("2026-11-01T00:00:00+02:00"));
  assert.equal(first.startAt, null); assert.equal(first.status, "draft"); assert.equal(first.legalReviewed, false);
  assert.match(first.eligibility, /South African residents aged 18/);
  assert.match(first.contactPolicy, /4 November 2026/);
  assert.equal(first.claimDays, 7); assert.match(first.rules, /seven calendar days after notification/); assert.doesNotMatch(first.rules, /PROPOSED CLAIM WINDOW/);
});
test("generated-output review allows only the exact game pages and account navigation changes", () => {
  const { isExactReviewedDifference } = require("../../scripts/lib/generated-output-review.js");
  const manifest = require("../baselines/airtime-dash-generated-output.json");
  assert.deepEqual(Object.keys(manifest.files).sort(), ["admin/airtime-dash/index.html", "club/account/index.html", "club/dashboard/index.html", "play/airtime-dash/index.html"]);
  for (const [file, pair] of Object.entries(manifest.files)) {
    const expected = pair.expected === "missing" ? undefined : { hash: pair.expected };
    assert.ok(pair.expected === "missing" || /^[a-f0-9]{64}$/.test(pair.expected));
    assert.match(pair.actual, /^[a-f0-9]{64}$/);
    assert.equal(isExactReviewedDifference(manifest, file, expected, { hash: pair.actual }), true);
    assert.equal(isExactReviewedDifference(manifest, file, expected, { hash: "tampered" }), false);
    assert.equal(isExactReviewedDifference(manifest, file, { hash: "existing" }, { hash: pair.actual }), false);
  }
  assert.equal(isExactReviewedDifference(manifest, "index.html", undefined, { hash: "anything" }), false);
});
test("the game follows the discovery flag, while admin stays private and both pages stay ad-free", () => {
  const enabled = require("../../data/airtime-dash.json").enabled;
  for (const route of ["play/airtime-dash", "admin/airtime-dash"]) {
    const html = fs.readFileSync(path.join(root, route, "index.html"), "utf8");
    assert.ok(html.includes(`name="robots" content="${route.startsWith("admin/") || !enabled ? "noindex" : "index"},follow"`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal(html.includes("shared/guest-ads.js"), false);
    assert.equal(html.includes("scripts.scriptwrapper.com"), false);
    assert.match(html, /shared\/auth-ui\.js/);
  }
  const game = fs.readFileSync(path.join(root, "play/airtime-dash/index.html"), "utf8");
  assert.match(game, /direct|welcome-v1-160\.webp/);
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  assert.equal((sitemap.match(/<loc>https:\/\/freehub\.co\.za\/play\/airtime-dash\/<\/loc>/g) || []).length, enabled ? 1 : 0);
  assert.equal(sitemap.includes("admin/airtime-dash"), false);
  assert.equal(fs.readFileSync(path.join(root, "index.html"), "utf8").includes('href="/play/airtime-dash/"'), enabled);
});

test("public discovery review rejects unrelated edits and duplicate game links", () => {
  const { isAirtimeDashDiscoveryDifference: reviewed } = require("../../scripts/lib/generated-output-review.js");
  const follow = '          <a class="site-topbar__link" href="/club/">My competitions</a>';
  const play = '          <a class="site-topbar__link" href="/play/airtime-dash/">Play</a>\n';
  const before = `<nav>\n${follow}\n</nav>`;
  const after = before.replace(follow, play + follow);
  assert.equal(reviewed("index.html", before, after), true);
  assert.equal(reviewed("index.html", before, after + "unrelated"), false);
  assert.equal(reviewed("index.html", before, after.replace(follow, play + follow)), false);
  const entry = '  <url>\n    <loc>https://freehub.co.za/play/airtime-dash/</loc>\n    <lastmod>2026-09-08</lastmod>\n  </url>\n';
  assert.equal(reviewed("sitemap.xml", "<urlset>\n</urlset>", `<urlset>\n${entry}</urlset>`, "2026-09-08"), true);
  assert.equal(reviewed("sitemap.xml", "<urlset>\n</urlset>", `<urlset>\n${entry}${entry}</urlset>`, "2026-09-08"), false);
  assert.equal(reviewed("sitemap.xml", "<urlset>\n</urlset>", `<urlset>\n${entry}</urlset>`, "2026-09-09"), false);
});
test("the browser engine is exactly the server simulation and gameplay assets stay proportionate", () => {
  const source = fs.readFileSync(path.join(root, "functions/airtime-dash/engine.js"));
  assert.deepEqual(fs.readFileSync(path.join(root, "shared/airtime-dash-engine.js")), source);
  const scripts = ["shared/airtime-dash-ui.js", "shared/airtime-dash-api.js", "shared/airtime-dash-engine.js"];
  const bytes = scripts.reduce((sum, file) => sum + fs.statSync(path.join(root, file)).size, 0);
  assert.ok(bytes < 50000, `Game scripts exceeded 50 KB: ${bytes}`);
});
