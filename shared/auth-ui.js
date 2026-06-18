import { getFirebaseClient } from "./firebase-client.js";

const EMAIL_STORAGE_KEY = "freehubEmailForSignIn";
const PENDING_ACTION_STORAGE_KEY = "freehubPendingAuthAction";
const LOCAL_SAVED_COMPETITIONS_KEY = "freehubClubSavedCompetitions";

const state = {
  client: null,
  user: null,
  panels: [],
  activePanel: null,
  activeCompetition: null,
  pendingAction: "save",
  saved: new Map(),
  ignored: new Map(),
  alerts: new Map(),
  showIgnored: false,
};

document.addEventListener("DOMContentLoaded", initAuthUi);

async function initAuthUi() {
  state.panels = Array.from(document.querySelectorAll("[data-freehub-auth]"));
  bindGlobalIgnoreControls();

  try {
    state.client = await getFirebaseClient();
  } catch (error) {
    state.client = null;
  }

  if (!state.client) {
    return;
  }

  document.documentElement.classList.add("freehub-auth-ready");
  ensureModal();
  await completeEmailLinkIfNeeded();

  state.panels.forEach((panel) => bindPanel(panel));
  state.client.onAuthStateChanged(async (user) => {
    state.user = user;
    await refreshPanelState();
    renderPanels();
    applyIgnoredCompetitionsToPage();
  });
}

function bindPanel(panel) {
  const saveButton = panel.querySelector('[data-auth-action="save"]');
  const alertsButton = panel.querySelector('[data-auth-action="alerts"]');
  const signInButton = panel.querySelector('[data-auth-action="signin"]');
  const signOutButton = panel.querySelector('[data-auth-action="signout"]');

  saveButton?.addEventListener("click", () => handleSaveClick(panel));
  alertsButton?.addEventListener("click", () => handleAlertsClick(panel));
  signInButton?.addEventListener("click", () => openSignupModal(panel, getDefaultAction(panel)));
  signOutButton?.addEventListener("click", () => handleSignOutClick(panel));

  panel.hidden = false;
}

function bindGlobalIgnoreControls() {
  document.addEventListener("click", (event) => {
    const ignoreButton = event.target.closest('[data-auth-action="ignore"]');

    if (!ignoreButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    handleIgnoreClick(ignoreButton);
  });

  document.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-ignored-toggle]");

    if (!toggleButton) {
      return;
    }

    state.showIgnored = !state.showIgnored;
    applyIgnoredCompetitionsToPage();
  });

  document.addEventListener("freehub:competition-cards-rendered", () => {
    applyIgnoredCompetitionsToPage();
  });
}

async function handleSaveClick(panel) {
  const competition = getPanelCompetition(panel);

  if (!competition?.id) {
    openSignupModal(panel, "alerts");
    return;
  }

  if (!state.user) {
    saveCompetitionLocally(competition);
    state.saved.set(competition.id, true);
    trackAuthEvent("save_competition_local", getCompetitionEventParams(competition));
    setPanelMessage(panel, "Saved on this device. Sign in to keep it in your Freehub Club account.");
    renderPanel(panel);
    return;
  }

  const isSaved = state.saved.get(competition.id) === true;

  setPanelBusy(panel, true);
  try {
    if (isSaved) {
      await state.client.helpers.unsaveCompetition(state.user.uid, competition.id);
      state.saved.set(competition.id, false);
      trackAuthEvent("unsave_competition", getCompetitionEventParams(competition));
      setPanelMessage(panel, "Removed from your saved competitions.");
    } else {
      await state.client.helpers.saveCompetition(state.user.uid, competition);
      state.saved.set(competition.id, true);
      trackAuthEvent("save_competition", getCompetitionEventParams(competition));
      setPanelMessage(panel, "Saved to your Freehub account.");
    }
  } catch (error) {
    setPanelMessage(panel, "We could not update saved competitions right now.");
  } finally {
    setPanelBusy(panel, false);
    renderPanel(panel);
  }
}

async function handleAlertsClick(panel) {
  if (!state.user) {
    openSignupModal(panel, "alerts");
    return;
  }

  const competition = getPanelCompetition(panel);
  const alertKey = getAlertKey(competition);
  const alertsOn = state.alerts.get(alertKey) === true;

  setPanelBusy(panel, true);
  try {
    await state.client.helpers.setAlertPreferences(state.user.uid, {
      competitionAlerts: !alertsOn,
      marketingOptIn: !alertsOn,
    });
    state.alerts.set(alertKey, !alertsOn);
    trackAuthEvent(alertsOn ? "alert_opt_out" : "alert_opt_in", getCompetitionEventParams(competition));
    setPanelMessage(panel, alertsOn ? "Competition alerts are off." : "Competition alerts are on.");
  } catch (error) {
    setPanelMessage(panel, "We could not update alert preferences right now.");
  } finally {
    setPanelBusy(panel, false);
    renderPanel(panel);
  }
}

async function handleSignOutClick(panel) {
  if (!state.client || !state.user) {
    return;
  }

  setPanelBusy(panel, true);
  try {
    await state.client.signOut();
    state.saved.clear();
    state.ignored.clear();
    state.alerts.clear();
    state.showIgnored = false;
    applyIgnoredCompetitionsToPage();
    setPanelMessage(panel, "Signed out.");
    trackAuthEvent("signout", {});
  } catch (error) {
    setPanelMessage(panel, "We could not sign you out right now.");
  } finally {
    setPanelBusy(panel, false);
    renderPanels();
  }
}

async function handleIgnoreClick(sourceElement) {
  if (!state.client) {
    return;
  }

  const competition = getElementCompetition(sourceElement);

  if (!competition?.id) {
    return;
  }

  if (!state.user) {
    openSignupModal(null, "ignore", competition);
    return;
  }

  const isIgnored = state.ignored.get(competition.id) === true;

  setIgnoreButtonsBusy(competition.id, true);
  try {
    if (isIgnored) {
      await state.client.helpers.unignoreCompetition(state.user.uid, competition.id);
      state.ignored.set(competition.id, false);
      trackAuthEvent("unignore_competition", getCompetitionEventParams(competition));
    } else {
      await state.client.helpers.ignoreCompetition(state.user.uid, competition);
      state.ignored.set(competition.id, true);
      trackAuthEvent("ignore_competition", getCompetitionEventParams(competition));
    }
    applyIgnoredCompetitionsToPage();
    renderPanels();
  } catch (error) {
    setNearestStatus(sourceElement, "We could not update ignored competitions right now.");
  } finally {
    setIgnoreButtonsBusy(competition.id, false);
  }
}

function openSignupModal(panel, action, competitionOverride = null) {
  state.activePanel = panel;
  state.activeCompetition = competitionOverride;
  state.pendingAction = action;

  const modal = getModal();
  const form = modal.querySelector("[data-auth-form]");
  const message = modal.querySelector("[data-auth-modal-message]");
  const title = modal.querySelector("[data-auth-modal-title]");
  const competition = competitionOverride || getPanelCompetition(panel);

  form.reset();
  title.textContent =
    action === "alerts"
      ? "Sign in for competition alerts"
      : action === "ignore"
        ? "Sign in to hide competitions"
        : "Sign in to save";
  message.textContent =
    action === "alerts"
      ? "Use Google or an email sign-in link to store competition alert preferences for your Freehub account."
      : action === "ignore"
        ? `Sign in to hide ${competition?.title || "competitions you have already seen"}.`
        : `Sign in to save ${competition?.title || "this competition"}.`;

  modal.hidden = false;
  modal.querySelector("#freehubPrivacyConsent").focus();
  trackAuthEvent("signup_modal_open", getCompetitionEventParams(competition));
}

function closeSignupModal() {
  getModal().hidden = true;
}

function ensureModal() {
  if (document.querySelector("[data-auth-modal]")) {
    bindModal();
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="auth-modal" data-auth-modal hidden>
      <div class="auth-modal__backdrop" data-auth-close></div>
      <section class="auth-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="freehubAuthTitle">
        <button class="auth-modal__close" type="button" data-auth-close aria-label="Close sign-in">x</button>
        <h2 class="auth-modal__title" id="freehubAuthTitle" data-auth-modal-title>Sign in to save</h2>
        <p class="auth-modal__text" data-auth-modal-message>Sign in to save this competition.</p>
        <form class="auth-form" data-auth-form>
          <label class="auth-check">
            <input id="freehubPrivacyConsent" type="checkbox" name="privacy" required />
            <span>I have read and agree to the <a href="/privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a>.</span>
          </label>
          <label class="auth-check">
            <input type="checkbox" name="alertsMarketing" />
            <span>Email me competition alerts and occasional Freehub updates.</span>
          </label>
          <div class="auth-provider-list">
            <button class="auth-provider" type="button" data-auth-provider="google">Continue with Google</button>
            <button class="auth-provider" type="button" data-auth-provider="facebook">Continue with Facebook</button>
          </div>
          <label class="auth-email" for="freehubAuthEmail" data-auth-provider="emailLink">
            <span>Email sign-in link</span>
            <input id="freehubAuthEmail" type="email" name="email" autocomplete="email" placeholder="you@example.com" />
          </label>
          <button class="auth-email__submit" type="submit" data-auth-provider="emailLink">Send sign-in link</button>
          <p class="auth-modal__status" data-auth-modal-status aria-live="polite"></p>
        </form>
      </section>
    </div>`
  );

  bindModal();
  applyProviderVisibility();
}

function bindModal() {
  const modal = getModal();
  const form = modal.querySelector("[data-auth-form]");

  modal.querySelectorAll("[data-auth-close]").forEach((button) => {
    button.addEventListener("click", closeSignupModal);
  });

  modal.querySelector('[data-auth-provider="google"]')?.addEventListener("click", () => {
    startProviderSignin("google");
  });

  modal.querySelector('[data-auth-provider="facebook"]')?.addEventListener("click", () => {
    startProviderSignin("facebook");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    startEmailSignin(form);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeSignupModal();
    }
  });
}

function applyProviderVisibility() {
  const modal = getModal();
  const enabledProviders = new Set(state.client?.enabledAuthProviders || []);

  modal.querySelectorAll("[data-auth-provider]").forEach((element) => {
    const provider = element.dataset.authProvider;
    element.hidden = !enabledProviders.has(provider);
  });
}

async function startProviderSignin(provider) {
  const form = getModal().querySelector("[data-auth-form]");

  if (!validateConsent(form)) {
    return;
  }

  const competition = getActiveCompetition();
  setModalBusy(true);
  setModalStatus(`Opening ${provider} sign-in...`);
  trackAuthEvent(
    provider === "facebook" ? "signup_start_facebook" : "signup_start_google",
    getCompetitionEventParams(competition)
  );

  try {
    const result =
      provider === "facebook"
        ? await state.client.signInWithFacebook()
        : await state.client.signInWithGoogle();

    await handleSigninSuccess(result.user, provider, getConsent(form));
    closeSignupModal();
  } catch (error) {
    setModalStatus("Sign-in was not completed. Please try again.");
  } finally {
    setModalBusy(false);
  }
}

async function startEmailSignin(form) {
  if (!validateConsent(form)) {
    return;
  }

  const email = form.elements.email.value.trim();

  if (!email) {
    setModalStatus("Enter your email address first.");
    return;
  }

  const competition = getActiveCompetition();
  setModalBusy(true);
  setModalStatus("Sending your sign-in link...");
  trackAuthEvent("signup_start_email", getCompetitionEventParams(competition));

  try {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    window.localStorage.setItem(
      PENDING_ACTION_STORAGE_KEY,
      JSON.stringify({
        action: state.pendingAction,
        competition,
        consent: getConsent(form),
      })
    );
    await state.client.sendEmailSignInLink(email);
    setModalStatus("Check your email for the Freehub sign-in link.");
  } catch (error) {
    setModalStatus("We could not send the sign-in link right now.");
  } finally {
    setModalBusy(false);
  }
}

async function completeEmailLinkIfNeeded() {
  if (!state.client.isEmailSignInLink()) {
    return;
  }

  let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  const pending = getStoredPendingAction();

  if (!email) {
    email = window.prompt("Confirm the email address you used for Freehub sign-in:");
  }

  if (!email) {
    return;
  }

  try {
    const result = await state.client.completeEmailSignIn(email);
    if (pending?.action) {
      state.pendingAction = pending.action;
    }
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    window.localStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
    await handleSigninSuccess(result.user, "email", pending?.consent || { acceptedPrivacyPolicy: true });
    cleanEmailLinkUrl();
  } catch (error) {
    console.warn("Unable to complete Freehub email sign-in:", error.message);
  }
}

async function handleSigninSuccess(user, provider, consent) {
  const competition = getActiveCompetition();

  try {
    await state.client.helpers.upsertUserProfile(user, consent);
    await state.client.helpers.recordSignupEvent(user, {
      provider,
      competitionId: competition?.id,
      alertsOptIn: consent.alertsMarketingConsent === true,
    });
    await importLocalSavedCompetitions(user.uid);
  } catch (error) {
    console.warn("Freehub account profile writes are unavailable:", error.message);
  }

  trackAuthEvent("signup_success", {
    provider,
    ...getCompetitionEventParams(competition),
  });

  if (consent.alertsMarketingConsent === true) {
    try {
      await state.client.helpers.setAlertPreferences(user.uid, {
        competitionAlerts: true,
        marketingOptIn: true,
      });
      state.alerts.set(getAlertKey(competition), true);
      trackAuthEvent("alert_opt_in", getCompetitionEventParams(competition));
    } catch (error) {
      console.warn("Freehub alert preference writes are unavailable:", error.message);
    }
  }

  if (state.pendingAction === "save" && competition?.id) {
    try {
      await state.client.helpers.saveCompetition(user.uid, competition);
      state.saved.set(competition.id, true);
      trackAuthEvent("save_competition", getCompetitionEventParams(competition));
    } catch (error) {
      console.warn("Freehub saved competition writes are unavailable:", error.message);
    }
  }

  if (state.pendingAction === "ignore" && competition?.id) {
    try {
      await state.client.helpers.ignoreCompetition(user.uid, competition);
      state.ignored.set(competition.id, true);
      trackAuthEvent("ignore_competition", getCompetitionEventParams(competition));
      applyIgnoredCompetitionsToPage();
    } catch (error) {
      console.warn("Freehub ignored competition writes are unavailable:", error.message);
    }
  }
}

async function refreshPanelState() {
  if (!state.user || !state.client) {
    state.saved.clear();
    getLocalSavedCompetitions().forEach((competition) => {
      state.saved.set(competition.competitionId, true);
    });
    state.ignored.clear();
    state.alerts.clear();
    applyIgnoredCompetitionsToPage();
    return;
  }

  const ignoredCompetitions = await state.client.helpers
    .getIgnoredCompetitions(state.user.uid)
    .catch(() => []);
  state.ignored.clear();
  ignoredCompetitions.forEach((competition) => {
    if (competition?.competitionId) {
      state.ignored.set(competition.competitionId, true);
    }
  });

  await Promise.all(
    state.panels.map(async (panel) => {
      const competition = getPanelCompetition(panel);
      const [saved, ignored, alerts] = await Promise.all([
        competition?.id
          ? state.client.helpers.getSavedCompetition(state.user.uid, competition.id).catch(() => null)
          : Promise.resolve(null),
        competition?.id
          ? state.client.helpers.getIgnoredCompetition(state.user.uid, competition.id).catch(() => null)
          : Promise.resolve(null),
        state.client.helpers.getAlertPreferences(state.user.uid).catch(() => null),
      ]);

      if (competition?.id) {
        state.saved.set(competition.id, Boolean(saved));
        state.ignored.set(competition.id, Boolean(ignored) || state.ignored.get(competition.id) === true);
      }
      state.alerts.set(getAlertKey(competition), alerts?.competitionAlerts === true);
    })
  );
}

function renderPanels() {
  state.panels.forEach(renderPanel);
}

function renderPanel(panel) {
  const competition = getPanelCompetition(panel);
  const saveButton = panel.querySelector('[data-auth-action="save"]');
  const alertsButton = panel.querySelector('[data-auth-action="alerts"]');
  const ignoreButton = panel.querySelector('[data-auth-action="ignore"]');
  const signInButton = panel.querySelector('[data-auth-action="signin"]');
  const signOutButton = panel.querySelector('[data-auth-action="signout"]');
  const userElement = panel.querySelector("[data-auth-user]");
  const isSaved = competition?.id ? state.saved.get(competition.id) === true : false;
  const isIgnored = competition?.id ? state.ignored.get(competition.id) === true : false;
  const alertsOn = state.alerts.get(getAlertKey(competition)) === true;

  if (saveButton) {
    saveButton.textContent = state.user
      ? (isSaved ? "Saved" : "Save this competition")
      : (isSaved ? "Saved locally" : "Save locally");
    saveButton.setAttribute("aria-pressed", String(isSaved));
  }

  if (alertsButton) {
    alertsButton.textContent = state.user
      ? (alertsOn ? "Alerts on" : "Get competition alerts")
      : "Get competition alerts";
    alertsButton.setAttribute("aria-pressed", String(alertsOn));
  }

  if (ignoreButton) {
    ignoreButton.textContent = state.user ? (isIgnored ? "Ignored" : "Hide this competition") : "Sign in to hide";
    ignoreButton.setAttribute("aria-pressed", String(isIgnored));
  }

  if (signInButton) {
    signInButton.hidden = Boolean(state.user);
  }

  if (signOutButton) {
    signOutButton.hidden = !state.user;
  }

  if (userElement) {
    userElement.textContent = state.user
      ? `Signed in as ${state.user.email || state.user.displayName || "Freehub user"}`
      : panel.dataset.authSignedOutText || "Sign in is optional. Browsing and entry links stay open.";
  }
}

function setPanelBusy(panel, busy) {
  panel.querySelectorAll("button").forEach((button) => {
    button.disabled = busy;
  });
}

function setPanelMessage(panel, message) {
  const status = panel.querySelector("[data-auth-status]");

  if (status) {
    status.textContent = message;
  }
}

function setNearestStatus(element, message) {
  const panel = element.closest("[data-freehub-auth]");
  const status = panel?.querySelector("[data-auth-status]");

  if (status) {
    status.textContent = message;
  }
}

function setIgnoreButtonsBusy(competitionId, busy) {
  document
    .querySelectorAll(`[data-auth-action="ignore"][data-competition-id="${cssEscape(competitionId)}"]`)
    .forEach((button) => {
      button.disabled = busy;
    });
}

function setModalBusy(busy) {
  getModal().querySelectorAll("button, input").forEach((element) => {
    element.disabled = busy;
  });
}

function setModalStatus(message) {
  getModal().querySelector("[data-auth-modal-status]").textContent = message;
}

function validateConsent(form) {
  if (!form.elements.privacy.checked) {
    setModalStatus("Please agree to the Privacy Policy to create or use a Freehub account.");
    form.elements.privacy.focus();
    return false;
  }

  return true;
}

function getConsent(form) {
  return {
    acceptedPrivacyPolicy: form.elements.privacy.checked === true,
    alertsMarketingConsent: form.elements.alertsMarketing.checked === true,
  };
}

function getActiveCompetition() {
  if (state.activeCompetition) {
    return state.activeCompetition;
  }

  if (state.activePanel) {
    return getPanelCompetition(state.activePanel);
  }

  return getStoredPendingAction()?.competition || null;
}

function getPanelCompetition(panel) {
  if (!panel?.dataset.competitionId) {
    return null;
  }

  return {
    id: panel.dataset.competitionId,
    slug: panel.dataset.competitionSlug || panel.dataset.competitionId,
    title: panel.dataset.competitionTitle,
    brand: panel.dataset.competitionBrand,
    category: panel.dataset.competitionCategory,
    closingDate: panel.dataset.competitionClosingDate,
    path: panel.dataset.competitionPath,
    status: "interested",
  };
}

function getElementCompetition(element) {
  const source = element.closest("[data-competition-id]") || element.closest("[data-competition-slug]");
  const id = source?.dataset.competitionId || source?.dataset.competitionSlug;

  if (!id) {
    return null;
  }

  return {
    id,
    slug: source.dataset.competitionSlug || id,
    title: source.dataset.competitionTitle || source.getAttribute("aria-label") || "this competition",
    brand: source.dataset.competitionBrand || "",
    category: source.dataset.competitionCategory || "",
    closingDate: source.dataset.competitionClosingDate || "",
    path: source.dataset.competitionPath || `${window.location.origin}/competition/${id}/`,
    status: "interested",
  };
}

function applyIgnoredCompetitionsToPage() {
  const ignoredIds = getIgnoredCompetitionIds();
  const shouldHide = Boolean(state.user) && !state.showIgnored;
  let hiddenCount = 0;

  document.querySelectorAll(".competition-card[data-competition-slug]").forEach((card) => {
    const isIgnored = ignoredIds.includes(card.dataset.competitionSlug);
    card.classList.toggle("competition-card--ignored", isIgnored);
    card.hidden = isIgnored && shouldHide;
    if (isIgnored) {
      hiddenCount += 1;
    }
  });

  updateIgnoreButtons();
  renderIgnoredSummary(hiddenCount);
  window.FreeHubAuth = buildPublicAuthApi();
}

function updateIgnoreButtons() {
  document.querySelectorAll('[data-auth-action="ignore"]').forEach((button) => {
    const competition = getElementCompetition(button);
    const isIgnored = competition?.id ? state.ignored.get(competition.id) === true : false;

    button.textContent = state.user ? (isIgnored ? "Ignored" : "Hide") : "Sign in to hide";
    button.setAttribute("aria-pressed", String(isIgnored));
  });
}

function renderIgnoredSummary(hiddenCount) {
  document.querySelectorAll("[data-ignored-summary]").forEach((element) => element.remove());

  if (!state.user || hiddenCount === 0) {
    return;
  }

  document.querySelectorAll(".competition-grid").forEach((grid) => {
    const summary = document.createElement("div");
    summary.className = "ignored-summary";
    summary.dataset.ignoredSummary = "true";
    summary.innerHTML = `
      <p>${hiddenCount} ignored ${hiddenCount === 1 ? "competition is" : "competitions are"} ${state.showIgnored ? "shown" : "hidden"}.</p>
      <button type="button" data-ignored-toggle>${state.showIgnored ? "Hide ignored" : "Show ignored"}</button>
    `;
    grid.before(summary);
  });
}

function getIgnoredCompetitionIds() {
  return Array.from(state.ignored.entries())
    .filter(([, ignored]) => ignored === true)
    .map(([competitionId]) => competitionId);
}

function buildPublicAuthApi() {
  return {
    user: state.user,
    client: state.client,
    openSignupModal,
    saveCompetitionLocally,
    getLocalSavedCompetitions,
    importLocalSavedCompetitions: () => (state.user ? importLocalSavedCompetitions(state.user.uid) : Promise.resolve(0)),
    getIgnoredCompetitionIds,
    applyIgnoredCompetitionsToPage,
  };
}

function saveCompetitionLocally(competition, status = "interested") {
  if (!competition?.id) {
    return;
  }

  const saved = getLocalSavedCompetitions();
  const existing = saved.find((entry) => entry.competitionId === competition.id);
  const nextEntry = {
    competitionId: competition.id,
    slug: competition.slug || competition.id,
    title: competition.title || "Saved competition",
    brand: competition.brand || null,
    category: competition.category || null,
    closingDate: competition.closingDate || null,
    path: competition.path || `/competition/${competition.id}/`,
    status: normalizeSavedStatus(status || existing?.status),
    savedAt: existing?.savedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const nextSaved = [nextEntry, ...saved.filter((entry) => entry.competitionId !== competition.id)].slice(0, 100);
  window.localStorage.setItem(LOCAL_SAVED_COMPETITIONS_KEY, JSON.stringify(nextSaved));
}

function getLocalSavedCompetitions() {
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_SAVED_COMPETITIONS_KEY) || "[]");
    return Array.isArray(value) ? value.filter((entry) => entry?.competitionId) : [];
  } catch (error) {
    return [];
  }
}

async function importLocalSavedCompetitions(userId) {
  if (!state.client || !userId) {
    return 0;
  }

  const saved = getLocalSavedCompetitions();
  let importedCount = 0;

  for (const competition of saved) {
    try {
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
      importedCount += 1;
    } catch (error) {
      console.warn("Unable to import local Freehub saved competition:", error.message);
    }
  }

  if (importedCount > 0) {
    window.localStorage.removeItem(LOCAL_SAVED_COMPETITIONS_KEY);
  }

  return importedCount;
}

function normalizeSavedStatus(value) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["interested", "entered", "skipped"].includes(status) ? status : "interested";
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, "\\$&");
}

function getAlertKey(competition) {
  return competition?.id || "global";
}

function getDefaultAction(panel) {
  return panel.dataset.authDefaultAction || (panel.dataset.competitionId ? "save" : "alerts");
}

function getCompetitionEventParams(competition) {
  if (!competition) {
    return {};
  }

  return {
    competition_slug: competition.id,
    competition_title: competition.title,
    competition_category: competition.category,
  };
}

function getStoredPendingAction() {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_ACTION_STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function cleanEmailLinkUrl() {
  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function getModal() {
  return document.querySelector("[data-auth-modal]");
}

function trackAuthEvent(name, params = {}) {
  const payload = {
    page_type: "competition",
    ...params,
  };

  if (window.FreeHubAnalytics?.track) {
    window.FreeHubAnalytics.track(name, payload);
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }
}
