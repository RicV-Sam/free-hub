const { test, expect } = require("@playwright/test");
const withdrawn = require("../../data/opportunities.json").filter(record => record.publicationStatus === "withdrawn");

for (const width of [320, 1365]) {
  test(`reviewed source holds reach public pages at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
    for (const path of ["/free-stuff-south-africa/", "/free-samples-south-africa/"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator('a[href="https://reviewclub.co.za/how-it-works/"]')).toHaveCount(0);
      expect(await page.content()).not.toContain("https://reviewclub.co.za/how-it-works/");
    }
    await page.goto("/free-stuff-south-africa/", { waitUntil: "domcontentloaded" });
    const spur = page.locator(".free-resource-card").filter({ has: page.getByRole("heading", { name: "Spur R50 birthday voucher", exact: true }) });
    await expect(spur).toContainText(/Reviewed 8 Sept? 2026/);
    await spur.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/playwright/source-review-${width}.png` });
    for (const path of ["/competition/mcdonalds-nazo-meals-airtime-data-rewards-2026/", "/out/mcdonalds-nazo-meals-airtime-data-rewards-2026/"]) {
      expect((await request.get(path)).status()).toBe(404);
    }
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("mcdonalds-nazo-meals-airtime-data-rewards-2026");
    for (const record of withdrawn) {
      expect(sitemap).not.toContain(`/opportunity/${record.slug}/`);
      expect((await request.get(`/out/opportunity/${record.slug}/`)).status()).toBe(404);
      const detail = await request.get(`/opportunity/${record.slug}/`);
      if (process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true") {
        expect(detail.status()).toBe(200);
        const html = await detail.text();
        expect(html).toMatch(/name="robots" content="noindex/);
        expect(html).not.toContain(`href="/out/opportunity/${record.slug}/"`);
      } else {
        expect(detail.status()).toBe(404);
      }
    }
    for (const path of ["/app-data/catalog.json", "/app-data/competitions.json"]) {
      const feed = await (await request.get(path)).text();
      expect(feed).not.toContain("mcdonalds-nazo-meals-airtime-data-rewards-2026");
      expect(feed).not.toContain("reviewclub.co.za");
      for (const record of withdrawn) expect(feed).not.toContain(record.id);
    }
  });
}
