const { test, expect } = require("@playwright/test");
const shared = require("../../shared/page-data.js");
const { referenceDate } = require("./editorial-source-fixture.js");
const { applyCompetitionRetirements } = require("../../scripts/lib/competition-retirements.js");

const CHANNEL = "https://whatsapp.com/channel/0029Vb7mS1VE50UlOc2yOe2H";
shared.setReferenceDate(referenceDate);
const inventory = applyCompetitionRetirements(
  require("../../data/competitions.json"),
  require("../../data/archive/competitions-expired.json"),
  { asOfDate: referenceDate },
);
const active = inventory.primary.find(record =>
  shared.isActiveCompetition(record) && shared.getEffectiveCompetitionEndDate(record) > referenceDate
);
const closed = [...inventory.archive, ...inventory.primary].find(shared.isIndexableClosedCompetition);
if (!active || !closed) throw new Error("WhatsApp browser checks need an eligible active and closed competition in the built inventory.");
const activePath = shared.getCompetitionPath(active);
const closedPath = shared.getCompetitionPath(closed);
const surfaces = [
  { name: "home", path: "/", prompt: ':is(.whatsapp-channel-note, .fh-whatsapp-quiet):has([data-whatsapp-placement="home-discovery"])' },
  { name: "collection", path: "/competitions/", prompt: '.whatsapp-channel-note:has([data-whatsapp-placement="collection-filters"])' },
  { name: "detail", path: activePath, prompt: '.whatsapp-channel-note:has([data-whatsapp-placement="competition-detail"])' },
  { name: "closed", path: closedPath, prompt: ".closed-competition-promo" },
  { name: "guide", path: "/whatsapp-channel/", prompt: ".wa-hero" },
];

async function blockExternalRequests(context, baseURL) {
  const localOrigin = new URL(baseURL).origin;
  await context.route("**/*", route => {
    if (new URL(route.request().url()).origin === localOrigin) return route.continue();
    // Native target=_blank navigation remains testable without contacting WhatsApp.
    if (route.request().isNavigationRequest()) {
      return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Mock external destination</title><h1>Mock external destination</h1>" });
    }
    return route.abort();
  });
}

async function visit(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.FreeHubWhatsAppChannelTrackingReady === true)).toBe(true);
}

async function readEvents(page) {
  return page.evaluate(() => (window.dataLayer || []).flatMap(entry => {
    if (entry?.[0] === "event") return [{ name: entry[1], payload: entry[2] || {} }];
    if (entry?.event) {
      const { event, ...payload } = entry;
      return [{ name: event, payload }];
    }
    return [];
  }));
}

async function openMockPopup(page, link, keyboard = false) {
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    keyboard ? page.keyboard.press("Enter") : link.click(),
  ]);
  await popup.waitForLoadState("domcontentloaded");
  await expect(popup.getByRole("heading", { name: "Mock external destination" })).toBeVisible();
  const url = popup.url();
  await popup.close();
  await page.bringToFront();
  return url;
}

async function tabToLink(page, link) {
  for (let step = 0; step < 80; step += 1) {
    await page.keyboard.press("Tab");
    if (await link.evaluate(node => node === document.activeElement)) return;
  }
  await expect(link, "The channel invitation must be reachable with Tab").toBeFocused();
}

test.beforeEach(async ({ context, page, baseURL }) => {
  await blockExternalRequests(context, baseURL);
  await page.clock.install({ time: new Date(`${referenceDate}T12:00:00+02:00`) });
});

for (const width of [320, 390, 768, 1440]) {
  test(`WhatsApp invitations retain readable layouts and primary tasks at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    for (const surface of surfaces) {
      await visit(page, surface.path);
      await expect(page.getByRole("heading", { level: 1 }), surface.name).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), surface.name).toBe(true);
      const prompt = page.locator(surface.prompt);
      await expect(prompt, surface.name).toHaveCount(1);
      await expect(prompt).toBeVisible();
      const follow = prompt.locator(`a[href="${CHANNEL}"]`).first();
      await expect(follow).toBeVisible();
      await expect(follow).toHaveAttribute("target", "_blank");
      await expect(follow).toHaveAttribute("rel", /noopener/);
      await expect(follow).toHaveAttribute("rel", /noreferrer/);
      const notificationCopy = surface.name === "guide" ? page.locator(".wa-how") : prompt;
      await expect(notificationCopy).toContainText(/Follow/);
      if (surface.name === "home" && process.env.FREEHUB_ENABLE_PROMOTIONS === "true") {
        await expect(notificationCopy).toContainText("Want new competition alerts?");
        expect(await prompt.evaluate(node => node.classList.contains("fh-whatsapp-quiet"))).toBe(true);
      } else {
        await expect(notificationCopy).toContainText(/bell/);
        await expect(notificationCopy).toContainText(/notification/);
      }

      if (surface.name === "collection") {
        await expect(page.locator("#loadingState")).toBeHidden();
        const search = await page.getByRole("searchbox").boundingBox();
        const controls = await page.locator(".controls").boundingBox();
        const invitation = await prompt.boundingBox();
        const card = await page.locator("#competitionsGrid article").first().boundingBox();
        expect(search.y + search.height).toBeLessThanOrEqual(invitation.y);
        expect(controls.y + controls.height).toBeLessThanOrEqual(invitation.y + 1);
        expect(invitation.y + invitation.height).toBeLessThanOrEqual(card.y + 1);
        if (width === 390) {
          expect(search.y + search.height).toBeLessThan(844);
          expect(card.y).toBeLessThan(844);
        }
      }
      if (surface.name === "home" && width === 390) {
        const firstDiscovery = page.locator(".editorial-pick, [data-editorial-fallback]").filter({ visible: true }).first();
        expect((await firstDiscovery.boundingBox()).y).toBeLessThan(844);
      }
      if (surface.name === "detail") {
        const entry = page.locator("[data-active-entry]").first();
        await expect(entry).toBeVisible();
        await expect(entry).toHaveAttribute("href", `/out/${shared.getCompetitionSlug(active)}/`);
        const entryBox = await entry.boundingBox();
        const invitationBox = await prompt.boundingBox();
        const artwork = await page.locator(".competition-detail__media").boundingBox();
        expect(entryBox.y + entryBox.height).toBeLessThanOrEqual(invitationBox.y + 1);
        expect(invitationBox.y + invitationBox.height).toBeLessThanOrEqual(artwork.y + 1);
      }
      await follow.focus();
      await expect(follow).toBeFocused();
      if (width === 390) {
        await follow.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath(`whatsapp-${surface.name}-390.png`) });
      }
    }
  });
}

test("WhatsApp invitations reflow at 200 percent text size with reduced motion", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const surface of surfaces) {
    await visit(page, surface.path);
    const prompt = page.locator(surface.prompt);
    // Resize actual computed text, including px sizes, without scaling its container.
    await prompt.evaluate(node => {
      const elements = [node, ...node.querySelectorAll("*")];
      const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize));
      elements.forEach((element, index) => { element.style.fontSize = `${sizes[index] * 2}px`; });
    });
    const follow = prompt.locator(`a[href="${CHANNEL}"]`).first();
    await expect(follow).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), surface.name).toBe(true);
    expect(await prompt.evaluate(node => node.scrollWidth <= node.clientWidth + 1), surface.name).toBe(true);
    const bounds = await prompt.boundingBox();
    const linkBounds = await follow.boundingBox();
    expect(linkBounds.x, surface.name).toBeGreaterThanOrEqual(bounds.x - 1);
    expect(linkBounds.x + linkBounds.width, surface.name).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    await follow.focus();
    await expect(follow).toBeFocused();
    await follow.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`whatsapp-${surface.name}-text-200.png`) });
  }
});

for (const analyticsMode of ["gtag", "dataLayer"]) {
  test(`one channel click is recorded separately from entry through ${analyticsMode}`, async ({ page }) => {
    await visit(page, activePath);
    const follow = page.locator('[data-whatsapp-placement="competition-detail"]');
    await page.evaluate(mode => {
      window.dataLayer = [];
      if (mode === "dataLayer") window.gtag = undefined;
    }, analyticsMode);
    await follow.focus();
    await expect(follow).toBeFocused();
    expect(await openMockPopup(page, follow, true)).toBe(CHANNEL);
    const events = await readEvents(page);
    const clicks = events.filter(event => event.name === "whatsapp_channel_click");
    expect(clicks).toHaveLength(1);
    expect(clicks[0].payload).toMatchObject({ placement: "competition-detail", source_path: activePath });
    expect(Object.keys(clicks[0].payload).filter(key => key !== "send_to").sort()).toEqual(["placement", "source_path"]);
    expect(events.filter(event => event.name === "enter_competition_click")).toEqual([]);
    expect(page.url()).toContain(activePath);
    await expect(page.locator("[data-active-entry]")).toBeVisible();

    for (const surface of [surfaces.find(item => item.name === "closed"), surfaces.find(item => item.name === "guide")]) {
      await visit(page, surface.path);
      await page.evaluate(mode => {
        window.dataLayer = [];
        if (mode === "dataLayer") window.gtag = undefined;
      }, analyticsMode);
      const secondaryFollow = page.locator(surface.prompt).locator(`a[href="${CHANNEL}"]`).first();
      expect(await openMockPopup(page, secondaryFollow)).toBe(CHANNEL);
      const secondaryEvents = await readEvents(page);
      const secondaryClicks = secondaryEvents.filter(event => event.name === "whatsapp_channel_click");
      expect(secondaryClicks).toHaveLength(1);
      expect(secondaryClicks[0].payload).toMatchObject({
        placement: surface.name === "guide" ? "channel-guide" : "closed-competition",
        source_path: surface.path,
      });
      expect(secondaryEvents.filter(event => event.name === "enter_competition_click")).toEqual([]);
    }
  });
}

test("sharing a competition through wa.me does not count as following the channel", async ({ page }) => {
  await visit(page, activePath);
  await page.evaluate(() => { window.dataLayer = []; });
  const share = page.getByRole("link", { name: "Share on WhatsApp", exact: true });
  await expect(share).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  expect(await openMockPopup(page, share)).toMatch(/^https:\/\/wa\.me\//);
  const events = await readEvents(page);
  expect(events.filter(event => ["whatsapp_channel_click", "enter_competition_click"].includes(event.name))).toEqual([]);
});

test("only the exact channel URL is counted even when a different link has a placement marker", async ({ page }) => {
  await visit(page, "/");
  const link = page.locator('[data-whatsapp-placement="home-discovery"]');
  await page.evaluate(() => { window.dataLayer = []; });
  for (const destination of [`${CHANNEL}?not-the-canonical-link=1`, "https://whatsapp.com/channel/another-channel", "https://wa.me/?text=test"]) {
    await link.evaluate((node, href) => { node.href = href; }, destination);
    expect(await openMockPopup(page, link)).toBe(destination);
  }
  expect((await readEvents(page)).filter(event => event.name === "whatsapp_channel_click")).toEqual([]);
});

test("JavaScript-disabled invitations retain ordinary keyboard-accessible follow links", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await blockExternalRequests(context, baseURL);
  const page = await context.newPage();
  try {
    for (const surface of surfaces) {
      await page.goto(new URL(surface.path, baseURL).href, { waitUntil: "domcontentloaded" });
      const follow = page.locator(surface.prompt).locator(`a[href="${CHANNEL}"]`).first();
      await expect(follow).toBeVisible();
      await expect(follow).toHaveAttribute("target", "_blank");
      await tabToLink(page, follow);
      await expect(follow).toBeFocused();
      expect(await openMockPopup(page, follow, true)).toBe(CHANNEL);
      expect(page.url()).toContain(surface.path);
    }
  } finally {
    await context.close();
  }
});
