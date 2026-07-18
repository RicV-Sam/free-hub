const { expect, test } = require("@playwright/test");
const { createOpportunityRouteRenderer } = require("../../scripts/lib/opportunity-route-renderer.js");
const opportunityFixture = require("../../data/opportunities.json")[0];
const opportunitiesEnabled = process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true";

async function disableFirebase(page) {
  await page.route("**/firebase-config.json", (route) => route.fulfill({ status: 404, body: "Not configured in regression tests" }));
}

async function expectCanonical(page, route) {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://freehub.co.za${route}`);
}

async function readDataLayerEvents(page) {
  return page.evaluate(() =>
    (window.dataLayer || [])
      .filter((entry) => entry && entry[0] === "event")
      .map((entry) => [entry[0], entry[1], entry[2]])
  );
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
  await expect(page.locator("article.opportunity-card")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  await expect(page.locator("section.opportunity-section")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  await expect(page.locator("#structured-data-opportunities")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  if (opportunitiesEnabled) {
    const card = page.locator('[data-opportunity-id="coloplast-speedicath-short-sample"]');
    await expect(card).toHaveAttribute("data-card-variant", "compact");
    await expect(card).toContainText("Medical product sample request");
    await expect(card).toContainText("Freehub does not receive or assess your application");
    await expect(card.getByRole("link", { name: "View verified sample details" })).toHaveAttribute(
      "href",
      "/opportunity/coloplast-speedicath-short-sample/"
    );
  }
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
  expect(events[0][2].destination_path).toMatch(/^\//);

  if (opportunitiesEnabled) {
    await page.evaluate(() => { window.__freehubTestEvents = []; });
    const opportunity = page.locator("article.opportunity-card a.opportunity-card__link");
    await opportunity.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await opportunity.click();
    events = await page.evaluate(() => window.__freehubTestEvents);
    expect(events).toEqual([["event", "discovery_card_click", {
      entity_kind: "opportunity",
      content_type: "free_sample",
      page_type: "free_stuff_parent",
      content_id: "coloplast-speedicath-short-sample",
      destination_path: "/opportunity/coloplast-speedicath-short-sample/",
    }]]);
  }
});

test("Free Samples v2 preserves its canonical and seven classified resources", async ({ page }) => {
  await page.goto("/free-samples-south-africa/");
  await expect(page).toHaveTitle("Where to Get Free Samples in South Africa | Official Offers Guide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where to Get Free Samples in South Africa");
  await expectCanonical(page, "/free-samples-south-africa/");
  await expect(page.locator('body[data-free-samples-page-version="2"]')).toHaveCount(1);
  await expect(page.locator("article.free-resource-card")).toHaveCount(7);
  await expect(page.locator('[data-content-type="product_testing_panel"]')).toHaveCount(4);
  await expect(page.locator('[data-content-type="brand_sample_programme"]')).toHaveCount(2);
  await expect(page.locator('[data-content-type="editorial_guide"]')).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Product-testing panels" })).toContainText("does not guarantee");
  await expect(page.locator("section.detail-faq details")).toHaveCount(6);
  await expect(page.locator("article.opportunity-card")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  await expect(page.locator("#structured-data-opportunities")).toHaveCount(opportunitiesEnabled ? 1 : 0);

  if (opportunitiesEnabled) {
    const card = page.locator('[data-opportunity-id="coloplast-speedicath-short-sample"]');
    await expect(card).toHaveAttribute("data-card-variant", "full");
    await expect(card).toContainText("Application only");
    await expect(card).toContainText("No delivery charge");
    await expect(card).toContainText("Coloplast, not Freehub, assesses product suitability");
    await expect(card).toContainText("Freehub does not receive or assess your application");
    await expect(card.getByRole("link", { name: "Coloplast consent and privacy information" })).toHaveAttribute(
      "href",
      "https://www.coloplast.co.za/global/declaration-of-consent/"
    );
    await expect(card.getByRole("link", { name: "View verified sample details" })).toHaveAttribute(
      "href",
      "/opportunity/coloplast-speedicath-short-sample/"
    );
  }

  const detail = await page.request.get("/opportunity/coloplast-speedicath-short-sample/");
  expect(detail.status()).toBe(opportunitiesEnabled ? 200 : 404);
});

test("Samples analytics identify the vertical and use parameter-free destinations", async ({ page }) => {
  await page.goto("/free-samples-south-africa/");
  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });
  const resource = page.locator("a.free-resource-card__link").first();
  await resource.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await resource.click();
  let events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toHaveLength(1);
  expect(events[0][1]).toBe("official_source_click");
  expect(events[0][2]).toMatchObject({ entity_kind: "resource", page_type: "free_samples_vertical" });
  expect(events[0][2].destination_path).toMatch(/^\//);
  expect(events[0][2].destination_path).not.toContain("?");

  if (opportunitiesEnabled) {
    await page.evaluate(() => { window.__freehubTestEvents = []; });
    const source = page.locator("article.opportunity-card a.opportunity-card__link");
    await source.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await source.click();
    events = await page.evaluate(() => window.__freehubTestEvents);
    expect(events).toEqual([["event", "discovery_card_click", {
      entity_kind: "opportunity",
      content_type: "free_sample",
      page_type: "free_samples_vertical",
      content_id: "coloplast-speedicath-short-sample",
      destination_path: "/opportunity/coloplast-speedicath-short-sample/",
    }]]);
  }
});

test("Opportunity detail and measured exit flow remain flag-controlled", async ({ browser, page }) => {
  const detailPath = "/opportunity/coloplast-speedicath-short-sample/";
  const exitPath = "/out/opportunity/coloplast-speedicath-short-sample/";
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap.includes(`<loc>https://freehub.co.za${detailPath}</loc>`)).toBe(opportunitiesEnabled);
  expect(sitemap).not.toContain(`<loc>https://freehub.co.za${exitPath}</loc>`);
  if (!opportunitiesEnabled) {
    expect((await page.request.get(detailPath)).status()).toBe(404);
    expect((await page.request.get(exitPath)).status()).toBe(404);
    return;
  }

  await page.goto(detailPath);
  await expectCanonical(page, detailPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coloplast SpeediCath Short free sample");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow, max-image-preview:large");
  await expect(page.locator('script[src*="pagead2.googlesyndication.com"]')).toHaveCount(0);
  await expect(page.getByText("Your information goes directly to Coloplast")).toBeVisible();
  await expect(page.getByText(/Freehub does not receive, store or assess your application/)).toBeVisible();
  const cta = page.getByRole("link", { name: "Continue to the official sample request" });
  await expect(cta).toHaveAttribute("href", exitPath);
  const schemaTypes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent)["@type"])
  );
  expect(schemaTypes).toEqual(expect.arrayContaining(["WebPage", "BreadcrumbList", "Thing"]));
  expect(schemaTypes).not.toEqual(expect.arrayContaining(["Product", "Offer", "MedicalEntity"]));
  expect((await readDataLayerEvents(page)).some((event) => event[1] === "opportunity_detail_view")).toBe(true);

  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });
  await cta.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await cta.click();
  let events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([["event", "opportunity_exit_click", expect.objectContaining({
    content_id: "coloplast-speedicath-short-sample",
    page_type: "opportunity_detail",
    destination_path: exitPath,
  })]]);

  await page.evaluate(() => { window.__freehubTestEvents = []; });
  const terms = page.getByRole("link", { name: "Read Coloplast sample terms" });
  await terms.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await terms.click();
  events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([["event", "official_source_click", expect.objectContaining({
    content_id: "coloplast-speedicath-short-sample",
    page_type: "opportunity_detail",
    link_role: "terms",
  })]]);

  await page.route("https://products.coloplast.co.za/**", (route) => route.abort());
  await page.goto(exitPath);
  await expectCanonical(page, exitPath);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator('script[src*="pagead2.googlesyndication.com"]')).toHaveCount(0);
  await expect(page.getByText(/Freehub does not receive, store or assess it/)).toBeVisible();
  expect((await readDataLayerEvents(page)).some((event) => event[1] === "opportunity_exit_view")).toBe(true);
  const manualEvents = [];
  await page.exposeFunction("__captureOpportunityManualEvent", (...args) => manualEvents.push(args));
  await page.evaluate(() => {
    window.gtag = (...args) => window.__captureOpportunityManualEvent(...args);
  });
  await page.getByRole("link", { name: "Continue now" }).evaluate((link) => link.click());
  await page.waitForTimeout(2200);
  expect(manualEvents.filter((event) => event[1] === "official_source_click")).toHaveLength(1);
  expect(manualEvents.filter((event) => event[1] === "opportunity_exit_handoff")).toEqual([
    ["event", "opportunity_exit_handoff", expect.objectContaining({ handoff_method: "manual" })],
  ]);

  const automaticContext = await browser.newContext();
  const automaticPage = await automaticContext.newPage();
  const automaticEvents = [];
  await automaticPage.exposeFunction("__captureOpportunityAutomaticEvent", (...args) => automaticEvents.push(args));
  await automaticPage.addInitScript(() => {
    Object.defineProperty(window, "gtag", {
      configurable: false,
      writable: false,
      value: (...args) => window.__captureOpportunityAutomaticEvent(...args),
    });
  });
  await automaticPage.route("**/firebase-config.json", (route) => route.fulfill({ status: 404, body: "Not configured" }));
  await automaticPage.route("https://products.coloplast.co.za/**", (route) => route.abort());
  await automaticPage.goto(exitPath);
  await automaticPage.waitForTimeout(2200);
  expect(automaticEvents.filter((event) => event[1] === "opportunity_exit_handoff")).toEqual([
    ["event", "opportunity_exit_handoff", expect.objectContaining({ handoff_method: "automatic" })],
  ]);
  expect(automaticEvents.some((event) => event[1] === "official_source_click")).toBe(false);
  await automaticContext.close();
});

test("Opportunity tombstones keep historical context without application paths", async ({ page }) => {
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const renderer = createOpportunityRouteRenderer({
    escapeHtml,
    escapeAttribute: escapeHtml,
    formatDate: (value) => value,
    canonicalOrigin: "https://freehub.co.za",
    getDetailPath: () => "/opportunity/coloplast-speedicath-short-sample/",
    getExitPath: () => "/out/opportunity/coloplast-speedicath-short-sample/",
  });

  for (const [state, visibleHeading] of [
    ["verification_due", "This opportunity is being re-verified"],
    ["expired", "This opportunity has ended"],
    ["withdrawn", "This opportunity has been withdrawn"],
  ]) {
    await page.setContent(`<main>${renderer.renderDetailContent(opportunityFixture, state)}</main>`);
    await expect(page.getByText(visibleHeading)).toBeVisible();
    await expect(page.getByText("No campaign or application link is available from this page.")).toBeVisible();
    await expect(page.locator('[data-opportunity-action="exit"]')).toHaveCount(0);
    await expect(page.locator('a[href^="/out/opportunity/"]')).toHaveCount(0);
    await expect(page.locator(`a[href="${opportunityFixture.sourceUrl}"]`)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Free Samples South Africa" })).toHaveAttribute("href", "/free-samples-south-africa/");
  }
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
  const response = await page.goto("/competitions/", { waitUntil: "domcontentloaded" });
  expect(response.status()).toBe(200);
  expect(await page.locator("article.competition-card").count()).toBeGreaterThan(0);
  await expectCanonical(page, "/competitions/");
  await context.close();
});

test("portrait competition artwork fills its media stage without being cropped", async ({ page }) => {
  const portraitCompetitionRoutes = [
    "/competition/evetech-pulse-giveaway-2026/",
    "/competition/takealot-back-to-school-voucher-2026/",
  ];

  for (const route of portraitCompetitionRoutes) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);

    const heroMedia = page.locator(".competition-hero-card__media.competition-media--portrait");
    const detailMedia = page.locator(".competition-detail__media.competition-media--portrait");
    await expect(heroMedia.locator(":scope > .competition-image-backdrop")).toHaveCount(1);
    await expect(heroMedia.locator(":scope > .competition-image-foreground")).toHaveCount(1);
    await expect(detailMedia.locator(":scope > .competition-image-backdrop")).toHaveCount(1);
    await expect(detailMedia.locator(":scope > .competition-image-foreground")).toHaveCount(1);

    const desktopHeroBox = await heroMedia.boundingBox();
    const desktopDetailBox = await detailMedia.boundingBox();
    expect(desktopHeroBox.height).toBeGreaterThanOrEqual(285);
    expect(desktopDetailBox.height).toBeGreaterThanOrEqual(375);
    await expect(heroMedia.locator(":scope > .competition-image-foreground")).toHaveCSS("object-fit", "contain");

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileHeroBox = await heroMedia.boundingBox();
    const mobileDetailBox = await detailMedia.boundingBox();
    expect(mobileHeroBox.height / mobileHeroBox.width).toBeGreaterThan(1.2);
    expect(mobileDetailBox.height / mobileDetailBox.width).toBeGreaterThan(1.2);
  }
});

test("landscape competition artwork receives a full 16:9 media stage", async ({ page }) => {
  const route = "/competition/discovery-four-principles-book-launch-2026/";
  const response = await page.request.get(route);
  const html = await response.text();
  expect(html).toContain("competition-media--landscape");
  expect(html).toContain("assets/competitions/discovery-four-principles-book-launch-2026.png");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  const heroMedia = page.locator(".competition-hero-card__media.competition-media--landscape");
  const detailMedia = page.locator(".competition-detail__media.competition-media--landscape");
  const desktopHeroBox = await heroMedia.boundingBox();
  const desktopDetailBox = await detailMedia.boundingBox();
  expect(desktopHeroBox.height).toBeGreaterThanOrEqual(225);
  expect(desktopDetailBox.height).toBeGreaterThanOrEqual(295);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileHeroBox = await heroMedia.boundingBox();
  const mobileDetailBox = await detailMedia.boundingBox();
  expect(mobileHeroBox.height / mobileHeroBox.width).toBeGreaterThan(0.55);
  expect(mobileDetailBox.height / mobileDetailBox.width).toBeGreaterThan(0.55);
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
