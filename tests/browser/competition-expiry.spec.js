const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const shared = require("../../shared/page-data.js");

const CLOSING_AT = "2030-01-15T12:00:00+02:00";
const CUTOFF = Date.parse(CLOSING_AT);
const OFFICIAL_URL = "https://example.test/competition-entry";
const FIXTURE_PATH = "/__test-competition-expiry/";
const fixtureRecord = {
  id: "exact-deadline-fixture",
  title: "Exact deadline test competition",
  brand: "Test promoter",
  category: "Tech",
  verificationStatus: "published",
  closingDate: "2030-01-15",
  closingAt: CLOSING_AT,
  url: OFFICIAL_URL,
};

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function sourceBetween(source, first, next) {
  const start = source.indexOf(first);
  const end = source.indexOf(next, start);
  if (start < 0 || end < 0) throw new Error(`Missing generator fixture boundary: ${first}`);
  return source.slice(start, end);
}

// Render the actual outbound template and hero helpers without running the
// mutating site build. Only unrelated navigation, tracking and artwork are stubbed.
function renderOutboundFixture({ timed = true, ads = false } = {}) {
  const source = fs.readFileSync(path.join(__dirname, "../../scripts/generate-pages.js"), "utf8");
  const context = {
    shared: { ...shared, competitionAllowsAds: () => ads },
    URL,
    escapeHtml: escape,
    escapeAttribute: escape,
    escapeScript: value => String(value).replace(/<\//g, "<\\/"),
    getOfficialSourceUrl: record => record.url,
    getOfficialSourceDomain: record => new URL(record.url).hostname,
    getStylesheetHref: () => "/styles.css",
    RELATIVE_ASSET_PATH: "/",
    UI_ASSET_VERSION: "expiry-fixture",
    GUEST_ADS_SCRIPT: '<script src="/shared/guest-ads.js?expiry-fixture"></script>',
    OUTBOUND_HANDOFF_SCRIPT: '<script src="/shared/outbound-handoff.js"></script>',
    renderGoogleTagManagerHead: () => '<script>window.gtag=function(){};</script>',
    renderMetaPixelHead: () => "",
    renderGoogleTagManagerNoScript: () => "",
    renderMetaPixelNoScript: () => "",
    renderTopNavigation: () => '<nav class="site-topbar"><a href="/competitions/">Competitions</a></nav>',
    renderSiteFooter: () => "",
    renderMascot: () => "",
    WHATSAPP_CHANNEL_URL: "https://example.test/updates",
  };
  vm.createContext(context);
  vm.runInContext(
    sourceBetween(source, "function renderHeroActions(", "function renderCollectionHero(") +
    sourceBetween(source, "function renderOutPage(", "function renderCompetitionInternalLinks("),
    context,
  );
  const record = { ...fixtureRecord };
  if (!timed) delete record.closingAt;
  let html = context.renderOutPage(record);
  // The production file writer adds these same runtime scripts to public shells.
  const runtime = (html.includes('src="/shared/page-data.js') ? "" : '<script src="/shared/page-data.js" defer></script>') +
    (html.includes('src="/shared/site-ui.js') ? "" : '<script src="/shared/site-ui.js" defer></script>');
  return html.replace("</body>", `${runtime}</body>`);
}

function renderDetailFixture({ timed = true } = {}) {
  const exactAttribute = timed ? `data-detail-closing-at="${CLOSING_AT}"` : "";
  return `<!doctype html><html><head><meta charset="utf-8">
    <script src="/shared/page-data.js" defer></script><script src="/shared/site-ui.js" defer></script>
    </head><body data-detail-closing-date="2030-01-15" ${exactAttribute}>
    <h1 id="pageTitle">Exact deadline fixture</h1><p class="hero__closing">Closes 15 Jan 2030</p>
    <a data-active-entry data-entry-path="/out/exact-deadline-fixture/" ${timed ? "hidden" : 'href="/out/exact-deadline-fixture/"'}>Enter competition</a>
    <p class="competition-detail__cta-note">Continue to the promoter.</p>
    <section data-runtime-closed hidden><h2>This competition has closed.</h2><a href="/competitions/">Browse current competitions</a></section>
    <article class="competition-card" data-competition-closing-date="2030-01-15" data-competition-closing-at="${CLOSING_AT}"><a href="/competition/exact-deadline-fixture/">Timed competition</a></article>
    <article class="competition-card" data-competition-closing-date="2030-01-15"><a href="/competition/date-only-fixture/">Date-only competition</a></article>
    <script id="fixture-itemlist" type="application/ld+json">${JSON.stringify({ "@type": "ItemList", numberOfItems: 2, itemListElement: [
      { "@type": "ListItem", position: 1, url: "https://freehub.co.za/competition/exact-deadline-fixture/" },
      { "@type": "ListItem", position: 2, url: "https://freehub.co.za/competition/date-only-fixture/" },
    ] })}</script></body></html>`;
}

async function serveFixture(page, html, time) {
  const externalRequests = [];
  await page.clock.install({ time: new Date(time) });
  await page.clock.pauseAt(new Date(time));
  await page.route("**/shared/guest-ads.js?expiry-fixture", route => route.fulfill({ contentType: "text/javascript", body: "/* Auth deliberately unresolved. */" }));
  await page.route("https://example.test/**", route => {
    externalRequests.push(route.request().url());
    return route.fulfill({ contentType: "text/html", body: "<h1>Test promoter destination</h1>" });
  });
  await page.route(`**${FIXTURE_PATH}`, route => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto(FIXTURE_PATH, { waitUntil: "domcontentloaded" });
  return externalRequests;
}

for (const [label, offset, open] of [["before", -1, true], ["at", 0, false], ["after", 1, false]]) {
  test(`timed detail and cards are correct ${label} the exact cutoff`, async ({ page }) => {
    await serveFixture(page, renderDetailFixture(), CUTOFF + offset);
    await expect(page.locator("[data-active-entry]")).toBeVisible({ visible: open });
    await expect(page.locator("[data-runtime-closed]")).toBeVisible({ visible: !open });
    await expect(page.locator("article[data-competition-closing-at]")).toHaveCount(open ? 1 : 0);
    await expect(page.locator("article:not([data-competition-closing-at])")).toHaveCount(1);
    const itemList = await page.locator("#fixture-itemlist").evaluate(node => JSON.parse(node.textContent));
    expect(itemList.numberOfItems).toBe(open ? 2 : 1);
    expect(itemList.itemListElement.map(item => item.position)).toEqual(open ? [1, 2] : [1]);
  });
}

test("an open detail tab expires at the deadline without waiting for the minute refresh", async ({ page }) => {
  await serveFixture(page, renderDetailFixture(), CUTOFF - 1000);
  await expect(page.locator("[data-active-entry]")).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.locator("[data-active-entry]")).toBeHidden();
  await expect(page.locator("[data-runtime-closed]")).toBeVisible();
});

for (const [eventType, button] of [["click", 0], ["auxclick", 1], ["contextmenu", 2]]) test(`detail ${eventType} rechecks expiry when no refresh event has run`, async ({ page }) => {
  await serveFixture(page, renderDetailFixture(), CUTOFF - 1000);
  await expect(page.locator("[data-active-entry]")).toBeVisible();
  await page.clock.setFixedTime(new Date(CUTOFF));
  const cancelled = await page.locator("[data-active-entry]").evaluate((link, event) => !link.dispatchEvent(new MouseEvent(event.type, { bubbles: true, cancelable: true, button: event.button })), { type: eventType, button });
  expect(cancelled).toBe(true);
  await expect(page.locator("[data-active-entry][href]")).toHaveCount(0);
  await expect(page.locator("[data-runtime-closed]")).toBeVisible();
  expect(page.url()).toContain(FIXTURE_PATH);
});

test("timed outbound enables both manual links and redirects while still open", async ({ page }) => {
  const external = await serveFixture(page, renderOutboundFixture(), CUTOFF - 10000);
  const links = page.locator("[data-outbound-destination]");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", OFFICIAL_URL);
  await expect(links.nth(1)).toHaveAttribute("href", OFFICIAL_URL);
  await page.clock.runFor(2000);
  await expect(page).toHaveURL(OFFICIAL_URL);
  expect(external).toEqual([OFFICIAL_URL]);
});

for (const offset of [0, 1]) test(`stale outbound cannot leave at cutoff + ${offset}ms`, async ({ page }) => {
  const external = await serveFixture(page, renderOutboundFixture(), CUTOFF + offset);
  await expect(page.locator("[data-outbound-destination][href]")).toHaveCount(0);
  await page.clock.runFor(6000);
  expect(external).toEqual([]);
  expect(page.url()).toContain(FIXTURE_PATH);
});

test("an outbound countdown cannot cross the exact cutoff", async ({ page }) => {
  const external = await serveFixture(page, renderOutboundFixture(), CUTOFF - 1000);
  await page.clock.runFor(2500);
  expect(external).toEqual([]);
  await expect(page.locator("[data-outbound-destination][href]")).toHaveCount(0);
});

test("delayed guest-ad resolution cannot release an expired outbound", async ({ page }) => {
  const external = await serveFixture(page, renderOutboundFixture({ ads: true }), CUTOFF - 1000);
  await page.clock.runFor(6000);
  expect(external).toEqual([]);
  await expect(page.locator("[data-outbound-destination][href]")).toHaveCount(0);
});

for (const [eventType, button] of [["click", 0], ["auxclick", 1], ["contextmenu", 2]]) test(`outbound manual ${eventType} rechecks the deadline between refreshes`, async ({ page }) => {
  const external = await serveFixture(page, renderOutboundFixture(), CUTOFF - 10000);
  await expect(page.locator("[data-outbound-destination]").last()).toHaveAttribute("href", OFFICIAL_URL);
  await page.clock.setFixedTime(new Date(CUTOFF));
  const cancelled = await page.locator("[data-outbound-destination]").last().evaluate((link, event) => !link.dispatchEvent(new MouseEvent(event.type, { bubbles: true, cancelable: true, button: event.button })), { type: eventType, button });
  expect(cancelled).toBe(true);
  expect(external).toEqual([]);
  await expect(page.locator("[data-outbound-destination][href]")).toHaveCount(0);
});

test("JavaScript-disabled timed outbound fails closed; date-only manual fallback remains", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const timed of [true, false]) {
    const html = renderOutboundFixture({ timed });
    await page.route(`**${FIXTURE_PATH}`, route => route.fulfill({ contentType: "text/html", body: html }));
    await page.goto(FIXTURE_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.locator(`a[href="${OFFICIAL_URL}"]`)).toHaveCount(timed ? 0 : 2);
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
    await page.unroute(`**${FIXTURE_PATH}`);
  }
  await context.close();
});

test("date-only detail remains open until the following South African midnight", async ({ page }) => {
  const midnight = Date.parse("2030-01-16T00:00:00+02:00");
  await serveFixture(page, renderDetailFixture({ timed: false }), midnight - 1);
  await expect(page.locator("[data-active-entry]")).toBeVisible();
  await page.clock.setFixedTime(new Date(midnight));
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.locator("[data-active-entry]")).toBeHidden();
  await expect(page.locator("[data-runtime-closed]")).toBeVisible();
});
