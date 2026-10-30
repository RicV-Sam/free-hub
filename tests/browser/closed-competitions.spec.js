const { test, expect } = require("@playwright/test");
const shared = require("../../shared/page-data.js");
const { applyCompetitionRetirements } = require("../../scripts/lib/competition-retirements.js");
shared.setReferenceDate(process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE);
const state = applyCompetitionRetirements(require("../../data/competitions.json"), require("../../data/archive/competitions-expired.json"));
const records = [...state.primary, ...state.archive];
const closed = [...new Map(records.filter(shared.isIndexableClosedCompetition).map(record => [shared.getCompetitionSlug(record), record])).values()];
const provider = "https://scripts.scriptwrapper.com/tags/db39d7ff-ec0e-46b2-9797-bad57ea1954f.js";
const channel = "https://whatsapp.com/channel/0029Vb7mS1VE50UlOc2yOe2H";

test("all eligible closed pages have consistent indexing, closure, advertising and archive links", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const feed = await (await request.get("/app-data/competitions.json")).text();
  const incoming = new Set();
  for (const record of closed) {
    const slug = shared.getCompetitionSlug(record);
    const response = await request.get(`/competition/${slug}/`);
    expect(response.status(), slug).toBe(200);
    const html = await response.text();
    expect(html, slug).toContain('name="robots" content="index, follow, max-image-preview:large"');
    expect(html, slug).toContain(shared.isEditorialPromotionEnded(record) ? "FreeHub has stopped promoting this competition." : "This competition has closed.");
    expect(html, slug).toContain('href="/">See live competitions</a>');
    expect(html, slug).toContain(`href="${channel}"`);
    expect(html.includes(provider), slug).toBe(shared.competitionAllowsAds(record));
    expect(html, slug).not.toContain(`href="/out/${slug}/"`);
    expect(sitemap, slug).toContain(`https://freehub.co.za/competition/${slug}/`);
    expect(feed, slug).not.toContain(`"${record.id}"`);
    const archive = html.match(/<section[^>]*data-closed-competition-links[\s\S]*?<\/section>/)?.[0] || "";
    for (const match of archive.matchAll(/href="\/competition\/([^/]+)\//g)) incoming.add(match[1]);
  }
  for (const record of closed) expect(incoming.has(shared.getCompetitionSlug(record))).toBe(true);
});

for (const width of [375, 1365]) {
  test(`closed competition prompts work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
    await page.goto("/competition/isuzu-win-a-new-x-rider-2026/", { waitUntil: "domcontentloaded" });
    const promo = page.getByRole("region", { name: "Competition closed", exact: true });
    await expect(promo).toBeVisible();
    await expect(promo.getByRole("link", { name: "See live competitions" })).toHaveAttribute("href", "/");
    await expect(promo.getByRole("link", { name: "Follow on WhatsApp" })).toHaveAttribute("href", channel);
    await expect(page.locator(`script[src="${provider}"]`)).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await promo.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/playwright/closed-competition-${width}.png`, fullPage: false });
  });
}
