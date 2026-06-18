import { getFirebaseClient } from "./firebase-client.js";

const LOCAL_SAVED_COMPETITIONS_KEY = "freehubClubSavedCompetitions";
const REFERRAL_ATTRIBUTION_KEY = "freehubReferralAttribution";
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const state = {
  client: null,
  user: null,
  profile: null,
  savedCompetitions: [],
  ignoredCompetitions: [],
  allCompetitions: [],
  page: null,
};

document.addEventListener("DOMContentLoaded", initClubUi);

async function initClubUi() {
  captureReferralFromUrl();
  state.page = document.querySelector("[data-club-page]")?.dataset.clubPage || "landing";
  state.allCompetitions = getDashboardCompetitions();
  bindClubActions();

  try {
    state.client = await getFirebaseClient();
  } catch (error) {
    state.client = null;
  }

  if (!state.client) {
    renderSignedOutState("Freehub Club sign-in is unavailable right now. You can still save competitions on this device.");
    return;
  }

  state.client.onAuthStateChanged(async (user) => {
    state.user = user;

    if (!user) {
      state.profile = null;
      state.savedCompetitions = getLocalSavedCompetitions();
      state.ignoredCompetitions = [];
      renderSignedOutState();
      return;
    }

    await loadClubState(user);
    renderSignedInState();
  });
}

function bindClubActions() {
  document.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-club-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.clubAction;

    if (action === "signin") {
      await signInWithGoogle(actionElement);
    } else if (action === "signout") {
      await signOut(actionElement);
    } else if (action === "copy-referral") {
      await copyReferralLink();
    } else if (action === "share-referral") {
      await shareReferralLink();
    } else if (action === "clear-local") {
      clearLocalSavedCompetitions();
      state.savedCompetitions = state.user ? state.savedCompetitions : [];
      renderSavedCompetitions();
    } else if (action === "remove-saved") {
      await removeSavedCompetition(actionElement.dataset.competitionId);
    }
  });

  document.addEventListener("change", async (event) => {
    const statusControl = event.target.closest("[data-club-status]");

    if (!statusControl) {
      return;
    }

    await updateSavedStatus(statusControl.dataset.competitionId, statusControl.value);
  });
}

async function signInWithGoogle(button) {
  if (!state.client) {
    setClubStatus("Freehub Club sign-in is unavailable right now.");
    return;
  }

  setBusy(button, true);
  setClubStatus("Opening Google sign-in...");

  try {
    const result = await state.client.signInWithGoogle();
    await loadClubState(result.user);
    renderSignedInState();
  } catch (error) {
    setClubStatus("Google sign-in was not completed. Please try again.");
  } finally {
    setBusy(button, false);
  }
}

async function signOut(button) {
  if (!state.client || !state.user) {
    return;
  }

  setBusy(button, true);

  try {
    await state.client.signOut();
  } catch (error) {
    setClubStatus("We could not sign you out right now.");
  } finally {
    setBusy(button, false);
  }
}

async function loadClubState(user) {
  state.user = user;
  state.profile = await state.client.helpers.ensureClubProfile(user, {
    acceptedPrivacyPolicy: true,
    alertsMarketingConsent: false,
  });
  await writePendingReferralAttribution(user, state.profile);
  await importLocalSavedCompetitions(user.uid);
  state.savedCompetitions = await state.client.helpers.getSavedCompetitions(user.uid).catch(() => []);
  state.ignoredCompetitions = await state.client.helpers.getIgnoredCompetitions(user.uid).catch(() => []);
}

async function writePendingReferralAttribution(user, profile) {
  const attribution = getStoredReferralAttribution();

  if (!attribution || attribution.referralCode === profile?.referralCode) {
    return;
  }

  const attributionId = await state.client.helpers.createPendingReferralAttribution(user, attribution).catch(() => null);

  if (attributionId) {
    window.localStorage.removeItem(REFERRAL_ATTRIBUTION_KEY);
  }
}

async function importLocalSavedCompetitions(userId) {
  const localSaved = getLocalSavedCompetitions();

  if (localSaved.length === 0) {
    return 0;
  }

  let imported = 0;

  for (const competition of localSaved) {
    try {
      if (normalizeSavedStatus(competition.status) === "skipped") {
        await state.client.helpers.ignoreCompetition(userId, {
          id: competition.competitionId,
          title: competition.title,
          category: competition.category,
          path: competition.path,
        });
      } else {
        await state.client.helpers.saveCompetition(userId, {
          id: competition.competitionId,
          slug: competition.slug || competition.competitionId,
          title: competition.title,
          brand: competition.brand,
          category: competition.category,
          closingDate: competition.closingDate,
          path: competition.path,
          status: competition.status,
        });
      }
      imported += 1;
    } catch (error) {
      console.warn("Unable to import local saved competition:", error.message);
    }
  }

  if (imported > 0) {
    clearLocalSavedCompetitions();
  }

  return imported;
}

function renderSignedOutState(message = "") {
  toggleAuthButtons(false);
  setWelcomeText(message || "Sign in with Google to sync saved competitions to your Freehub Club account.");
  document.querySelectorAll("[data-club-referral]").forEach((element) => {
    element.hidden = true;
  });
  state.savedCompetitions = getLocalSavedCompetitions();
  renderSavedCompetitions();
  renderAllCompetitions();
  renderAccountFields();
}

function renderSignedInState() {
  toggleAuthButtons(true);
  setWelcomeText(`Welcome${state.profile?.displayName ? `, ${state.profile.displayName}` : ""}. Your Club account is ready.`);
  renderReferralLink();
  renderSavedCompetitions();
  renderAllCompetitions();
  renderAccountFields();
}

function toggleAuthButtons(isSignedIn) {
  document.querySelectorAll('[data-club-action="signin"]').forEach((button) => {
    button.hidden = isSignedIn;
  });
  document.querySelectorAll('[data-club-action="signout"]').forEach((button) => {
    button.hidden = !isSignedIn;
  });
}

function setWelcomeText(message) {
  document.querySelectorAll("[data-club-welcome]").forEach((element) => {
    element.textContent = message;
  });
}

function renderReferralLink() {
  const referralCode = state.profile?.referralCode || "";
  const referralLink = referralCode ? `${window.location.origin}/club/?ref=${encodeURIComponent(referralCode)}` : "";

  document.querySelectorAll("[data-club-referral]").forEach((element) => {
    element.hidden = !referralLink;
  });
  document.querySelectorAll("[data-club-referral-link]").forEach((input) => {
    input.value = referralLink;
  });
  document
    .querySelectorAll('[data-club-action="copy-referral"], [data-club-action="share-referral"]')
    .forEach((button) => {
      button.hidden = !referralLink;
    });
}

function renderSavedCompetitions() {
  const list = document.querySelector("[data-club-saved-list]");
  const summary = document.querySelector("[data-club-saved-summary]");

  if (!list) {
    return;
  }

  const saved = normalizeSavedCompetitionList(state.savedCompetitions).filter(
    (competition) => competition.status !== "skipped"
  );

  if (summary) {
    summary.textContent = state.user
      ? `${saved.length} saved ${saved.length === 1 ? "competition" : "competitions"} in your Freehub Club account.`
      : `${saved.length} local ${saved.length === 1 ? "save" : "saves"} on this device. Sign in to sync them.`;
  }

  if (saved.length === 0) {
    list.innerHTML = `<article class="club-empty-state">
      <h3>No tracked competitions yet</h3>
      <p>Use the all competitions list below to mark items as interested or entered.</p>
      <a class="btn btn--primary" href="/competitions/">Browse competitions</a>
    </article>`;
    return;
  }

  list.innerHTML = saved.map(renderSavedCompetition).join("");
}

function renderAllCompetitions() {
  const list = document.querySelector("[data-club-all-list]");
  const summary = document.querySelector("[data-club-all-summary]");

  if (!list) {
    return;
  }

  const competitions = state.allCompetitions;
  const statusCounts = competitions.reduce(
    (counts, competition) => {
      counts[getCompetitionStatus(competition.competitionId)] += 1;
      return counts;
    },
    { untracked: 0, interested: 0, entered: 0, skipped: 0 }
  );

  if (summary) {
    summary.textContent = `${competitions.length} active competitions by nearest closing date. ${statusCounts.entered} entered, ${statusCounts.interested} interested, ${statusCounts.skipped} not relevant.`;
  }

  if (competitions.length === 0) {
    list.innerHTML = `<article class="club-empty-state">
      <h3>No active competitions right now</h3>
      <p>New verified competitions will appear here when Freehub publishes them.</p>
    </article>`;
    return;
  }

  list.innerHTML = competitions.map(renderAllCompetition).join("");
}

function renderAllCompetition(competition) {
  const status = getCompetitionStatus(competition.competitionId);
  const closingDate = formatDate(competition.closingDate);

  return `<article class="club-competition-row club-competition-row--${escapeAttribute(status)}">
    <div>
      <p class="club-saved-item__meta">${escapeHtml([competition.brand, competition.category, competition.entryCost].filter(Boolean).join(" - ") || "Freehub competition")}</p>
      <h3><a href="${escapeAttribute(competition.path)}">${escapeHtml(competition.title || "Competition")}</a></h3>
      <p>${closingDate ? `Closes ${escapeHtml(closingDate)}` : "Check the listing for the latest closing date."}${competition.entryMethod ? ` Entry: ${escapeHtml(competition.entryMethod)}.` : ""}</p>
    </div>
    <div class="club-saved-item__actions">
      <label>
        <span class="visually-hidden">Competition status</span>
        <select data-club-status data-competition-id="${escapeAttribute(competition.competitionId)}">
          ${[
            ["untracked", "Need to review"],
            ["interested", "Interested"],
            ["entered", "Entered"],
            ["skipped", "Not relevant"],
          ]
            .map(([value, label]) => `<option value="${value}"${value === status ? " selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </label>
    </div>
  </article>`;
}

function renderSavedCompetition(competition) {
  const status = normalizeSavedStatus(competition.status);
  const path = competition.path || `/competition/${competition.competitionId}/`;
  const closingDate = formatDate(competition.closingDate);

  return `<article class="club-saved-item">
    <div>
      <p class="club-saved-item__meta">${escapeHtml([competition.brand, competition.category].filter(Boolean).join(" - ") || "Freehub competition")}</p>
      <h3><a href="${escapeAttribute(path)}">${escapeHtml(competition.title || "Saved competition")}</a></h3>
      <p>${closingDate ? `Closes ${escapeHtml(closingDate)}` : "Check the listing for the latest closing date."}</p>
    </div>
    <div class="club-saved-item__actions">
      <label>
        <span class="visually-hidden">Saved status</span>
        <select data-club-status data-competition-id="${escapeAttribute(competition.competitionId)}">
          ${[
            ["interested", "Interested"],
            ["entered", "Entered"],
            ["skipped", "Not relevant"],
          ]
            .map(([value, label]) => `<option value="${value}"${value === status ? " selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </label>
      <button class="btn btn--secondary" type="button" data-club-action="remove-saved" data-competition-id="${escapeAttribute(
        competition.competitionId
      )}">Remove</button>
    </div>
  </article>`;
}

function renderAccountFields() {
  const saved = normalizeSavedCompetitionList(state.savedCompetitions).filter(
    (competition) => competition.status !== "skipped"
  );
  const fields = {
    displayName: state.profile?.displayName || "Not signed in",
    email: state.profile?.email || "Not signed in",
    createdAt: formatTimestamp(state.profile?.createdAt),
    referralCode: state.profile?.referralCode || "Not available",
    savedCount: String(saved.length),
    referWinTermsAccepted: window.FREEHUB_CLUB_CONFIG?.referWinCampaignEnabled ? "Accepted" : "Not live",
    marketingConsent: state.profile?.marketingConsent === true || state.profile?.alertsMarketingConsent === true ? "Opted in" : "Not opted in",
  };

  Object.entries(fields).forEach(([key, value]) => {
    document.querySelectorAll(`[data-club-field="${key}"]`).forEach((element) => {
      element.textContent = value;
    });
  });

  renderReferralLink();
}

async function updateSavedStatus(competitionId, status) {
  const nextStatus = normalizeSavedStatus(status);

  if (!competitionId) {
    return;
  }

  const competition = getCompetitionById(competitionId);

  if (state.user) {
    if (nextStatus === "untracked") {
      await Promise.all([
        state.client.helpers.unsaveCompetition(state.user.uid, competitionId).catch(() => null),
        state.client.helpers.unignoreCompetition(state.user.uid, competitionId).catch(() => null),
      ]);
      state.savedCompetitions = state.savedCompetitions.filter((entry) => entry.competitionId !== competitionId);
      state.ignoredCompetitions = state.ignoredCompetitions.filter((entry) => entry.competitionId !== competitionId);
    } else if (nextStatus === "skipped") {
      await Promise.all([
        state.client.helpers.ignoreCompetition(state.user.uid, toFirestoreCompetition(competition, nextStatus)).catch(() => null),
        state.client.helpers.unsaveCompetition(state.user.uid, competitionId).catch(() => null),
      ]);
      state.savedCompetitions = state.savedCompetitions.filter((entry) => entry.competitionId !== competitionId);
      state.ignoredCompetitions = upsertStateCompetition(state.ignoredCompetitions, toStateCompetition(competition, nextStatus));
    } else {
      await Promise.all([
        state.client.helpers.saveCompetition(state.user.uid, toFirestoreCompetition(competition, nextStatus)),
        state.client.helpers.unignoreCompetition(state.user.uid, competitionId).catch(() => null),
      ]).catch(() => {
        setClubStatus("We could not update that competition right now.");
      });
      state.savedCompetitions = upsertStateCompetition(state.savedCompetitions, toStateCompetition(competition, nextStatus));
      state.ignoredCompetitions = state.ignoredCompetitions.filter((entry) => entry.competitionId !== competitionId);
    }
  } else {
    const saved = getLocalSavedCompetitions().filter((entry) => entry.competitionId !== competitionId);
    if (nextStatus !== "untracked") {
      saved.unshift(toStateCompetition(competition, nextStatus));
    }
    window.localStorage.setItem(LOCAL_SAVED_COMPETITIONS_KEY, JSON.stringify(saved));
    state.savedCompetitions = saved;
  }

  renderSavedCompetitions();
  renderAllCompetitions();
  renderAccountFields();
}

async function removeSavedCompetition(competitionId) {
  if (!competitionId) {
    return;
  }

  if (state.user) {
    await state.client.helpers.unsaveCompetition(state.user.uid, competitionId).catch(() => {
      setClubStatus("We could not remove that saved competition right now.");
    });
    state.savedCompetitions = state.savedCompetitions.filter((competition) => competition.competitionId !== competitionId);
  } else {
    const saved = getLocalSavedCompetitions().filter((competition) => competition.competitionId !== competitionId);
    window.localStorage.setItem(LOCAL_SAVED_COMPETITIONS_KEY, JSON.stringify(saved));
    state.savedCompetitions = saved;
  }

  renderSavedCompetitions();
  renderAllCompetitions();
  renderAccountFields();
}

async function copyReferralLink() {
  const link = getCurrentReferralLink();

  if (!link) {
    setClubStatus("Sign in to create your referral link.");
    return;
  }

  await navigator.clipboard.writeText(link);
  setClubStatus("Referral link copied.");
}

async function shareReferralLink() {
  const link = getCurrentReferralLink();

  if (!link) {
    setClubStatus("Sign in to create your referral link.");
    return;
  }

  if (navigator.share) {
    await navigator.share({
      title: "Freehub Club",
      text: "Join Freehub Club to save and track South African competitions.",
      url: link,
    });
  } else {
    await copyReferralLink();
  }
}

function getCurrentReferralLink() {
  return document.querySelector("[data-club-referral-link]")?.value || "";
}

function setClubStatus(message) {
  document.querySelectorAll("[data-club-referral-status], .club-status").forEach((element) => {
    element.textContent = message;
  });
}

function setBusy(element, busy) {
  if (element) {
    element.disabled = busy;
  }
}

function captureReferralFromUrl() {
  const url = new URL(window.location.href);
  const referralCode = normalizeReferralCode(url.searchParams.get("ref"));

  if (!referralCode) {
    return;
  }

  const existing = getStoredReferralAttribution();

  if (existing) {
    return;
  }

  window.localStorage.setItem(
    REFERRAL_ATTRIBUTION_KEY,
    JSON.stringify({
      referralCode,
      landingPath: `${window.location.pathname}${window.location.search}`,
      capturedAt: new Date().toISOString(),
      expiresAt: Date.now() + REFERRAL_TTL_MS,
    })
  );
}

function getStoredReferralAttribution() {
  try {
    const attribution = JSON.parse(window.localStorage.getItem(REFERRAL_ATTRIBUTION_KEY) || "null");

    if (!attribution?.referralCode || Number(attribution.expiresAt) <= Date.now()) {
      window.localStorage.removeItem(REFERRAL_ATTRIBUTION_KEY);
      return null;
    }

    return attribution;
  } catch (error) {
    return null;
  }
}

function getLocalSavedCompetitions() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LOCAL_SAVED_COMPETITIONS_KEY) || "[]");
    return Array.isArray(saved) ? normalizeSavedCompetitionList(saved) : [];
  } catch (error) {
    return [];
  }
}

function getDashboardCompetitions() {
  const competitions = Array.isArray(window.FREEHUB_CLUB_COMPETITIONS) ? window.FREEHUB_CLUB_COMPETITIONS : [];
  return competitions
    .filter((competition) => competition?.competitionId)
    .map((competition) => ({
      competitionId: competition.competitionId,
      slug: competition.slug || competition.competitionId,
      title: competition.title || "Competition",
      brand: competition.brand || "",
      category: competition.category || "",
      closingDate: competition.closingDate || "",
      path: competition.path || `/competition/${competition.slug || competition.competitionId}/`,
      entryCost: competition.entryCost || "",
      entryMethod: competition.entryMethod || "",
    }))
    .sort((left, right) => new Date(left.closingDate) - new Date(right.closingDate));
}

function clearLocalSavedCompetitions() {
  window.localStorage.removeItem(LOCAL_SAVED_COMPETITIONS_KEY);
}

function normalizeSavedCompetitionList(saved) {
  return saved
    .filter((competition) => competition?.competitionId)
    .map((competition) => ({
      ...competition,
      competitionId: competition.competitionId,
      slug: competition.slug || competition.competitionId,
      title: competition.title || "Saved competition",
      path: competition.path || `/competition/${competition.slug || competition.competitionId}/`,
      status: normalizeSavedStatus(competition.status),
    }))
    .sort((left, right) => String(right.updatedAt || right.savedAt || "").localeCompare(String(left.updatedAt || left.savedAt || "")));
}

function normalizeSavedStatus(value) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["untracked", "interested", "entered", "skipped"].includes(status) ? status : "interested";
}

function getCompetitionStatus(competitionId) {
  const saved = state.savedCompetitions.find((competition) => competition.competitionId === competitionId);
  if (saved) {
    return normalizeSavedStatus(saved.status);
  }

  const ignored = state.ignoredCompetitions.find((competition) => competition.competitionId === competitionId);
  if (ignored) {
    return "skipped";
  }

  return "untracked";
}

function getCompetitionById(competitionId) {
  return (
    state.allCompetitions.find((competition) => competition.competitionId === competitionId) ||
    state.savedCompetitions.find((competition) => competition.competitionId === competitionId) || {
      competitionId,
      slug: competitionId,
      title: "Competition",
      path: `/competition/${competitionId}/`,
    }
  );
}

function toFirestoreCompetition(competition, status) {
  return {
    id: competition.competitionId,
    slug: competition.slug || competition.competitionId,
    title: competition.title,
    brand: competition.brand,
    category: competition.category,
    closingDate: competition.closingDate,
    path: competition.path,
    status,
  };
}

function toStateCompetition(competition, status) {
  return {
    competitionId: competition.competitionId,
    slug: competition.slug || competition.competitionId,
    title: competition.title,
    brand: competition.brand || null,
    category: competition.category || null,
    closingDate: competition.closingDate || null,
    path: competition.path,
    status,
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function upsertStateCompetition(competitions, competition) {
  return [competition, ...competitions.filter((entry) => entry.competitionId !== competition.competitionId)];
}

function normalizeReferralCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^FH[A-Z0-9]{5,6}$/.test(code) ? code : "";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimestamp(value) {
  if (!value) {
    return "Not available";
  }

  if (typeof value.toDate === "function") {
    return formatDate(value.toDate().toISOString());
  }

  return formatDate(value) || "Not available";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
