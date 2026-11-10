// Local UX comparison only. Variant A moves the existing rendered node in the
// preview browser; it never rewrites generated files or runs an audience test.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const argument = process.argv.find((value) => value.startsWith("--output-dir="));
if (!argument) throw new Error("Supply --output-dir=<absolute directory>");
const output = path.resolve(argument.slice("--output-dir=".length));
const origin = `http://127.0.0.1:${process.env.FREEHUB_TEST_PORT || 4319}`;
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const measurements = [];
  async function openPage(route, width, height) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, (request) => ["image", "font", "stylesheet"].includes(request.request().resourceType()) ? request.continue() : request.abort());
    await page.goto(origin + route, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return page;
  }
  async function captureNear(page, selector, filename, offset = 120) {
    await page.locator(selector).first().evaluate((element, topOffset) => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - topOffset, behavior: "instant" }), offset);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(output, filename) });
  }
  try {
    for (const [device, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 1000]]) {
      for (const variant of ["before-prizes", "after-prizes"]) {
        const page = await openPage("/", width, height);
        if (variant === "before-prizes") await page.evaluate(() => {
          const promotion = document.querySelector("[data-freehub-promotion]");
          document.querySelector(".editorial-shortlist").after(promotion);
        });
        const geometry = await page.evaluate(() => {
          const rect = (selector) => { const box = document.querySelector(selector).getBoundingClientRect(); return { top: Math.round(box.top + scrollY), height: Math.round(box.height) }; };
          return { promotion: rect("[data-freehub-promotion]"), prizes: rect(".home-section--intent"), guides: rect('[aria-labelledby="home-resources-title"]'), tools: rect(".fh-home-tools"), membership: rect(".home-cta--club") };
        });
        measurements.push({ route: "/", device, variant, ...geometry });
        await page.screenshot({ path: path.join(output, `home-${variant}-${device}-full.png`), fullPage: true });
        await captureNear(page, variant === "before-prizes" ? "[data-freehub-promotion]" : ".home-section--intent", `home-${variant}-${device}.png`);
        if (variant === "after-prizes") {
          await captureNear(page, ".fh-home-tools", `home-secondary-${device}.png`);
          await captureNear(page, ".home-cta--club", `home-membership-${device}.png`);
          await captureNear(page, ".fh-whatsapp-quiet", `home-whatsapp-${device}.png`);
        }
        await page.close();
      }
      for (const slug of ["win-data-competitions-south-africa", "win-airtime-competitions-south-africa"]) {
        const page = await openPage(`/${slug}/`, width, height);
        const geometry = await page.evaluate(() => {
          const rect = (selector) => { const box = document.querySelector(selector).getBoundingClientRect(); return { top: Math.round(box.top + scrollY), height: Math.round(box.height) }; };
          return { hero: rect(".hero"), search: rect(".controls"), firstListing: rect(".competition-card"), promotion: rect("[data-freehub-promotion]"), whatsappBeforeListings: [...document.querySelectorAll('main [data-whatsapp-placement]')].filter((element) => element.getBoundingClientRect().top < document.querySelector('.competition-card').getBoundingClientRect().top).length };
        });
        measurements.push({ route: `/${slug}/`, device, ...geometry });
        await page.screenshot({ path: path.join(output, `${slug}-discovery-${device}.png`) });
        await captureNear(page, ".competition-section", `${slug}-listings-${device}.png`);
        await page.close();
      }
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(output, "layout-comparison.json"), JSON.stringify(measurements, null, 2) + "\n");
  console.log(`Saved homepage position comparison and discovery screenshots to ${output}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
