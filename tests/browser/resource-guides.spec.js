const { test, expect } = require("@playwright/test");
const path = require("node:path");
const output = path.resolve(__dirname, "../../output/famelack-review");

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1") return route.continue();
    if (url.href === "https://famelack.com/") return route.fulfill({ contentType: "text/html", body: "<h1>Destination reached</h1>" });
    return route.abort();
  });
  await page.addInitScript(() => {
    window.__resourceEvents = [];
    window.dataLayer = [];
    const push = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = (...items) => {
      items.forEach(item => { if (item[0] === "event") window.__resourceEvents.push(Array.from(item)); });
      return push(...items);
    };
  });
});

test("Famelack is discoverable and readable on desktop and mobile", async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/free-stuff-south-africa/");
    const tile = page.locator("#resource-resource-famelack-live-tv-radio-webcams");
    await expect(tile.getByRole("link", { name: /^View details for Famelack/ })).toHaveAttribute("href", "/resources/famelack/");
    await tile.screenshot({ path: path.join(output, `tile-${width}.png`) });
    await tile.getByRole("link", { name: /^View details for Famelack/ }).click();
    await expect(page).toHaveURL(/\/resources\/famelack\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Famelack: Free TV, Radio & Webcams");
    await expect(page.getByRole("heading", { name: "How to get started" })).toBeVisible();
    const heroCta = page.locator(".hero").getByRole("link", { name: "Open Famelack", exact: true });
    await heroCta.focus(); await expect(heroCta).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const image = page.locator(".listing-hero-image img");
    await image.scrollIntoViewIfNeeded();
    expect(await image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await heroCta.evaluate(link => link.blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(output, `detail-top-${width}.png`) });
    await page.screenshot({ path: path.join(output, `detail-${width}.png`), fullPage: true });
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(2);
  }
});

test("larger text keeps the resource readable and actionable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/resources/famelack/");
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const action = page.locator(".hero").getByRole("link", { name: "Open Famelack", exact: true });
  await action.focus();
  await expect(action).toBeFocused();
  await expect(action).toHaveAttribute("href", "/out/resources/famelack/");
});

test("detail clicks, manual departures and automatic departures are distinct", async ({ page }) => {
  await page.clock.install();
  await page.goto("/resources/famelack/");
  await page.evaluate(() => document.querySelector('.hero [data-discovery-action="resource-handoff"]').addEventListener("click", event => event.preventDefault()));
  await page.locator('.hero [data-discovery-action="resource-handoff"]').click();
  expect(await page.evaluate(() => window.__resourceEvents.some(args => args[1] === "resource_handoff_start"))).toBe(true);
  await page.goto("/out/resources/famelack/");
  await page.evaluate(() => document.querySelector("[data-resource-destination]").addEventListener("click", event => event.preventDefault()));
  await page.getByRole("link", { name: "Continue to Famelack", exact: true }).click();
  expect(await page.evaluate(() => window.__resourceEvents.filter(args => args[1] === "resource_outbound_navigation").map(args => args[2].navigation_method))).toEqual(["manual"]);
  await page.clock.runFor(10000);
  await expect(page).toHaveURL(/\/out\/resources\/famelack\/$/);
  await page.screenshot({ path: path.join(output, "leaving-page.png"), fullPage: true });
  await page.goto("/out/resources/famelack/");
  await page.clock.runFor(6000);
  await expect(page).toHaveURL("https://famelack.com/");
});

test("the resource flow keeps working without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${process.env.FREEHUB_TEST_PORT || 4318}/resources/famelack/`);
  await expect(page.getByRole("heading", { name: "How to get started" })).toBeVisible();
  await page.locator(".hero").getByRole("link", { name: "Open Famelack", exact: true }).click();
  await expect(page.getByRole("link", { name: "Continue to Famelack", exact: true })).toHaveAttribute("href", "https://famelack.com/");
  await expect(page.getByRole("link", { name: "Back to Famelack details", exact: true })).toHaveAttribute("href", "/resources/famelack/");
  await context.close();
});
