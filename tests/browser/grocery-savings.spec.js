const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const enabled = process.env.FREEHUB_ENABLE_OFFERS === "true";
test.skip(!enabled, "Grocery Savings requires the offers flag.");

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  await page.addInitScript(() => { window.groceryEvents = []; window.gtag = (...args) => window.groceryEvents.push(args); });
});

for (const width of [390, 1440]) test(`grocery discovery, layout and retailer clicks at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/grocery-savings/");
  await expect(page.locator("h1")).toHaveText("Grocery savings in South Africa");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://freehub.co.za/grocery-savings/");
  await page.evaluate(() => { window.groceryEvents = []; window.gtag = (...args) => window.groceryEvents.push(args); });
  const area = page.locator("#where-to-shop");
  await expect(area.locator("article")).toHaveCount(3);
  expect((await area.boundingBox()).y).toBeLessThan((await page.locator("#price-checked-finds").boundingBox()).y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('a[data-link-role="store_directory"]').first().evaluate(link => link.addEventListener("click", event => event.preventDefault()));
  await page.locator('a[data-link-role="store_directory"]').first().click();
  const directoryEvents = await page.evaluate(() => window.groceryEvents.filter(args => args[1] === "official_source_click"));
  expect(directoryEvents).toHaveLength(1);
  expect(directoryEvents[0][2]).toMatchObject({ entity_kind: "grocery", link_role: "store_directory", source_domain: "www.best-before.co.za" });
  expect(directoryEvents[0][2].send_to).toEqual(["G-23P37R20FY", "G-P13C4QZYRG"]);
  const cards = page.locator('.grocery-find__body a[data-discovery-action="card"]');
  if (await cards.count()) {
    await cards.first().evaluate(link => link.addEventListener("click", event => event.preventDefault()));
    await cards.first().click();
    expect(await page.evaluate(() => window.groceryEvents.filter(args => args[1] === "discovery_card_click").length)).toBe(1);
    const href = await cards.first().getAttribute("href");
    await page.goto(href);
    await page.evaluate(() => { window.groceryEvents = []; window.gtag = (...args) => window.groceryEvents.push(args); });
    const handoff = page.locator('a[data-link-role="retailer_handoff"]');
    await expect(handoff).toHaveAttribute("href", /^\/out\/deal\//);
    await handoff.evaluate(link => link.addEventListener("click", event => event.preventDefault()));
    await handoff.click();
    expect(await page.evaluate(() => window.groceryEvents.filter(args => args[1] === "official_source_click" && args[2].link_role === "retailer_handoff").length)).toBe(1);
  }
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Grocery Savings guides" }).getByRole("link", { name: "Explore Grocery Savings" })).toBeVisible();
  for (const slug of ["win-grocery-vouchers-south-africa", "supermarket-competitions-south-africa"]) {
    if (!fs.existsSync(path.join(root, slug, "index.html"))) continue;
    await page.goto(`/${slug}/`);
    await expect(page.locator('.hub-editorial a[href="/grocery-savings/"]')).toBeVisible();
  }
  fs.mkdirSync(path.join(root, "output/grocery-review"), { recursive: true });
  await page.goto("/grocery-savings/");
  await page.screenshot({ path: path.join(root, `output/grocery-review/hub-${width}.png`), fullPage: true });
});
