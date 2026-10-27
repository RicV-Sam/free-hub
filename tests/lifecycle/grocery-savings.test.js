const test = require("node:test");
const assert = require("node:assert/strict");
const grocery = require("../../scripts/lib/grocery-savings.js");
const offers = require("../../data/offers.json");
const images = require("../../data/listing-images.json");
const offerData = require("../../shared/offer-data.js");
const escape = text => String(text).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapeScript = text => String(text).replaceAll("<", "\\u003c");
const renderer = grocery.createGroceryRenderer({ escapeHtml: escape, escapeAttribute: escape, escapeScript, images, stylesheet: "/styles.css", navigation: "", footer: "", preview: true });

test("grocery drafts remain absent from ordinary publication", () => {
  const source = { ...grocery.settings, publicationStatus: "draft" };
  const drafts = offers.map(offer => ({ ...offer, publicationStatus: "draft" }));
  assert.deepEqual(grocery.getGroceryPages({ source, asOfDate: "2026-10-18" }), []);
  assert.deepEqual(grocery.getGroceryPrices(drafts, { asOfDate: "2026-10-18" }), []);
  for (const offer of drafts) {
    assert.equal(offerData.isPublicOffer(offer, { asOfDate: "2026-10-18" }), false);
  }
});

test("approved grocery pages and offers appear only from their publication date", () => {
  assert.equal(grocery.settings.publicationStatus, "published");
  assert.equal(grocery.getGroceryPages({ asOfDate: "2026-10-18" }).length, 3);
  assert.deepEqual(grocery.getGroceryPages({ asOfDate: "2026-09-08" }), []);
  assert.equal(grocery.getGroceryPrices(offers, { asOfDate: "2026-10-18" }).length, 2);
  assert.equal(grocery.getGroceryPrices(offers, { asOfDate: "2026-10-26" }).length, 10);
  assert.equal(grocery.getGroceryPrices(offers, { asOfDate: "2026-10-27" }).length, 10);
  assert.deepEqual(grocery.getGroceryPrices(offers, { asOfDate: "2026-10-28" }), []);
  assert.deepEqual(grocery.getGroceryPrices(offers, { asOfDate: "2026-09-08" }), []);
});

test("preview is read-only and still withholds overdue or unverified prices", () => {
  const drafts = offers.map(offer => ({ ...offer, publicationStatus: "draft" }));
  const before = JSON.stringify(drafts);
  assert.equal(grocery.getGroceryPrices(drafts, { asOfDate: "2026-10-26", preview: true }).length, 10);
  assert.equal(grocery.getGroceryPrices(drafts, { asOfDate: "2026-10-28", preview: true }).length, 0);
  const changed = drafts.map(offer => ({ ...offer, verificationStatus: "unverified" }));
  assert.equal(grocery.getGroceryPrices(changed, { asOfDate: "2026-10-19", preview: true }).length, 0);
  assert.equal(JSON.stringify(drafts), before);
});

test("Ackermans remains held while its official entry rules conflict", () => {
  const shared = require("../../shared/page-data.js");
  const record = require("../../data/competitions.json").find(row => row.id === "ackermans-baby-of-the-year-2026");
  assert.equal(record.publicationStatus, "held");
  assert.equal(record.verificationStatus, "needs-verification");
  assert.equal(record.doNotPublish, true);
  assert.equal(shared.isPublishedCompetition(record), false);
  assert.match(record.verificationNote, /30 October.*31 October/);
});

test("unit prices use net pack quantity and reject missing or invalid quantities", () => {
  const current = grocery.getGroceryPrices(offers, { asOfDate: "2026-10-26" });
  assert.deepEqual(current.map(grocery.unitPriceCents), [3415, 2415, 4225, 4475, 6738, 5000, 2800, 4400, 5975, 2345]);
  assert.equal(grocery.unitPriceCents({ priceCents: 2500, quantity: 500, unit: "ml" }), 5000);
  for (const quantity of [0, -1, NaN]) assert.throws(() => grocery.unitPriceCents({ priceCents: 990, quantity, unit: "g" }));
});

test("Pasta Joy remains excluded from public and preview prices while its pack size conflicts", () => {
  const record = offers.find(offer => offer.id === "looters-pasta-joy-elbows-500g");
  assert.equal(record.publicationStatus, "review");
  assert.equal(record.verificationStatus, "unverified");
  assert.equal(record.reviewDueAt, "2026-10-19");
  assert.match(record.terms, /500g.*0\.4 kg/);
  for (const preview of [false, true]) {
    const prices = grocery.getGroceryPrices(offers, { asOfDate: "2026-10-19", preview });
    assert.ok(!prices.some(price => price.offerId === record.id));
  }
});

test("price metadata agrees with the offer registry and official image provenance", () => {
  assert.doesNotThrow(() => grocery.validateGroceryData(offers, images));
  const changed = offers.map(offer => offer.id === grocery.settings.priceChecks[0].offerId ? { ...offer, sourceUrl: "https://example.com/" } : offer);
  assert.throws(() => grocery.validateGroceryData(changed, images), /source\/date mismatch/);
});

test("out-of-stock Weet-Bix stays excluded without extending its review window", () => {
  const record = offers.find(offer => offer.id === "looters-bokomo-weet-bix-450g");
  assert.equal(record.publicationStatus, "review");
  assert.equal(record.verificationStatus, "source_changed");
  assert.equal(record.lastChecked, "2026-10-19");
  assert.equal(record.reviewDueAt, "2026-10-20");
  assert.match(record.terms, /Out of stock/);
  for (const preview of [false, true]) {
    assert.ok(!grocery.getGroceryPrices(offers, { asOfDate: "2026-10-26", preview }).some(price => price.offerId === record.id));
  }
});

test("production pages are indexable and deals use the existing retailer handoff", () => {
  const live = grocery.createGroceryRenderer({ escapeHtml: escape, escapeAttribute: escape, escapeScript, images, stylesheet: "/styles.css", navigation: "", footer: "" });
  const prices = grocery.getGroceryPrices(offers, { asOfDate: "2026-10-26" });
  for (const price of prices) {
    const html = live.renderOffer(price);
    assert.ok(html.includes(`href="${offerData.getOfferExitPath(price.offer)}"`));
    assert.ok(html.includes('content="index, follow, max-image-preview:large"'));
    assert.ok(!html.includes('content="noindex'));
    assert.ok(html.includes("/shared/auth-ui.js"));
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.dateModified, price.offer.lastChecked);
    if (price.unit === "ml") {
      assert.ok(html.includes("400ml net pack volume"));
      assert.ok(html.includes("R59.75/litre"));
      assert.ok(!html.includes("400ml net pack weight"));
    }
  }
});

test("preview renders uncertainty, noindex and the empty state without fabricated offers", () => {
  const prices = grocery.getGroceryPrices(offers, { asOfDate: "2026-10-26", preview: true });
  const hub = grocery.getGroceryPages({ preview: true })[0];
  const html = renderer.renderPage(hub, prices);
  assert.ok(html.includes('content="noindex, nofollow"'));
  assert.ok(html.includes("Batch date unavailable"));
  assert.ok(html.includes("No supermarket price saving has been established"));
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.deepEqual(schemas.map(schema => schema["@type"]), ["CollectionPage", "BreadcrumbList"]);
  const empty = renderer.renderPage(hub, []);
  assert.ok(empty.includes("No current price checks to show"));
  assert.ok(!empty.includes("R9.90"));
});


test("grocery discovery puts area and guide choices before product cards without refreshing evidence", () => {
  const page = grocery.getGroceryPages({ asOfDate: "2026-10-27" })[0];
  const html = renderer.renderPage(page, grocery.getGroceryPrices(offers, { asOfDate: "2026-10-27" }));
  assert.equal(page.dateModified, "2026-10-27");
  assert.equal(grocery.settings.lastReviewed, "2026-10-26");
  assert.match(html, /<h1>Grocery savings in South Africa<\/h1>/);
  assert.ok(html.indexOf('id="where-to-shop"') < html.indexOf('id="price-checked-finds"'));
  assert.ok(html.indexOf('id="reading-heading"') < html.indexOf('id="price-checked-finds"'));
  for (const area of ["Gauteng", "Western Cape", "KwaZulu-Natal"]) assert.ok(html.includes(area));
  assert.match(html, /data-link-role="store_directory"/);
  assert.match(html, /No supermarket price saving has been established/);
});

test("grocery clicks reuse discovery analytics while previews and reference images send no events", () => {
  const live = grocery.createGroceryRenderer({ escapeHtml: escape, escapeAttribute: escape, escapeScript, images, stylesheet: "/styles.css", navigation: "", footer: "" });
  const prices = grocery.getGroceryPrices(offers, { asOfDate: "2026-10-27" });
  const html = live.renderOffer(prices[0]);
  assert.match(html, /src="\/shared\/discovery-analytics\.js" defer/);
  assert.match(html, /data-discovery-action="official-source"[^>]+data-content-id="best-before-farmgirl-baked-beans-410g"[^>]+data-source-domain="www.best-before.co.za"[^>]+data-link-role="retailer_handoff"/);
  assert.match(html, /data-link-role="product_source"/);
  assert.match(html, /data-link-role="delivery_terms"/);
  const hub = grocery.getGroceryPages({ asOfDate: "2026-10-27" })[0];
  assert.match(live.renderPage(hub, prices), /data-discovery-action="card"/);
  const preview = renderer.renderPage(hub, prices);
  assert.ok(!preview.includes('src="/shared/discovery-analytics.js"'));
  const figcaptions = [...preview.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g)];
  assert.ok(figcaptions.length > 0);
  for (const caption of figcaptions) assert.ok(!caption[1].includes("data-discovery-action"));
});
