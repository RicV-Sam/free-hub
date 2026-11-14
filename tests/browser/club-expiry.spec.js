const { test, expect } = require("@playwright/test");

const exact = {
  competitionId: "exact-deadline-fixture",
  title: "Exact deadline fixture",
  closingDate: "2026-11-01",
  closingAt: "2026-11-01T11:00:00Z",
  path: "/competition/exact-deadline-fixture/",
};
const dateOnly = {
  competitionId: "date-only-fixture",
  title: "Date-only fixture",
  closingDate: "2026-11-01",
  path: "/competition/date-only-fixture/",
};
const editorial = {
  competitionId: "editorial-cutoff-fixture",
  title: "Earlier editorial cutoff fixture",
  closingDate: "2026-11-03",
  editorialActiveUntil: "2026-10-31",
};
const saved = [{ ...exact, status: "entered", savedAt: "2026-10-31T10:00:00Z" }];

async function loadFixture(page, signedIn) {
  await page.clock.install({ time: new Date("2026-11-01T10:58:00Z") });
  await page.clock.pauseAt(new Date("2026-11-01T10:59:59Z"));
  await page.addInitScript(({ signedIn, saved }) => {
    window.__clubWrites = [];
    if (!signedIn) localStorage.setItem("freehubClubSavedCompetitions", JSON.stringify(saved));
  }, { signedIn, saved });
  await page.route("**/shared/firebase-client.js*", route => route.fulfill({
    contentType: "text/javascript",
    body: signedIn ? `
      const user = { uid: "expiry-test-user", email: "member@example.test" };
      const profile = { ...user, acceptedPrivacyPolicy: true };
      const reads = {
        ensureClubProfile: async () => profile,
        getSavedCompetitions: async () => ${JSON.stringify(saved)},
        getIgnoredCompetitions: async () => [],
        getUserProfile: async () => profile,
        getAlertPreferences: async () => ({})
      };
      export async function getFirebaseClient() {
        return {
          onAuthStateChanged(callback) { queueMicrotask(() => callback(user)); },
          helpers: new Proxy(reads, { get(target, name) {
            return target[name] || (() => { window.__clubWrites.push(name); throw Error("Unexpected account write"); });
          } })
        };
      }` : "export async function getFirebaseClient() { return null; }",
  }));
  await page.route("**/club-expiry-fixture/", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><head><meta charset="utf-8">
      <script src="/shared/page-data.js"></script>
      <script>window.FREEHUB_CLUB_COMPETITIONS = ${JSON.stringify([exact, dateOnly, editorial])};</script>
      </head><body><main data-club-page="dashboard">
      <p data-club-welcome></p><p data-club-saved-summary></p><div data-club-saved-list></div>
      <p data-club-all-summary></p><div data-club-all-list></div>
      </main><script type="module" src="/shared/club-ui.js"></script>
      <script src="/shared/site-ui.js" defer></script></body></html>`,
  }));
  await page.goto("/club-expiry-fixture/");
}

for (const signedIn of [false, true]) {
  test(`Club expires the active list in an open tab without changing ${signedIn ? "account" : "local"} history`, async ({ page }) => {
    await loadFixture(page, signedIn);
    const active = page.locator("[data-club-all-list]");
    const history = page.locator("[data-club-saved-list]");
    await expect(active.locator("article")).toHaveCount(2);
    await expect(active).toContainText(exact.title);
    await expect(active).not.toContainText(editorial.title);
    await expect(history.getByRole("link", { name: exact.title })).toHaveCount(1);
    await expect(history.locator("select")).toHaveValue("entered");
    const before = await page.evaluate(() => JSON.stringify({
      user: window.FreeHubClub.user,
      saved: window.FreeHubClub.savedCompetitions,
      local: localStorage.getItem("freehubClubSavedCompetitions"),
    }));

    // Let the real freshness scheduler reach the exact deadline, without a reload.
    await page.clock.runFor(1500);
    await expect(active.getByRole("link", { name: exact.title })).toHaveCount(0);
    await expect(active.getByRole("link", { name: dateOnly.title })).toHaveCount(1);
    await expect(page.locator("[data-club-all-summary]")).toContainText("1 active competition");
    await expect(history.getByRole("link", { name: exact.title })).toHaveCount(1);
    await expect(history.locator("select")).toHaveValue("entered");

    // Date-only entries retain the established South African end-of-day rule.
    await page.clock.setFixedTime(new Date("2026-11-01T22:00:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
    await expect(active).toContainText("No active competitions right now");
    expect(await page.evaluate(() => JSON.stringify({
      user: window.FreeHubClub.user,
      saved: window.FreeHubClub.savedCompetitions,
      local: localStorage.getItem("freehubClubSavedCompetitions"),
    }))).toBe(before);
    expect(await page.evaluate(() => window.__clubWrites)).toEqual([]);
  });
}
