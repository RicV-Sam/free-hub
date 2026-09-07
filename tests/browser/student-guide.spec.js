const { test, expect } = require("@playwright/test");
const guide = require("../../data/student-guide.json");
const route = `/${guide.slug}/`;

test.beforeEach(async ({ page }) => {
  // Keep third-party tracking/auth off the local editorial test surface.
  await page.route("**/*", (request) => new URL(request.request().url()).hostname === "127.0.0.1"
    ? request.continue() : request.abort());
});

for (const width of [320, 768, 1440]) {
  test(`student guide remains readable and linked at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(guide.heading);
    await expect(page.locator(".student-offer")).toHaveCount(guide.offers.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const missing = await page.locator('.student-guide a[href^="#"]').evaluateAll((links) => links
      .filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash));
    expect(missing).toEqual([]);
    await page.locator('.student-jump a[href="#transport"]').click();
    await expect(page).toHaveURL(/#transport$/);
    await expect(page.locator("#gautrain-student")).toContainText("OR Tambo");
    await page.goto(route);
    await page.screenshot({ path: `output/playwright/student-guide-${width}.png` });
    await page.locator("#google-ai-plus").evaluate((node) => node.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.screenshot({ path: `output/playwright/student-guide-${width}-offer.png` });
  });
}

test("student guide exposes core content without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route("**/*", (request) => new URL(request.request().url()).hostname === "127.0.0.1"
    ? request.continue() : request.abort());
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:4318${route}`);
  await expect(page.locator(".student-offer")).toHaveCount(guide.offers.length);
  await expect(page.locator("#google-ai-plus .student-cost")).toContainText("paid plan");
  await expect(page.locator("#standard-bank-vibe .student-cost")).toContainText("R12");
  await page.locator('.student-jump a[href="#attractions"]').click();
  await expect(page).toHaveURL(/#attractions$/);
  await context.close();
});

test("student metadata, sources, internal discovery and keyboard focus are consistent", async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://freehub.co.za${route}`);
  const article = JSON.parse(await page.locator("#structured-data-article").textContent());
  expect(article.headline).toBe(guide.heading);
  expect(article.dateModified).toBe(guide.dateModified);
  expect(article.datePublished).toBe(guide.datePublished);
  expect(article.image).toBe("https://freehub.co.za/assets/student-guide/campus-study-1200.jpg");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", article.image);
  await expect(page.locator('.student-review a[rel="author"]')).toHaveAttribute("href", "/about/");
  const artwork = page.locator('.student-art img');
  await expect(artwork).toBeVisible();
  expect(await artwork.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#table-mountain')).not.toContainText('R265');
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids.length).toBe(new Set(ids).size);
  const focusLink = page.locator('.student-best a').first();
  await focusLink.focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineStyle }));
  expect(focus.tag).toBe("A");
  expect(focus.outline).not.toBe("none");
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "output/playwright/student-guide-large-text.png" });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.addStyleTag({ content: "html { font-size: 100%; zoom: 2; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#google-ai-plus .student-cost").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "output/playwright/student-guide-200-percent.png" });
  for (const path of ["/guides/", "/free-stuff-south-africa/"]) {
    await page.goto(path);
    await expect(page.locator(`a[href="${route}"]`).first()).toBeVisible();
  }
});


test("all student notices disclose the offer and keep reviewed destinations fixed", async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const offer of guide.offers) {
    const notice = '/out/student/' + offer.id + '/';
    const response = await request.get(notice + '?url=https://example.invalid/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('content="noindex, nofollow"');
    expect(html).toContain('href="https://freehub.co.za' + notice + '"');
    expect(sitemap).not.toContain(notice);
    expect(html).not.toMatch(/http-equiv="refresh"|window.location|location.replace|beginRedirectCountdown/);
    expect(html).not.toContain('example.invalid');
    await page.goto(notice);
    await expect(page.locator('.student-offer')).toHaveCount(1);
    await expect(page.locator('.student-offer')).toContainText(offer.eligibility);
    await expect(page.locator('.student-offer')).toContainText(offer.limitations);
    if (offer.renewal) await expect(page.locator('.student-cost')).toContainText(offer.renewal);
    if (offer.accountCosts) await expect(page.locator('.student-cost')).toContainText(offer.accountCosts);
    await expect(page.locator('.student-continue')).toHaveAttribute('href', offer.destination.url);
    await expect(page.locator('.student-claim')).toHaveCount(0);
  }
});

test("student claim flow works without JavaScript and lets the reader choose when to leave", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Mock provider destination</h1>' }));
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4318/' + guide.slug + '/');
  await page.locator('#spotify-student .student-claim').click();
  await expect(page).toHaveURL(/\/out\/student\/spotify-student\/$/);
  await expect(page.locator('.student-cost')).toContainText('R37.99');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.student-destination').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/playwright/student-notice-mobile.png' });
  await page.locator('.student-continue').click();
  await expect(page).toHaveURL(guide.offers.find(o => o.id === 'spotify-student').destination.url);
  await expect(page.locator('h1')).toHaveText('Mock provider destination');
  await context.close();
});
