import { getFirebaseClient } from "./firebase-client.js";

const state = {
  client: null,
  user: null,
  admin: null,
  referrals: [],
  participants: [],
  userCache: new Map(),
};

document.addEventListener("DOMContentLoaded", initReferralAdmin);

async function initReferralAdmin() {
  bindActions();
  setMonthDefault();
  setStatus("Checking admin access...");

  try {
    state.client = await getFirebaseClient();
  } catch (error) {
    state.client = null;
  }

  if (!state.client) {
    setStatus("Firebase is unavailable. Admin review cannot load.");
    renderAccessState("Firebase unavailable", "Check the Firebase runtime config and try again.");
    return;
  }

  state.client.onAuthStateChanged(async (user) => {
    state.user = user;

    if (!user) {
      state.admin = null;
      renderAccessState("Admin sign-in required", "Sign in with the Google account that has an active admins/{uid} document.");
      return;
    }

    await loadAdminState();
  });
}

function bindActions() {
  document.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-referral-admin-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.referralAdminAction;

    if (action === "signin") {
      await signIn(actionElement);
    } else if (action === "signout") {
      await signOut(actionElement);
    } else if (action === "refresh") {
      await loadReferralQueue();
    } else if (action === "approve") {
      await reviewReferral(actionElement.dataset.attributionId, "approved");
    } else if (action === "reject") {
      await reviewReferral(actionElement.dataset.attributionId, "rejected");
    }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.matches("[data-referral-admin-filter]")) {
      await loadReferralQueue();
    }
  });
}

async function signIn(button) {
  setBusy(button, true);
  setStatus("Opening Google sign-in...");

  try {
    await state.client.signInWithGoogle();
  } catch (error) {
    setStatus("Google sign-in was not completed.");
  } finally {
    setBusy(button, false);
  }
}

async function signOut(button) {
  setBusy(button, true);

  try {
    await state.client.signOut();
  } catch (error) {
    setStatus("Could not sign out right now.");
  } finally {
    setBusy(button, false);
  }
}

async function loadAdminState() {
  setStatus("Verifying admin access...");

  try {
    const admin = await state.client.helpers.getAdminProfile(state.user.uid);
    state.admin = admin?.active === true ? admin : null;
  } catch (error) {
    state.admin = null;
  }

  if (!state.admin) {
    renderAccessState(
      "No active admin record",
      "Create admins/" + state.user.uid + " with active: true in Firebase Console, then refresh."
    );
    return;
  }

  renderAdminReady();
  await loadReferralQueue();
}

async function loadReferralQueue() {
  if (!state.user || !state.admin) {
    return;
  }

  setStatus("Loading referral review queue...");
  setBusy(document.querySelector('[data-referral-admin-action="refresh"]'), true);

  try {
    const status = document.querySelector("[data-referral-admin-status]")?.value || "pending_verification";
    const campaignMonth = document.querySelector("[data-referral-admin-month]")?.value || getCampaignMonth();
    const [referrals, monthlyReferrals, participants] = await Promise.all([
      state.client.helpers.getReferralAttributions({
        status,
        campaignMonth,
        limit: 200,
      }),
      state.client.helpers.getReferralAttributions({
        status: "all",
        campaignMonth,
        limit: 500,
      }),
      state.client.helpers.getReferWinParticipantProfiles({ limit: 500 }).catch(() => []),
    ]);

    state.referrals = referrals.sort(compareReferralDates);
    state.participants = participants;
    const monthlySorted = monthlyReferrals.sort(compareReferralDates);
    await loadUserContexts([...state.referrals, ...monthlySorted]);
    renderSummary(monthlySorted);
    renderParticipantReadiness(participants);
    renderTopReferrers(monthlySorted);
    renderReferralList(state.referrals);
    setStatus(`${state.referrals.length} referral ${state.referrals.length === 1 ? "record" : "records"} loaded.`);
  } catch (error) {
    setStatus("Could not load referrals. Check Firestore rules and admin access.");
    renderReferralList([]);
  } finally {
    setBusy(document.querySelector('[data-referral-admin-action="refresh"]'), false);
  }
}

async function loadUserContexts(referrals) {
  const userIds = new Set();

  referrals.forEach((referral) => {
    if (referral.referrerUid) userIds.add(referral.referrerUid);
    if (referral.referredUid) userIds.add(referral.referredUid);
  });

  await Promise.all(
    [...userIds].map(async (userId) => {
      if (state.userCache.has(userId)) {
        return;
      }

      try {
        const profile = await state.client.helpers.getUserProfile(userId);
        state.userCache.set(userId, profile || { userId });
      } catch (error) {
        state.userCache.set(userId, { userId });
      }
    })
  );
}

async function reviewReferral(attributionId, status) {
  const referral = state.referrals.find((entry) => entry.attributionId === attributionId || entry.id === attributionId);

  if (!referral || referral.status !== "pending_verification") {
    setStatus("Only pending referrals can be reviewed.");
    return;
  }

  const reasonInput = document.querySelector(`[data-rejection-reason="${cssEscape(attributionId)}"]`);
  const rejectionReason = status === "rejected" ? String(reasonInput?.value || "").trim() : "";

  if (status === "rejected" && rejectionReason.length < 3) {
    setStatus("Add a rejection reason before rejecting.");
    reasonInput?.focus();
    return;
  }

  try {
    await state.client.helpers.updateReferralReview(attributionId, { status, rejectionReason }, state.user);
    setStatus(status === "approved" ? "Referral approved." : "Referral rejected.");
    await loadReferralQueue();
  } catch (error) {
    setStatus("Could not update that referral. Check admin rules and try again.");
  }
}

function renderAccessState(title, message) {
  toggleSignedIn(Boolean(state.user));
  document.querySelector("[data-referral-admin-gate]").hidden = false;
  document.querySelector("[data-referral-admin-content]").hidden = true;
  document.querySelector("[data-referral-admin-gate-title]").textContent = title;
  document.querySelector("[data-referral-admin-gate-message]").textContent = message;
  setStatus(message);
}

function renderAdminReady() {
  toggleSignedIn(true);
  document.querySelector("[data-referral-admin-gate]").hidden = true;
  document.querySelector("[data-referral-admin-content]").hidden = false;
  document.querySelector("[data-referral-admin-email]").textContent = state.admin.email || state.user.email || "Admin";
}

function toggleSignedIn(isSignedIn) {
  document.querySelectorAll('[data-referral-admin-action="signin"]').forEach((button) => {
    button.hidden = isSignedIn;
  });
  document.querySelectorAll('[data-referral-admin-action="signout"]').forEach((button) => {
    button.hidden = !isSignedIn;
  });
}

function renderSummary(referrals) {
  const counts = getMonthlyCounts(referrals);
  setText("[data-referral-count-total]", String(referrals.length));
  setText("[data-referral-count-pending]", String(counts.pending_verification || 0));
  setText("[data-referral-count-approved]", String(counts.approved || 0));
  setText("[data-referral-count-rejected]", String(counts.rejected || 0));
}

function renderParticipantReadiness(participants) {
  const optedIn = participants.filter((profile) => profile.referWinParticipant === true);
  const missingMobile = optedIn.filter((profile) => !isValidMobileNumber(profile.mobileNumber));
  const missingTerms = optedIn.filter((profile) => profile.referWinTermsAccepted !== true);

  setText("[data-referral-participant-count]", String(optedIn.length));
  setText("[data-referral-missing-mobile-count]", String(missingMobile.length));
  setText("[data-referral-missing-terms-count]", String(missingTerms.length));
}

function renderTopReferrers(referrals) {
  const list = document.querySelector("[data-referral-top-referrers]");

  if (!list) {
    return;
  }

  const grouped = new Map();

  referrals.forEach((referral) => {
    const key = referral.referrerUid || "unknown";
    const current = grouped.get(key) || { uid: key, approved: 0, pending: 0, rejected: 0 };
    if (referral.status === "approved") current.approved += 1;
    if (referral.status === "pending_verification") current.pending += 1;
    if (referral.status === "rejected") current.rejected += 1;
    grouped.set(key, current);
  });

  const rows = [...grouped.values()]
    .sort((left, right) => right.approved - left.approved || right.pending - left.pending)
    .slice(0, 8);

  if (rows.length === 0) {
    list.innerHTML = `<p class="admin-empty">No referral records for this filter.</p>`;
    return;
  }

  list.innerHTML = rows
    .map((row) => {
      const profile = state.userCache.get(row.uid) || {};
      const readiness = getParticipantReadinessLabel(profile);
      return `<article class="admin-referral-rank">
        <div>
          <strong>${escapeHtml(profile.displayName || profile.email || shortId(row.uid))}</strong>
          <span>${escapeHtml(shortId(row.uid))}</span>
        </div>
        <p>${row.approved} approved · ${row.pending} pending · ${row.rejected} rejected</p>
        <p class="admin-referral-rank__readiness">Participant readiness: ${escapeHtml(readiness)}</p>
      </article>`;
    })
    .join("");
}

function renderReferralList(referrals) {
  const list = document.querySelector("[data-referral-admin-list]");

  if (!list) {
    return;
  }

  if (referrals.length === 0) {
    list.innerHTML = `<article class="admin-empty">
      <h3>No referral records found</h3>
      <p>Pending referrals will appear here after users sign in from a captured referral link.</p>
    </article>`;
    return;
  }

  list.innerHTML = referrals.map(renderReferralCard).join("");
}

function renderReferralCard(referral) {
  const referrer = state.userCache.get(referral.referrerUid) || {};
  const referred = state.userCache.get(referral.referredUid) || {};
  const isPending = referral.status === "pending_verification";
  const attributionId = referral.attributionId || referral.id;

  return `<article class="admin-referral-card">
    <div class="admin-referral-card__header">
      <div>
        <p class="section-kicker">${escapeHtml(referral.campaignMonth || "No month")}</p>
        <h3>${escapeHtml(referral.referralCode || "Referral")}</h3>
      </div>
      <span class="admin-status admin-status--${escapeAttribute(referral.status || "unknown")}">${escapeHtml(formatStatus(referral.status))}</span>
    </div>
    <dl class="admin-referral-details">
      ${renderDetail("Referrer", formatUser(referrer, referral.referrerUid))}
      ${renderDetail("Referred user", formatUser(referred, referral.referredUid))}
      ${renderDetail("Captured", formatTimestamp(referral.capturedAt))}
      ${renderDetail("Registered", formatTimestamp(referral.registeredAt))}
      ${renderDetail("Landing path", referral.landingPath || "Not captured")}
      ${renderDetail("Rejection reason", referral.rejectionReason || "None")}
    </dl>
    <div class="admin-referral-review">
      <label>
        <span>Rejection reason</span>
        <textarea data-rejection-reason="${escapeAttribute(attributionId)}" rows="3" maxlength="500" ${isPending ? "" : "disabled"}>${escapeHtml(
          referral.rejectionReason || ""
        )}</textarea>
      </label>
      <div class="admin-referral-review__actions">
        <button class="btn btn--primary" type="button" data-referral-admin-action="approve" data-attribution-id="${escapeAttribute(
          attributionId
        )}" ${isPending ? "" : "disabled"}>Approve</button>
        <button class="btn btn--secondary" type="button" data-referral-admin-action="reject" data-attribution-id="${escapeAttribute(
          attributionId
        )}" ${isPending ? "" : "disabled"}>Reject</button>
      </div>
    </div>
  </article>`;
}

function renderDetail(label, value) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "Not available")}</dd></div>`;
}

function getMonthlyCounts(referrals) {
  return referrals.reduce((counts, referral) => {
    const status = referral.status || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function getParticipantReadinessLabel(profile = {}) {
  if (profile.referWinParticipant !== true) {
    return "not opted in";
  }

  if (profile.referWinTermsAccepted !== true) {
    return "missing terms";
  }

  if (!isValidMobileNumber(profile.mobileNumber)) {
    return "missing mobile";
  }

  return "ready";
}

function setMonthDefault() {
  const input = document.querySelector("[data-referral-admin-month]");
  if (input && !input.value) {
    input.value = getCampaignMonth();
  }
}

function getCampaignMonth() {
  const configuredMonth = window.FREEHUB_REFER_WIN_CONFIG?.campaignMonth;
  return /^\d{4}-\d{2}$/.test(configuredMonth) ? configuredMonth : getCurrentMonth();
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function isValidMobileNumber(value) {
  return /^27[6-8]\d{8}$/.test(String(value || ""));
}

function compareReferralDates(left, right) {
  return getMillis(right.registeredAt || right.capturedAt) - getMillis(left.registeredAt || left.capturedAt);
}

function getMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatTimestamp(value) {
  if (!value) return "Not available";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status) {
  return String(status || "unknown").replace(/_/g, " ");
}

function formatUser(profile, fallbackUid) {
  const name = profile?.displayName || "No name";
  const email = profile?.email || "No email";
  return `${name} · ${email} · ${shortId(fallbackUid)}`;
}

function shortId(value) {
  const text = String(value || "unknown");
  return text.length > 12 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text;
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function setStatus(message) {
  setText("[data-referral-admin-status-text]", message);
}

function setBusy(element, busy) {
  if (element) {
    element.disabled = busy;
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return String(value || "").replace(/"/g, '\\"');
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
