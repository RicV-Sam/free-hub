const { test, expect } = require("@playwright/test");
const manifest = require("../../data/responsive-images.json");
const provider = "https://scripts.scriptwrapper.com/tags/db39d7ff-ec0e-46b2-9797-bad57ea1954f.js";
const referenceDate = require('./editorial-source-fixture.js').referenceDate;

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${referenceDate}T10:00:00Z`));
  await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
});

test("encoded artwork paths use the reviewed responsive derivatives", async ({ page }) => {
  const fixture = require('../../scripts/lib/current-content-baseline.js').getCurrentContentBaseline().active[0];
  expect(fixture).toBeTruthy();
  const requested = [];
  page.on('request', request => { if (request.resourceType() === 'image') requested.push(new URL(request.url()).pathname); });
  await page.route('**/app-data/browser-competitions.json', route => {
    requested.length = 0; // Measure hydrated cards, independently of historical server-rendered inventory.
    return route.fulfill({ json: [{ ...fixture, image: 'https://freehub.co.za/FH%20logo.png', imageFallback: 'https://freehub.co.za/FH%20logo.png' }] });
  });
  await page.goto('/competitions/');
  await expect(page.locator('#loadingState')).toBeHidden();
  const image = page.locator('#competitionsGrid img[srcset]');
  await expect(image).toHaveCount(1);
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute('srcset', /\/assets\/responsive\/fh-logo-/);
  expect(requested).not.toContain('/FH%20logo.png');
});

test("mobile navigation works before deferred scripts arrive and does not collapse later", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  for (const script of ["app.js", "shared/site-ui.js"]) {
    await page.route(`**/${script}?*`, async route => { await barrier; await route.continue(); });
  }
  try {
    await page.goto("/category/vouchers/", { waitUntil: "commit" });
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    const nav = page.getByRole("navigation", { name: "Primary navigation", exact: true });
    await expect(menu).toBeVisible(); await expect(nav).toBeHidden();
    const before = (await page.locator("main").boundingBox()).y;
    await menu.click(); await expect(nav).toBeVisible();
    await page.keyboard.press("Escape"); await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
    release();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#loadingState")).toBeHidden();
    expect(Math.abs((await page.locator("main").boundingBox()).y - before)).toBeLessThan(1);
  } finally { release(); }
});

test("responsive card creation does not start requests for superseded originals", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requested = [];
  page.on("request", request => { if (request.resourceType() === "image") requested.push(decodeURIComponent(new URL(request.url()).pathname)); });
  const source = Object.keys(manifest).find(src => src.includes("spar-colgate-palmolive"));
  expect(source).toBeTruthy();
  const fixture = require('../../scripts/lib/current-content-baseline.js').getCurrentContentBaseline().active.find(record => record.category === 'Vouchers');
  expect(fixture).toBeTruthy();
  await page.route('**/app-data/browser-competitions.json', route => {
    requested.length = 0;
    return route.fulfill({ json: [{ ...fixture, image: `https://freehub.co.za${source}`, imageFallback: `https://freehub.co.za${source}` }] });
  });
  await page.goto("/category/vouchers/");
  await expect(page.locator("#loadingState")).toBeHidden();
  const image = page.locator('#competitionsGrid img[srcset]');
  await expect(image).toHaveCount(1);
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => requested.some(src => src.startsWith('/assets/responsive/'))).toBe(true);
  expect(requested).not.toContain(source);
});

for (const route of ["/", "/category/vouchers/", "/free-stuff-south-africa/", "/student-freebies-discounts-south-africa/"]) {
  test(`eligible page keeps exactly one unmodified asynchronous provider: ${route}`, async ({ page }) => {
    await page.route(provider, request => request.fulfill({ contentType: "application/javascript", body: "window.__providerInstallCount=(window.__providerInstallCount||0)+1;" }));
    await page.goto(route);
    const script = page.locator(`script[src="${provider}"]`);
    await expect(script).toHaveCount(1);
    await expect(script).toHaveAttribute("async", "async");
    await expect(script).toHaveAttribute("data-noptimize", "1");
    expect(await page.evaluate(() => window.__providerInstallCount)).toBe(1);
    for (const origin of ["https://scripts.scriptwrapper.com", "https://scripts.journeymv.com", "https://eu-us.consentmanager.net", "https://eu-us-cdn.consentmanager.net"]) {
      await expect(page.locator(`link[rel="preconnect"][href="${origin}"]`)).toHaveCount(1);
    }
    // The application bootstrap must never assign or rewrite provider consent.
    const bootstrap = await page.locator("script[data-freehub-navigation]").textContent();
    expect(bootstrap).not.toMatch(/__cmp|__tcfapi|setConsent|consentStatus/);
  });
}

test("protected pages do not start provider or consent connections", async ({ page }) => {
  for (const route of ["/privacy-policy/", "/about/", "/club/dashboard/"]) {
    const response = await page.request.get(route);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain(provider);
    expect(html).not.toContain('href="https://eu-us.consentmanager.net"');
  }
  const source = require("../../data/competitions.json").find(record => record.verificationStatus === "published" && record.closingDate < referenceDate && !record.resultStatus && !record.doNotPublish);
  expect(source).toBeTruthy();
  const route = require("../../shared/page-data.js").getCompetitionPath(source);
  const response = await page.request.get(route);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).not.toContain(provider);
});

test("win-a-car tag retains the primary canonical after hydration", async ({ page }) => {
  await page.goto("/tag/win-a-car/");
  await expect(page.locator("#loadingState")).toBeHidden();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://freehub.co.za/win-a-car/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
});
