const { test } = require("node:test");
const assert = require("node:assert/strict");
const config = require("../../data/promotions.json");
const { validatePromotions, selectPromotion, renderPromotion, injectPromotionAssets } = require("../../scripts/lib/promotion-renderer.js");
const active = { enabled: true, asOf: "2026-11-10T12:00:00+02:00" };
const clone = () => structuredClone(config);

test("five explicit routes share the three formats, with one selected house campaign each", () => {
  validatePromotions(config);
  assert.equal(config.placements.length, 5);
  assert.deepEqual(new Set(config.placements.map((row) => row.format)), new Set(["card", "category", "compact"]));
  for (const placement of config.placements) {
    const selected = selectPromotion(config, placement.path, active);
    assert.equal(selected.placement.id, placement.id);
    assert.equal(selected.campaign.kind, "house");
    const url = new URL(selected.href);
    assert.equal(url.origin, "https://datacost.co.za");
    assert.equal(url.searchParams.get("utm_source"), "freehub");
    assert.equal(url.searchParams.get("utm_campaign"), selected.campaign.id);
    assert.equal(url.searchParams.get("utm_content"), `${placement.id}__${selected.campaign.creative.id}`);
  }
});

test("default-off, noindex, outbound, private and non-allowlisted pages cannot select a promotion", () => {
  assert.equal(selectPromotion(config, "/"), null);
  for (const pathname of ["/out/competition/test/", "/account/", "/admin/", "/competition/example/", "/win-data-competitions-south-africa/?query=1"]) assert.equal(selectPromotion(config, pathname, active), null);
  assert.equal(selectPromotion(config, "/", { ...active, noindex: true }), null);
  assert.equal(selectPromotion(config, "/", { ...active, asOf: "invalid" }), null);
});

test("campaign and destination schedules fail closed at exact SAST review boundaries", () => {
  assert.equal(selectPromotion(config, "/", { ...active, asOf: "2026-11-09T23:59:59+02:00" }), null);
  assert.ok(selectPromotion(config, "/", { ...active, asOf: "2026-11-10T00:00:00+02:00" }));
  assert.ok(selectPromotion(config, "/", { ...active, asOf: "2026-12-10T23:59:59+02:00" }));
  assert.equal(selectPromotion(config, "/", { ...active, asOf: "2026-12-11T00:00:00+02:00" }), null);
  const draft = clone();
  draft.campaigns[0].startsAt = "2026-11-11T10:00:00+02:00";
  draft.campaigns[0].endsAt = "2026-11-12T10:00:00+02:00";
  assert.equal(selectPromotion(draft, "/", active), null);
  assert.equal(selectPromotion(draft, "/", { ...active, asOf: draft.campaigns[0].endsAt }), null);
  draft.campaigns[0].status = "paused";
  assert.equal(selectPromotion(draft, "/", { ...active, asOf: draft.campaigns[0].startsAt }), null);
});

test("paid and affiliate campaigns can be drafted but never activated or selected", () => {
  for (const kind of ["paid", "affiliate"]) {
    const draft = clone();
    draft.campaigns[0].kind = kind;
    assert.throws(() => validatePromotions(draft), /cannot be activated/);
    assert.equal(selectPromotion(draft, "/", active), null);
    draft.campaigns[0].status = "draft";
    assert.doesNotThrow(() => validatePromotions(draft));
  }
  const external = clone();
  external.sponsors[0].relationship = "external";
  assert.throws(() => validatePromotions(external), /cannot be activated/);
  assert.equal(selectPromotion(external, "/", active), null);
});

test("invalid references, URLs, duplicate paths, forbidden fields and malformed dates are rejected", () => {
  const changes = [
    (c) => { c.destinations[0].url = "javascript:alert(1)"; },
    (c) => { c.destinations[0].url = "https://datacost.co.za.evil.test/"; },
    (c) => { c.destinations[0].url = "https://user:pass@datacost.co.za/"; },
    (c) => { c.destinations[0].url = "https://datacost.co.za/?email=private"; },
    (c) => { c.destinations[0].reviewedAt = "2026-02-30"; },
    (c) => { c.destinations[0].reviewDueAt = "2026-01-01"; },
    (c) => { c.campaigns[0].destinationId = "missing"; },
    (c) => { c.campaigns[0].placements = ["missing"]; },
    (c) => { c.placements[1].path = "/"; },
    (c) => { c.placements[0].path = "/out/test/"; },
    (c) => { c.campaigns[0].pixel = "https://tracker.test/"; },
    (c) => { c.sponsors[0].approvedHosts.push("evil.test"); c.destinations[0].url = "https://evil.test/"; },
  ];
  for (const change of changes) { const invalid = clone(); change(invalid); assert.throws(() => validatePromotions(invalid)); }
});

test("selection is deterministic by priority, then ID, without rotation or extra modules", () => {
  const multiple = clone();
  const other = structuredClone(multiple.campaigns[0]);
  other.id = "another-house-campaign";
  multiple.campaigns.push(other);
  validatePromotions(multiple);
  assert.equal(selectPromotion(multiple, "/", active).campaign.id, other.id);
  other.priority = 9;
  assert.equal(selectPromotion(multiple, "/", active).campaign.id, config.campaigns[0].id);
});

test("shared renderer escapes copy, names destinations and labels ownership", () => {
  const selected = selectPromotion(clone(), "/", active);
  selected.campaign.creative.title = '<script>alert("x")</script>';
  const html = renderPromotion(selected);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /House promotion · FreeHub’s sister site/);
  assert.match(html, /rel="sponsored noopener"/);
  assert.match(html, /data-destination-path="\/guides\/cheapest-data-south-africa\/"/);
  assert.equal(renderPromotion(null), "");
});

test("assets are added only with a single module, preserving provider markup", () => {
  const provider = '<script src="https://scripts.scriptwrapper.com/example.js"></script>';
  const shell = `<html><head>${provider}</head><body>CONTENT</body></html>`;
  assert.equal(injectPromotionAssets(shell), shell);
  const pausedLayout = injectPromotionAssets(shell.replace("<body>", '<body data-promotion-layout="home">'));
  assert.match(pausedLayout, /promotions.css/);
  assert.doesNotMatch(pausedLayout, /promotion-runtime.js|promotion-analytics.js/);
  const module = renderPromotion(selectPromotion(config, "/", active));
  const html = injectPromotionAssets(shell.replace("CONTENT", module));
  assert.ok(html.includes(provider));
  assert.match(html, /freehub-promotion-window/);
  assert.match(html, /promotion-analytics.js/);
  assert.throws(() => injectPromotionAssets(shell.replace("CONTENT", module + module)), /multiple primary/);
  assert.throws(() => injectPromotionAssets(shell.replace("<head>", '<head><meta name="robots" content="noindex,follow">').replace("CONTENT", module)), /noindex/);
});
