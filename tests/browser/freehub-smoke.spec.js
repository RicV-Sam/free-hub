const { expect, test } = require("@playwright/test");

async function disableFirebase(page) {
  await page.route("**/firebase-config.json", (route) => route.fulfill({ status: 404, body: "Not configured in regression tests" }));
}

async function expectCanonical(page, route) {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://freehub.co.za${route}`);
}

test.beforeEach(async ({ page }) => {
  await disableFirebase(page);
});

test("homepage navigation reaches canonical pillar routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find South African competitions worth entering today");
  await expectCanonical(page, "/");

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Competitions" }).click();
  await expect(page).toHaveURL(/\/competitions\/$/);
  await expectCanonical(page, "/competitions/");
  await page.goto("/competitions/?utm_source=regression-test&filter=free");
  await expectCanonical(page, "/competitions/");

  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Free Stuff" }).click();
  await expect(page).toHaveURL(/\/free-stuff-south-africa\/$/);
  await expectCanonical(page, "/free-stuff-south-africa/");
  await page.goto("/free-samples-south-africa/");
  await expectCanonical(page, "/free-samples-south-africa/");
  await page.goto("/free-online-courses-south-africa/");
  await expectCanonical(page, "/free-online-courses-south-africa/");
});

test("skip link is keyboard reachable and targets main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("current mobile navigation remains visible and horizontally responsive", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Competitions" })).toBeVisible();
  await navigation.getByRole("link", { name: "Free Stuff" }).scrollIntoViewIfNeeded();
  await expect(navigation.getByRole("link", { name: "Free Stuff" })).toBeVisible();
  const dimensions = await navigation.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
  expect(dimensions.scrollWidth).toBeGreaterThanOrEqual(dimensions.clientWidth);
});

test("Free Stuff parent preserves intent and separates durable resources from opportunities", async ({ page }) => {
  await page.goto("/free-stuff-south-africa/");
  await expect(page).toHaveTitle("Free Stuff South Africa | Legit Freebies, Samples, Competitions");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free Stuff South Africa");
  await expectCanonical(page, "/free-stuff-south-africa/");
  await expect(page.locator('body[data-free-stuff-parent-version="2"]')).toHaveCount(1);

  const childNavigation = page.getByRole("navigation", { name: "Free Stuff categories" });
  await expect(childNavigation.getByRole("link")).toHaveCount(4);
  await expect(childNavigation.getByRole("link", { name: "Free Samples" })).toHaveAttribute("href", "/free-samples-south-africa/");
  await expect(childNavigation.getByRole("link", { name: "Free Courses" })).toHaveAttribute("href", "/free-online-courses-south-africa/");
  await expect(childNavigation.getByRole("link", { name: "Children's Books" })).toHaveAttribute("href", "/free-childrens-books-south-africa/");
  await expect(childNavigation.getByRole("link", { name: "Credit Reports" })).toHaveAttribute("href", "/free-credit-report-south-africa/");

  await expect(page.locator("article.free-resource-card")).toHaveCount(18);
  await expect(page.locator("article.opportunity-card")).toHaveCount(0);
  await expect(page.locator("section.opportunity-section")).toHaveCount(0);
  await expect(page.locator("#structured-data-opportunities")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Competition discovery" })).toContainText("separate inventory");
});

test("Free Stuff discovery analytics separates pillar and official-source events", async ({ page }) => {
  await page.goto("/free-stuff-south-africa/");
  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });

  const pillar = page.getByRole("navigation", { name: "Free Stuff categories" }).getByRole("link", { name: "Free Samples" });
  await pillar.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await pillar.click();
  let events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([
    ["event", "discovery_card_click", {
      entity_kind: "resource_category",
      content_type: "free_samples",
      page_type: "free_stuff_parent",
      destination_path: "/free-samples-south-africa/",
    }],
  ]);

  await page.evaluate(() => { window.__freehubTestEvents = []; });
  const officialSource = page.locator("a.free-resource-card__link").first();
  await officialSource.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await officialSource.click();
  events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toHaveLength(1);
  expect(events[0][0]).toBe("event");
  expect(events[0][1]).toBe("official_source_click");
  expect(events[0][2]).toMatchObject({
    entity_kind: "resource",
    page_type: "free_stuff_parent",
  });
  expect(events[0][2].content_id).toBeTruthy();
  expect(events[0][2].source_domain).toBeTruthy();
  expect(events[0][2]).not.toHaveProperty("destination_path");
});

test("PR2-mobile-navigation: collapsible mobile navigation opens and closes", async ({ page }) => {
  test.fail(true, "Expected defect: current mobile navigation scrolls horizontally and has no collapsible menu yet.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: /menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toHaveAttribute("data-open", "true");
  await menuButton.click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toHaveAttribute("data-open", "false");
});

test("competition collection cards are present in the static HTML", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("/competitions/");
  expect(response.status()).toBe(200);
  expect(await page.locator("article.competition-card").count()).toBeGreaterThan(0);
  await expectCanonical(page, "/competitions/");
  await context.close();
});

test("PR2-collection-controls: rendered collection filters become interactive", async ({ page }) => {
  test.fail(true, "Expected defect: collection controls render but app.js only activates them for the home route.");
  await page.goto("/competitions/");
  await expect(page.locator("#categoryFilters button")).not.toHaveCount(0);
});

test("active detail, outbound handoff, and expired detail retain lifecycle behavior", async ({ browser, page }) => {
  await page.goto("/competition/one-life-winning-wednesday-cash-2026/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("1Life Winning Wednesday");
  await expectCanonical(page, "/competition/one-life-winning-wednesday-cash-2026/");
  await expect(page.locator('a[href="/out/one-life-winning-wednesday-cash-2026/"]')).not.toHaveCount(0);

  await page.goto("/competition/isuzu-win-a-new-x-rider-2026/");
  await expect(page.getByText("This competition has closed.", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");

  const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
  const outPage = await noJavaScript.newPage();
  const response = await outPage.goto("/out/one-life-winning-wednesday-cash-2026/");
  expect(response.status()).toBe(200);
  await expect(outPage.getByRole("heading", { level: 1 })).toHaveText("You are leaving Freehub");
  await expect(outPage.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await noJavaScript.close();
});

test("unknown routes serve the generated 404 response", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-freehub-route/");
  expect(response.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
});

test("Club public and private pages remain usable without Firebase credentials", async ({ page }) => {
  await page.goto("/club/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Save and track South African competitions");
  await expectCanonical(page, "/club/");

  await page.goto("/club/dashboard/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.getByText(/Freehub Club sign-in is unavailable right now/)).toBeVisible();
  await expect(page.getByText(/local saves on this device/)).toBeVisible();

  await page.goto("/admin/referrals/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");

  await page.goto("/competitions/");
  await expect(page.locator("article.competition-card").first()).toBeVisible();
});
