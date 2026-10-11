const test = require("node:test");
const assert = require("node:assert/strict");
const shared = require("../../shared/page-data.js");
const { getReviewedGuides } = require("../../scripts/lib/research-guides.js");
const { createEditorialSectionsRenderer } = require("../../scripts/lib/editorial-sections.js");
const { buildMobileFeed } = require("../../scripts/lib/mobile-feed.js");

test("an earlier editorial cutoff removes promotion without changing the official date", () => {
  const draw = require("../../data/competitions.json").find(item => item.id === "stimorol-volume-driver-2026");
  try {
    shared.setReferenceDate("2026-11-29");
    assert.equal(shared.isExpiredCompetition(draw), false);
    assert.equal(shared.isEditorialPromotionEnded(draw), false);
    assert.equal(shared.isActiveCompetition(draw), true);
    assert.equal(shared.isNoindexActiveCompetition({ ...draw, visibility: "noindex" }), true);
    assert.equal(buildMobileFeed([draw], { asOfDate: "2026-11-29" }).count, 1);
    shared.setReferenceDate("2026-11-30");
    assert.equal(shared.isExpiredCompetition(draw), true);
    assert.equal(shared.isEditorialPromotionEnded(draw), true);
    assert.equal(shared.isActiveCompetition(draw), false);
    assert.equal(shared.isNoindexActiveCompetition({ ...draw, visibility: "noindex" }), false);
    assert.equal(shared.getPublishedActiveCompetitions([draw]).length, 0);
    assert.equal(shared.getPublishedCoreActiveCompetitions([draw]).length, 0);
    assert.equal(buildMobileFeed([draw], { asOfDate: "2026-11-30" }).count, 0);
    assert.equal(draw.closingDate, "2026-11-30");
    assert.equal(shared.isExpiredCompetition({ closingDate: "2026-11-30" }), false);
    assert.equal(shared.getEffectiveCompetitionEndDate({ closingDate: "2026-11-30", editorialActiveUntil: "2026-12-01" }), "2026-11-30");
    assert.equal(shared.getEffectiveCompetitionEndDate({ closingDate: "2026-11-30", editorialActiveUntil: "2026-02-30" }), "2026-11-30");
    shared.setReferenceDate("2026-12-01");
    assert.equal(shared.isExpiredCompetition(draw), true);
    assert.equal(shared.isEditorialPromotionEnded(draw), false);
  } finally { shared.setReferenceDate(); }
});

test("dated guides keep only current calendar dates and become noindex after the last event", () => {
  const bySlug = date => new Map(getReviewedGuides(date).map(page => [page.slug, page]));
  const original = bySlug("2026-10-11");
  assert.equal(original.get("cape-town-waterfront-free-events").sections[0].table.rows.length, 5);
  const later = bySlug("2026-11-09");
  const remaining = later.get("cape-town-waterfront-free-events").sections[0].table.rows;
  assert.deepEqual(remaining.map(row => row[1]), ["22 November 2026", "4 December 2026"]);
  assert.equal(later.get("greyville-colours-of-mzansi-16-october-2026").noindex, true);
  assert.deepEqual(later.get("greyville-colours-of-mzansi-16-october-2026").actions, []);
  const ended = bySlug("2026-12-05").get("cape-town-waterfront-free-events");
  assert.equal(ended.noindex, true);
  assert.equal(ended.sections[0].table.rows.length, 0);
  assert.equal(ended.dateModified, "2026-10-11");
  assert.equal(bySlug("2026-12-05").get("coffee-rewards-south-africa").noindex, false);
});

test("editorial tables escape text and reject executable link schemes", () => {
  const escape = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const renderer = createEditorialSectionsRenderer({ escapeHtml: escape, escapeAttribute: escape });
  const section = href => [{ heading: "<script>", paragraphs: [], table: { caption: "Dates", headers: ["Event"], rows: [[{ label: "<img>", href }]] } }];
  const html = renderer.renderSections(section("https://example.com/event"));
  assert.ok(html.includes('scope="row"'));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&lt;img&gt;"));
  assert.throws(() => renderer.renderSections(section("javascript:alert(1)")), /unsupported destination/);
  assert.throws(() => renderer.renderSections(section("//other.example/")), /unsupported destination/);
});

test("related links disappear when their destination is unavailable", () => {
  const escape = value => String(value);
  const renderer = createEditorialSectionsRenderer({
    escapeHtml: escape, escapeAttribute: escape,
    isLinkAvailable: link => link.href !== "/deal/overdue/",
  });
  const html = renderer.renderListingDetails({ sections: [], relatedLinks: [
    { label: "Overdue deal", href: "/deal/overdue/" },
    { label: "Current guide", href: "/free-stuff-south-africa/" },
  ] });
  assert.ok(!html.includes("/deal/overdue/"));
  assert.ok(html.includes("/free-stuff-south-africa/"));
});
