import { getDashClient } from "./airtime-dash-api.js?v=dash-nickname-1";
import { createNicknameRestorer } from "./airtime-dash-nickname.js?v=dash-nickname-1";
const E = window.FreeHubDashEngine;
const $ = id => document.getElementById(`dash-${id}`);
const canvas = $("canvas"), ctx = canvas.getContext("2d"), sprite = new Image();
const arcade = $("arcade"), expandButton = $("expand");
let expanded = false, inertSiblings = [];
function fitExpandedBoard() {
  if (!expanded) { canvas.style.removeProperty("width"); canvas.style.removeProperty("height"); return; }
  const board = canvas.parentElement;
  const width = Math.max(0, Math.min(board.clientWidth - 16, board.clientHeight * canvas.width / canvas.height));
  canvas.style.width = `${width}px`; canvas.style.height = `${width * canvas.height / canvas.width}px`;
}
new ResizeObserver(fitExpandedBoard).observe(canvas.parentElement);
function expandGame(value) {
  expanded = value; arcade.classList.toggle("dash-arcade--expanded", value);
  document.body.classList.toggle("dash-game-expanded", value);
  expandButton.textContent = value ? "Return to page" : "Expand game";
  expandButton.setAttribute("aria-expanded", String(value));
  fitExpandedBoard();
  if (value) {
    arcade.setAttribute("role", "dialog"); arcade.setAttribute("aria-modal", "true");
    for (let branch = arcade; branch.parentElement; branch = branch.parentElement) {
      for (const sibling of branch.parentElement.children) if (sibling !== branch) {
        inertSiblings.push([sibling, sibling.inert]); sibling.inert = true;
      }
      if (branch.parentElement === document.body) break;
    }
    canvas.focus({ preventScroll: true });
  } else {
    arcade.removeAttribute("role"); arcade.removeAttribute("aria-modal");
    for (const [element, prior] of inertSiblings) element.inert = prior;
    inertSiblings = []; expandButton.focus({ preventScroll: true });
  }
}
expandButton.addEventListener("click", () => expandGame(!expanded));
document.addEventListener("keydown", e => {
  if (!expanded) return;
  if (e.key === "Escape") { e.preventDefault(); expandGame(false); return; }
  if (e.key !== "Tab") return;
  const controls = [...arcade.querySelectorAll('button:not(:disabled), a[href], input, canvas[tabindex]')].filter(element => element.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
sprite.src = "/assets/mascot/direct-v1-160.webp";
const tile = canvas.width / E.CONFIG.width;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let client, config, run = null, lastMode = "practice", challenge = null, challengeLink = "", busy = false;
let readyMode = "practice", readyOwner = null;
let initial = E.create();
function status(message) { $("status").textContent = message; }
function event(name, data = {}) { window.dataLayer?.push({ event: name, game_version: E.VERSION.game, ...data }); }
function updateEntryActions() {
  for (const button of document.querySelectorAll("[data-dash-enter]")) {
    button.disabled = !config?.live;
    button.textContent = config?.live ? client?.user ? "Prepare competition run" : "Sign in & compete" : "Prize entry closed";
  }
  if (config?.competition) {
    const c = config.competition;
    $("prize").textContent = c.prizeTitle;
    $("entry-copy").textContent = config.live ? "Highest verified score wins. Free entry; no purchase necessary." : "Prize entry is closed. Practice is still open.";
    $("hero-prize").textContent = config.live ? `${c.prizeTitle} · Highest eligible verified score wins` : "Free practice · Challenge your friends with verified scores";
    if (!client.preview) $("competition").textContent = `${c.title} · ${c.prizeTitle} · ${config.live ? "Entry open" : "Entry closed"} · Closes ${new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" }).format(c.endAt)} SAST`;
  }
}
function entryUnavailable() {
  $("hero-prize").textContent = "Free practice · Prize details unavailable";
  $("competition").textContent = "Competition details are temporarily unavailable. Practice is open; retry by reloading the page.";
  $("entry-copy").textContent = "Prize entry is unavailable while we check the competition details. Practice remains free.";
  $("board-status").textContent = "Leaderboard temporarily unavailable. Try again by reloading the page.";
  $("board-refresh").disabled = true;
  $("current-rules").textContent = "Current competition rules could not load. Reload to check them before entering.";
  for (const button of document.querySelectorAll("[data-dash-enter]")) { button.disabled = true; button.textContent = "Prize entry unavailable"; }
}
function showEntry() {
  if (expanded) expandGame(false);
  $("entry").scrollIntoView({ block: "center", behavior: "instant" });
  if (client?.user) { $("terms").elements.displayName.focus({ preventScroll: true }); return; }
  if (window.FreeHubAuth?.openSignupModal) window.FreeHubAuth.openSignupModal(document.querySelector(".dash-account"), "airtime");
  else { $("entry").focus({ preventScroll: true }); status("Sign-in is still loading. Use Sign in & compete in the entry panel when it is ready."); }
}
for (const button of document.querySelectorAll("[data-dash-enter]")) button.addEventListener("click", () => { event("game_entry_intent", { placement: button.id === "dash-result-enter" ? "practice_result" : "hero" }); showEntry(); });
document.addEventListener("freehub:signin-complete", () => { if (config?.live) showEntry(); });
$("try").addEventListener("click", e => {
  e.preventDefault();
  if (!run || run.ended) prepare("practice");
  else { arcade.scrollIntoView({ block: "start", behavior: "instant" }); canvas.focus({ preventScroll: true }); }
});
document.querySelector('#dash-terms a[href="#dash-rules"]').addEventListener("click", () => { $("full-rules").open = true; });
function draw(state) {
  ctx.fillStyle = "#102b27"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < E.CONFIG.height; y++) for (let x = 0; x < E.CONFIG.width; x++) {
    const at = E.index(x, y), px = x * tile, py = y * tile;
    if (state.walls[at]) {
      ctx.fillStyle = "#316548"; ctx.beginPath(); ctx.roundRect(px + 2, py + 2, tile - 4, tile - 4, 5); ctx.fill();
      ctx.fillStyle = "#517e50"; ctx.fillRect(px + 6, py + 4, tile - 12, 2);
    } else if (state.items[at]) {
      const item = state.items[at];
      if (item === 1) { ctx.fillStyle = "#e9c875"; ctx.beginPath(); ctx.arc(px + tile / 2, py + tile / 2, 3.2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = ["", "", "#9ce1d5", "#ffc265", "#efb3c5", "#fff4ad"][item]; ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(["", "", "◆", "▰", "▣", "★"][item], px + tile / 2, py + tile / 2); }
    }
  }
  state.enemies.forEach((enemy, i) => {
    const x = enemy.x * tile + tile / 2, y = enemy.y * tile + tile / 2;
    // Original scam-bot obstacles: square chassis, aerial, bolt eyes and barred mouth.
    ctx.fillStyle = ["#f19071", "#dda2c8", "#b2adf0", "#8cbed7"][i];
    ctx.beginPath(); ctx.roundRect(x - 10, y - 9, 20, 19, 3); ctx.fill(); ctx.fillRect(x - 1, y - 14, 2, 5);
    ctx.fillStyle = "#263833"; ctx.fillRect(x - 6, y - 3, 4, 4); ctx.fillRect(x + 2, y - 3, 4, 4); ctx.fillRect(x - 5, y + 5, 10, 2);
  });
  const px = state.player.x * tile, py = state.player.y * tile;
  ctx.save(); if (state.tick < state.protectedUntil && !reduced && Math.floor(state.tick / 4) % 2) ctx.globalAlpha = .55;
  ctx.fillStyle = "#f2d37c"; ctx.beginPath(); ctx.arc(px + tile / 2, py + tile / 2, 13, 0, Math.PI * 2); ctx.fill();
  if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, px - 1, py - 6, tile + 2, tile + 10);
  else { ctx.fillStyle = "#173a35"; ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.fillText("FH", px + tile / 2, py + tile / 2); }
  ctx.restore();
  $("score").textContent = state.score.toLocaleString("en-ZA"); $("level").textContent = state.level; $("lives").textContent = state.lives;
}
draw(initial); sprite.onload = () => draw(run?.state || initial);
async function load() {
  event("game_page_view");
  try {
    client = await getDashClient();
    const restoreNickname = createNicknameRestorer($("terms").elements.displayName, client);
    client.onAuth(user => {
      $("terms").hidden = !user || !config?.live;
      restoreNickname(user);
      if (readyMode === "ranked" && readyOwner !== user?.uid) prepare("practice");
      if (config) { updateEntryActions(); refreshBoard(); }
    });
    if (!client.available) { entryUnavailable(); return; }
    config = await client.call("config");
    $("terms").hidden = !client.user || !config.live;
    await restoreNickname(client.user);
    updateEntryActions();
    if (client.preview) {
      $("competition").textContent = "LOCAL PREVIEW · Test scores and accounts only. No real prize entry, registration or payout.";
      $("ranked").textContent = "Prepare a test ranked run";
      if (!$("terms").elements.displayName.value) $("terms").elements.displayName.value = "Preview Player";
      document.querySelector(".dash-account").hidden = true;
    }
    if (config.competition) {
      const c = config.competition;
      const summary = $("rule-summary"); summary.replaceChildren();
      for (const text of [`${c.title}: ${c.prizeTitle}. Free entry; no purchase required. Highest eligible verified score wins.`, `Eligibility: ${c.eligibility}`, `Closes ${new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "long", timeStyle: "short" }).format(c.endAt)} SAST. Repeat attempts allowed; one active ranked run per account. Only progress verified before closing counts.`]) { const p = document.createElement("p"); p.textContent = text; summary.append(p); }
      const rules = $("current-rules"); rules.replaceChildren();
      for (const text of [`Eligibility: ${c.eligibility}`, c.rules, `Winner contact: ${c.contactPolicy}`, `Claim deadline: ${c.claimDays} days after notification.`, `Public display: ${c.winnerPolicy}`]) { const p = document.createElement("p"); p.textContent = text; rules.append(p); }
      await refreshBoard();
    } else { $("hero-prize").textContent = "Free practice · Three lives · Endless ranked levels"; $("competition").textContent = "No prize competition is currently configured. Free practice is open."; $("entry-copy").textContent = "Prize entry is closed. Practice is still open."; $("board-status").textContent = "No prize competition is currently configured."; $("board-refresh").disabled = true; $("current-rules").textContent = "Current prize entry rules will appear here before a competition opens."; }
    const incoming = new URLSearchParams(location.search).get("challenge") || sessionStorage.getItem("freehubDashChallenge");
    if (incoming) {
      try {
        challenge = await client.call("challenge.resolve", { token: incoming, visitor: visitor() });
        sessionStorage.setItem("freehubDashChallenge", challenge.token);
        $("challenge").hidden = false;
        $("challenge").textContent = `${challenge.displayName} challenged you. Score to beat: ${challenge.score.toLocaleString("en-ZA")}.${challenge.competitionId !== config.competition?.id ? " This score belongs to an earlier competition; current-month scores use the current rules." : ""}`;
        event("challenge_landing_view");
      } catch (error) { $("challenge").hidden = false; $("challenge").textContent = error.message; sessionStorage.removeItem("freehubDashChallenge"); }
    }
  } catch (error) { entryUnavailable(); status("The competition service is unavailable. Practice is still open."); }
}
function visitor() {
  try { let id = localStorage.getItem("freehubDashVisitor"); if (!id) { id = crypto.randomUUID(); localStorage.setItem("freehubDashVisitor", id); } return id; }
  catch { return crypto.randomUUID(); }
}
async function refreshBoard() {
  if (!config?.competition) return;
  $("board-refresh").disabled = true;
  $("board-status").textContent = "Loading this month's leaderboard…";
  try {
    const board = await client.call("leaderboard", { competitionId: config.competition.id });
    $("leaderboard").replaceChildren();
    for (const row of board.top) { const li = document.createElement("li"), score = document.createElement("span"); li.textContent = row.displayName; score.textContent = row.score.toLocaleString("en-ZA"); li.append(score); $("leaderboard").append(li); }
    $("board-status").textContent = config.live ? board.top.length ? "Best verified score per player." : "Be the first to set a competition score." : "Entries are closed. Standings are subject to verification and winner review.";
    $("own-rank").textContent = board.own ? `Your best: ${board.own.score.toLocaleString("en-ZA")} · Rank #${board.own.rank}` : "";
    $("personal").textContent = $("own-rank").textContent;
    if (client.user) {
      $("challenge-summary").hidden = false;
      try { const summary = await client.call("challenges.summary"); $("summary").textContent = `${summary.shared} links created · ${summary.opened} opens · ${summary.played} qualified players · ${summary.beaten} beat you`; }
      catch { $("summary").textContent = "Challenge activity is temporarily unavailable. Refresh to retry."; }
    } else $("challenge-summary").hidden = true;
  } catch { $("board-status").textContent = "Leaderboard temporarily unavailable. Try Refresh leaderboard. Verified scores are preserved."; }
  finally { $("board-refresh").disabled = false; }
}
$("board-refresh").addEventListener("click", refreshBoard);
function begin(mode, authorised) {
  run = { mode, ranked: mode === "ranked", state: authorised ? structuredClone(authorised.state) : E.create(),
    origin: performance.now() - (authorised ? authorised.serverNow - authorised.startedAt : 0), inputs: [], lastSequence: authorised?.sequence || 0,
    lastAckTick: authorised?.state.tick || 0, sessionId: authorised?.sessionId, pending: null, inflight: null, ended: false, pausedAt: null };
  lastMode = mode; $("cover").hidden = true; $("result").hidden = true; $("stop").disabled = false; $("share").hidden = true;
  $("practice").disabled = true; $("ranked").disabled = true; $("mode").textContent = mode === "ranked" ? (client.preview ? "TEST RANKED" : "RANKED") : "PRACTICE";
  status(mode === "ranked" ? "Your progress is checked as you play. Switching tabs does not pause ranked play." : "25-second practice. Clear the maze, keep your lives. This score does not enter the prize competition.");
  canvas.focus({ preventScroll: true }); if (!expanded) arcade.scrollIntoView({ block: "start", behavior: "instant" });
  draw(run.state); event(mode === "ranked" ? "game_ranked_start" : "game_practice_start");
}
function prepare(mode, owner = null) {
  if (run && !run.ended) return;
  readyMode = mode; readyOwner = owner;
  $("cover").hidden = false; $("result").hidden = true; $("stop").disabled = true;
  $("practice").disabled = false;
  $("cover-title").textContent = mode === "unranked" ? "Ready to continue?" : "Ready to dash?";
  $("cover-copy").textContent = "The maze waits for you. Use arrow keys, WASD, swipes or the direction pad. Click Start when you are ready.";
  $("practice").textContent = mode === "ranked" ? "Start ranked run" : mode === "unranked" ? "Start unranked play" : "Start practice";
  $("ready-note").textContent = mode === "ranked" ? "Three lives · Switching tabs does not pause ranked play" : mode === "unranked" ? "Later points do not count toward the prize" : "25-second demo · No prize entry";
  $("mode").textContent = `${mode.toUpperCase()} · READY`;
  draw(mode === "unranked" ? run.state : initial);
  status("Ready. Nothing moves until you click Start.");
  arcade.scrollIntoView({ block: "start", behavior: "instant" });
  $("practice").focus({ preventScroll: true });
}
$("practice").addEventListener("click", async () => {
  if (busy || (run && !run.ended)) return;
  if (readyMode === "practice") { begin("practice"); return; }
  if (readyMode === "unranked") {
    run.ended = false; run.mode = "unranked"; run.ranked = false; run.origin = performance.now() - run.state.tick * 1000 / E.CONFIG.hz;
    $("cover").hidden = true; $("result").hidden = true; $("mode").textContent = "UNRANKED";
    $("stop").disabled = false; $("practice").disabled = true; $("ranked").disabled = true;
    status("Unranked play. These later points do not count toward the prize."); canvas.focus(); return;
  }
  if (!client.user || client.user.uid !== readyOwner) { prepare("practice"); return; }
  const owner = readyOwner;
  busy = true; $("practice").disabled = true; $("ranked").disabled = true;
  $("cover-title").textContent = "Checking entry…";
  $("cover-copy").hidden = true; $("ready-note").hidden = true;
  try {
    const authorised = await client.call("session.start");
    if (client.user?.uid !== owner) { status("Sign in and prepare your ranked run again."); return; }
    begin("ranked", authorised);
  }
  catch (error) { status(error.message); }
  finally {
    busy = false;
    $("cover-title").textContent = "Ready to dash?";
    $("cover-copy").hidden = false; $("ready-note").hidden = false;
    if (!run || run.ended) { $("practice").disabled = false; $("ranked").disabled = false; }
  }
});
$("terms").addEventListener("submit", async e => {
  e.preventDefault(); if (busy || (run && !run.ended)) return; busy = true; $("ranked").disabled = true;
  try {
    const data = new FormData(e.target), owner = client.user?.uid;
    await client.call("terms.accept", { displayName: data.get("displayName"), accepted: data.get("accepted") === "on", eligible: data.get("eligible") === "on", termsVersion: config.competition.termsVersion,
      challengeToken: challenge?.competitionId === config.competition.id ? challenge.token : null });
    event("game_terms_accepted");
    if (owner && client.user?.uid === owner) prepare("ranked", owner);
    else { prepare("practice"); status("Sign in and prepare your ranked run again."); }
  } catch (error) { status(error.message); $("ranked").disabled = false; }
  finally { busy = false; $("ranked").disabled = false; }
});
function direction(value) {
  if (!run || run.ended) return;
  const tick = run.state.tick + 1;
  if (run.inputs.at(-1)?.tick === tick) run.inputs[run.inputs.length - 1].direction = value;
  else run.inputs.push({ tick, direction: value });
  run.nextDirection = value;
}
const keys = { ArrowUp: 1, w: 1, W: 1, ArrowRight: 2, d: 2, D: 2, ArrowDown: 3, s: 3, S: 3, ArrowLeft: 4, a: 4, A: 4 };
document.addEventListener("keydown", e => {
  if (!run || run.ended || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (keys[e.key]) { e.preventDefault(); if (!e.repeat) direction(keys[e.key]); }
});
document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("pointerdown", e => { e.preventDefault(); direction(Number(button.dataset.direction)); });
  button.addEventListener("click", e => { if (e.detail === 0) direction(Number(button.dataset.direction)); });
});
let touchStart;
canvas.addEventListener("pointerdown", e => { touchStart = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointerup", e => {
  if (!touchStart) return; const dx = e.clientX - touchStart[0], dy = e.clientY - touchStart[1]; touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
  direction(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 2 : 4 : dy > 0 ? 3 : 1);
});
function tick() {
  if (!run || run.ended || run.pausedAt !== null) return;
  const active = run, target = Math.floor((performance.now() - active.origin) * E.CONFIG.hz / 1000);
  if (active.ranked && (target - active.state.tick > E.CONFIG.maxChunkTicks || active.state.tick - active.lastAckTick >= E.CONFIG.maxChunkTicks)) {
    active.ended = true; recoverResult(active); return;
  }
  const steps = Math.min(target - active.state.tick, E.CONFIG.maxChunkTicks);
  for (let n = 0; n < steps && !active.state.gameOver; n++) { E.step(active.state, active.nextDirection || 0); active.nextDirection = 0; }
  if (!active.ranked) active.inputs = [];
  draw(active.state);
  if (active.mode === "practice") $("demo-time").textContent = `${Math.max(0, Math.ceil((E.CONFIG.practiceTicks - active.state.tick) / E.CONFIG.hz))}s demo`;
  if (active.state.gameOver || (active.mode === "practice" && active.state.tick >= E.CONFIG.practiceTicks)) { finish(); return; }
  if (active.ranked && (active.pending || active.state.tick - active.lastAckTick >= E.CONFIG.checkpointTicks) && !active.inflight && performance.now() >= (active.retryAt || 0)) sendCheckpoint(active);
}
setInterval(tick, 50);
document.addEventListener("visibilitychange", () => {
  if (!run || run.ended || run.mode !== "practice") return;
  if (document.hidden) run.pausedAt = performance.now();
  else if (run.pausedAt !== null) { run.origin += performance.now() - run.pausedAt; run.pausedAt = null; }
});
async function sendCheckpoint(active, final = false, endReason = "quit") {
  if (active.inflight) { await active.inflight; if (final && active.ranked) return sendCheckpoint(active, true, endReason); return; }
  const pendingWasFinal = active.pending?.final;
  if (!active.pending) active.pending = { final, data: { sessionId: active.sessionId, sequence: active.lastSequence + 1,
    toTick: active.state.tick, inputs: active.inputs.filter(input => input.tick <= active.state.tick), ...(final ? { endReason } : {}) } };
  const pending = active.pending;
  active.inflight = (async () => {
    try {
      const result = await client.call(pending.final ? "session.finish" : "session.checkpoint", pending.data);
      active.lastSequence = result.sequence; active.lastAckTick = result.state.tick; active.inputs = active.inputs.filter(input => input.tick > pending.data.toTick); active.pending = null;
      if (result.status !== "active") {
        active.ranked = false; active.ended = true; active.verifiedResult = result; await showResult(active, result);
      } else status(`Verified score: ${result.score.toLocaleString("en-ZA")}. Keep going.`);
      event("game_score_verified", { score_band: Math.floor(result.score / 1000) * 1000 });
    } catch (error) { active.retryAt = performance.now() + 3000; status(`${error.message} Previous verified progress is preserved. Retry saving below.`); }
    finally { active.inflight = null; }
  })();
  await active.inflight;
  if (final && pendingWasFinal === false && !active.pending && active.ranked) return sendCheckpoint(active, true, endReason);
  if (final && active.pending) { $("result").hidden = false; $("result-title").textContent = "Score awaiting verification"; $("result-copy").textContent = "Your final progress has not been verified. Use Retry save before starting another ranked run."; $("replay").textContent = "Retry save"; }
}
async function recoverResult(active) {
  $("stop").disabled = true;
  status("Ranked play was interrupted. Checking the last verified score…");
  try { const result = await client.call("session.abandon", { sessionId: active.sessionId }); active.ranked = false; active.verifiedResult = result; await showResult(active, result); }
  catch { status("Your connection is unavailable. Unverified points do not count. Reload to check your last verified result."); $("practice").disabled = false; }
}
async function finish() {
  if (!run || run.ended) return; const active = run; active.ended = true; $("stop").disabled = true;
  if (active.ranked) { status("Checking your final score…"); await sendCheckpoint(active, true, active.state.gameOver ? "lives_lost" : "quit"); }
  else await showResult(active);
}
$("stop").addEventListener("click", finish);
async function showResult(active, result) {
  const verified = result?.verificationStatus === "verified";
  $("stop").disabled = true; $("result").hidden = false; $("practice").disabled = false; $("ranked").disabled = false; $("demo-time").textContent = "";
  $("result-title").textContent = result ? !verified ? result.verificationStatus === "review_required" ? "Score awaiting review" : "Score not eligible" : result.endReason === "deadline" ? "Competition score frozen" : "Verified run" : active.mode === "unranked" ? "Unranked run complete" : "Practice complete";
  $("result-enter").hidden = active.mode !== "practice" || !config?.live;
  updateEntryActions();
  $("result-copy").textContent = result ? !verified ? `This run is ${result.verificationStatus.replaceAll("_", " ")}. ${result.verificationReason || "It does not count on the verified leaderboard."}` : `You scored ${result.score.toLocaleString("en-ZA")} verified points and reached level ${result.level}.${result.challengeOutcome ? ` Challenge: ${result.challengeOutcome === "won" ? "you beat the score!" : result.challengeOutcome === "tie" ? "a tie." : "the challenger is still ahead."}` : ""}` : `You scored ${active.state.score.toLocaleString("en-ZA")} and reached level ${active.state.level}. ${active.mode === "unranked" ? "These later points do not count toward the competition." : config?.live ? "Use your free FreeHub account to save ranked scores and enter the competition." : "Sign in when prize entry opens to save a ranked score."}`;
  if (active.mode === "practice" && config?.live) $("result-copy").textContent = `You scored ${active.state.score.toLocaleString("en-ZA")} and reached level ${active.state.level}. That was practice. ${client.user ? "Prepare a new competition run" : "Sign in free and prepare a competition run"} to compete for ${config.competition.prizeTitle}. Practice points do not transfer.`;
  $("replay").textContent = result?.endReason === "deadline" && active.state.lives > 0 ? "Continue unranked" : active.mode === "practice" ? "Practise again" : "Play again";
  status(result ? !verified ? "This result is not an eligible verified leaderboard score." : result.endReason === "deadline" ? "The month's score is frozen. Further play is unranked and does not transfer into next month." : `Verified score saved.${client.preview ? " Local test only; no prize entry." : ""}` : "Unranked play does not count toward the prize.");
  event(result ? "game_ranked_complete" : "game_practice_complete");
  if (result) {
    if (["deadline", "competition_closed"].includes(result.endReason)) { config.live = false; $("terms").hidden = true; updateEntryActions(); }
    await refreshBoard();
    if (result.state.tick > 0 && result.verificationStatus === "verified") {
      try {
        const saved = await client.call("challenge.create", { sessionId: result.sessionId });
        const url = new URL("/play/airtime-dash/", location.origin); url.searchParams.set("challenge", saved.token); challengeLink = url.href;
        const message = `I scored ${saved.score.toLocaleString("en-ZA")} on FreeHub Airtime Dash. Think you can beat me? ${config?.live && !client.preview ? `Play for ${config.competition.prizeTitle}: ` : "Play here: "}${challengeLink}`;
        $("whatsapp").href = `https://wa.me/?text=${encodeURIComponent(message)}`; $("email").href = `mailto:?subject=${encodeURIComponent("Can you beat my FreeHub score?")}&body=${encodeURIComponent(message)}`;
        $("link-value").value = challengeLink; $("share").hidden = false;
        await refreshBoard();
      } catch (error) { status(`Your verified score is saved. ${error.message}`); }
    }
  }
  $("result").scrollIntoView({ block: "nearest", behavior: "instant" });
}
$("replay").addEventListener("click", async () => {
  if (run?.pending && run.ranked) { await sendCheckpoint(run, true, run.state.gameOver ? "lives_lost" : "quit"); return; }
  if (run?.verifiedResult?.endReason === "deadline" && run.state.lives > 0) {
    prepare("unranked"); return;
  }
  event("game_replay");
  if (lastMode === "ranked" && config?.live) { $("terms").requestSubmit(); }
  else prepare("practice");
});
$("copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(challengeLink); status("Challenge link copied."); }
  catch { $("link-fallback").hidden = false; $("link-value").focus(); $("link-value").select(); status("Select and copy the challenge link below."); }
  event("game_share_copy_link");
});
$("whatsapp").addEventListener("click", () => event("game_share_whatsapp")); $("email").addEventListener("click", () => event("game_share_email"));
load();
