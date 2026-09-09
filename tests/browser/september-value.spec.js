const { test, expect } = require('@playwright/test');
const offers = require('../../data/offers.json');
const { isPublicOffer } = require('../../shared/offer-data.js');
const guidePath = '/free-parks-entry-south-africa-september-2026/';
const coupon = offers.find(row => row.id === 'akis-september-2026-personal-coupon');
const asOfDate = process.env.FREEHUB_BUILD_DATE || new Date().toISOString().slice(0, 10);

test.beforeEach(async ({ page }) => {
  await page.route('**/*', request => new URL(request.request().url()).hostname === '127.0.0.1' ? request.continue() : request.abort());
});

for (const width of [320, 768, 1440]) {
  test(`September parks dates and personal coupon remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(guidePath);
    await expect(page.locator('h1')).toHaveText('Free park entry in South Africa: September 2026');
    await expect(page.locator('main')).toContainText('7 to 11 September 2026 only');
    await expect(page.locator('main')).toContainText('19–25 September 2026, walk-ins only');
    await expect(page.locator('a[href="https://www.sanparks.org/events/sa-national-parks-week-2026"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `output/playwright/september-parks-${width}.png`, fullPage: true });
    if (process.env.FREEHUB_ENABLE_OFFERS === 'true' && isPublicOffer(coupon, { asOfDate })) {
      await page.goto(`/coupon/${coupon.slug}/`);
      await expect(page.locator('main')).toContainText('Personal coupon');
      await expect(page.locator('main')).toContainText(coupon.couponInstructions);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `output/playwright/september-coupon-${width}.png`, fullPage: true });
    }
  });
}

test('Free Stuff exposes the dated guide and SA Youth with official links', async ({ page }) => {
  await page.goto('/free-stuff-south-africa/');
  await expect(page.locator(`a[href="${guidePath}"]`).first()).toBeVisible();
  await expect(page.locator('main')).toContainText('SA Youth work and learning support');
  await expect(page.locator('a[href="https://www.harambee.co.za/work-seekers/"]')).toBeVisible();
  await page.locator(`a[href="${guidePath}"]`).first().click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://freehub.co.za${guidePath}`);
});

test('Hyatt competition presents the entry conditions and official destination', async ({ page }) => {
  test.skip(asOfDate > '2026-09-30', 'Current-entry assertions apply during this competition window.');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/competition/penguin-random-house-hyatt-great-escapes-2026/');
  await expect(page.locator('h1')).toContainText('Hyatt');
  await expect(page.locator('main')).toContainText('exactly seven books');
  await expect(page.locator('main')).toContainText('30 November 2026');
  await expect(page.locator('main')).toContainText('Travel is excluded');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const brokenImages = await page.locator('img').evaluateAll(images => images.filter(img => new URL(img.src).hostname === '127.0.0.1' && img.complete && img.naturalWidth === 0).map(img => img.src));
  expect(brokenImages).toEqual([]);
  await page.screenshot({ path: 'output/playwright/september-hyatt-390.png', fullPage: true });
  await page.goto('/out/penguin-random-house-hyatt-great-escapes-2026/');
  await expect(page.locator('a[href="https://www.penguinrandomhouse.co.za/competitions/win-great-stories-great-escapes/"]').first()).toBeVisible();
});
