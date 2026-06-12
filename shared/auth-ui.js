import { getFirebaseClient } from "./firebase-client.js";

const EMAIL_STORAGE_KEY = "freehubEmailForSignIn";
const PENDING_ACTION_STORAGE_KEY = "freehubPendingAuthAction";

const state = {
  client: null,
  user: null,
  panels: [],
  activePanel: null,
  pendingAction: "save",
  saved: new Map(),
  alerts: new Map(),
};

document.addEventListener("DOMContentLoaded", initAuthUi);

async function initAuthUi() {
  state.panels = Array.from(document.querySelectorAll("[data-freehub-auth]"));

  try {
    state.client = await getFirebaseClient();
  } catch (error) {
    state.client = null;
  }

  if (!state.client) {
    return;
  }

  ensureModal();
  await completeEmailLinkIfNeeded();

  state.panels.forEach((panel) => bindPanel(panel));
  state.client.onAuthStateChanged(async (user) => {
    state.user = user;
    await refreshPanelState();
    renderPanels();
  });
}

function bindPanel(panel) {
  const saveButton = panel.querySelector('[data-auth-action="save"]');
  const alertsButton = panel.querySelector('[data-auth-action="alerts"]');
  const signInButton = panel.querySelector('[data-auth-action="signin"]');

  saveButton?.addEventListener("click", () => handleSaveClick(panel));
  alertsButton?.addEventListener("click", () => handleAlertsClick(panel));
  signInButton?.addEventListener("click", () => openSignupModal(panel, "save"));

  panel.hidden = false;
}

async function handleSaveClick(panel) {
  if (!state.user) {
    openSignupModal(panel, "save");
    return;
  }

  const competition = getPanelCompetition(panel);
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
  const alertsOn = state.alerts.get(competition.id) === true;

  setPanelBusy(panel, true);
  try {
    await state.client.helpers.setAlertPreferences(state.user.uid, {
      competitionAlerts: !alertsOn,
      marketingOptIn: !alertsOn,
    });
    state.alerts.set(competition.id, !alertsOn);
    trackAuthEvent(alertsOn ? "alert_opt_out" : "alert_opt_in", getCompetitionEventParams(competition));
    setPanelMessage(panel, alertsOn ? "Competition alerts are off." : "Competition alerts are on.");
  } catch (error) {
    setPanelMessage(panel, "We could not update alert preferences right now.");
  } finally {
    setPanelBusy(panel, false);
    renderPanel(panel);
  }
}

function openSignupModal(panel, action) {
  state.activePanel = panel;
  state.pendingAction = action;

  const modal = getModal();
  const form = modal.querySelector("[data-auth-form]");
  const message = modal.querySelector("[data-auth-modal-message]");
  const title = modal.querySelector("[data-auth-modal-title]");
  const competition = getPanelCompetition(panel);

  form.reset();
  title.textContent = action === "alerts" ? "Sign in for competition alerts" : "Sign in to save";
  message.textContent =
    action === "alerts"
      ? "Tick the optional alerts box if you want Freehub to store alert preferences for your account."
      : `Sign in to save ${competition.title}.`;

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
      if (competition?.id) {
        state.alerts.set(competition.id, true);
      }
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
}

async function refreshPanelState() {
  if (!state.user || !state.client) {
    state.saved.clear();
    state.alerts.clear();
    return;
  }

  await Promise.all(
    state.panels.map(async (panel) => {
      const competition = getPanelCompetition(panel);
      const [saved, alerts] = await Promise.all([
        state.client.helpers.getSavedCompetition(state.user.uid, competition.id).catch(() => null),
        state.client.helpers.getAlertPreferences(state.user.uid).catch(() => null),
      ]);

      state.saved.set(competition.id, Boolean(saved));
      state.alerts.set(competition.id, alerts?.competitionAlerts === true);
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
  const signInButton = panel.querySelector('[data-auth-action="signin"]');
  const userElement = panel.querySelector("[data-auth-user]");
  const isSaved = state.saved.get(competition.id) === true;
  const alertsOn = state.alerts.get(competition.id) === true;

  if (saveButton) {
    saveButton.textContent = state.user ? (isSaved ? "Saved" : "Save this competition") : "Sign in to save";
    saveButton.setAttribute("aria-pressed", String(isSaved));
  }

  if (alertsButton) {
    alertsButton.textContent = state.user
      ? (alertsOn ? "Alerts on" : "Get competition alerts")
      : "Get competition alerts";
    alertsButton.setAttribute("aria-pressed", String(alertsOn));
  }

  if (signInButton) {
    signInButton.hidden = Boolean(state.user);
  }

  if (userElement) {
    userElement.textContent = state.user
      ? `Signed in as ${state.user.email || state.user.displayName || "Freehub user"}`
      : "Sign in is optional. Browsing and entry links stay open.";
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
  if (state.activePanel) {
    return getPanelCompetition(state.activePanel);
  }

  return getStoredPendingAction()?.competition || null;
}

function getPanelCompetition(panel) {
  return {
    id: panel.dataset.competitionId,
    title: panel.dataset.competitionTitle,
    category: panel.dataset.competitionCategory,
    path: panel.dataset.competitionPath,
  };
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
