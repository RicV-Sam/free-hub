const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const shared = require("../../shared/page-data.js");
const unverifiedData = require("../../shared/unverified-competition-data.js");
const offerData = require("../../shared/offer-data.js");
const current = require("../../scripts/lib/current-content-baseline.js").getCurrentContentBaseline();
const student = require("../../data/student-guide.json");
const offers = require("../../data/offers.json").filter(row => offerData.isPublicOffer(row, { asOfDate: process.env.FREEHUB_AS_OF_DATE || shared.getSouthAfricanDate() }));
const root = path.resolve(__dirname, "../..");
const visibleMascots = page => page.locator("[data-mascot]:visible");
const guides = ["guides", "blog", "best-competitions-south-africa-this-month", "free-stuff-south-africa", "free-samples-south-africa", "free-online-courses-south-africa", "free-childrens-books-south-africa", "free-credit-report-south-africa", "birthday-freebies", student.slug, "free-parks-entry-south-africa-september-2026", "how-we-verify-competitions", "how-to-enter-competitions-safely", "how-to-spot-a-scam-competition", "legit-competitions-south-africa", "competition-closing-date-checklist", "competition-entry-cost-labels", "till-slip-competitions-south-africa", "whatsapp-competitions-south-africa", "app-competitions-south-africa", "fake-competition-winner-messages", "purchase-required-competitions-explained", "paid-entry-competitions-explained", "south-african-lottery"];
const browseRoutes = ["/competitions/", "/category/cash/", "/tag/free-entry/", "/brands/", "/brand/clicks/", "/win-a-car/", "/offers/", "/coupons/", "/deals/", unverifiedData.PUBLIC_PATH];
const layoutRoutes = ["/", "/competitions/", "/free-stuff-south-africa/", "/best-competitions-south-africa-this-month/", "/about/", "/not-a-freehub-page/", `/${student.slug}/`, "/offers/", "/win-a-car/", "/free-samples-south-africa/", "/how-to-enter-competitions-safely/"];

test.beforeEach(async ({ page }) => {
  await page.route("**/scripts.scriptwrapper.com/**", route => route.abort());
  await page.route("**/firebase-config.json", route => route.fulfill({ status: 404, body: "Local test" }));
  await page.clock.install({ time: new Date(`${process.env.FREEHUB_AS_OF_DATE || shared.getSouthAfricanDate()}T10:00:00Z`) });
});

test("all public guides use Read; browsing hubs use Browse; excluded pages stay clear", async ({ page }) => {
  for (const slug of guides) {
    const html = fs.readFileSync(path.join(root, slug, "index.html"), "utf8");
    // The overlapping WhatsApp and till-slip URLs are catalogue hubs.
    const pose = html.includes('id="competitionsGrid"') ? "browse" : "read";
    expect(html).toContain(`data-mascot="${pose}"`);
    expect((html.match(/data-mascot-heading/g) || []).length).toBe(1);
  }
  for (const route of browseRoutes) {
    await page.goto(route);
    await expect(visibleMascots(page)).toHaveCount(1);
    const emptyOffers = ["/offers/", "/coupons/", "/deals/"].includes(route) && !offers.some(row => route === "/offers/" || row.type === (route === "/coupons/" ? "coupon" : "deal"));
    await expect(visibleMascots(page)).toHaveAttribute("data-mascot", emptyOffers ? "recover" : "browse");
  }
  for (const route of ["/contact/", "/privacy-policy/", "/terms-of-use/", "/submit-an-offer/", "/submit-a-competition/", "/report-a-competition/", "/club/", "/club/account/", "/competition/cadbury-made-to-share-2026/", ...(offers[0] ? [offerData.getOfferPath(offers[0])] : []), ...(current.publicOpportunities[0] ? [`/opportunity/${current.publicOpportunities[0].slug}/`] : [])]) {
    await page.goto(route);
    await expect(page.locator("[data-mascot]")).toHaveCount(0);
  }
  await page.goto("/about/");
  await expect(page.getByText("Our hadeda mascot points the way around FreeHub.")).toBeVisible();
  await expect(page.locator('[data-mascot] img')).toHaveAttribute("alt", /FreeHub.*hadeda/);
});

for (const width of [320, 390, 768, 1024, 1440]) test(`mascot layouts reflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  for (const route of layoutRoutes) {
    await page.goto(route);
    await expect(visibleMascots(page)).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
    const mascot = await visibleMascots(page).boundingBox();
    const featured = ["/", "/about/", "/not-a-freehub-page/"].includes(route);
    expect(mascot.height).toBeLessThanOrEqual((width < 768 ? featured ? 96 : 72 : featured ? 180 : 96) + 1);
    const overlaps = await page.evaluate(() => {
      const image = [...document.querySelectorAll('[data-mascot]')].find(n => n.getBoundingClientRect().width)?.getBoundingClientRect();
      return [...document.querySelectorAll('a,button,input,summary')].filter(n => {
        const b=n.getBoundingClientRect();
        return b.width && image && b.left < image.right && b.right > image.left && b.top < image.bottom && b.bottom > image.top;
      }).map(n=>n.textContent);
    });
    expect(overlaps, route).toEqual([]);
    if (width === 390 && route === "/") expect((await page.locator('.editorial-pick, [data-editorial-fallback]').filter({ visible:true }).first().boundingBox()).y).toBeLessThan(844);
    if (width === 390 && route === "/competitions/") expect((await page.locator('#competitionsGrid article').first().boundingBox()).y).toBeLessThan(844);
  }
});

test("empty search, empty category and failed feeds keep messages and one recovery pose", async ({ page }) => {
  await page.goto("/competitions/");
  const search = page.getByRole("searchbox");
  await search.fill("not-a-real-hadeda-match");
  await expect(page.locator('#emptyState .state-card__title')).toHaveText("No competitions match");
  await expect(page.locator('#emptyState .state-card__text')).toContainText("Try");
  await expect(visibleMascots(page)).toHaveCount(1);
  await expect(visibleMascots(page)).toHaveAttribute("data-mascot", "recover");
  await search.fill("not-a-real-hadeda-match-again");
  await expect(visibleMascots(page).locator('img')).toHaveCSS("animation-name", "none");
  await search.fill("");
  await expect(visibleMascots(page)).toHaveAttribute("data-mascot", "browse");
  await page.route("**/data/competitions.json", route => route.fulfill({ contentType:"application/json", body:"[]" }));
  await page.goto("/category/cash/");
  await expect(page.locator('#emptyState .state-card__title')).toBeVisible();
  await expect(visibleMascots(page)).toHaveAttribute("data-mascot", "recover");
  await page.unroute("**/data/competitions.json");
  await page.route("**/data/competitions.json", route => route.abort());
  await page.goto("/competitions/");
  await expect(page.locator('#errorState .state-card__title')).toHaveText("Unable to load competitions");
  await expect(page.locator('#errorState .state-card__text')).toContainText("refresh");
  await expect(visibleMascots(page)).toHaveCount(1);
  await expect(visibleMascots(page)).toHaveAttribute("data-mascot", "recover");
  expect(await page.locator('#competitionsGrid article').count()).toBeGreaterThan(0);
  await page.unroute("**/data/competitions.json");
  await page.reload();
  await expect(visibleMascots(page)).toHaveAttribute("data-mascot", "browse");
});

test("200% text, reduced motion, broken images and keyboard access remain useful", async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({ reducedMotion:"reduce" });
  for (const route of layoutRoutes) {
    await page.goto(route);
    await expect(visibleMascots(page).locator('img')).toHaveCSS("animation-name","none");
    await page.evaluate(() => {
      const sizes=[...document.querySelectorAll('body *')].map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);
      for(const [node,size] of sizes) if(Number.isFinite(size)) node.style.fontSize=`${size*2}px`;
    });
    const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(node=>{
      const box=node.getBoundingClientRect();return box.width && box.right>innerWidth+1 && !node.closest('.table-scroll');
    }).map(node=>`${node.tagName}.${node.className}`));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route}: ${overflow.join(', ')}`).toBe(true);
  }
  await page.route("**/assets/mascot/**",route=>route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.locator('.home-hero-guide__links a')).toHaveCount(3);
  await page.getByRole("button",{name:"Menu",exact:true}).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation",{name:"Primary navigation",exact:true})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button",{name:"Menu",exact:true})).toBeFocused();
  expect(await page.locator('[data-mascot] :is(a,button,[tabindex])').count()).toBe(0);
});

test("the welcome greeting runs once for 800ms and finishes at rest", async ({ page }) => {
  await page.goto("/");
  const image=page.locator('[data-mascot="welcome"] img');
  await expect(image).toHaveCSS("animation-duration", "0.8s");
  await expect(image).toHaveCSS("animation-iteration-count", "1");
  await expect(image).toHaveCSS("animation-fill-mode", "none");
  await expect.poll(()=>image.evaluate(node=>getComputedStyle(node).transform)).toBe("none");
});

const competition=current.core[0];
const opportunity=current.publicOpportunities[0];
const handoffs=[
  {kind:"competition",route:`/out/${shared.getCompetitionSlug(competition)}/`,selector:'.outbound-notice a'},
  ...(offers[0] ? [{kind:"offer",route:offerData.getOfferExitPath(offers[0]),selector:'[data-offer-destination]'}] : []),
  ...(opportunity ? [{kind:"opportunity",route:`/out/opportunity/${opportunity.slug}/`,selector:'[data-opportunity-action="handoff"]'}] : []),
  {kind:"student",route:`/out/student/${student.offers[0].id}/`,selector:'.student-continue'}
];
for (const auth of ["guest","member","unresolved"]) test(`handoffs preserve automatic/manual behaviour with ${auth} account state and failed art`,async({page})=>{
  await page.clock.pauseAt(new Date(`${process.env.FREEHUB_AS_OF_DATE || shared.getSouthAfricanDate()}T10:00:01Z`));
  await page.route("**/shared/guest-ads.js*",route=>route.fulfill({contentType:"application/javascript",body:''}));
  await page.route("**/assets/mascot/**",route=>route.abort());
  const navigations=[];
  await page.route(/https?:\/\/(?!127\.0\.0\.1)/,route=>{
    if(route.request().isNavigationRequest()) navigations.push(route.request().url());
    return route.fulfill({contentType:"text/html",body:"<p>Intercepted official destination</p>"});
  });
  for(const handoff of handoffs){
    await page.goto(handoff.route);
    await expect(visibleMascots(page)).toHaveAttribute("data-mascot","direct");
    await expect(visibleMascots(page).locator('img')).toHaveCSS("animation-name","none");
    const target=await page.locator(handoff.selector).first().getAttribute('href');
    const before=navigations.length;
    if (auth !== "unresolved") await page.evaluate(auth => {
      document.documentElement.dataset.freehubAdState = auth;
      window.dispatchEvent(new CustomEvent('freehub:guest-ads-state', { detail: { state: auth } }));
    }, auth);
    await page.clock.runFor(5100);
    if(handoff.kind==="student"){
      expect(navigations.length).toBe(before);
      await page.locator(handoff.selector).click();
    }
    await expect.poll(()=>navigations.length).toBe(before+1);
    expect(navigations.at(-1)).toBe(target);
    if(handoff.kind==="offer" && auth!=="unresolved") expect(await page.url()).toBe(target);
  }
});

test("all handoffs keep manual links with JavaScript disabled",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();
  for(const handoff of handoffs){
    await page.goto(handoff.route);
    await expect(visibleMascots(page)).toHaveCount(1);
    await expect(page.locator(handoff.selector).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await context.close();
});

test("manual handoff links work before an unresolved account check and before images load", async ({ page }) => {
  await page.clock.pauseAt(new Date(`${process.env.FREEHUB_AS_OF_DATE || shared.getSouthAfricanDate()}T10:00:01Z`));
  await page.route("**/shared/guest-ads.js*", route => route.fulfill({contentType:"application/javascript",body:''}));
  await page.route("**/assets/mascot/**", route => route.abort());
  const destinations=[];
  await page.context().route(/https?:\/\/(?!127\.0\.0\.1)/, route => {
    if(route.request().isNavigationRequest()) destinations.push(route.request().url());
    return route.fulfill({contentType:"text/html",body:"<p>Intercepted manual destination</p>"});
  });
  for(const handoff of handoffs) {
    await page.goto(handoff.route);
    const link=page.locator(handoff.selector).first();
    const target=await link.getAttribute('href');
    const count=destinations.length;
    await link.click();
    await expect.poll(()=>destinations.length).toBe(count+1);
    expect(destinations.at(-1)).toBe(target);
    for(const popup of page.context().pages()) if(popup!==page) await popup.close();
  }
});
