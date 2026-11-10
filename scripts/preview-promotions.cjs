const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const config = require("../data/promotions.json");
const arg = process.argv.find((value) => value.startsWith("--output-dir="));
if (!arg) throw new Error("Supply --output-dir=<absolute preview directory>");
const output = path.resolve(arg.slice("--output-dir=".length));
const origin = `http://127.0.0.1:${process.env.FREEHUB_TEST_PORT || 4319}`;
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const placement of config.placements) {
      for (const [device, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]]) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => ["image", "font", "stylesheet"].includes(route.request().resourceType()) ? route.continue() : route.abort());
        await page.goto(origin + placement.path, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const module = page.locator("[data-freehub-promotion]");
        if (await module.count() !== 1 || !await module.isVisible()) throw new Error(`Expected one current promotion at ${placement.path}`);
        const stem = `${placement.id}-${device}`;
        await page.screenshot({ path: path.join(output, `${stem}-full.png`), fullPage: true });
        await module.evaluate((element) => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 120, behavior: "instant" }));
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(output, `${stem}.png`) });
        const data = await module.evaluate((element) => ({ format: element.dataset.format, destination: element.querySelector("a").href, position: Math.round(element.getBoundingClientRect().top + scrollY), height: Math.round(element.getBoundingClientRect().height), overflow: document.documentElement.scrollWidth > innerWidth }));
        results.push({ path: placement.path, placement: placement.id, device, width, ...data, errors, image: `${stem}.png`, fullImage: `${stem}-full.png` });
        await page.close();
      }
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(output, "preview-checks.json"), JSON.stringify(results, null, 2) + "\n");
  const groups = config.placements.map((placement) => {
    const shots = results.filter((row) => row.placement === placement.id);
    return `<section><div class="heading"><h2>${escape(placement.path === "/" ? "Homepage" : placement.path)}</h2><span>${escape(placement.format)}</span></div><p>Placement: ${escape(placement.id)} · <a href="${origin}${placement.path}">Open local page</a></p><div class="shots">${shots.map((row) => `<figure class="${row.device}"><a href="${row.fullImage}"><img src="${row.image}" alt="Actual ${escape(row.device)} preview of ${escape(placement.path)}" loading="lazy"></a><figcaption>${row.device} · ${row.width}px · <a href="${row.fullImage}">Full page</a></figcaption></figure>`).join("")}</div></section>`;
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FreeHub · Contextual promotion review</title><style>*{box-sizing:border-box}body{margin:0;background:#edf3f7;color:#162132;font:16px/1.6 system-ui,sans-serif}main{max-width:1450px;margin:auto;padding:40px 28px}header{padding:25px 0 35px;border-bottom:1px solid #b7c8d3}h1{font-size:clamp(30px,4vw,52px);line-height:1.1;margin:12px 0 20px;letter-spacing:-.04em}header p{max-width:80ch}small,.heading span{color:#086558;font-weight:750;text-transform:uppercase;letter-spacing:.08em}section{margin:32px 0;padding:24px;border:1px solid #d6e0ea;border-radius:18px;background:#fff}.heading{display:flex;gap:20px;align-items:center;justify-content:space-between}h2{font-size:20px;overflow-wrap:anywhere}a{color:#075f56}figure{margin:0;min-width:0}img{display:block;width:100%;border:1px solid #d6e0ea;border-radius:12px}.shots{display:grid;grid-template-columns:minmax(0,3fr) minmax(220px,1fr);gap:24px;align-items:start}figcaption{font-size:13px;margin-top:8px}.note{padding:18px;background:#e3f6f3;border-radius:12px}@media(max-width:750px){main{padding:20px 12px}section{padding:16px}.shots{grid-template-columns:1fr}.mobile{max-width:390px}.heading{display:block}}</style></head><body><main><header><small>Development branch · Review before release</small><h1>More useful. Easier to find.</h1><p>Five existing DataCost banners replaced by contextual promotions on the actual generated FreeHub pages. One shared component, three formats, one primary module per page.</p><p class="note">These are local implementation screenshots. Nothing has been published. Google advertising and other external scripts were blocked during capture; their existing installation is preserved. Click an image for the full page.</p><p>Captured ${escape(new Date().toISOString())} · Desktop 1440px · Mobile 390px · <a href="preview-checks.json">Layout checks</a></p></header>${groups}</main></body></html>`;
  fs.writeFileSync(path.join(output, "index.html"), html);
  console.log(`Saved ${results.length} actual-page previews to ${output}`);
  if (results.some((row) => row.overflow || row.errors.length)) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
