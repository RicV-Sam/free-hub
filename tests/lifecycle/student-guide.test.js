const test = require("node:test");
const assert = require("node:assert/strict");
const { validateStudentGuide, createStudentGuideRenderer } = require("../../scripts/lib/student-guide");
const content = require("../../data/student-guide.json");
const copy = () => structuredClone(content);
const asOf = "2026-09-07";

test("student guide contains reviewed content across the four benefit types", () => {
  assert.equal(validateStudentGuide(content, asOf), content);
  assert.equal(new Set(content.offers.map((o) => o.type)).size, 4);
});

for (const [name, change, error] of [
  ["missing evidence", (g) => { g.offers[0].sources = []; }, /missing evidence/],
  ["duplicate anchors", (g) => { g.offers[1].id = g.offers[0].id; }, /duplicate anchor/],
  ["unsupported source", (g) => { g.offers[0].sources[0].url = "https://www.microsoft.com.evil.example/"; }, /unapproved/],
  ["unsafe URL", (g) => { g.offers[0].sources[0].url = "javascript:alert(1)"; }, /unapproved/],
  ["missing trial renewal costs", (g) => { delete g.offers.find((o) => o.type === "free_trial").renewal; }, /renewal/],
  ["missing account costs", (g) => { delete g.offers.find((o) => o.type === "account_benefit").accountCosts; }, /accountCosts/],
  ["missing regional eligibility", (g) => { delete g.offers[0].region; }, /region/],
  ["missing provider destination", (g) => { delete g.offers[0].destination; }, /destination/],
  ["unreviewed provider destination", (g) => { g.offers[0].destination.url = "https://www.microsoft.com/unreviewed/"; }, /destination must match reviewed evidence/],
  ["unknown classification", (g) => { g.offers[0].type = "freeish"; }, /classification/],
  ["invalid calendar date", (g) => { g.offers[0].lastChecked = "2026-02-30"; }, /invalid date/],
  ["trial masquerading as best free pick", (g) => { g.bestPicks[0] = "google-ai-plus"; }, /Invalid free best pick/],
]) test(`student guide rejects ${name}`, () => {
  const g = copy(); change(g); assert.throws(() => validateStudentGuide(g, asOf), error);
});

test("expiry is inclusive and fails closed on the following day", () => {
  const g = copy();
  g.offers.forEach((o) => { delete o.comparison; });
  assert.doesNotThrow(() => validateStudentGuide(g, "2026-12-31"));
  assert.throws(() => validateStudentGuide(g, "2027-01-01"), /gautrain-student: expired/);
});

test("undated price comparisons have an editorial deadline without inventing a provider expiry", () => {
  assert.doesNotThrow(() => validateStudentGuide(content, "2026-10-07"));
  assert.throws(() => validateStudentGuide(content, "2026-10-08"), /comparison review overdue/);
  const g = copy();
  delete g.offers.find((o) => o.comparison).comparison.reviewBy;
  assert.throws(() => validateStudentGuide(g, asOf), /comparison requires a deadline/);
});

test("time-limited comparisons require evidence, a deadline and editorial review after expiry", () => {
  const g = copy();
  g.offers[0].comparison = { text: "Test comparison", expiresOn: asOf, source: g.offers[0].sources[0] };
  assert.doesNotThrow(() => validateStudentGuide(g, asOf));
  assert.throws(() => validateStudentGuide(g, "2026-09-08"), /comparison expired/);
  delete g.offers[0].comparison.source;
  assert.throws(() => validateStudentGuide(g, asOf), /unapproved/);
});

test("renderer escapes content and keeps conditions, sources and dates visible without scripting", () => {
  const escape = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const render = createStudentGuideRenderer({ escapeHtml: escape, escapeAttribute: escape, formatDate: (d) => d });
  const g = copy(); g.offers[0].name = '<script>alert("bad")</script>';
  const html = render(g);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.equal((html.match(/class="student-offer"/g) || []).length, g.offers.length);
  for (const o of g.offers) {
    assert.ok(html.includes(`id="${o.id}"`));
    assert.ok(html.includes(escape(o.eligibility)));
    assert.ok(html.includes(escape(o.limitations)));
    assert.ok(html.includes(o.lastChecked));
    if (o.renewal) assert.ok(html.includes(escape(o.renewal)));
  }
});
