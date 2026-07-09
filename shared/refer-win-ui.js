import { getFirebaseClient } from "./firebase-client.js";

const REFERRAL_ATTRIBUTION_KEY = "freehubReferralAttribution";
const PUBLIC_REFERRAL_KEY = "freehubPublicReferralLead";
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7mS1VE50UlOc2yOe2H";

const state = {
  client: null,
  attribution: null,
  lead: null,
};

document.addEventListener("DOMContentLoaded", initReferWinUi);

async function initReferWinUi() {
  state.attribution = captureReferralFromUrl();
  state.lead = getStoredPublicReferralLead();
  bindReferWinActions();
  renderReferralResult();

  try {
    state.client = await getFirebaseClient();
  } catch (error) {
    state.client = null;
  }

  if (state.client && state.attribution?.referralCode && !state.attribution.visitRecorded) {
    await recordReferralVisit(state.attribution);
  }
}

function bindReferWinActions() {
  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-public-referral-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    await createReferralLead(form);
  });

  document.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-public-referral-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.publicReferralAction;

    if (action === "copy") {
      await copyReferralLink();
    } else if (action === "whatsapp") {
      openWhatsAppShare();
    } else if (action === "channel") {
      trackReferWinEvent("public_referral_channel_click");
    }
  });
}

async function createReferralLead(form) {
  const submitButton = form.querySelector('[type="submit"]');
  const contactInput = form.querySelector("[data-public-referral-contact]");
  const termsInput = form.querySelector("[data-public-referral-terms]");
  const prizeConsentInput = form.querySelector("[data-public-referral-prize-consent]");
  const marketingInput = form.querySelector("[data-public-referral-marketing]");

  if (!state.client) {
    setStatus("Referral link creation is unavailable right now. Please try again later.", "error");
    return;
  }

  setBusy(submitButton, true);
  setStatus("Creating your referral link...");

  try {
    const lead = await state.client.helpers.createPublicReferralLead({
      contact: contactInput?.value || "",
      landingPath: `${window.location.pathname}${window.location.search}`,
      referredByCode: state.attribution?.referralCode || "",
      termsAccepted: termsInput?.checked === true,
      prizeContactConsent: prizeConsentInput?.checked === true,
      marketingConsent: marketingInput?.checked === true,
    });

    state.lead = {
      ...lead,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(PUBLIC_REFERRAL_KEY, JSON.stringify(state.lead));
    renderReferralResult();
    setStatus("Your referral link is ready.");
    form.reset();
    trackReferWinEvent("public_referral_lead_created", {
      referred_by_code: state.attribution?.referralCode || "",
    });
  } catch (error) {
    setStatus(error.message || "Could not create your referral link right now.", "error");
  } finally {
    setBusy(submitButton, false);
  }
}

async function recordReferralVisit(attribution) {
  try {
    await state.client.helpers.recordPublicReferralVisit({
      referralCode: attribution.referralCode,
      landingPath: attribution.landingPath,
    });
    state.attribution = {
      ...attribution,
      visitRecorded: true,
    };
    window.localStorage.setItem(REFERRAL_ATTRIBUTION_KEY, JSON.stringify(state.attribution));
    trackReferWinEvent("public_referral_visit", {
      referral_code: attribution.referralCode,
    });
  } catch (error) {
    // Firestore rules may not be deployed yet; attribution is still kept locally.
  }
}

async function copyReferralLink() {
  const link = getReferralLink();

  if (!link) {
    setStatus("Create your referral link first.", "error");
    return;
  }

  await navigator.clipboard.writeText(link);
  setStatus("Referral link copied.");
  trackReferWinEvent("public_referral_link_copy");
}

function openWhatsAppShare() {
  const link = getReferralLink();

  if (!link) {
    setStatus("Create your referral link first.", "error");
    return;
  }

  const message = `I found Freehub, a South African site for competitions and freebies. Join or follow here and we can stand a chance to win airtime: ${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  trackReferWinEvent("public_referral_whatsapp_share");
}

function renderReferralResult() {
  const result = document.querySelector("[data-public-referral-result]");

  if (!result) {
    return;
  }

  const link = getReferralLink();

  if (!link) {
    result.hidden = true;
    return;
  }

  result.hidden = false;
  result.querySelectorAll("[data-public-referral-link]").forEach((input) => {
    input.value = link;
  });
  result.querySelectorAll("[data-public-referral-code]").forEach((element) => {
    element.textContent = state.lead.referralCode;
  });
  result.querySelectorAll("[data-public-referral-contact-masked]").forEach((element) => {
    element.textContent = state.lead.contactMasked || "your contact";
  });
  result.querySelectorAll("[data-public-referral-channel-link]").forEach((element) => {
    element.href = WHATSAPP_CHANNEL_URL;
  });
}

function getReferralLink() {
  const code = normalizeReferralCode(state.lead?.referralCode);
  return code ? `${window.location.origin}/refer-and-win/?ref=${encodeURIComponent(code)}` : "";
}

function captureReferralFromUrl() {
  const url = new URL(window.location.href);
  const referralCode = normalizeReferralCode(url.searchParams.get("ref"));

  if (!referralCode) {
    return getStoredReferralAttribution();
  }

  const attribution = {
    referralCode,
    landingPath: `${window.location.pathname}${window.location.search}`,
    capturedAt: new Date().toISOString(),
    expiresAt: Date.now() + REFERRAL_TTL_MS,
    visitRecorded: false,
  };

  window.localStorage.setItem(REFERRAL_ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
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

function getStoredPublicReferralLead() {
  try {
    const lead = JSON.parse(window.localStorage.getItem(PUBLIC_REFERRAL_KEY) || "null");
    return normalizeReferralCode(lead?.referralCode) ? lead : null;
  } catch (error) {
    return null;
  }
}

function setStatus(message, status = "") {
  document.querySelectorAll("[data-public-referral-status]").forEach((element) => {
    element.textContent = message;
    element.dataset.status = status;
  });
}

function setBusy(element, busy) {
  if (element) {
    element.disabled = busy;
  }
}

function normalizeReferralCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^FH[A-Z0-9]{5,6}$/.test(code) ? code : "";
}

function trackReferWinEvent(name, params = {}) {
  const payload = {
    page_type: "refer_win",
    ...params,
  };

  if (window.FreeHubAnalytics?.track) {
    window.FreeHubAnalytics.track(name, payload);
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: name,
    ...payload,
  });
}
