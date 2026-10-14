const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const routes = ["sms-competitions-south-africa", "win-airtime-competitions-south-africa", "win-data-competitions-south-africa"];

test.beforeEach(async ({ page }) => {
  await page.route("**/scripts.scriptwrapper.com/**", route => route.abort());
  await page.route("**/firebase-config.json", route => route.fulfill({ status: 404, body: "Local test" }));
  await page.clock.install({ time: new Date(`${process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || "2026-10-14"}T10:00:00Z`) });
});

for (const slug of routes) test(`${slug} preserves guide, canonical and qualifying inventory after hydration`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${slug}/`);
  await expect(page.locator("#loadingState")).toBeHidden();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://freehub.co.za/${slug}/`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index,\s*follow/);
  const ids = await page.evaluate(() => window.FreeHubVerticalCollection.recordIds);
  expect(ids.length).toBeGreaterThan(0);
  await expect(page.locator("#competitionsGrid article")).toHaveCount(ids.length);
  const heading = await page.locator('h1').textContent();
  expect(await page.locator('#structured-data-itemlist').evaluate(node => JSON.parse(node.textContent).name)).toBe(heading);
  const title = await page.title();
  await page.getByRole("searchbox").fill("no-matching-listing-fixture");
  await expect(page.locator("#competitionsGrid article")).toHaveCount(0);
  await expect(page.locator("[data-inventory-count]")).toContainText(`${ids.length} current verified`);
  await page.route("**/app-data/browser-competitions.json", route => route.fulfill({ json: [] }));
  await page.reload();
  await expect(page.locator("[data-inventory-count]")).toHaveText("No current verified competitions match this guide.");
  await expect(page.locator("#competitionsGrid article")).toHaveCount(0);
  await expect(page.locator(".hero .trust-row__item").first()).toHaveText("No current competitions");
  await expect(page.locator(".hero-preview-item")).toHaveCount(0);
  await expect(page.locator(".seo-copy-block--intro")).toBeVisible();
  expect(await page.title()).toBe(title);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("voucher cards keep responsive artwork after the live feed loads", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/category/vouchers/");
  await expect(page.locator("#loadingState")).toBeHidden();
  const images = page.locator('#competitionsGrid img[srcset]');
  expect(await images.count()).toBeGreaterThan(0);
  const first = images.first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveAttribute("width", /\d+/);
  await expect(first).toHaveAttribute("height", /\d+/);
  expect(await first.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await first.getAttribute("srcset")).toContain("/assets/responsive/");
});

test("expired recommendations expose useful links and clear the shortlist heading", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T10:00:00Z"));
  await page.goto("/");
  await expect(page.locator("[data-editorial-pick]")).toHaveCount(0);
  await expect(page.locator("[data-editorial-heading]")).toHaveText("Keep exploring Freehub");
  await expect(page.locator("[data-editorial-fallback] a")).toHaveCount(3);
  for (const href of await page.locator("[data-editorial-fallback] a").evaluateAll(links => links.map(link => link.getAttribute("href")))) {
    expect(fs.existsSync(path.join(root, href, "index.html"))).toBe(true);
  }
});
