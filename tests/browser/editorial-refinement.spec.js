const { test, expect } = require("@playwright/test");
const hasReviewed = require("node:fs").readFileSync(require("node:path").resolve(__dirname,"../../index.html"),"utf8").includes("data-editorial-pick=");
const routes = ["/", "/competitions/", "/competition/cadbury-made-to-share-2026/", "/best-competitions-south-africa-this-month/", "/free-stuff-south-africa/"];

test.beforeEach(async ({ page }) => {
  await page.route("**/scripts.scriptwrapper.com/**", route => route.abort());
  await page.route("**/firebase-config.json", route => route.fulfill({ status: 404, body: "Local layout test" }));
  await page.clock.install({ time: new Date("2026-10-04T10:00:00Z") });
});

for (const width of [320, 390, 768, 1024, 1440]) test(`five editorial surfaces reflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('a[href="#main-content"]')).toHaveCount(1);
    const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(node => {
      const box = node.getBoundingClientRect();
      return box.width && box.right > innerWidth + 1 && !node.closest('.table-scroll');
    }).map(node => `${node.tagName}.${node.className}`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route}: ${overflow.join(', ')}`).toBe(true);
    if (width <= 900) {
      await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Primary navigation", exact: true })).toBeHidden();
    }
    if (route === "/" && width === 390 && hasReviewed) expect((await page.locator(".editorial-pick").first().boundingBox()).y).toBeLessThan(844);
    if (route === "/competitions/" && width === 390) expect((await page.locator("#competitionsGrid article").first().boundingBox()).y).toBeLessThan(844);
    if (route.includes("/competition/")) {
      await expect(page.locator(".competition-detail__media > img")).toHaveCount(1);
      const decision = await page.locator(".detail-decision").boundingBox();
      const image = await page.locator(".competition-detail__media").boundingBox();
      expect(decision.y + decision.height).toBeLessThan(image.y);
    }
  }
});

test("menu and category disclosure work with keyboard and preserve destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/competitions/");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.focus(); await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const nav = page.getByRole("navigation", { name: "Primary navigation", exact: true });
  await expect(nav.getByRole("link")).toHaveCount(8);
  await expect(nav.getByRole("link", { name: "Competitions", exact: true })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape"); await expect(menu).toBeFocused();
  await expect(nav).toBeHidden();
  await page.locator(".more-categories summary").focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "More competition categories" })).toBeVisible();
  await page.locator('#categoryFilters > a[href="/category/cash/"]').click();
  await expect(page).toHaveURL(/\/category\/cash\/$/);
  await expect(page.locator('#categoryFilters a[aria-current="page"]')).toHaveText("Cash");
});

test("search handles empty results and a failed feed leaves useful static listings", async ({ page }) => {
  await page.goto("/competitions/");
  await page.getByRole("searchbox").fill("not-a-real-competition");
  await expect(page.locator("#resultsSummary")).toHaveText("Showing 0 competitions");
  await expect(page.locator("#emptyState")).toBeVisible();
  await page.route("**/data/competitions.json", route => route.abort());
  await page.reload();
  await expect(page.locator("#errorState")).toBeVisible();
  expect(await page.locator("#competitionsGrid article").count()).toBeGreaterThan(0);
});

test("delayed regeneration removes overdue picks at South African midnight", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-11T21:59:30Z"));
  await page.goto("/");
  await expect(page.locator("[data-editorial-pick]")).toHaveCount(hasReviewed ? 3 : 0);
  await page.clock.setFixedTime(new Date("2026-10-11T22:00:01Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.locator("[data-editorial-pick]")).toHaveCount(0);
  await expect(page.locator("[data-editorial-fallback]")).toBeVisible();
  expect(await page.locator("#structured-data-itemlist").evaluate(node => JSON.parse(node.textContent).itemListElement.length)).toBe(0);
  await page.goto("/best-competitions-south-africa-this-month/");
  await expect(page.locator("[data-editorial-pick]")).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-10-16T10:00:00Z"));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.locator('tr[data-closing-date="2026-10-15"]')).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2027-01-01T10:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.locator("[data-current-comparison]")).toBeHidden();
  await expect(page.locator("[data-comparison-empty]")).toBeVisible();
});

test("date-only detail stays open on closing day and becomes an archive on return", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-31T21:59:30Z"));
  await page.goto("/competition/cadbury-made-to-share-2026/");
  await expect(page.locator("[data-active-entry]")).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-10-31T22:00:01Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(page.locator("[data-active-entry]")).toBeHidden();
  await expect(page.locator("[data-runtime-closed]")).toBeVisible();
  await expect(page.locator(".hero__closing")).toContainText("Closed 31 Oct 2026");
  await expect(page.locator("[data-runtime-closed]").getByRole("link", { name: /Browse/ }).first()).toBeVisible();
});

test("missing artwork retains readable decision facts and an official action", async ({ page }) => {
  await page.route("**/assets/competitions/**", route => route.abort());
  await page.goto("/competition/cadbury-made-to-share-2026/");
  await expect(page.locator(".detail-decision")).toContainText("Eligibility");
  await expect(page.locator("[data-active-entry]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("JavaScript-disabled pages retain navigation, absolute dates, source checks and resources", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route("**/scripts.scriptwrapper.com/**", route => route.abort());
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("navigation", { name: "Primary navigation", exact: true })).toBeVisible();
    await expect(page.locator(".hero__updated")).toContainText("Compiled");
    await expect(page.locator("body")).not.toContainText("Ends today");
  }
  await context.close();
});

test("200 percent text enlargement reflows without page-wide overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => {
      const sizes = [...document.querySelectorAll('body *')].map(node => [node, parseFloat(getComputedStyle(node).fontSize)]);
      sizes.forEach(([node, size]) => { if (Number.isFinite(size)) node.style.fontSize = `${size * 2}px`; });
    });
    const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(node => {
      const box = node.getBoundingClientRect();
      return box.width && box.right > innerWidth + 1 && !node.closest('.table-scroll');
    }).map(node => `${node.tagName}.${node.className}`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route}: ${overflow.join(', ')}`).toBe(true);
  }
});

test("reduced motion and secondary button contrast remain readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/free-stuff-south-africa/");
  const link = page.getByRole("link", { name: "Free-entry Competitions", exact: true });
  await expect(link).toHaveCSS("color", "rgb(15, 118, 110)");
  await expect(link).toHaveCSS("background-color", "rgb(255, 255, 255)");
  expect(await link.evaluate(node => parseFloat(getComputedStyle(node).transitionDuration))).toBeLessThan(0.001);
  await page.goto("/competition/cadbury-made-to-share-2026/");
  await expect(page.locator(".competition-image-disclosure")).toHaveCSS("color", "rgb(71, 85, 105)");
  await expect(page.locator(".competition-image-disclosure a")).toHaveCSS("color", "rgb(15, 118, 110)");
});

test("revised navigation and resource links retain existing analytics events", async ({ page }) => {
  await page.goto("/free-stuff-south-africa/");
  await page.evaluate(() => { window.__refinementEvents = []; window.gtag = (...args) => window.__refinementEvents.push(args); });
  const source = page.locator('a.free-resource-card__link[data-content-id="resource-childrens-books-book-dash"]');
  await source.evaluate(link => link.addEventListener("click", event => event.preventDefault(), { once: true }));
  await source.click();
  expect(await page.evaluate(() => window.__refinementEvents)).toEqual([
    ["event", "official_source_click", expect.objectContaining({ entity_kind: "resource", page_type: "free_stuff_parent", content_id: "resource-childrens-books-book-dash" })],
  ]);
  await page.goto("/competitions/");
  await page.evaluate(() => { window.__refinementEvents = []; window.gtag = (...args) => window.__refinementEvents.push(args); });
  const category = page.locator('#categoryFilters > a[href="/category/cash/"]');
  await category.evaluate(link => link.addEventListener("click", event => event.preventDefault(), { once: true }));
  await category.click();
  expect(await page.evaluate(() => window.__refinementEvents)).toEqual([
    ["event", "category_filter_click", expect.objectContaining({ filter_label: "Cash", destination_path: "/category/cash/" })],
  ]);
});
