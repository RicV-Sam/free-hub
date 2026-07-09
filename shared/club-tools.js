const TOOL_STORAGE_KEY = "freehubClubTools";
const LOTTO_GAMES = {
  lotto: { label: "Lotto", mainCount: 6, mainMax: 52 },
  powerball: { label: "PowerBall", mainCount: 5, mainMax: 50, bonusLabel: "PowerBall", bonusMax: 20 },
  daily: { label: "Daily Lotto", mainCount: 5, mainMax: 36 },
};

const RISK_WEIGHTS = {
  payment: 3,
  banking: 4,
  pressure: 2,
  unofficial: 2,
  unknown: 2,
};

const state = {
  storage: readStorage(),
  lastLottoSet: null,
};

document.addEventListener("DOMContentLoaded", initClubTools);
document.addEventListener("freehub:club-state-rendered", renderProofVault);

function initClubTools() {
  if (!document.querySelector("[data-club-tools]")) {
    return;
  }

  bindToolActions();
  renderSavedLottoSets();
  renderProofVault();
}

function bindToolActions() {
  document.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-tool-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.toolAction;

    if (action === "generate-lotto") {
      generateLottoNumbers();
    } else if (action === "save-lotto") {
      saveCurrentLottoSet();
    } else if (action === "calculate-cost") {
      calculateEntryCost();
    } else if (action === "check-scam") {
      checkScamRisk();
    } else if (action === "save-proof") {
      saveProofNote(actionElement.dataset.competitionId);
    } else if (action === "clear-proof") {
      clearProofNote(actionElement.dataset.competitionId);
    } else if (action === "remove-lotto") {
      removeLottoSet(actionElement.dataset.lottoId);
    }
  });
}

function generateLottoNumbers() {
  const gameKey = document.querySelector("[data-lotto-game]")?.value || "lotto";
  const game = LOTTO_GAMES[gameKey] || LOTTO_GAMES.lotto;
  const mainNumbers = drawUniqueNumbers(game.mainCount, game.mainMax);
  const bonus = game.bonusMax ? drawUniqueNumbers(1, game.bonusMax)[0] : null;
  const set = {
    id: `${Date.now()}`,
    gameKey,
    gameLabel: game.label,
    mainNumbers,
    bonus,
    createdAt: new Date().toISOString(),
  };

  state.lastLottoSet = set;
  renderLottoResult(set);
  trackToolEvent("club_tool_lotto_generate", { lotto_game: gameKey });
}

function saveCurrentLottoSet() {
  if (!state.lastLottoSet) {
    generateLottoNumbers();
  }

  state.storage.lottoSets = [state.lastLottoSet, ...getSavedLottoSets()].slice(0, 10);
  writeStorage();
  renderSavedLottoSets();
  setText("[data-lotto-result]", `Saved ${formatLottoSet(state.lastLottoSet)}.`);
  trackToolEvent("club_tool_lotto_save", { lotto_game: state.lastLottoSet.gameKey });
}

function removeLottoSet(lottoId) {
  state.storage.lottoSets = getSavedLottoSets().filter((set) => set.id !== lottoId);
  writeStorage();
  renderSavedLottoSets();
}

function calculateEntryCost() {
  const spend = readNumber("[data-cost-spend]");
  const entries = Math.max(1, Math.floor(readNumber("[data-cost-entries]") || 1));
  const prize = readNumber("[data-cost-prize]");
  const oddsNote = document.querySelector("[data-cost-odds]")?.value.trim();
  const costPerEntry = spend / entries;
  const prizeRatio = spend > 0 && prize > 0 ? prize / spend : null;
  const parts = [
    `Cost per entry: ${formatRand(costPerEntry)}.`,
    spend === 0 ? "This looks like a free-entry competition." : `Total tracked spend: ${formatRand(spend)}.`,
  ];

  if (prizeRatio) {
    parts.push(`Prize value is about ${prizeRatio.toFixed(prizeRatio >= 10 ? 0 : 1)}x your spend.`);
  }

  if (oddsNote) {
    parts.push(`Chance note: ${oddsNote}.`);
  } else {
    parts.push("Odds are not known, so use this as a spend check rather than a winning prediction.");
  }

  setText("[data-cost-result]", parts.join(" "));
  trackToolEvent("club_tool_cost_calculate", { entries, has_prize_value: prize > 0 });
}

function checkScamRisk() {
  const selected = Array.from(document.querySelectorAll("[data-risk-item]:checked")).map((input) => input.value);
  const score = selected.reduce((sum, value) => sum + (RISK_WEIGHTS[value] || 0), 0);
  let message = "Low risk based on the items selected. Still confirm the message against the official promoter page before sharing personal details.";

  if (score >= 6) {
    message = "High risk. Do not pay, do not share OTPs or banking details, and verify through the promoter's official website or customer-care channel.";
  } else if (score >= 3) {
    message = "Medium risk. Pause before responding and confirm the sender, competition page and winner process from official sources.";
  }

  setText("[data-risk-result]", `${message} Risk score: ${score}.`);
  trackToolEvent("club_tool_scam_check", { risk_score: score });
}

function renderProofVault() {
  const list = document.querySelector("[data-proof-vault-list]");

  if (!list) {
    return;
  }

  const trackedCompetitions = getTrackedCompetitions();

  if (trackedCompetitions.length === 0) {
    list.innerHTML = `<article class="club-empty-state">
      <h3>No tracked competitions yet</h3>
      <p>Mark a competition as interested or entered, then use this vault to store reference notes and reminder dates.</p>
    </article>`;
    return;
  }

  list.innerHTML = trackedCompetitions.map(renderProofVaultItem).join("");
}

function renderProofVaultItem(competition) {
  const proof = getProofNote(competition.competitionId);
  const closingDate = formatDate(competition.closingDate);

  return `<article class="club-proof-item">
    <div class="club-proof-item__summary">
      <p class="club-saved-item__meta">${escapeHtml([competition.brand, competition.category].filter(Boolean).join(" - ") || "Tracked competition")}</p>
      <h4><a href="${escapeAttribute(competition.path)}">${escapeHtml(competition.title)}</a></h4>
      <p>${closingDate ? `Closes ${escapeHtml(closingDate)}` : "Check the listing for the current closing date."}</p>
    </div>
    <div class="club-proof-fields">
      <label><span>Entry reference</span><input type="text" data-proof-reference="${escapeAttribute(competition.competitionId)}" value="${escapeAttribute(proof.reference)}" placeholder="SMS, form ID or email subject" /></label>
      <label><span>Proof note</span><input type="text" data-proof-note="${escapeAttribute(competition.competitionId)}" value="${escapeAttribute(proof.note)}" placeholder="Receipt stored, screenshot saved, WhatsApp sent" /></label>
      <label><span>Reminder</span><input type="date" data-proof-reminder="${escapeAttribute(competition.competitionId)}" value="${escapeAttribute(proof.reminderDate)}" /></label>
    </div>
    <div class="club-tool-actions">
      <button class="btn btn--primary" type="button" data-tool-action="save-proof" data-competition-id="${escapeAttribute(competition.competitionId)}">Save note</button>
      <button class="btn btn--secondary" type="button" data-tool-action="clear-proof" data-competition-id="${escapeAttribute(competition.competitionId)}">Clear</button>
    </div>
  </article>`;
}

function saveProofNote(competitionId) {
  if (!competitionId) {
    return;
  }

  const reference = document.querySelector(`[data-proof-reference="${cssEscape(competitionId)}"]`)?.value.trim() || "";
  const note = document.querySelector(`[data-proof-note="${cssEscape(competitionId)}"]`)?.value.trim() || "";
  const reminderDate = document.querySelector(`[data-proof-reminder="${cssEscape(competitionId)}"]`)?.value || "";

  state.storage.proofVault = {
    ...state.storage.proofVault,
    [competitionId]: {
      reference,
      note,
      reminderDate,
      updatedAt: new Date().toISOString(),
    },
  };
  writeStorage();
  setText("[data-proof-status]", "Proof note saved on this device.");
  trackToolEvent("club_tool_proof_save", { competition_id: competitionId });
}

function clearProofNote(competitionId) {
  if (!competitionId) {
    return;
  }

  delete state.storage.proofVault[competitionId];
  writeStorage();
  renderProofVault();
}

function getTrackedCompetitions() {
  const authSaved = window.FreeHubClub?.savedCompetitions || window.FreeHubAuth?.getLocalSavedCompetitions?.() || [];
  const dashboardCompetitions = Array.isArray(window.FREEHUB_CLUB_COMPETITIONS) ? window.FREEHUB_CLUB_COMPETITIONS : [];
  const localById = new Map(
    authSaved
      .filter((competition) => competition?.competitionId && competition.status !== "skipped")
      .map((competition) => [competition.competitionId, normalizeCompetition(competition)])
  );

  dashboardCompetitions.forEach((competition) => {
    if (competition?.competitionId && localById.has(competition.competitionId)) {
      localById.set(competition.competitionId, {
        ...normalizeCompetition(competition),
        ...localById.get(competition.competitionId),
      });
    }
  });

  return Array.from(localById.values()).slice(0, 30);
}

function normalizeCompetition(competition) {
  return {
    competitionId: competition.competitionId || competition.id,
    title: competition.title || "Tracked competition",
    brand: competition.brand || "",
    category: competition.category || "",
    closingDate: competition.closingDate || "",
    path: competition.path || `/competition/${competition.slug || competition.competitionId || competition.id}/`,
  };
}

function getProofNote(competitionId) {
  const proof = state.storage.proofVault?.[competitionId] || {};
  return {
    reference: proof.reference || "",
    note: proof.note || "",
    reminderDate: /^\d{4}-\d{2}-\d{2}$/.test(proof.reminderDate) ? proof.reminderDate : "",
  };
}

function getSavedLottoSets() {
  return Array.isArray(state.storage.lottoSets) ? state.storage.lottoSets : [];
}

function renderLottoResult(set) {
  setText("[data-lotto-result]", formatLottoSet(set));
}

function renderSavedLottoSets() {
  const list = document.querySelector("[data-lotto-saved]");

  if (!list) {
    return;
  }

  const sets = getSavedLottoSets();

  if (sets.length === 0) {
    list.innerHTML = `<p class="club-tool-muted">Saved number sets will appear here.</p>`;
    return;
  }

  list.innerHTML = sets
    .map(
      (set) => `<div class="club-lotto-set">
        <span>${escapeHtml(formatLottoSet(set))}</span>
        <button type="button" data-tool-action="remove-lotto" data-lotto-id="${escapeAttribute(set.id)}" aria-label="Remove saved number set">x</button>
      </div>`
    )
    .join("");
}

function formatLottoSet(set) {
  if (!set) {
    return "";
  }

  const main = Array.isArray(set.mainNumbers) ? set.mainNumbers.join(", ") : "";
  const bonus = Number.isFinite(set.bonus) ? ` | ${LOTTO_GAMES[set.gameKey]?.bonusLabel || "Bonus"}: ${set.bonus}` : "";
  return `${set.gameLabel || "Numbers"}: ${main}${bonus}`;
}

function drawUniqueNumbers(count, max) {
  const numbers = new Set();
  const randomValues = new Uint32Array(count * 4);

  while (numbers.size < count) {
    window.crypto.getRandomValues(randomValues);
    randomValues.forEach((value) => {
      if (numbers.size < count) {
        numbers.add((value % max) + 1);
      }
    });
  }

  return Array.from(numbers).sort((left, right) => left - right);
}

function readStorage() {
  try {
    const value = JSON.parse(window.localStorage.getItem(TOOL_STORAGE_KEY) || "{}");
    return {
      lottoSets: Array.isArray(value.lottoSets) ? value.lottoSets : [],
      proofVault: value.proofVault && typeof value.proofVault === "object" ? value.proofVault : {},
    };
  } catch (error) {
    return { lottoSets: [], proofVault: {} };
  }
}

function writeStorage() {
  window.localStorage.setItem(TOOL_STORAGE_KEY, JSON.stringify(state.storage));
}

function readNumber(selector) {
  const value = Number.parseFloat(document.querySelector(selector)?.value || "0");
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatRand(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value || 0);
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

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = value;
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, "\\$&");
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

function trackToolEvent(name, params = {}) {
  const payload = {
    page_type: "club_dashboard",
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
