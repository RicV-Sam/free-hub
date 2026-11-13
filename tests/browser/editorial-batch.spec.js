const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const shared = require("../../shared/page-data.js");
const offerData = require("../../shared/offer-data.js");
const opportunityData = require("../../shared/opportunity-data.js");

// Opt-in: the ordinary browser suite intentionally uses historical fixtures.
const enabled = process.env.FREEHUB_EDITORIAL_REVIEW === "true";
const root = path.resolve(__dirname, "../..");
const output = path.join(root, "output/editorial-review");
const manifestPath = path.join(root, "data/editorial-review-batch.json");
const production = "https://freehub.co.za";
const widths = [390, 1440];
const kinds = new Set(["competition", "unverified", "offer", "opportunity", "resource", "guide"]);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
test.use({ timezoneId: "Africa/Johannesburg", serviceWorkers: "block", video: "off" });
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const sastDate = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const safeName = (value) => String(value).replace(/[^a-zA-Z0-9_-]+/g, "-");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const imagePath = (value) => new URL(value, production).pathname;

let batch = null;
let loadError = null;
if (enabled) {
  try { batch = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
  catch (error) { loadError = `Cannot read data/editorial-review-batch.json: ${error.message}`; }
}
const pages = Array.isArray(batch?.pages) ? batch.pages : [];
const validPages = pages.filter((item) => item && typeof item.route === "string" && typeof item.id === "string" && kinds.has(item.kind));
const registries = enabled ? {
  competition: [...readJson("data/competitions.json"), ...readJson("data/archive/competitions-expired.json")],
  unverified: readJson("data/unverified-competitions.json"),
  offer: readJson("data/offers.json"),
  opportunity: readJson("data/opportunities.json"),
  resource: readJson("data/free-resources.json"),
  guide: readJson("data/research-guides.json"),
} : {};
const responsiveImages = enabled ? readJson("data/responsive-images.json") : {};
const opportunityEvidence = enabled ? readJson("data/opportunity-source-evidence.json") : [];
const opportunityHosts = enabled ? readJson("tests/baselines/seo-baseline.json").opportunityAllowedSourceHosts : [];

function lifecycle(item) {
  const record = registries[item.kind].find((row) => row.id === item.id || (item.kind === "guide" && row.slug === item.id));
  const today = sastDate();
  if (!record) return { state: "current", evidence: "No matching dated registry record; normal page checks remain mandatory." };
  if (item.kind === "competition") {
    const cutoff = shared.getCompetitionClosingTimestamp(record);
    if (Number.isFinite(cutoff) && Date.now() >= cutoff) return { state: "closed", evidence: `Registry cutoff ${new Date(cutoff).toISOString()}` };
  }
  if (item.kind === "unverified") {
    const due = [record.closingDate, record.reviewDueAt].filter((value) => isoDate.test(value || "") && value < today).sort()[0];
    // On the batch's own review date every approved route must still exist.
    if (due && batch.asOfDate < today) return { state: "removed", evidence: `Registry closing/review date ${due} precedes ${today}; under-review policy removes the detail file.` };
  }
  if (item.kind === "offer") {
    const due = [record.expiresAt, record.reviewDueAt].filter((value) => isoDate.test(value || "") && value < today).sort()[0];
    if (due && batch.asOfDate < today && offerData.isPublicOffer(record, { asOfDate: batch.asOfDate }) && !offerData.isPublicOffer(record, { asOfDate: today })) {
      return { state: "removed", evidence: `Previously eligible offer passed expiry/review date ${due}; isPublicOffer is false on ${today}, and the generator removes its route.` };
    }
  }
  if (item.kind === "opportunity") {
    const options = { asOfDate: today, strictFreeOnly: false, allowedSourceHosts: opportunityHosts, sourceEvidence: opportunityEvidence, requireSourceEvidence: true };
    const active = opportunityData.isPublicOpportunity(record, options);
    if (!active && opportunityData.isOpportunityTombstoneAllowed(record, options)) {
      const state = opportunityData.getOpportunityLifecycleState(record, options);
      return { state: state === "verification_due" ? "review-due" : "closed", active: false, tombstone: true, evidence: `Shared opportunity gate returns ${state}; historical evidence permits a noindex tombstone without an application route.` };
    }
  }
  if (["offer", "guide"].includes(item.kind)) {
    if (record.expiresAt && record.expiresAt < today) return { state: "closed", evidence: `Registry expiresAt ${record.expiresAt} precedes ${today}.` };
  }
  return { state: "current", evidence: "No elapsed verified cutoff in the matching registry record." };
}

async function restrictRequests(page) {
  const local = new URL(`http://127.0.0.1:${process.env.FREEHUB_TEST_PORT || 4318}`).origin;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) return route.abort();
    if (url.origin === local) return route.continue();
    // Some generated images use the canonical absolute URL. Serve only the
    // repository copy; never contact production, ad vendors, analytics or forms.
    if (url.origin === production && request.resourceType() === "image") {
      let file;
      try { file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`); }
      catch (_) { return route.abort(); }
      if (file.startsWith(`${root}${path.sep}`) && fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ path: file });
    }
    return route.abort();
  });
}

async function checkHero(page, item, result) {
  const expected = imagePath(item.image);
  const accepted = new Set([expected, ...(responsiveImages[expected]?.variants || []).map((variant) => imagePath(variant.src))]);
  const index = await page.locator("img").evaluateAll((images, paths) => images.findIndex((image) => {
    if (image.getAttribute("aria-hidden") === "true") return false;
    return [image.getAttribute("src"), image.currentSrc].filter(Boolean).some((url) => paths.includes(new URL(url, document.baseURI).pathname));
  }), [...accepted]);
  if (index < 0 && result.lifecycle.tombstone === true) {
    result.hero = { expected, omitted: "An expired or review-due opportunity can use a text-only tombstone." };
    return;
  }
  expect(index, `${item.route}: reviewed hero ${expected} must be present`).toBeGreaterThanOrEqual(0);
  const hero = page.locator("img").nth(index);
  await hero.scrollIntoViewIfNeeded();
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate((image) => image.complete && image.naturalWidth > 0), { message: `${item.route}: reviewed hero must load`, timeout: 10000 }).toBe(true);
  result.hero = await hero.evaluate((image) => ({ src: image.getAttribute("src"), currentSrc: image.currentSrc, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }));
}

async function checkUnderReview(page, result) {
  await expect(page.locator("h1")).toContainText(/under review|not (?:yet )?verified/i);
  await expect(page.locator(".unverified-card__status").first()).toHaveText(/not verified/i);
  await expect(page.getByText("Why Freehub has not verified it", { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="/out/"], a[href^="https://freehub.co.za/out/"], [data-active-entry][href]')).toHaveCount(0);
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent)));
  const types = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value["@type"]) types.push(...[].concat(value["@type"]).map((type) => String(type).split(/[\/#]/).pop()));
    Object.values(value).forEach((child) => Array.isArray(child) ? child.forEach(visit) : visit(child));
  };
  schemas.forEach(visit);
  expect(types.filter((type) => /^(?:Competition|Event|Product|Offer|ItemList|Game)$|Action$/.test(type)), "Under-review pages must not emit verified competition, offer or entry-action schema").toEqual([]);
  expect(JSON.stringify(schemas)).not.toMatch(/(?:https:\/\/freehub\.co\.za)?\/out\//);
  result.underReview = { disclosure: true, entryLinks: 0, schemaTypes: [...new Set(types)] };
}

async function checkClosure(page, item, result) {
  if (!["closed", "review-due"].includes(result.lifecycle.state)) return;
  const scope = item.kind === "guide" ? page.locator(".hero") : page.locator("main");
  await expect(scope).toContainText(/closed|ended|expired|withdrawn|no longer|not currently available|stopped promoting|verification due|review due|being re-verified|being reviewed|check.*again/i);
  if (item.kind === "competition") {
    await expect(page.locator('[data-active-entry][href]:visible')).toHaveCount(0);
    await expect(page.locator(`a[href="/out/${item.id}/"]:visible`)).toHaveCount(0);
  }
  if (item.kind === "guide") {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('.hero a[href^="https://"]')).toHaveCount(0);
  }
  if (item.kind === "opportunity") {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('a[href^="/out/opportunity/"], a[href^="https://freehub.co.za/out/opportunity/"]')).toHaveCount(0);
  }
}

async function capture(page, item, width, result, full) {
  const stem = `${safeName(item.kind)}--${safeName(item.id)}--${width}`;
  const directory = path.join(output, "screenshots");
  fs.mkdirSync(directory, { recursive: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const top = `${stem}-top.jpg`;
  await page.screenshot({ path: path.join(directory, top), type: "jpeg", quality: 65, animations: "disabled", scale: "css" });
  result.screenshots = { top: `screenshots/${top}` };
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  if (full && height <= 24000) {
    const name = `${stem}-full.jpg`;
    await page.screenshot({ path: path.join(directory, name), type: "jpeg", quality: 60, fullPage: true, animations: "disabled", scale: "css" });
    result.screenshots.full = `screenshots/${name}`;
  } else if (full) result.fullScreenshotNote = `Full-page capture omitted because ${height}px exceeds the 24,000px artifact limit; top capture retained.`;
}

function writeReport() {
  const cases = path.join(output, "cases");
  if (!fs.existsSync(cases)) return;
  const results = fs.readdirSync(cases).filter((name) => name.endsWith(".json")).map((name) => JSON.parse(fs.readFileSync(path.join(cases, name), "utf8"))).sort((a, b) => a.route.localeCompare(b.route) || a.width - b.width);
  const report = { batchAsOfDate: batch?.asOfDate, actualReviewDateSast: sastDate(), buildDate: process.env.FREEHUB_BUILD_DATE, buildInstant: process.env.FREEHUB_AS_OF_TIME, generatedAt: new Date().toISOString(), commit: process.env.GITHUB_SHA || null, results };
  fs.writeFileSync(path.join(output, "summary.json"), `${JSON.stringify(report, null, 2)}\n`);
  const rows = results.map((row) => `<tr><td>${escapeHtml(row.kind)}<br><code>${escapeHtml(row.id)}</code></td><td>${row.width}px</td><td>${row.error ? "FAILED" : "Passed"}<br>${escapeHtml(row.lifecycle?.state)}</td><td><a href="${escapeHtml(production + row.route)}">${escapeHtml(row.route)}</a><br>${escapeHtml(row.error || row.lifecycle?.evidence || "")}</td><td>${Object.entries(row.screenshots || {}).map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join(" · ")}</td></tr>`).join("\n");
  fs.writeFileSync(path.join(output, "index.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FreeHub editorial preview review</title><style>body{font:16px/1.5 system-ui;margin:2rem;color:#18342a}table{border-collapse:collapse;width:100%}td,th{padding:.65rem;border:1px solid #c8d8d0;text-align:left;vertical-align:top}code{overflow-wrap:anywhere}a{color:#006b4a}td:nth-child(4){overflow-wrap:anywhere;max-width:36rem}</style><h1>FreeHub editorial preview review</h1><p>Batch reviewed ${escapeHtml(report.batchAsOfDate)}. Build ${escapeHtml(report.buildDate)}; screenshots checked ${escapeHtml(report.actualReviewDateSast)} South African time. Commit <code>${escapeHtml(report.commit || "local")}</code>.</p><p>External requests, advertising, analytics and submissions were blocked. These checks cover the local generated pages; provider eligibility and claims require the separate editorial source review.</p><p><a href="report/index.html">Playwright report</a> · <a href="summary.json">Machine-readable results</a></p><table><thead><tr><th>Page</th><th>Viewport</th><th>Result</th><th>Route and lifecycle evidence</th><th>Screenshots</th></tr></thead><tbody>${rows}</tbody></table></html>\n`);
}

test.describe("current-date editorial publication batch", () => {
  test.skip(!enabled, "Run with FREEHUB_EDITORIAL_REVIEW=true; historical regression fixtures remain unchanged.");
  test.setTimeout(45000);

  test("manifest and clock use the actual South African date", async () => {
    expect(loadError).toBeNull();
    expect(batch && !Array.isArray(batch)).toBeTruthy();
    expect(isoDate.test(batch.asOfDate || "")).toBe(true);
    expect(batch.asOfDate <= sastDate(), "The research date must not be in the future").toBe(true);
    expect(process.env.FREEHUB_BUILD_DATE, "Build using today's South African date, never the batch's historical date").toBe(sastDate());
    expect(process.env.FREEHUB_AS_OF_DATE).toBe(sastDate());
    expect(Number.isFinite(Date.parse(process.env.FREEHUB_AS_OF_TIME))).toBe(true);
    expect(sastDate(new Date(process.env.FREEHUB_AS_OF_TIME))).toBe(sastDate());
    expect(process.env.NODE_OPTIONS || "").not.toContain("fixed-date-register");
    for (const flag of ["FREEHUB_ENABLE_OPPORTUNITIES", "FREEHUB_ENABLE_OFFERS", "FREEHUB_ENABLE_PROMOTIONS"]) expect(process.env[flag], flag).toBe("true");
    expect(pages.length).toBeGreaterThan(0);
    expect(validPages).toHaveLength(pages.length);
    expect(new Set(pages.map((item) => item.route)).size).toBe(pages.length);
    for (const item of pages) {
      expect(item.route).toMatch(/^\/(?:[a-z0-9-]+\/)*$/);
      expect(item.route).not.toMatch(/^\/out\//);
      expect(item.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(typeof item.image, `${item.id}: image must be the reviewed asset src`).toBe("string");
      expect(imagePath(item.image), `${item.id}: a reviewed local hero image is required`).toMatch(/^\/assets\//);
    }
  });

  const representativeCounts = new Map();
  for (const item of validPages) {
    const count = representativeCounts.get(item.kind) || 0;
    representativeCounts.set(item.kind, count + 1);
    const full = count < 2 || /(?:mqa|fem|sati|ruwacon)/.test(item.id);
    for (const width of widths) {
      test(`${item.kind}: ${item.id} at ${width}px`, async ({ page }) => {
        const result = { id: item.id, route: item.route, kind: item.kind, width, checkedAt: new Date().toISOString(), lifecycle: lifecycle(item), consoleErrors: [] };
        page.on("pageerror", (error) => result.consoleErrors.push(error.message));
        await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
        await restrictRequests(page);
        try {
          const response = await page.goto(item.route, { waitUntil: "domcontentloaded" });
          result.httpStatus = response?.status();
          if (result.lifecycle.state === "removed") {
            expect(result.httpStatus, result.lifecycle.evidence).toBe(404);
            return;
          }
          expect(result.httpStatus, `${item.route}: expected a generated detail page`).toBe(200);
          await expect(page.locator("h1")).toHaveCount(1);
          await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", production + item.route);
          result.h1 = await page.locator("h1").innerText();
          result.canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
          await checkHero(page, item, result);
          if (item.kind === "unverified") await checkUnderReview(page, result);
          await checkClosure(page, item, result);
          await page.evaluate(() => document.fonts.ready);
          result.geometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, height: document.documentElement.scrollHeight, overflow: [...document.querySelectorAll("body *")].filter((element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && (rect.right > innerWidth + 1 || rect.left < -1) && getComputedStyle(element).visibility !== "hidden"; }).slice(0, 12).map((element) => ({ tag: element.tagName, className: String(element.className), text: (element.textContent || "").trim().slice(0, 70) })) }));
          expect(result.geometry.document, JSON.stringify(result.geometry)).toBeLessThanOrEqual(width + 1);
          expect(result.geometry.body, JSON.stringify(result.geometry)).toBeLessThanOrEqual(width + 1);
        } catch (error) {
          result.error = error.message;
          throw error;
        } finally {
          try { await capture(page, item, width, result, full); }
          catch (error) { result.screenshotError = error.message; if (!result.error) result.error = `Screenshot capture failed: ${error.message}`; }
          const directory = path.join(output, "cases");
          fs.mkdirSync(directory, { recursive: true });
          fs.writeFileSync(path.join(directory, `${safeName(item.kind)}--${safeName(item.id)}--${width}.json`), `${JSON.stringify(result, null, 2)}\n`);
          if (result.screenshotError && result.error.startsWith("Screenshot capture failed:")) throw new Error(result.error);
        }
      });
    }
  }
  test.afterAll(writeReport);
});
