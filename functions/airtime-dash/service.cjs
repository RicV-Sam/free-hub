const { randomBytes, createHash } = require("node:crypto");
const Engine = require("./engine.js");
const hash = value => createHash("sha256").update(String(value)).digest("hex");
const token = () => randomBytes(18).toString("base64url");
class GameError extends Error { constructor(code, message) { super(message); this.code = code; } }
function need(test, message, code = "failed-precondition") { if (!test) throw new GameError(code, message); }
function key(value) { need(typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value), "Invalid identifier.", "invalid-argument"); return value; }
const userKey = (competitionId, uid) => `${key(competitionId)}_${hash(uid).slice(0, 32)}`;
const better = (a, b) => !b || a.score > b.score || (a.score === b.score && a.reachedAt < b.reachedAt);
const order = (a, b) => b.score - a.score || a.reachedAt - b.reachedAt || a.sessionId.localeCompare(b.sessionId);
const finished = session => session.status !== "active";
const publicScore = (row, rank) => ({ rank, displayName: row.displayName, score: row.score });
const ACTIONS = new Set(["config", "leaderboard", "player.profile", "terms.accept", "session.start", "session.checkpoint", "session.finish", "result", "session.abandon", "challenge.create", "challenge.resolve", "challenges.summary", "admin.saveCompetition", "admin.activate", "admin.report", "admin.review", "admin.winner", "admin.prize", "admin.forfeitWinner", "admin.securityCheck"]);
function nickname(value) {
  need(typeof value === "string" && value.trim().length >= 2 && /^[\p{L}\p{N} _.-]{2,30}$/u.test(value) && /[\p{L}\p{N}]/u.test(value) && value.replace(/\D/g, "").length < 7, "Choose a public nickname of 2–30 characters without contact details.", "invalid-argument");
  return value.trim();
}
function live(competition, now) { return competition?.status === "live" && competition.startAt <= now && now < competition.endAt && competition.legalReviewed === true; }
function publicCompetition(c, now) {
  if (!c) return { competition: null, live: false, versions: Engine.VERSION };
  const { id, title, prizeTitle, startAt, endAt, timezone, termsVersion, rules, eligibility, claimDays, contactPolicy, winnerPolicy } = c;
  return { competition: { id, title, prizeTitle, startAt, endAt, timezone, termsVersion, rules, eligibility, claimDays, contactPolicy, winnerPolicy,
    status: c.status === "live" && now >= c.endAt ? "closed" : c.status }, live: live(c, now), versions: Engine.VERSION };
}
function validateCompetition(input) {
  const id = key(input.id);
  const text = (name, max) => { need(typeof input[name] === "string" && input[name].trim().length > 0 && input[name].length <= max, `Enter ${name}.`, "invalid-argument"); return input[name].trim(); };
  const status = input.status || "draft";
  need(["draft", "scheduled", "live", "closed", "winner_pending", "completed", "cancelled"].includes(status), "Invalid competition status.", "invalid-argument");
  const startAt = Number(input.startAt), endAt = Number(input.endAt), claimDays = Number(input.claimDays);
  need(Number.isSafeInteger(startAt) && Number.isSafeInteger(endAt) && endAt > startAt, "Choose valid competition start and closing times.", "invalid-argument");
  need(Number.isInteger(claimDays) && claimDays >= 1 && claimDays <= 90, "Choose a claim deadline from 1 to 90 days.", "invalid-argument");
  need(!["live", "scheduled"].includes(status) || input.legalReviewed === true, "Final rules must be reviewed before activation.");
  return { id, title: text("title", 100), prizeTitle: text("prizeTitle", 100), termsVersion: text("termsVersion", 80),
    rules: text("rules", 12000), eligibility: text("eligibility", 1000), contactPolicy: text("contactPolicy", 1000), winnerPolicy: text("winnerPolicy", 1000),
    startAt, endAt, claimDays, timezone: "Africa/Johannesburg", legalReviewed: input.legalReviewed === true, status, versions: Engine.VERSION };
}
function createService(store, { clock = Date.now } = {}) {
  const uid = context => { need(context?.uid, "Sign in with your FreeHub account.", "unauthenticated"); return key(context.uid); };
  async function admin(context) { const id = uid(context); need((await store.get(`admins/${id}`))?.active === true, "Admin access required.", "permission-denied"); return id; }
  async function current() { const config = await store.get("dashConfig/current"); return config?.competitionId ? store.get(`dashCompetitions/${key(config.competitionId)}`) : null; }
  async function limit(context, action) {
    const bucket = action === "session.checkpoint" || action === "session.finish" ? "progress" : action;
    const max = bucket === "progress" ? 40 : bucket === "session.start" ? 20 : bucket === "challenge.create" ? 30 : 120;
    const now = clock(), window = Math.floor(now / 60000), identity = context?.uid || context?.ip || "anonymous";
    await store.transaction(async tx => {
      const path = `dashRateLimits/${hash(`${identity}:${bucket}`)}`, prior = await tx.get(path);
      const count = prior?.window === window ? prior.count + 1 : 1;
      need(count <= max, "Please wait a moment before trying again.", "resource-exhausted");
      tx.put(path, { window, count, expiresAt: now + 120000 });
    });
  }
  async function publish(tx, session) {
    if (session.verificationStatus !== "verified" || session.state.tick === 0) return;
    if (await tx.get(`dashExclusions/${userKey(session.competitionId, session.uid)}`)) return;
    const path = `dashBest/${userKey(session.competitionId, session.uid)}`, prior = await tx.get(path);
    const row = { eligible: true, competitionId: session.competitionId, uid: session.uid, displayName: session.displayName,
      score: session.state.score, reachedAt: session.scoreReachedAt, sessionId: session.id };
    if (prior?.eligible !== true || better(row, prior)) tx.put(path, row);
  }
  async function qualify(tx, session) {
    if (!session.challengeToken || session.verificationStatus !== "verified" || session.state.tick === 0) return;
    const challenge = await tx.get(`dashChallenges/${session.challengeToken}`);
    if (!challenge || challenge.uid === session.uid || challenge.competitionId !== session.competitionId) return;
    if ((await tx.get(`dashSessions/${challenge.sessionId}`))?.verificationStatus !== "verified") return;
    const path = `dashReferrals/${userKey(session.competitionId, session.uid)}`, prior = await tx.get(path);
    if (!prior || prior.qualified !== true) tx.put(path, { qualified: true, competitionId: session.competitionId, uid: session.uid, referrerUid: challenge.uid,
      challengeToken: challenge.id, sessionId: session.id, qualifiedAt: clock(), outcome: session.state.score > challenge.score ? "won" : session.state.score === challenge.score ? "tie" : "lost" });
  }
  function result(session) {
    return { sessionId: session.id, score: session.state.score, level: session.state.level, lives: session.state.lives,
      sequence: session.sequence, status: session.status, verificationStatus: session.verificationStatus, endReason: session.endReason || null,
      verificationReason: session.verificationReason || null, expiresAt: session.expiresAt, state: session.state, versions: session.versions, competitionId: session.competitionId,
      startedAt: session.startedAt, serverNow: clock(), checkpointTicks: Engine.CONFIG.checkpointTicks, challengeOutcome: session.challengeOutcome || null };
  }
  async function end(tx, session, reason) {
    session.status = "finished"; session.endReason = reason; session.finishedAt = clock();
    if (session.challengeToken) {
      const challenge = await tx.get(`dashChallenges/${session.challengeToken}`);
      if (challenge && challenge.uid !== session.uid) session.challengeOutcome = session.state.score > challenge.score ? "won" : session.state.score === challenge.score ? "tie" : "lost";
    }
    await publish(tx, session); await qualify(tx, session);
    tx.put(`dashSessions/${session.id}`, session);
    const playerPath = `dashPlayers/${hash(session.uid)}`, player = await tx.get(playerPath);
    if (player?.activeSessionId === session.id) tx.put(playerPath, { ...player, activeSessionId: null, closesAt: session.closesAt });
    return result(session);
  }
  async function leaderboard(competitionId, context) {
    const rows = (await store.scan("dashBest", [["competitionId", "==", key(competitionId)]])).filter(r => r.eligible === true).sort(order);
    const position = context?.uid ? rows.findIndex(row => row.uid === context.uid) : -1;
    return { top: rows.slice(0, 20).map((row, i) => publicScore(row, i + 1)), own: position < 0 ? null : publicScore(rows[position], position + 1) };
  }
  async function checkpoint(data, context, final = false) {
    const owner = uid(context), id = key(data.sessionId);
    return store.transaction(async tx => {
      const session = await tx.get(`dashSessions/${id}`);
      need(session?.uid === owner, "This game session is unavailable.", "permission-denied");
      const competition = await tx.get(`dashCompetitions/${session.competitionId}`);
      const now = clock();
      const signature = hash(JSON.stringify({ sequence: data.sequence, toTick: data.toTick, inputs: data.inputs, final, endReason: data.endReason }));
      if (data.sequence === session.sequence && signature === session.lastRequestHash) return result(session);
      if (finished(session)) return result(session);
      if (now >= competition.endAt) return end(tx, session, "deadline");
      if (!live(competition, now)) return end(tx, session, "competition_closed");
      if (now >= session.expiresAt) return end(tx, session, "inactivity");
      need(JSON.stringify(session.versions) === JSON.stringify(Engine.VERSION), "This session uses an earlier gameplay version. Its verified progress is preserved.");
      need(data.sequence === session.sequence + 1, "Checkpoint out of order. Retry the last pending checkpoint.", "invalid-argument");
      const elapsed = Math.floor((now - session.startedAt) * Engine.CONFIG.hz / 1000);
      need(Number.isSafeInteger(data.toTick) && data.toTick <= elapsed + Engine.CONFIG.clockSlackTicks, "Gameplay timing could not be verified. Your previous verified score is preserved.", "invalid-argument");
      const previousScore = session.state.score, previousState = structuredClone(session.state);
      try { Engine.advance(session.state, data.toTick, data.inputs); } catch (error) { throw new GameError("invalid-argument", error.message); }
      need(session.state.gameOver || data.toTick >= elapsed - Engine.CONFIG.clockSlackTicks, "Gameplay cannot pause while ranked. Your previous verified score is preserved.", "invalid-argument");
      const verifiedAt = clock();
      if (verifiedAt >= competition.endAt) { session.state = previousState; return end(tx, session, "deadline"); }
      session.sequence = data.sequence; session.lastRequestHash = signature; session.verifiedAt = verifiedAt;
      session.expiresAt = verifiedAt + Engine.CONFIG.inactivityMs;
      tx.put(`dashCheckpoints/${id}_${data.sequence}`, { sessionId: id, competitionId: session.competitionId, sequence: data.sequence, verifiedAt, tick: session.state.tick, score: session.state.score, level: session.state.level, lives: session.state.lives, inputs: data.inputs, requestHash: signature, versions: session.versions });
      if (session.state.score !== previousScore) session.scoreReachedAt = verifiedAt;
      if (session.state.gameOver || final) {
        need(!final || ["lives_lost", "quit"].includes(data.endReason), "Invalid end reason.", "invalid-argument");
        return end(tx, session, session.state.gameOver ? "lives_lost" : "quit");
      }
      await publish(tx, session); tx.put(`dashSessions/${id}`, session); return result(session);
    });
  }
  async function handle(action, data = {}, context = {}) {
    need(ACTIONS.has(action) && data && typeof data === "object" && !Array.isArray(data), "Invalid request.", "invalid-argument");
    await limit(context, action);
    const now = clock();
    if (action === "config") return publicCompetition(await current(), now);
    if (action === "leaderboard") return leaderboard(data.competitionId, context);
    if (action === "player.profile") {
      const owner = uid(context), competition = await current();
      const acceptance = competition ? await store.get(`dashTerms/${userKey(competition.id, owner)}`) : null;
      const player = await store.get(`dashPlayers/${hash(owner)}`);
      return { displayName: player?.displayName || acceptance?.displayName || null };
    }
    if (action === "terms.accept") {
      const owner = uid(context), competition = await current();
      need(live(competition, now), "The prize competition is not open.");
      need(data.termsVersion === competition.termsVersion && data.accepted === true && data.eligible === true, "Accept the current rules and confirm eligibility.");
      need((await store.get(`users/${owner}`))?.acceptedPrivacyPolicy === true, "Complete your FreeHub account setup first.");
      const displayName = nickname(data.displayName);
      const acceptance = { uid: owner, competitionId: competition.id, termsVersion: competition.termsVersion, acceptedAt: now, eligibleConfirmed: true, displayName,
        challengeToken: data.challengeToken ? key(data.challengeToken) : null };
      await store.transaction(async tx => {
        const path = `dashTerms/${userKey(competition.id, owner)}`, prior = await tx.get(path);
        tx.put(path, { ...acceptance, acceptedAt: prior?.termsVersion === acceptance.termsVersion ? prior.acceptedAt : now });
        const playerPath = `dashPlayers/${hash(owner)}`, player = await tx.get(playerPath);
        tx.put(playerPath, { ...player, displayName, closesAt: competition.endAt });
      });
      return { accepted: true };
    }
    if (action === "session.start") {
      const owner = uid(context), id = token();
      return store.transaction(async tx => {
        const now = clock();
        const config = await tx.get("dashConfig/current"), competition = config ? await tx.get(`dashCompetitions/${key(config.competitionId)}`) : null;
        need(live(competition, clock()), "The prize competition is not open.");
        need(JSON.stringify(competition.versions) === JSON.stringify(Engine.VERSION), "Ranked gameplay is held while its version is checked.");
        const acceptance = await tx.get(`dashTerms/${userKey(competition.id, owner)}`);
        need(acceptance?.termsVersion === competition.termsVersion, "Accept the current competition rules first.");
        need((await tx.get(`users/${owner}`))?.acceptedPrivacyPolicy === true, "Complete your FreeHub account setup first.");
        const playerPath = `dashPlayers/${hash(owner)}`, player = await tx.get(playerPath);
        if (player?.activeSessionId) {
          const existing = await tx.get(`dashSessions/${player.activeSessionId}`);
          need(!existing || finished(existing) || now >= existing.expiresAt || now >= existing.closesAt, "Finish your current ranked game before starting another.");
          if (existing && !finished(existing)) await end(tx, existing, now >= existing.closesAt ? "deadline" : "inactivity");
        }
        const session = { id, uid: owner, competitionId: competition.id, displayName: acceptance.displayName, challengeToken: acceptance.challengeToken,
          startedAt: now, closesAt: competition.endAt, expiresAt: now + Engine.CONFIG.inactivityMs, verifiedAt: now,
          state: Engine.create(), sequence: 0, scoreReachedAt: now, status: "active", verificationStatus: "verified", versions: Engine.VERSION };
        tx.put(`dashSessions/${id}`, session); tx.put(playerPath, { ...player, activeSessionId: id, closesAt: session.closesAt });
        tx.put(`dashCompetitions/${competition.id}`, { ...competition, startedCount: (competition.startedCount || 0) + 1 });
        return result(session);
      });
    }
    if (action === "session.checkpoint") return checkpoint(data, context);
    if (action === "session.finish") return checkpoint(data, context, true);
    if (action === "result" || action === "session.abandon") {
      const owner = uid(context), id = key(data.sessionId);
      return store.transaction(async tx => {
        const session = await tx.get(`dashSessions/${id}`);
        need(session?.uid === owner, "This game session is unavailable.", "permission-denied");
        if (action === "session.abandon" && !finished(session)) return end(tx, session, now >= session.closesAt ? "deadline" : "quit");
        if (!finished(session) && (now >= session.closesAt || now >= session.expiresAt)) return end(tx, session, now >= session.closesAt ? "deadline" : "inactivity");
        return result(session);
      });
    }
    if (action === "challenge.create") {
      const owner = uid(context), session = await store.get(`dashSessions/${key(data.sessionId)}`), id = token();
      need(session?.uid === owner && finished(session) && session.verificationStatus === "verified" && session.state.tick > 0, "Challenges need a completed verified score.");
      const record = { id, uid: owner, competitionId: session.competitionId, sessionId: session.id, displayName: session.displayName,
        score: session.state.score, createdAt: now, expiresAt: now + 90 * 86400000 };
      await store.transaction(tx => tx.put(`dashChallenges/${id}`, record));
      return { token: id, score: record.score, displayName: record.displayName, competitionId: record.competitionId };
    }
    if (action === "challenge.resolve") {
      const id = key(data.token), challenge = await store.get(`dashChallenges/${id}`);
      need(challenge && now < challenge.expiresAt, "This challenge link is unavailable or expired.", "not-found");
      need((await store.get(`dashSessions/${challenge.sessionId}`))?.verificationStatus === "verified", "This challenge score is no longer eligible.", "not-found");
      if (typeof data.visitor === "string" && /^[a-zA-Z0-9_-]{10,80}$/.test(data.visitor)) {
        const eventId = hash(`${id}:${context.uid || data.visitor}`);
        await store.transaction(async tx => { const path = `dashEvents/${eventId}`; if (!await tx.get(path)) tx.put(path, { challengeToken: id, competitionId: challenge.competitionId, uid: challenge.uid, openedAt: now }); });
      }
      return { token: id, displayName: challenge.displayName, score: challenge.score, competitionId: challenge.competitionId };
    }
    if (action === "challenges.summary") {
      const owner = uid(context);
      const [challenges, events, referrals] = await Promise.all([store.scan("dashChallenges", [["uid", "==", owner]]), store.scan("dashEvents", [["uid", "==", owner]]), store.scan("dashReferrals", [["referrerUid", "==", owner]])]);
      const qualified = referrals.filter(r => r.qualified === true);
      return { shared: challenges.length, opened: events.length, played: qualified.length, beaten: qualified.filter(r => r.outcome === "won").length, qualified: qualified.length };
    }
    if (action.startsWith("admin.")) {
      const owner = await admin(context);
      if (action === "admin.securityCheck") return { verified: true };
      if (action === "admin.activate") {
        return store.transaction(async tx => {
          const config = await tx.get("dashConfig/current");
          const competition = config ? await tx.get(`dashCompetitions/${key(config.competitionId)}`) : null;
          const openedAt = clock();
          need(competition?.status === "draft" && !competition.startedCount, "Only an unused draft can open on deployment.");
          need(competition.legalReviewed === true, "Approve the final competition rules before opening prize entry.");
          need(openedAt < competition.endAt, "This competition's closing time has passed.");
          const active = validateCompetition({ ...competition, startAt: openedAt, status: "live" });
          tx.put(`dashCompetitions/${competition.id}`, { ...competition, ...active, activatedBy: owner, activatedAt: openedAt, updatedAt: openedAt });
          tx.put(`dashAudit/${token()}`, { action, adminUid: owner, competitionId: competition.id, at: openedAt });
          return publicCompetition(active, openedAt);
        });
      }
      if (action === "admin.saveCompetition") {
        const competition = validateCompetition(data), auditId = token();
        await store.transaction(async tx => {
          const path = `dashCompetitions/${competition.id}`, prior = await tx.get(path);
          const active = await tx.get("dashConfig/current");
          if (active?.competitionId && active.competitionId !== competition.id) {
            const previous = await tx.get(`dashCompetitions/${active.competitionId}`);
            need(!live(previous, now), "Close the current competition before activating another.");
          }
          if (prior?.startedCount) {
            for (const field of ["startAt", "endAt", "termsVersion", "rules", "eligibility", "prizeTitle", "claimDays", "contactPolicy", "winnerPolicy"])
              need(prior[field] === competition[field], "Entry conditions are locked once ranked play starts. Create a new competition for material changes.");
            need(prior.legalReviewed === competition.legalReviewed, "Review approval is locked after entry starts.");
            need(JSON.stringify(prior.versions) === JSON.stringify(competition.versions), "Gameplay versions are locked after entry starts.");
          }
          need(competition.status !== "completed" || prior?.prizeStatus === "sent", "Confirm the winner and record fulfilment first.");
          tx.put(path, { ...prior, ...competition, updatedAt: now });
          tx.put("dashConfig/current", { competitionId: competition.id });
          tx.put(`dashAudit/${auditId}`, { action, adminUid: owner, competitionId: competition.id, at: now });
        }); return publicCompetition(competition, now);
      }
      if (action === "admin.report") {
        const competition = await current();
        if (!competition) return { competition: null, sessions: [], referrals: [], termsCount: 0 };
        const filters = [["competitionId", "==", competition.id]];
        const [sessions, referrals, terms] = await Promise.all([store.scan("dashSessions", filters), store.scan("dashReferrals", filters), store.scan("dashTerms", filters)]);
        const winnerProfile = competition.winner ? await store.get(`users/${competition.winner.uid}`) : null;
        return { competition, winnerContactEmail: winnerProfile?.email || null, sessions: sessions.map(s => ({ id: s.id, displayName: s.displayName, score: s.state.score, level: s.state.level,
          status: s.status, verificationStatus: s.verificationStatus, verificationReason: s.verificationReason || "", startedAt: s.startedAt })), referrals: referrals.filter(r => r.qualified === true), termsCount: terms.length };
      }
      if (action === "admin.review") {
        const id = key(data.sessionId), session = await store.get(`dashSessions/${id}`);
        need(session, "Session unavailable.", "not-found");
        need(["verified", "review_required", "disqualified", "rejected"].includes(data.status), "Invalid review status.", "invalid-argument");
        need(typeof data.reason === "string" && data.reason.trim().length >= 3 && data.reason.length <= 500, "Record a review reason.", "invalid-argument");
        await store.transaction(async tx => {
          const latest = await tx.get(`dashSessions/${id}`), competition = await tx.get(`dashCompetitions/${session.competitionId}`);
          const candidates = await tx.scan("dashSessions", [["competitionId", "==", session.competitionId], ["uid", "==", session.uid]]);
          need(!competition.winner, "Reopen winner review before changing a confirmed result.");
          tx.put(`dashSessions/${id}`, { ...latest, status: "finished", verificationStatus: data.status, verificationReason: data.reason.trim(), reviewedAt: now, reviewedBy: owner });
          const pool = candidates.filter(s => s.id !== id && s.verificationStatus === "verified");
          if (data.status === "verified") pool.push(latest);
          const scores = pool.filter(s => s.state.tick > 0).map(s => ({ eligible: true, uid: s.uid, competitionId: s.competitionId, sessionId: s.id,
            displayName: s.displayName, score: s.state.score, reachedAt: s.scoreReachedAt })).sort(order);
          const excluded = await tx.get(`dashExclusions/${userKey(session.competitionId, session.uid)}`);
          tx.put(`dashBest/${userKey(session.competitionId, session.uid)}`, !excluded && scores[0] ? scores[0] : { eligible: false, competitionId: session.competitionId, uid: session.uid, displayName: session.displayName, score: 0, reachedAt: now, sessionId: id });
          const referralPath = `dashReferrals/${userKey(session.competitionId, session.uid)}`, referral = await tx.get(referralPath);
          if (referral?.sessionId === id) tx.put(referralPath, { ...referral, qualified: data.status === "verified", reviewedAt: now });
          tx.put(`dashCompetitions/${session.competitionId}`, { ...competition, reviewRevision: (competition.reviewRevision || 0) + 1 });
          tx.put(`dashAudit/${token()}`, { action, adminUid: owner, competitionId: session.competitionId, sessionId: id, status: data.status, reason: data.reason.trim(), at: now });
        }); return { reviewed: true };
      }
      if (action === "admin.forfeitWinner") {
        const competition = await current(); need(competition && now >= competition.endAt, "Wait until the competition closes.");
        need(typeof data.reason === "string" && data.reason.trim().length >= 3 && data.reason.length <= 500, "Record why the confirmed winner forfeited the prize.", "invalid-argument");
        await store.transaction(async tx => {
          const path = `dashCompetitions/${competition.id}`, latest = await tx.get(path);
          need(latest.winner && latest.prizeStatus !== "sent", "Only an unfulfilled confirmed prize can be forfeited.");
          const winner = latest.winner, id = userKey(competition.id, winner.uid);
          tx.put(`dashExclusions/${id}`, { uid: winner.uid, competitionId: competition.id, reason: data.reason.trim(), at: now, adminUid: owner });
          tx.put(`dashBest/${id}`, { ...winner, eligible: false });
          tx.put(path, { ...latest, status: "closed", winner: null, winnerConfirmedAt: null, winnerConfirmedBy: null });
          tx.put(`dashAudit/${token()}`, { action, adminUid: owner, competitionId: competition.id, winner, reason: data.reason.trim(), at: now });
        }); return { saved: true };
      }
      if (action === "admin.winner" || action === "admin.prize") {
        const competition = await current(); need(competition && now >= competition.endAt, "Wait until the competition closes.");
        await store.transaction(async tx => {
          const latest = await tx.get(`dashCompetitions/${competition.id}`);
          const rows = (await tx.scan("dashBest", [["competitionId", "==", competition.id]])).filter(r => r.eligible === true).sort(order);
          const pending = (await tx.scan("dashSessions", [["competitionId", "==", competition.id]])).some(s => s.verificationStatus === "review_required");
          need(!pending, "Resolve flagged scores before confirming the winner."); need(rows.length, "There is no eligible verified winner.");
          const top = rows[0];
          if (action === "admin.winner") { need(!latest.winner, "Winner already confirmed."); tx.put(`dashCompetitions/${competition.id}`, { ...latest, status: "winner_pending", winner: top, winnerConfirmedAt: now, winnerConfirmedBy: owner }); }
          else { need(latest.winner && latest.winner.sessionId === top.sessionId, "Confirm the current winner first."); tx.put(`dashCompetitions/${competition.id}`, { ...latest, status: "completed", prizeSentAt: now, prizeStatus: "sent" }); }
          tx.put(`dashAudit/${token()}`, { action, adminUid: owner, competitionId: competition.id, at: now });
        }); return { saved: true };
      }
    }
    throw new GameError("invalid-argument", "Unknown game action.");
  }
  async function sweep() {
    const now = clock(), active = await store.scan("dashSessions", [["status", "==", "active"]]);
    for (const session of active) if (now >= session.closesAt || now >= session.expiresAt) await handle("result", { sessionId: session.id }, { uid: session.uid });
    const config = await store.get("dashConfig/current");
    if (config?.competitionId) await store.transaction(async tx => {
      const path = `dashCompetitions/${config.competitionId}`, competition = await tx.get(path);
      if (!competition) return;
      if (["live", "scheduled"].includes(competition.status) && now >= competition.endAt) tx.put(path, { ...competition, status: "closed" });
      else if (competition.status === "scheduled" && competition.legalReviewed && now >= competition.startAt) tx.put(path, { ...competition, status: "live" });
    });
  }
  return { handle, current, sweep };
}
module.exports = { createService, GameError, validateCompetition, publicCompetition, order };
