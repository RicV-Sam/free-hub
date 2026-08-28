const { expect, test } = require("@playwright/test");
const { createOpportunityRouteRenderer } = require("../../scripts/lib/opportunity-route-renderer.js");
const opportunityFixture = require("../../data/opportunities.json")[0];
const opportunitiesEnabled = process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true";
const offersEnabled = process.env.FREEHUB_ENABLE_OFFERS === "true";
const usesReviewedPilotDate = process.env.FREEHUB_BUILD_DATE === "2026-07-31";
const RELEASE_ASSET_VERSION = "20260818-video-v1";
const GUEST_ADS_LOADER_SRC = `/shared/guest-ads.js?v=${RELEASE_ASSET_VERSION}`;
const OUTBOUND_HANDOFF_SRC = `/shared/outbound-handoff.js?v=${RELEASE_ASSET_VERSION}`;

const ADSTERRA_SCRIPTS = Object.freeze({
  popunder: "https://pl30713595.effectivecpmnetwork.com/51/4f/11/514f11fd1c975eebb82034a3a019787a.js",
  socialBar: "https://pl30713596.effectivecpmnetwork.com/5e/fa/1d/5efa1d12d7d4dfb40f2bf1a6ae3d645f.js",
});

const MOCK_MEMBER = Object.freeze({
  uid: "freehub-test-member",
  email: "member@example.test",
  displayName: "Freehub Test Member",
  photoURL: null,
  providerData: [],
});

async function disableFirebase(page) {
  await page.route("**/firebase-config.json", (route) => route.fulfill({ status: 404, body: "Not configured in regression tests" }));
}

async function mockFirebaseAuth(
  page,
  { signedIn = false, enabledAuthProviders = [], providerSigninUser = null, authDelayMs = 0 } = {}
) {
  await page.unroute("**/firebase-config.json");
  await page.addInitScript(({ initialUser, popupUser, callbackDelay }) => {
    const persistedUser = window.sessionStorage.getItem("freehubTestAuthUser");
    window.__freehubTestAuthUser = persistedUser ? JSON.parse(persistedUser) : initialUser;
    window.__freehubProviderSigninUser = popupUser;
    window.__freehubAuthDelayMs = callbackDelay;
    window.__freehubAuthCallbacks = [];
    window.__freehubFirestoreWrites = [];
    window.__freehubEmitAuth = (user) => {
      window.__freehubTestAuthUser = user;
      if (user) {
        window.sessionStorage.setItem("freehubTestAuthUser", JSON.stringify(user));
      } else {
        window.sessionStorage.removeItem("freehubTestAuthUser");
      }
      window.__freehubAuthCallbacks.slice().forEach((callback) => callback(user));
    };
  }, {
    initialUser: signedIn ? MOCK_MEMBER : null,
    popupUser: providerSigninUser,
    callbackDelay: authDelayMs,
  });

  await page.route("**/firebase-config.json", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      apiKey: "freehub-test-api-key",
      authDomain: "freehub-test.firebaseapp.com",
      projectId: "freehub-test",
      appId: "freehub-test-app",
      enabledAuthProviders,
    }),
  }));

  const moduleHeaders = { "access-control-allow-origin": "*" };
  await page.route("**/firebase-app.js", (route) => route.fulfill({
    contentType: "application/javascript",
    headers: moduleHeaders,
    body: `
      const apps = [];
      export function getApps() { return apps; }
      export function initializeApp(config) {
        const app = { config };
        apps.push(app);
        return app;
      }
    `,
  }));
  await page.route("**/firebase-auth.js", (route) => route.fulfill({
    contentType: "application/javascript",
    headers: moduleHeaders,
    body: `
      export class GoogleAuthProvider { addScope() {} }
      export class FacebookAuthProvider { addScope() {} }
      export function getAuth(app) { return { app }; }
      export function onAuthStateChanged(auth, callback) {
        globalThis.__freehubAuthCallbacks.push(callback);
        const delay = Number(globalThis.__freehubAuthDelayMs) || 0;
        if (delay > 0) {
          setTimeout(() => callback(globalThis.__freehubTestAuthUser), delay);
        } else {
          queueMicrotask(() => callback(globalThis.__freehubTestAuthUser));
        }
        return () => {
          globalThis.__freehubAuthCallbacks = globalThis.__freehubAuthCallbacks.filter((item) => item !== callback);
        };
      }
      export function isSignInWithEmailLink() { return false; }
      export async function signInWithPopup() {
        const user = globalThis.__freehubProviderSigninUser || globalThis.__freehubTestAuthUser;
        if (user) globalThis.__freehubEmitAuth(user);
        return { user };
      }
      export async function sendSignInLinkToEmail() {}
      export async function signInWithEmailLink() { return { user: globalThis.__freehubTestAuthUser }; }
      export async function signOut() { globalThis.__freehubEmitAuth(null); }
    `,
  }));
  await page.route("**/firebase-firestore.js", (route) => route.fulfill({
    contentType: "application/javascript",
    headers: moduleHeaders,
    body: `
      const missingDocument = () => ({ exists: () => false, data: () => ({}) });
      export function getFirestore(app) { return { app }; }
      export function collection(...path) { return { path }; }
      export function doc(...path) { return { path }; }
      export async function deleteDoc() {}
      export async function getDoc() { return missingDocument(); }
      export async function getDocs() { return { docs: [] }; }
      export function limit(value) { return { value }; }
      export function query(...parts) { return { parts }; }
      export async function runTransaction(db, update) {
        return update({ get: async () => missingDocument(), set() {} });
      }
      export function serverTimestamp() { return "test-timestamp"; }
      export async function setDoc(reference, data) {
        globalThis.__freehubFirestoreWrites.push({
          path: reference.path.filter((part) => typeof part === "string"),
          data,
        });
      }
      export function where(...parts) { return { parts }; }
    `,
  }));
}

async function stubAdsterra(page) {
  const requests = { popunder: 0, socialBar: 0 };
  await page.route(ADSTERRA_SCRIPTS.popunder, (route) => route.fulfill({
    contentType: "application/javascript",
    headers: { "access-control-allow-origin": "*" },
    body: "globalThis.__freehubPopunderExecutions = (globalThis.__freehubPopunderExecutions || 0) + 1;",
  }).finally(() => {
    requests.popunder += 1;
  }));
  await page.route(ADSTERRA_SCRIPTS.socialBar, (route) => route.fulfill({
    contentType: "application/javascript",
    headers: { "access-control-allow-origin": "*" },
    body: "globalThis.__freehubSocialBarExecutions = (globalThis.__freehubSocialBarExecutions || 0) + 1;",
  }).finally(() => {
    requests.socialBar += 1;
  }));
  return requests;
}

async function expectCanonical(page, route) {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://freehub.co.za${route}`);
}

async function readDataLayerEvents(page) {
  return page.evaluate(() =>
    (window.dataLayer || [])
      .filter((entry) => entry && entry[0] === "event")
      .map((entry) => [entry[0], entry[1], entry[2]])
  );
}

test.beforeEach(async ({ page }) => {
  await disableFirebase(page);
});

test("homepage navigation reaches canonical pillar routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find South African competitions worth entering today");
  await expectCanonical(page, "/");

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Competitions" }).click();
  await expect(page).toHaveURL(/\/competitions\/$/);
  await expectCanonical(page, "/competitions/");
  await page.goto("/competitions/?utm_source=regression-test&filter=free");
  await expectCanonical(page, "/competitions/");

  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Free Stuff" }).click();
  await expect(page).toHaveURL(/\/free-stuff-south-africa\/$/);
  await expectCanonical(page, "/free-stuff-south-africa/");
  await page.goto("/free-samples-south-africa/");
  await expectCanonical(page, "/free-samples-south-africa/");
  await page.goto("/free-online-courses-south-africa/");
  await expectCanonical(page, "/free-online-courses-south-africa/");
});

test("generated pages contain one first-party ad gate and no raw Adsterra tags", async ({ page }) => {
  const homepageHtml = await (await page.request.get("/")).text();
  expect(homepageHtml.split(`src="${GUEST_ADS_LOADER_SRC}"`)).toHaveLength(2);
  expect(homepageHtml).not.toContain("effectivecpmnetwork.com");

  for (const route of ["/about/", "/club/dashboard/"]) {
    const html = await (await page.request.get(route)).text();
    expect(html).not.toContain("/shared/guest-ads.js");
    expect(html).not.toContain("effectivecpmnetwork.com");
  }

  for (const route of [
    "/blog/",
    "/guides/",
    "/best-competitions-south-africa-this-month/",
    "/out/one-life-winning-wednesday-cash-2026/",
    "/competition/isuzu-win-a-new-x-rider-2026/",
    ...(opportunitiesEnabled ? ["/out/opportunity/coloplast-speedicath-short-sample/"] : []),
    ...(offersEnabled ? ["/offers/", "/out/coupon/capitec-snappi-extra-15-percent/"] : []),
  ]) {
    const html = await (await page.request.get(route)).text();
    expect(html.split(`src="${GUEST_ADS_LOADER_SRC}"`)).toHaveLength(2);
    expect(html).not.toContain("effectivecpmnetwork.com");
  }

  for (const route of [
    "/out/one-life-winning-wednesday-cash-2026/",
    ...(opportunitiesEnabled ? ["/out/opportunity/coloplast-speedicath-short-sample/"] : []),
    ...(offersEnabled ? ["/out/coupon/capitec-snappi-extra-15-percent/"] : []),
  ]) {
    const html = await (await page.request.get(route)).text();
    expect(html.split(`src="${OUTBOUND_HANDOFF_SRC}"`)).toHaveLength(2);
  }
});

test("Adsterra fails closed when Firebase auth cannot be resolved", async ({ page }) => {
  await stubAdsterra(page);
  await page.goto("/");

  await expect(page.locator('html[data-freehub-ad-state="unavailable"]')).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(0);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(0);
});

test("signed-out visitors receive each exact Adsterra script once", async ({ page }) => {
  await mockFirebaseAuth(page);
  const requests = await stubAdsterra(page);
  await page.goto("/");

  await expect(page.locator('html[data-freehub-ad-state="guest"]')).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(1);
  await expect.poll(() => requests).toEqual({ popunder: 1, socialBar: 1 });
  await expect.poll(() => page.evaluate(() => ({
    popunder: window.__freehubPopunderExecutions || 0,
    socialBar: window.__freehubSocialBarExecutions || 0,
  }))).toEqual({ popunder: 1, socialBar: 1 });

  await page.evaluate(() => {
    window.__freehubEmitAuth(null);
    window.__freehubEmitAuth(null);
  });
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(1);
  expect(requests).toEqual({ popunder: 1, socialBar: 1 });

  await page.evaluate(() => {
    document.querySelectorAll("script[data-freehub-guest-ad]").forEach((script) => script.remove());
    window.__freehubEmitAuth(null);
  });
  await expect(page.locator("script[data-freehub-guest-ad]")).toHaveCount(0);
  expect(requests).toEqual({ popunder: 1, socialBar: 1 });
});

test("signed-out visitors receive Adsterra on expired and outbound pages", async ({ page }) => {
  await mockFirebaseAuth(page, { authDelayMs: 750 });
  const requests = await stubAdsterra(page);
  const routes = [
    { route: "/competition/isuzu-win-a-new-x-rider-2026/", handoff: false },
    { route: "/out/one-life-winning-wednesday-cash-2026/", handoff: true },
    ...(opportunitiesEnabled
      ? [{ route: "/out/opportunity/coloplast-speedicath-short-sample/", handoff: true }]
      : []),
    ...(offersEnabled
      ? [{ route: "/coupon/capitec-snappi-extra-15-percent/", handoff: false }]
      : []),
  ];

  for (const [index, { route, handoff }] of routes.entries()) {
    await page.goto(route);
    if (handoff) {
      await expect(page.locator('html[data-freehub-handoff-state="waiting-for-ad-state"]')).toHaveCount(1);
    }
    await expect(page.locator('html[data-freehub-ad-state="guest"]')).toHaveCount(1);
    await expect.poll(() => requests).toEqual({ popunder: index + 1, socialBar: index + 1 });
    if (handoff) {
      await expect(page.locator('html[data-freehub-handoff-auth-resolution="resolved"]')).toHaveCount(1);
      await expect(page.locator('html[data-freehub-handoff-state="countdown"]')).toHaveCount(1);
    }
  }
});

test("signed-in members receive no external Adsterra scripts or executions", async ({ page }) => {
  await mockFirebaseAuth(page, { signedIn: true, authDelayMs: 750 });
  const requests = await stubAdsterra(page);
  await page.goto("/");

  await expect(page.locator('html[data-freehub-ad-state="member"]')).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(0);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(0);
  expect(requests).toEqual({ popunder: 0, socialBar: 0 });
  expect(await page.evaluate(() => ({
    popunder: window.__freehubPopunderExecutions || 0,
    socialBar: window.__freehubSocialBarExecutions || 0,
  }))).toEqual({ popunder: 0, socialBar: 0 });

  const memberRoutes = [
    { route: "/competition/isuzu-win-a-new-x-rider-2026/", handoff: false },
    { route: "/out/one-life-winning-wednesday-cash-2026/", handoff: true },
    ...(opportunitiesEnabled
      ? [{ route: "/out/opportunity/coloplast-speedicath-short-sample/", handoff: true }]
      : []),
    ...(offersEnabled
      ? [{ route: "/coupon/capitec-snappi-extra-15-percent/", handoff: false }]
      : []),
  ];
  for (const { route, handoff } of memberRoutes) {
    await page.goto(route);
    if (handoff) {
      await expect(page.locator('html[data-freehub-handoff-state="waiting-for-ad-state"]')).toHaveCount(1);
    }
    await expect(page.locator('html[data-freehub-ad-state="member"]')).toHaveCount(1);
    await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(0);
    await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(0);
    if (handoff) {
      await expect(page.locator('html[data-freehub-handoff-auth-resolution="resolved"]')).toHaveCount(1);
      await expect(page.locator('html[data-freehub-handoff-state="countdown"]')).toHaveCount(1);
    }
  }
  expect(requests).toEqual({ popunder: 0, socialBar: 0 });
});

test("a guest-to-member transition reloads into a clean ad-free document", async ({ page }) => {
  await mockFirebaseAuth(page);
  const requests = await stubAdsterra(page);
  await page.goto("/");
  await expect(page.locator('html[data-freehub-ad-state="guest"]')).toHaveCount(1);
  await expect.poll(() => requests).toEqual({ popunder: 1, socialBar: 1 });

  const navigation = page.waitForNavigation();
  await page.evaluate((member) => {
    window.FreeHubGuestAds.beginSignIn();
    window.__freehubEmitAuth(member);
    window.FreeHubGuestAds.completeSignIn();
  }, MOCK_MEMBER);
  await navigation;

  await expect(page.locator('html[data-freehub-ad-state="member"]')).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(0);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(0);
  expect(requests).toEqual({ popunder: 1, socialBar: 1 });
});

test("provider sign-in resumes the requested competition action after the clean reload", async ({ page }) => {
  await mockFirebaseAuth(page, {
    enabledAuthProviders: ["google"],
    providerSigninUser: MOCK_MEMBER,
  });
  const requests = await stubAdsterra(page);
  const competitionId = "one-life-winning-wednesday-cash-2026";
  await page.goto(`/competition/${competitionId}/`);
  await expect(page.locator('html[data-freehub-ad-state="guest"]')).toHaveCount(1);

  await page.locator('[data-auth-action="signin"]').first().click();
  await expect(page.getByText(/Club benefit:.*no Adsterra Popunder or Social Bar ads/)).toBeVisible();
  await page.getByLabel(/I have read and agree to the Privacy Policy/).check();
  const navigation = page.waitForNavigation();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await navigation;

  await expect(page.locator('html[data-freehub-ad-state="member"]')).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(0);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(0);
  await expect.poll(() => page.evaluate(({ id, uid }) => window.__freehubFirestoreWrites.some((write) =>
    write.path.join("/") === `users/${uid}/savedCompetitions/${id}`
  ), { id: competitionId, uid: MOCK_MEMBER.uid })).toBe(true);
  expect(requests).toEqual({ popunder: 1, socialBar: 1 });
});

test("evergreen prize pages are indexable, useful and linked from discovery areas", async ({ page }) => {
  const routes = [
    ["/win-a-car/", "Win a Car Competitions in South Africa"],
    ["/category/cash/", "Cash Competitions in South Africa"],
    ["/category/vouchers/", "Free Voucher Giveaways and Competitions in South Africa"],
    ["/category/holidays/", "Holiday Competitions in South Africa"],
    ["/category/tech/", "Tech Competitions in South Africa"],
    ["/category/groceries/", "Win Groceries in South Africa"],
    ["/category/experiences/", "Win Experiences in South Africa"],
  ];

  await page.goto("/");
  const prizeBrowser = page.getByRole("region", { name: "Browse competitions by prize" });
  const footerBrowser = page.getByRole("navigation", { name: "Explore competition hubs" });
  for (const [route] of routes) {
    await expect(prizeBrowser.locator(`a[href="${route}"]`)).toHaveCount(1);
    await expect(footerBrowser.locator(`a[href="${route}"]`)).toHaveCount(1);
  }

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expectCanonical(page, route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow, max-image-preview:large"
    );
    await expect(page.locator("#structured-data-collectionpage")).toHaveCount(1);
    const collectionSchema = JSON.parse(await page.locator("#structured-data-collectionpage").textContent());
    expect(collectionSchema.dateModified).toBeTruthy();
    await expect(page.locator("#structured-data-breadcrumb")).toHaveCount(1);
    await expect(page.locator("#structured-data-faq")).toHaveCount(1);

    const cardCount = await page.locator("#competitionsGrid article.competition-card").count();
    await expect(page.locator("#structured-data-itemlist")).toHaveCount(cardCount > 0 ? 1 : 0);
    if (cardCount === 0) {
      await expect(page.locator("#emptyState")).toBeVisible();
    }
  }

  await page.goto("/category/cash/");
  const categoryNavigation = page.getByRole("navigation", { name: "Competition categories" });
  await expect(categoryNavigation.locator('a[href="/win-a-car/"]')).toHaveCount(1);
  await expect(categoryNavigation.locator('a[href="/category/cars/"]')).toHaveCount(0);

  await page.goto("/category/cars/");
  await expectCanonical(page, "/win-a-car/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");

  await page.goto("/win-a-car/");
  await expect(page.locator('[data-competition-slug="volkswagen-easydrive-maintenance-plan-2026"]')).toHaveCount(0);

  await page.goto("/category/groceries/");
  await expect(page.getByRole("heading", { name: "When there are no live grocery prizes" })).toBeVisible();
  await page.goto("/category/experiences/");
  await expect(page.getByRole("heading", { name: "Use current listings only" })).toBeVisible();
});

test("skip link is keyboard reachable and targets main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("mobile navigation remains fully visible without a horizontal strip", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Competitions" })).toBeVisible();
  await navigation.getByRole("link", { name: "Free Stuff" }).scrollIntoViewIfNeeded();
  await expect(navigation.getByRole("link", { name: "Free Stuff" })).toBeVisible();
  const dimensions = await navigation.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  await expect(page.getByRole("link", { name: "Open Freehub Club account" })).toContainText("Account");
});

test("competition hub search filters prerendered listings and updates the result count", async ({ page }) => {
  await page.goto("/competitions/");
  const search = page.getByRole("searchbox", { name: "Search competitions" });
  await expect(search).toBeVisible();
  await expect(page.getByRole("group", { name: "Categories" }).getByRole("button")).not.toHaveCount(0);

  await search.fill("Knorr Soup");
  await expect(page.locator("#resultsSummary")).toHaveText("Showing 1 competition");
  await expect(page.locator("#competitionsGrid article.competition-card")).toHaveCount(1);
  await expect(page.locator("#competitionsGrid article.competition-card")).toContainText("Knorr Soup");

  await search.fill("not-a-real-competition");
  await expect(page.locator("#resultsSummary")).toHaveText("Showing 0 competitions");
  await expect(page.getByText("No competitions match", { exact: true })).toBeVisible();
});

test("competition detail shows entry facts before discovery and partner content", async ({ page }) => {
  await page.goto("/competition/spar-win-a-car/");
  await expect(page.getByRole("heading", { level: 2, name: "How to enter" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Quick answer" })).toBeVisible();

  const order = await page.evaluate(() => {
    const detail = document.querySelector("article.competition-detail");
    const categories = document.querySelector('nav[aria-label="Competition categories"]');
    return Boolean(
      detail &&
      categories &&
      (detail.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  });
  expect(order).toBe(true);
});

test("paid-entry competition video has one primary embed and an ad-free watch page", async ({ page }) => {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>YouTube embed stub</title>" })
  );

  await page.goto("/competition/sa-guide-dogs-suzuki-across-car-raffle-2026/");
  const competitionVideo = page.locator(".competition-video");
  await expect(competitionVideo).toBeVisible();
  await expect(competitionVideo.locator("iframe")).toHaveCount(1);
  await expect(competitionVideo.locator("iframe")).toHaveAttribute("src", /0WipIiXfMtM/);
  await expect(competitionVideo.getByRole("link", { name: "Open the dedicated video page" })).toHaveAttribute(
    "href",
    "/videos/sa-guide-dogs-suzuki-across-raffle-video/"
  );
  await expect(page.locator(`script[src="${GUEST_ADS_LOADER_SRC}"]`)).toHaveCount(0);

  await page.goto("/videos/sa-guide-dogs-suzuki-across-raffle-video/");
  await expect(page).toHaveTitle("Could a R150 Ticket Win You a Suzuki Across and Safari? | Freehub Video");
  await expectCanonical(page, "/videos/sa-guide-dogs-suzuki-across-raffle-video/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /max-video-preview:-1/);
  await expect(page.locator(".video-watch-hero__player iframe")).toHaveCount(1);
  await expect(page.locator(".video-watch-hero__player iframe")).toHaveAttribute("src", /0WipIiXfMtM/);
  await expect(page.locator(`iframe[src*="GtieTMjWGN0"]`)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch the alternative cut on YouTube" })).toHaveAttribute(
    "href",
    "https://youtube.com/shorts/GtieTMjWGN0"
  );
  await expect(page.locator(`script[src="${GUEST_ADS_LOADER_SRC}"]`)).toHaveCount(0);

  const videoObject = await page.locator("#structured-data-video").evaluate((script) =>
    JSON.parse(script.textContent || "{}")
  );
  expect(videoObject["@type"]).toBe("VideoObject");
  expect(videoObject.embedUrl).toBe("https://www.youtube.com/embed/0WipIiXfMtM");
  expect(videoObject.duration).toBe("PT27S");
  expect(videoObject.uploadDate).toBe("2026-08-27T09:04:45-07:00");
});

test("Free Stuff parent preserves intent and separates durable resources from opportunities", async ({ page }) => {
  await page.goto("/free-stuff-south-africa/");
  await expect(page).toHaveTitle("Where to Find Free Stuff in South Africa | Legit Freebies");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where to Find Free Stuff in South Africa");
  await expectCanonical(page, "/free-stuff-south-africa/");
  await expect(page.locator('body[data-free-stuff-parent-version="3"]')).toHaveCount(1);

  const childNavigation = page.getByRole("navigation", { name: "Free Stuff categories" });
  await expect(childNavigation.getByRole("link")).toHaveCount(5);
  await expect(childNavigation.getByRole("link", { name: "Free Samples" })).toHaveAttribute("href", "/free-samples-south-africa/");
  await expect(childNavigation.getByRole("link", { name: "Free Courses" })).toHaveAttribute("href", "/free-online-courses-south-africa/");
  await expect(childNavigation.getByRole("link", { name: "Children's Books" })).toHaveAttribute("href", "/free-childrens-books-south-africa/");
  await expect(childNavigation.getByRole("link", { name: "Credit Reports" })).toHaveAttribute("href", "/free-credit-report-south-africa/");

  await expect(page.locator("article.free-resource-card")).toHaveCount(25);
  await expect(page.locator("article.opportunity-card")).toHaveCount(opportunitiesEnabled ? 2 : 0);
  await expect(page.locator("section.opportunity-section")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  await expect(page.locator("#structured-data-opportunities")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  if (opportunitiesEnabled) {
    const card = page.locator('[data-opportunity-id="coloplast-speedicath-short-sample"]');
    await expect(card).toHaveAttribute("data-card-variant", "compact");
    await expect(card).toContainText("Medical product sample request");
    await expect(card).toContainText("Freehub does not receive or assess your application");
    await expect(card.getByRole("link", { name: "View verified sample details" })).toHaveAttribute(
      "href",
      "/opportunity/coloplast-speedicath-short-sample/"
    );
  }
  await expect(page.getByRole("region", { name: "Competition discovery" })).toContainText("separate inventory");
});

test("Free Stuff discovery analytics separates pillar and official-source events", async ({ page }) => {
  await page.goto("/free-stuff-south-africa/");
  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });

  const pillar = page.getByRole("navigation", { name: "Free Stuff categories" }).getByRole("link", { name: "Free Samples" });
  await pillar.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await pillar.click();
  let events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([
    ["event", "discovery_card_click", {
      entity_kind: "resource_category",
      content_type: "free_samples",
      page_type: "free_stuff_parent",
      destination_path: "/free-samples-south-africa/",
    }],
  ]);

  await page.evaluate(() => { window.__freehubTestEvents = []; });
  const officialSource = page.locator("a.free-resource-card__link").first();
  await officialSource.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await officialSource.click();
  events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toHaveLength(1);
  expect(events[0][0]).toBe("event");
  expect(events[0][1]).toBe("official_source_click");
  expect(events[0][2]).toMatchObject({
    entity_kind: "resource",
    page_type: "free_stuff_parent",
  });
  expect(events[0][2].content_id).toBeTruthy();
  expect(events[0][2].source_domain).toBeTruthy();
  expect(events[0][2].destination_path).toMatch(/^\//);

  if (opportunitiesEnabled) {
    await page.evaluate(() => { window.__freehubTestEvents = []; });
    const opportunity = page.locator('[data-opportunity-id="coloplast-speedicath-short-sample"] a.opportunity-card__link');
    await opportunity.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await opportunity.click();
    events = await page.evaluate(() => window.__freehubTestEvents);
    expect(events).toEqual([["event", "discovery_card_click", {
      entity_kind: "opportunity",
      content_type: "free_sample",
      page_type: "free_stuff_parent",
      content_id: "coloplast-speedicath-short-sample",
      destination_path: "/opportunity/coloplast-speedicath-short-sample/",
    }]]);
  }
});

test("Free Samples v4 preserves its canonical and separates official sites from current offers", async ({ page }) => {
  await page.goto("/free-samples-south-africa/");
  await expect(page).toHaveTitle("Where to Get Free Samples in South Africa | Official Sites");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where to Get Free Samples in South Africa");
  await expect(page.locator(".hero__text")).toContainText("where to get free samples in South Africa");
  await expectCanonical(page, "/free-samples-south-africa/");
  await expect(page.locator('body[data-free-samples-page-version="4"]')).toHaveCount(1);
  await expect(
    page.getByRole("region", {
      name: opportunitiesEnabled
        ? "7 reviewed routes plus 21 current opportunities"
        : "7 reviewed sample routes, clearly separated",
    })
  ).toBeVisible();
  await expect(page.locator("article.free-resource-card")).toHaveCount(7);
  await expect(page.locator('[data-content-type="product_testing_panel"]')).toHaveCount(4);
  await expect(page.locator('[data-content-type="brand_sample_programme"]')).toHaveCount(2);
  await expect(page.locator('[data-content-type="editorial_guide"]')).toHaveCount(1);
  await expect(page.locator("#brand-sample-programmes")).toContainText("Official brand sample programmes");
  await expect(page.getByRole("region", { name: "Product-testing panels" })).toContainText("does not guarantee");
  await expect(page.locator("section.detail-faq details")).toHaveCount(6);
  await expect(page.locator("article.opportunity-card")).toHaveCount(opportunitiesEnabled ? 21 : 0);
  await expect(page.locator("#structured-data-opportunities")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  await expect(page.locator("#structured-data-product-testing")).toHaveCount(opportunitiesEnabled ? 1 : 0);

  if (opportunitiesEnabled) {
    await expect(page.getByText("7 current sample requests", { exact: true })).toBeVisible();
    await expect(page.getByText("14 current product tests", { exact: true })).toBeVisible();
    await expect(page.getByText("7 reviewed sites and programmes", { exact: true })).toBeVisible();
    await expect(page.locator("#current-samples article.opportunity-card")).toHaveCount(7);
    const card = page.locator('[data-opportunity-id="coloplast-speedicath-short-sample"]');
    await expect(card).toHaveAttribute("data-card-variant", "full");
    await expect(card).toContainText("Application only");
    await expect(card).toContainText("No delivery charge");
    await expect(card).toContainText("Coloplast South Africa, not Freehub, assesses product suitability");
    await expect(card).toContainText("Freehub does not receive or assess your application");
    await expect(card.getByRole("link", { name: "Coloplast South Africa consent and privacy information" })).toHaveAttribute(
      "href",
      "https://www.coloplast.co.za/global/declaration-of-consent/"
    );
    await expect(card.getByRole("link", { name: "View verified sample details" })).toHaveAttribute(
      "href",
      "/opportunity/coloplast-speedicath-short-sample/"
    );
    const tena = page.locator('[data-opportunity-id="tena-women-free-sample-pack"]');
    await expect(tena).toContainText("Direct request under the provider's stated limits");
    await expect(tena).toContainText("One sample pack per person, family or address every six months");
    await expect(tena.getByRole("link", { name: "View verified sample details" })).toHaveAttribute(
      "href",
      "/opportunity/tena-women-free-sample-pack/"
    );
    const blindDesigns = page.locator('[data-opportunity-id="blind-designs-free-fabric-samples"]');
    await expect(blindDesigns).toContainText("up to five");
    await expect(blindDesigns).toContainText("No delivery charge");
    await expect(blindDesigns).not.toContainText(/medical|health-related|suitability/i);
    const testingCards = page.locator('[data-content-type="product_testing"]');
    await expect(testingCards).toHaveCount(14);
    const sunlight = page.locator('[data-opportunity-id="brand-advisor-sunlight-dishwashing-testing"]');
    await expect(sunlight).toContainText("two TikTok videos");
    await expect(sunlight).toContainText("does not guarantee selection");
  } else {
    await expect(page.getByText("0 current sample requests", { exact: true })).toHaveCount(0);
    await expect(page.getByText("0 current product tests", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Reviewed Sample & Testing Sites" })).toHaveAttribute("href", "#sample-options");
    await expect(page.getByRole("link", { name: "Testing & Sample Sites" })).toHaveCount(0);
  }

  const detail = await page.request.get("/opportunity/coloplast-speedicath-short-sample/");
  expect(detail.status()).toBe(opportunitiesEnabled ? 200 : 404);
  const testingDetail = await page.request.get("/opportunity/brand-advisor-sunlight-dishwashing-testing/");
  expect(testingDetail.status()).toBe(opportunitiesEnabled ? 200 : 404);
  const blindDetail = await page.request.get("/opportunity/blind-designs-free-fabric-samples/");
  expect(blindDetail.status()).toBe(opportunitiesEnabled ? 200 : 404);
});

test("voucher hub separates direct rewards, strict voucher prizes and creator exchanges", async ({ page }) => {
  await page.goto("/category/vouchers/");
  await expect(page).toHaveTitle("Free Voucher Giveaways South Africa | Offers & Competitions");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Free Voucher Giveaways and Competitions in South Africa"
  );
  await expectCanonical(page, "/category/vouchers/");
  await expect(page.locator('body[data-voucher-hub-version="2"]')).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Free vouchers in South Africa: what is available now?" })).toBeVisible();
  await expect(page.locator("#free-entry-vouchers")).toContainText("No verified unrestricted free-entry voucher");
  await expect(page.locator('.hero-preview-panel a[href="/competition/clicks-babyclub-competition/"]')).toHaveCount(0);

  const voucherResources = page.locator("#current-voucher-offers article.free-resource-card");
  await expect(voucherResources).toHaveCount(usesReviewedPilotDate ? 4 : 3);
  await expect(voucherResources.filter({ hasText: "Absa Advantage meal vouchers" })).toContainText("Account-linked meal vouchers");
  await expect(voucherResources.filter({ hasText: "Spur R50 birthday voucher" })).toContainText("not a no-purchase freebie");
  const voucherResourceSchema = await page.locator("#structured-data-voucher-resources").evaluate((script) => JSON.parse(script.textContent || "{}"));
  expect(voucherResourceSchema.itemListElement).toHaveLength(usesReviewedPilotDate ? 4 : 3);

  const freeEntryPicks = page.locator("#free-entry-vouchers .voucher-free-pick");
  await expect(freeEntryPicks).toHaveCount(0);
  await expect(page.locator("#free-entry-vouchers .voucher-free-picks__empty")).toBeVisible();
  await expect(page.locator('#free-entry-vouchers a[href="/competition/clicks-babyclub-competition/"]')).toHaveCount(0);
  await expect(page.locator('#free-entry-vouchers a[href="/competition/clicks-clubcard-have-your-say-june-july-2026/"]')).toHaveCount(0);
  const accountLinkedPicks = page.locator("#account-linked-vouchers .voucher-free-pick");
  await expect(accountLinkedPicks).toHaveCount(1);
  await expect(accountLinkedPicks.first()).toContainText("Account required");
  expect(await accountLinkedPicks.evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual([
    "/competition/capitec-tactical-flexi-voucher-2026/",
  ]);
  await expect(page.locator('a[href="/competition/clicks-clubcard-fragrance-giveaway-june-july-2026/"]')).toHaveCount(0);
  await expect(page.locator("#creator-voucher-exchanges article.opportunity-card")).toHaveCount(opportunitiesEnabled ? 2 : 0);
  await expect(page.locator("#structured-data-voucher-opportunities")).toHaveCount(opportunitiesEnabled ? 1 : 0);
  const voucherListings = page.locator("#competitionsGrid article.competition-card");
  await expect(voucherListings).toHaveCount(9);
  await expect(voucherListings.first()).toBeVisible();
});

test("voucher reward links emit source-safe discovery analytics", async ({ page }) => {
  await page.goto("/category/vouchers/");
  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });
  const source = page.locator('[data-content-id="absa-advantage-meal-vouchers"]');
  await source.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await source.click();
  const events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([["event", "official_source_click", expect.objectContaining({
    entity_kind: "resource",
    content_id: "absa-advantage-meal-vouchers",
    page_type: "voucher_hub",
    source_domain: "absa.co.za",
    destination_path: "/personal/bank/absa-advantage/",
  })]]);
});

test("Samples analytics identify the vertical and use parameter-free destinations", async ({ page }) => {
  await page.goto("/free-samples-south-africa/");
  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });
  const resource = page.locator("a.free-resource-card__link").first();
  await resource.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await resource.click();
  let events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toHaveLength(1);
  expect(events[0][1]).toBe("official_source_click");
  expect(events[0][2]).toMatchObject({ entity_kind: "resource", page_type: "free_samples_vertical" });
  expect(events[0][2].destination_path).toMatch(/^\//);
  expect(events[0][2].destination_path).not.toContain("?");

  if (opportunitiesEnabled) {
    await page.evaluate(() => { window.__freehubTestEvents = []; });
    const source = page.locator('[data-opportunity-id="coloplast-speedicath-short-sample"] a.opportunity-card__link');
    await source.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await source.click();
    events = await page.evaluate(() => window.__freehubTestEvents);
    expect(events).toEqual([["event", "discovery_card_click", {
      entity_kind: "opportunity",
      content_type: "free_sample",
      page_type: "free_samples_vertical",
      content_id: "coloplast-speedicath-short-sample",
      destination_path: "/opportunity/coloplast-speedicath-short-sample/",
    }]]);
  }
});

test("Opportunity detail and measured exit flow remain flag-controlled", async ({ browser, page }) => {
  const detailPath = "/opportunity/coloplast-speedicath-short-sample/";
  const exitPath = "/out/opportunity/coloplast-speedicath-short-sample/";
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap.includes(`<loc>https://freehub.co.za${detailPath}</loc>`)).toBe(opportunitiesEnabled);
  expect(sitemap).not.toContain(`<loc>https://freehub.co.za${exitPath}</loc>`);
  if (!opportunitiesEnabled) {
    expect((await page.request.get(detailPath)).status()).toBe(404);
    expect((await page.request.get(exitPath)).status()).toBe(404);
    return;
  }

  await page.goto(detailPath);
  await expectCanonical(page, detailPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coloplast SpeediCath Short free sample");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow, max-image-preview:large");
  await expect(page.locator(`script[src="${GUEST_ADS_LOADER_SRC}"]`)).toHaveCount(0);
  await expect(page.locator(`script[src="${OUTBOUND_HANDOFF_SRC}"]`)).toHaveCount(0);
  await expect(page.locator('script[src*="effectivecpmnetwork.com"]')).toHaveCount(0);
  await expect(page.getByText("Your information goes directly to Coloplast")).toBeVisible();
  await expect(page.getByText(/Freehub does not receive, store or assess your application/)).toBeVisible();
  const cta = page.getByRole("link", { name: "Continue to the official sample request" });
  await expect(cta).toHaveAttribute("href", exitPath);
  const schemaTypes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent)["@type"])
  );
  expect(schemaTypes).toEqual(expect.arrayContaining(["WebPage", "BreadcrumbList", "Thing"]));
  expect(schemaTypes).not.toEqual(expect.arrayContaining(["Product", "Offer", "MedicalEntity"]));
  expect((await readDataLayerEvents(page)).some((event) => event[1] === "opportunity_detail_view")).toBe(true);

  await page.evaluate(() => {
    window.__freehubTestEvents = [];
    window.gtag = (...args) => window.__freehubTestEvents.push(args);
  });
  await cta.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await cta.click();
  let events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([["event", "opportunity_exit_click", expect.objectContaining({
    content_id: "coloplast-speedicath-short-sample",
    page_type: "opportunity_detail",
    destination_path: exitPath,
  })]]);

  await page.evaluate(() => { window.__freehubTestEvents = []; });
  const terms = page.getByRole("link", { name: "Read the official sample terms" });
  await terms.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault(), { once: true }));
  await terms.click();
  events = await page.evaluate(() => window.__freehubTestEvents);
  expect(events).toEqual([["event", "official_source_click", expect.objectContaining({
    content_id: "coloplast-speedicath-short-sample",
    page_type: "opportunity_detail",
    link_role: "terms",
  })]]);

  await page.route("https://products.coloplast.co.za/**", (route) => route.abort());
  await page.goto(exitPath);
  await expectCanonical(page, exitPath);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator(`script[src="${GUEST_ADS_LOADER_SRC}"]`)).toHaveCount(1);
  await expect(page.locator(`script[src="${OUTBOUND_HANDOFF_SRC}"]`)).toHaveCount(1);
  await expect(page.locator('script[src*="effectivecpmnetwork.com"]')).toHaveCount(0);
  await expect(page.locator('html[data-freehub-handoff-auth-resolution="resolved"]')).toHaveCount(1);
  await expect(page.locator('html[data-freehub-handoff-state="countdown"]')).toHaveCount(1);
  await expect(page.getByText(/Freehub does not receive, store or assess it/)).toBeVisible();
  expect((await readDataLayerEvents(page)).some((event) => event[1] === "opportunity_exit_view")).toBe(true);
  const manualEvents = [];
  await page.exposeFunction("__captureOpportunityManualEvent", (...args) => manualEvents.push(args));
  await page.evaluate(() => {
    window.gtag = (...args) => window.__captureOpportunityManualEvent(...args);
  });
  await page.getByRole("link", { name: "Continue now" }).evaluate((link) => link.click());
  await page.waitForTimeout(2200);
  expect(manualEvents.filter((event) => event[1] === "official_source_click")).toHaveLength(1);
  expect(manualEvents.filter((event) => event[1] === "opportunity_exit_handoff")).toEqual([
    ["event", "opportunity_exit_handoff", expect.objectContaining({ handoff_method: "manual" })],
  ]);

  const automaticContext = await browser.newContext();
  const automaticPage = await automaticContext.newPage();
  const automaticEvents = [];
  await automaticPage.exposeFunction("__captureOpportunityAutomaticEvent", (...args) => automaticEvents.push(args));
  await automaticPage.addInitScript(() => {
    Object.defineProperty(window, "gtag", {
      configurable: false,
      writable: false,
      value: (...args) => window.__captureOpportunityAutomaticEvent(...args),
    });
  });
  await automaticPage.route("**/firebase-config.json", (route) => route.fulfill({ status: 404, body: "Not configured" }));
  await automaticPage.route("https://products.coloplast.co.za/**", (route) => route.abort());
  await automaticPage.goto(exitPath);
  await automaticPage.waitForTimeout(2200);
  expect(automaticEvents.filter((event) => event[1] === "opportunity_exit_handoff")).toEqual([
    ["event", "opportunity_exit_handoff", expect.objectContaining({ handoff_method: "automatic" })],
  ]);
  expect(automaticEvents.some((event) => event[1] === "official_source_click")).toBe(false);
  await automaticContext.close();
});

test("Product-testing detail pages state selection and creator obligations", async ({ page }) => {
  const detailPath = "/opportunity/brand-advisor-sunlight-dishwashing-testing/";
  const exitPath = "/out/opportunity/brand-advisor-sunlight-dishwashing-testing/";
  if (!opportunitiesEnabled) {
    expect((await page.request.get(detailPath)).status()).toBe(404);
    expect((await page.request.get(exitPath)).status()).toBe(404);
    return;
  }

  await page.goto(detailPath);
  await expectCanonical(page, detailPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sunlight Dishwashing Liquid product-testing application"
  );
  await expect(page.getByText("This is a creator product-testing application, not a guaranteed free sample.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What Brand Advisor requires" })).toBeVisible();
  await expect(page.getByText("Two TikTok videos required if selected")).toBeVisible();
  await expect(page.getByText("Your application goes directly to Brand Advisor")).toBeVisible();
  await expect(page.getByText(/health-related information|medical suitability/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Continue to the official product-testing application" })).toHaveAttribute(
    "href",
    exitPath
  );
});

test("Opportunity tombstones keep historical context without application paths", async ({ page }) => {
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const renderer = createOpportunityRouteRenderer({
    escapeHtml,
    escapeAttribute: escapeHtml,
    formatDate: (value) => value,
    canonicalOrigin: "https://freehub.co.za",
    getDetailPath: () => "/opportunity/coloplast-speedicath-short-sample/",
    getExitPath: () => "/out/opportunity/coloplast-speedicath-short-sample/",
  });

  for (const [state, visibleHeading] of [
    ["verification_due", "This opportunity is being re-verified"],
    ["expired", "This opportunity has ended"],
    ["withdrawn", "This opportunity has been withdrawn"],
  ]) {
    await page.setContent(`<main>${renderer.renderDetailContent(opportunityFixture, state)}</main>`);
    await expect(page.getByText(visibleHeading)).toBeVisible();
    await expect(page.getByText("No campaign or application link is available from this page.")).toBeVisible();
    await expect(page.locator('[data-opportunity-action="exit"]')).toHaveCount(0);
    await expect(page.locator('a[href^="/out/opportunity/"]')).toHaveCount(0);
    await expect(page.locator(`a[href="${opportunityFixture.sourceUrl}"]`)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Free Samples South Africa" })).toHaveAttribute("href", "/free-samples-south-africa/");
  }
});

test("competition collection cards are present in the static HTML", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  let response = await page.goto("/competitions/", { waitUntil: "domcontentloaded" });
  expect(response.status()).toBe(200);
  expect(await page.locator("article.competition-card").count()).toBeGreaterThan(0);
  await expectCanonical(page, "/competitions/");

  for (const [route, editorialHeading] of [
    ["/category/groceries/", "How to compare grocery prizes and vouchers"],
    ["/category/experiences/", "How to compare experience competitions"],
  ]) {
    response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response.status()).toBe(200);
    await expectCanonical(page, route);
    await expect(page.getByRole("heading", { name: editorialHeading })).toBeVisible();
    await expect(page.locator("#structured-data-faq")).toHaveCount(1);
    const cardCount = await page.locator("article.competition-card").count();
    await expect(page.locator("#structured-data-itemlist")).toHaveCount(cardCount > 0 ? 1 : 0);
    if (cardCount === 0) {
      await expect(page.locator("#emptyState")).toBeVisible();
    }
  }
  await context.close();
});

test("portrait competition artwork fills its media stage without being cropped", async ({ page }) => {
  const portraitCompetitionRoutes = [
    "/competition/evetech-pulse-giveaway-2026/",
    "/competition/takealot-back-to-school-voucher-2026/",
  ];

  for (const route of portraitCompetitionRoutes) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);

    const heroMedia = page.locator(".competition-hero-card__media.competition-media--portrait");
    const detailMedia = page.locator(".competition-detail__media.competition-media--portrait");
    await expect(heroMedia.locator(":scope > .competition-image-backdrop")).toHaveCount(1);
    await expect(heroMedia.locator(":scope > .competition-image-foreground")).toHaveCount(1);
    await expect(detailMedia.locator(":scope > .competition-image-backdrop")).toHaveCount(1);
    await expect(detailMedia.locator(":scope > .competition-image-foreground")).toHaveCount(1);

    const desktopHeroBox = await heroMedia.boundingBox();
    const desktopDetailBox = await detailMedia.boundingBox();
    expect(desktopHeroBox.height).toBeGreaterThanOrEqual(285);
    expect(desktopDetailBox.height).toBeGreaterThanOrEqual(375);
    await expect(heroMedia.locator(":scope > .competition-image-foreground")).toHaveCSS("object-fit", "contain");

    await page.setViewportSize({ width: 390, height: 844 });
    const mobileHeroBox = await heroMedia.boundingBox();
    const mobileDetailBox = await detailMedia.boundingBox();
    expect(mobileHeroBox.height / mobileHeroBox.width).toBeGreaterThan(1.2);
    expect(mobileDetailBox.height / mobileDetailBox.width).toBeGreaterThan(1.2);
  }
});

test("landscape competition artwork receives a full 16:9 media stage", async ({ page }) => {
  const route = "/competition/discovery-four-principles-book-launch-2026/";
  const response = await page.request.get(route);
  const html = await response.text();
  expect(html).toContain("competition-media--landscape");
  expect(html).toContain("assets/competitions/discovery-four-principles-book-launch-2026.png");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  const heroMedia = page.locator(".competition-hero-card__media.competition-media--landscape");
  const detailMedia = page.locator(".competition-detail__media.competition-media--landscape");
  const desktopHeroBox = await heroMedia.boundingBox();
  const desktopDetailBox = await detailMedia.boundingBox();
  expect(desktopHeroBox.height).toBeGreaterThanOrEqual(225);
  expect(desktopDetailBox.height).toBeGreaterThanOrEqual(295);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileHeroBox = await heroMedia.boundingBox();
  const mobileDetailBox = await detailMedia.boundingBox();
  expect(mobileHeroBox.height / mobileHeroBox.width).toBeGreaterThan(0.55);
  expect(mobileDetailBox.height / mobileDetailBox.width).toBeGreaterThan(0.55);
});

test("active detail, outbound handoff, and expired detail retain lifecycle behavior", async ({ browser, page }) => {
  await page.goto("/competition/one-life-winning-wednesday-cash-2026/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("1Life Winning Wednesday");
  await expectCanonical(page, "/competition/one-life-winning-wednesday-cash-2026/");
  await expect(page.locator('a[href="/out/one-life-winning-wednesday-cash-2026/"]')).not.toHaveCount(0);

  await page.goto("/competition/isuzu-win-a-new-x-rider-2026/");
  await expect(page.getByText("This competition has closed.", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");

  const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
  const outPage = await noJavaScript.newPage();
  const response = await outPage.goto("/out/one-life-winning-wednesday-cash-2026/");
  expect(response.status()).toBe(200);
  await expect(outPage.getByRole("heading", { level: 1 })).toHaveText("You are leaving Freehub");
  await expect(outPage.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(outPage.locator(`script[src="${GUEST_ADS_LOADER_SRC}"]`)).toHaveCount(1);
  await expect(outPage.locator('script[src*="effectivecpmnetwork.com"]')).toHaveCount(0);
  await expect(outPage.locator(".ad-slot")).toHaveCount(0);
  await noJavaScript.close();
});

test("privacy policy discloses advertising cookies", async ({ page }) => {
  await page.goto("/privacy-policy/");
  await expect(page.getByRole("heading", { level: 2, name: "Cookies and analytics" })).toBeVisible();
  await expect(page.getByText(/Adsterra Popunder and Social Bar advertising/)).toBeVisible();
  await expect(page.getByText(/only after Firebase confirms that a visitor is signed out/)).toBeVisible();
  await expect(page.getByText(/Signed-in Freehub Club members are not served these Adsterra scripts/)).toBeVisible();
  await expect(page.getByText(/Consent choices and applicable controls/)).toBeVisible();
});

test("offers portal separates coupons and deals with honest indexability", async ({ page }) => {
  test.skip(!offersEnabled, "Offers are feature flagged in this build.");

  await page.goto("/offers/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coupons and Deals in South Africa");
  await expectCanonical(page, "/offers/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow, max-image-preview:large");
  await expect(page.locator("article.offer-card")).toHaveCount(3);
  const structuredData = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(structuredData).not.toContain('"@type":"Offer"');

  await page.goto("/coupons/");
  await expect(page.locator("article.offer-card")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");

  await page.goto("/deals/");
  await expect(page.locator("article.offer-card")).toHaveCount(3);
  await expect(page.getByText("No code needed", { exact: true }).first()).toBeVisible();

  await page.goto("/offers/category/pets/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");

  await page.goto("/offers/category/baby-kids/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow, max-image-preview:large");

  const outboundHtml = await (await page.request.get("/out/deal/mr-price-girls-7-14-denim-shorts-r50-off/")).text();
  expect(outboundHtml).toContain('content="noindex, nofollow"');
  expect(outboundHtml).toContain(`src="${GUEST_ADS_LOADER_SRC}"`);
  expect(outboundHtml).toContain(`src="${OUTBOUND_HANDOFF_SRC}"`);
  expect(outboundHtml).not.toContain("effectivecpmnetwork.com");
});

test("offer contributions stay private and require an explicit email send", async ({ page }) => {
  test.skip(!offersEnabled, "Offers are feature flagged in this build.");

  await page.goto("/deal/mr-price-girls-7-14-denim-shorts-r50-off/");
  const workedButton = page.getByRole("button", { name: "Yes, it worked" });
  const changedButton = page.getByRole("button", { name: "No, something changed" });
  await workedButton.click();
  await expect(workedButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Thanks — your feedback is saved on this device.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Yes, it worked" })).toHaveAttribute("aria-pressed", "true");
  await changedButton.click();
  await expect(page.locator("[data-offer-report]")).toHaveAttribute("open", "");
  await page.getByLabel("What changed?").selectOption("code-rejected");
  await page.getByLabel("What did you notice? (optional)").fill("The checkout rejected the code.");
  await page.getByRole("button", { name: "Prepare Email Report" }).click();
  const reportActions = page.locator("[data-offer-report] [data-email-actions]");
  await expect(reportActions).toBeVisible();
  await expect(reportActions.getByRole("link", { name: "Open Email Draft" })).toHaveAttribute("href", /^mailto:hello@freehub\.co\.za\?/);
  await expect(page).toHaveURL(/\/deal\/mr-price-girls-7-14-denim-shorts-r50-off\/$/);

  await page.goto("/submit-an-offer/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Submit a Coupon or Deal");
  await expectCanonical(page, "/submit-an-offer/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow, max-image-preview:large");
  await page.getByLabel("Your relationship to the offer").selectOption("customer");
  await page.getByLabel("Offer type").selectOption("coupon");
  await page.getByLabel("Brand or programme").fill("Example Brand");
  await page.getByLabel("Offer title").fill("Example official-source offer");
  await page.getByLabel("Coupon code (if there is one)").fill("EXAMPLE10");
  await page.getByLabel("Category").selectOption("groceries");
  await page.getByLabel("Official offer URL").fill("https://example.com/official-offer");
  await page.getByLabel("How the saving works").fill("A development-only form test. This is not a public offer.");
  await page.getByLabel(/I am sharing public offer information/).check();
  await page.getByRole("button", { name: "Prepare Offer Email" }).click();
  const submissionActions = page.locator(".submission-panel--offer [data-email-actions]");
  await expect(submissionActions).toBeVisible();
  await expect(submissionActions.getByRole("link", { name: "Open Email Draft" })).toHaveAttribute("href", /^mailto:hello@freehub\.co\.za\?/);
  await expect(page.getByText("Your offer email is ready. Review it before choosing Send in your email app.")).toBeVisible();
  await expect(page).toHaveURL(/\/submit-an-offer\/$/);
});

test("unknown routes serve the generated 404 response", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-freehub-route/");
  expect(response.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
});

test("Club public and private pages remain usable without Firebase credentials", async ({ page }) => {
  await page.goto("/club/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Save and track South African competitions");
  await expectCanonical(page, "/club/");
  await expect(page.getByRole("heading", { name: "No Adsterra ads while signed in" })).toBeVisible();

  await page.goto("/freehub-account-benefits/");
  await expect(page).toHaveURL(/\/club\/$/);
  await expectCanonical(page, "/club/");

  await page.goto("/club/dashboard/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.getByText(/Freehub Club sign-in is unavailable right now/)).toBeVisible();
  await expect(page.getByText(/local saves on this device/)).toBeVisible();

  await page.goto("/admin/referrals/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");

  await page.goto("/competitions/");
  await expect(page.locator("article.competition-card").first()).toBeVisible();
});

test("About page explains Freehub, suppresses guest ads and tracks its primary journeys", async ({ page }) => {
  const requests = await stubAdsterra(page);
  await mockFirebaseAuth(page, { signedIn: false });
  await page.goto("/about/");

  await expect(page).toHaveTitle("What Is FreeHub? South African Competitions & Free Club");
  await expectCanonical(page, "/about/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A simpler, safer way to find South African competitions");
  await expect(page.getByRole("heading", { name: "From discovery to entry in four clear steps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Freehub helps you find competitions — we do not run them" })).toBeVisible();
  await expect(page.locator('#structured-data-aboutpage')).toHaveCount(1);
  await expect(page.locator('#structured-data-breadcrumb')).toHaveCount(1);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.popunder}"]`)).toHaveCount(0);
  await expect(page.locator(`script[src="${ADSTERRA_SCRIPTS.socialBar}"]`)).toHaveCount(0);
  expect(requests).toEqual({ popunder: 0, socialBar: 0 });

  const trackedLinks = [
    ["about_browse_competitions_click", "hero"],
    ["about_join_club_click", "hero"],
    ["about_whatsapp_click", "hero"],
    ["about_safety_guide_click", "safety"],
    ["about_submit_competition_click", "promoters"],
  ];

  for (const [eventName, placement] of trackedLinks) {
    const link = page.locator(`a[data-about-event="${eventName}"][data-about-placement="${placement}"]`).first();
    await link.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault(), { once: true }));
    await link.click();
  }

  const events = await readDataLayerEvents(page);
  for (const [eventName] of trackedLinks) {
    expect(events.some((entry) => entry[1] === eventName)).toBe(true);
  }
});
