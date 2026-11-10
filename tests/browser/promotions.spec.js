const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const config = require("../../data/promotions.json");
const enabled = process.env.FREEHUB_ENABLE_PROMOTIONS === "true";
const moduleSelector = "[data-freehub-promotion]";
const now = new Date("2026-11-10T12:00:00+02:00");

async function prepare(page, consent = "granted") {
  await page.clock.setFixedTime(now);
  await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  await page.addInitScript((choice) => {
    window.dataLayer = [];
    if (choice !== "unknown") window.dataLayer.push(["consent", "update", { analytics_storage: choice }]);
  }, consent);
}
async function events(page, name) {
  return page.evaluate((eventName) => window.dataLayer.filter((row) => row[0] === "event" && row[1] === eventName).map((row) => row[2]), name);
}
async function reveal(page) {
  await page.locator(moduleSelector).scrollIntoViewIfNeeded();
  await expect(page.locator(moduleSelector)).toBeInViewport({ ratio: 0.5 });
}

test("disabled build preserves legacy promotions and adds no new runtime", async ({ page }) => {
  test.skip(enabled);
  await prepare(page);
  await page.goto("/");
  await expect(page.locator(moduleSelector)).toHaveCount(0);
  await expect(page.locator('script[src*="promotion-analytics"]')).toHaveCount(0);
  await expect(page.locator(".datacost-promo")).toHaveCount(1);
});

test.describe("enabled contextual promotions", () => {
  test.skip(!enabled);
  for (const width of [1440, 390, 320]) {
    for (const placement of config.placements) {
      test(`${placement.id} at ${width}px: one module, readable CTA, mapped destination`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await prepare(page);
        await page.goto(placement.path);
        await expect(page.locator(moduleSelector)).toHaveCount(1);
        await expect(page.locator(".datacost-promo")).toHaveCount(0);
        await expect(page.locator(moduleSelector)).toHaveAttribute("data-format", placement.format);
        await reveal(page);
        const link = page.locator(`${moduleSelector} a`);
        const campaign = config.campaigns.find((row) => row.placements.includes(placement.id));
        const destination = config.destinations.find((row) => row.id === campaign.destinationId);
        const href = new URL(await link.getAttribute("href"));
        expect(href.origin + href.pathname).toBe(destination.url);
        expect(href.searchParams.get("utm_content")).toBe(`${placement.id}__${campaign.creative.id}`);
        expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
        await expect(page.locator('script[src*="scripts.scriptwrapper.com/tags/"]')).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator(".site-footer")).toHaveCount(1);
        await expect.poll(async () => (await events(page, "promotion_view")).length).toBe(1);
      });
    }
  }

  test("no impression offscreen or before consent; grant starts a fresh second, revocation stops clicks", async ({ page }) => {
    await prepare(page, "unknown");
    await page.goto("/");
    await page.waitForTimeout(1200);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    await reveal(page);
    await page.waitForTimeout(1200);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    await page.evaluate(() => dataLayer.push(["consent", "update", { analytics_storage: "granted" }]));
    await page.waitForTimeout(500);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    await expect.poll(async () => (await events(page, "promotion_view")).length).toBe(1);
    await page.evaluate(() => {
      dataLayer.push(["consent", "update", { analytics_storage: "denied" }]);
      document.addEventListener("click", (event) => event.preventDefault(), { once: true });
    });
    await page.locator(`${moduleSelector} a`).click();
    expect(await events(page, "promotion_click")).toHaveLength(0);
  });

  test("CMP needs actual Analytics vendor consent; legitimate interest or mere choice is insufficient", async ({ page }) => {
    await prepare(page, "unknown");
    await page.addInitScript(() => {
      window.__testVendor = false;
      window.__cmp = (command) => command === "consentStatus" ? { consentExists: true } : { vendorConsents: { s26: window.__testVendor }, vendorLI: { s26: true } };
    });
    await page.goto("/");
    await reveal(page);
    await page.waitForTimeout(1300);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    await page.evaluate(() => { window.__testVendor = true; });
    await expect.poll(async () => (await events(page, "promotion_view")).length).toBe(1);
  });

  test("continuous viewability resets offscreen, and rerunning analytics does not duplicate events", async ({ page }) => {
    await prepare(page);
    await page.goto("/");
    await reveal(page);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(200);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    await reveal(page);
    await page.waitForTimeout(400);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    await expect.poll(async () => (await events(page, "promotion_view")).length).toBe(1);
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, "../../shared/promotion-analytics.js"), "utf8") });
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })); });
    await page.waitForTimeout(1300);
    expect(await events(page, "promotion_view")).toHaveLength(1);
  });

  test("keyboard and middle clicks carry campaign, placement and destination without navigation interception", async ({ page, context }) => {
    await prepare(page);
    await page.goto("/");
    await reveal(page);
    await expect.poll(async () => (await events(page, "promotion_view")).length).toBe(1);
    const link = page.locator(`${moduleSelector} a`);
    // A test-only target keeps this document available for inspecting captured calls.
    await link.evaluate((element) => { element.target = "_blank"; });
    await context.route("https://datacost.co.za/**", (route) => route.fulfill({ body: "Destination fixture" }));
    await link.focus();
    const popup = page.waitForEvent("popup");
    await page.keyboard.press("Enter");
    await (await popup).close();
    await page.bringToFront();
    const secondPopup = context.waitForEvent("page");
    await link.click({ button: "middle" });
    await (await secondPopup).close();
    const clicks = await events(page, "promotion_click");
    expect(clicks).toHaveLength(2);
    expect(clicks[0]).toMatchObject({ campaign_id: "dc-compare-data", placement_id: "home-after-shortlist", destination_id: "compare-data", destination_host: "datacost.co.za", destination_path: "/guides/cheapest-data-south-africa/", send_to: "G-23P37R20FY", was_viewable: 1, first_click: 1 });
    expect(clicks[1].first_click).toBe(0);
    expect(Object.keys(clicks[0]).some((key) => /^(?:email|uid|user_id|session_id)$/.test(key))).toBe(false);
  });

  test("cached expired promotions hide before display and cannot be clicked", async ({ page }) => {
    await prepare(page);
    await page.clock.setFixedTime(new Date("2026-12-11T00:00:00+02:00"));
    await page.goto("/");
    await expect(page.locator(moduleSelector)).toBeHidden();
    await expect(page.locator(".datacost-promo")).toHaveCount(0);
    expect(await events(page, "promotion_view")).toHaveLength(0);
    expect(await page.locator(`${moduleSelector} a`).evaluate((element) => element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })))).toBe(false);
    expect(await events(page, "promotion_click")).toHaveLength(0);
  });

  test("filters and existing navigation remain usable; unrelated pages do not load the module", async ({ page }) => {
    await prepare(page);
    await page.goto("/win-data-competitions-south-africa/");
    await page.locator("#searchInput").fill("unlikely-test-search");
    await expect(page.locator("#searchInput")).toHaveValue("unlikely-test-search");
    await expect(page.locator(moduleSelector)).toHaveCount(1);
    await page.goto("/about/");
    await expect(page.locator(moduleSelector)).toHaveCount(0);
    await expect(page.locator('script[src*="promotion-runtime"]')).toHaveCount(0);
  });
});
