const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { referenceDate } = require('./editorial-source-fixture.js');
const { getPublicUnderReview, getDetailPath, PUBLIC_PATH } = require('../../shared/unverified-competition-data.js');
const registry = require('../../data/unverified-competitions.json');
const leads = getPublicUnderReview(registry, { asOfDate: referenceDate });
const illustratedLead = leads.find(row => row.image);
const newCompetitions = require('../../data/competitions.json').filter(row => row.researchReference);
test('new verified pages show their reviewed conditions and local artwork', async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname === 'freehub.co.za' && route.request().resourceType() === 'image') {
      const file = path.resolve(__dirname, '../..', `.${decodeURIComponent(url.pathname)}`);
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
    }
    return route.abort();
  });
  for (const row of newCompetitions) {
    await page.goto(`/competition/${row.id}/`);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://freehub.co.za/competition/${row.id}/`);
    const picture = page.locator(`img[src*="discovery-2026-10-30"]`).first();
    await picture.scrollIntoViewIfNeeded();
    await expect(picture).toBeVisible();
    expect(await picture.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    if (row.imageReviewStatus === 'editorial-generated') await expect(page.getByText(/FreeHub editorial illustration/i).first()).toBeVisible();
  }
});
for (const width of [390, 1440]) {
  test(`under-review disclosure and artwork at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const collection = await page.goto(PUBLIC_PATH);
    expect(collection.status()).toBe(200);
    if (!illustratedLead) {
      if (!leads.length) await expect(page.getByText('No current leads under review')).toBeVisible();
      const unavailable = registry.find(row => row.image && !leads.includes(row));
      expect(unavailable).toBeTruthy();
      const route = getDetailPath(unavailable);
      await expect(page.locator(`a[href="${route}"]`)).toHaveCount(0);
      expect((await page.request.get(route)).status()).toBe(404);
      return;
    }
    const route = getDetailPath(illustratedLead);
    await expect(page.locator(`a[href="${route}"]`).first()).toBeVisible();
    expect((await page.goto(route)).status()).toBe(200);
    await expect(page.locator('h1')).toContainText('under review');
    await expect(page.getByText('Why Freehub has not verified it', { exact: true })).toBeVisible();
    await expect(page.locator('.unverified-card__art img')).toBeVisible();
    const artwork = page.locator('.unverified-card__art img');
    await artwork.scrollIntoViewIfNeeded();
    await artwork.evaluate(img => img.decode());
    expect(await artwork.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('a[href^="/out/"]')).toHaveCount(0);
    fs.mkdirSync(path.resolve('output/discovery-2026-10-30'), { recursive: true });
    await page.screenshot({ path: `output/discovery-2026-10-30/under-review-${width}.png`, fullPage: true });
  });
}
