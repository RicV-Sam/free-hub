const test = require("node:test"), assert = require("node:assert/strict");
const { MemoryStore } = require("../../functions/airtime-dash/store.cjs");
const { createService, validateCompetition } = require("../../functions/airtime-dash/service.cjs");
const E = require("../../functions/airtime-dash/engine.js");
function fixture() {
  let now = 100000;
  const competition = { id: "test-month", title: "Test", prizeTitle: "R500 airtime", startAt: now - 1000, endAt: now + 100000,
    status: "live", legalReviewed: true, termsVersion: "rules-1", eligibility: "Fixture", rules: "Fixture rules", claimDays: 7, contactPolicy: "Fixture", winnerPolicy: "Nickname", versions: E.VERSION };
  const store = new MemoryStore({ "dashConfig/current": { competitionId: competition.id }, [`dashCompetitions/${competition.id}`]: competition,
    "users/alice": { acceptedPrivacyPolicy: true }, "users/bob": { acceptedPrivacyPolicy: true }, "admins/admin": { active: true } });
  const service = createService(store, { clock: () => now });
  const call = (action, data = {}, user = "alice") => service.handle(action, data, user ? { uid: user } : { ip: "test-ip" });
  async function start(user = "alice", challengeToken = null) {
    await call("terms.accept", { termsVersion: "rules-1", displayName: user === "alice" ? "Alice" : "Bob", accepted: true, eligible: true, challengeToken }, user);
    return call("session.start", {}, user);
  }
  async function score(session, user = "alice") {
    now = session.startedAt + 200;
    const direction = [1, 2, 3, 4].find(d => E.available(session.state.walls, session.state.player, d));
    const input = { sessionId: session.sessionId, sequence: 1, toTick: 4, inputs: [{ tick: 1, direction }], score: 999999999 };
    return { result: await call("session.checkpoint", input, user), input };
  }
  return { store, competition, service, call, start, score, advance: ms => { now += ms; }, setTime: ms => { now = ms; } };
}
test("unknown actions cannot create arbitrary rate-limit records", async () => {
  const f = fixture();
  await assert.rejects(f.call("unknown-user-controlled-action"), /Invalid request/);
  assert.equal((await f.store.scan("dashRateLimits")).length, 0);
});

test("ranked entry needs authentication, current terms, eligibility and the existing privacy profile", async () => {
  const f = fixture();
  await assert.rejects(f.call("session.start", {}, null), /Sign in/);
  await assert.rejects(f.call("session.start"), /rules/);
  await assert.rejects(f.call("terms.accept", { termsVersion: "wrong", displayName: "Alice", accepted: true, eligible: true }), /current/);
  await assert.rejects(f.call("terms.accept", { termsVersion: "rules-1", displayName: "alice@example.com", accepted: true, eligible: true }), /nickname/);
  await assert.rejects(f.call("terms.accept", { termsVersion: "rules-1", displayName: "New Player", accepted: true, eligible: true }, "new-user"), /account setup/);
  await f.start(); assert.equal((await f.store.get("users/alice")).marketingConsent, undefined);
});
test("server replay ignores fabricated score totals, rejects impossible time and duplicate credit", async () => {
  const f = fixture(), session = await f.start(), { result, input } = await f.score(session);
  assert.ok(result.score > 0 && result.score < 1000);
  assert.deepEqual(await f.call("session.checkpoint", input), result);
  await assert.rejects(f.call("session.checkpoint", { ...input, score: 0, inputs: [{ tick: 1, direction: 2 }], toTick: 8 }), /order/);
  await assert.rejects(f.call("session.checkpoint", { sessionId: session.sessionId, sequence: 2, toTick: 1000, inputs: [] }), /timing/);
  await assert.rejects(f.call("session.checkpoint", input, "bob"), /unavailable/);
  assert.equal((await f.call("leaderboard", { competitionId: f.competition.id })).top.length, 1);
  assert.equal((await f.store.scan("dashCheckpoints")).length, 1);
});

test("saved nicknames survive new sessions and months, with legacy entry recovery and account isolation", async () => {
  const f = fixture();
  await assert.rejects(f.call("player.profile", {}, null), /Sign in/);
  assert.deepEqual(await f.call("player.profile"), { displayName: null });
  const session = await f.start();
  assert.deepEqual(await f.call("player.profile"), { displayName: "Alice" });
  assert.deepEqual(await f.call("player.profile", { uid: "alice" }, "bob"), { displayName: null });
  const player = (await f.store.scan("dashPlayers"))[0];
  await f.store.transaction(async tx => { const { displayName, id, ...legacy } = player; tx.put(`dashPlayers/${id}`, legacy); });
  assert.deepEqual(await f.call("player.profile"), { displayName: "Alice" });
  await f.call("terms.accept", { termsVersion: "rules-1", displayName: "Alice Updated", accepted: true, eligible: true });
  assert.equal((await f.store.scan("dashPlayers"))[0].activeSessionId, session.sessionId);
  await f.call("session.abandon", { sessionId: session.sessionId });
  await f.call("session.start");
  assert.deepEqual(await f.call("player.profile"), { displayName: "Alice Updated" });
  await f.store.transaction(tx => {
    tx.put("dashConfig/current", { competitionId: "next-month" });
    tx.put("dashCompetitions/next-month", { ...f.competition, id: "next-month", termsVersion: "rules-2" });
  });
  assert.deepEqual(await f.call("player.profile"), { displayName: "Alice Updated" });
  await assert.rejects(f.call("session.start"), /rules/);
});
test("only one ranked session may run at once; inactivity preserves verified progress", async () => {
  const f = fixture(), session = await f.start(), { result } = await f.score(session);
  await assert.rejects(f.call("session.start"), /current ranked/);
  f.advance(E.CONFIG.inactivityMs + 1);
  const frozen = await f.call("session.checkpoint", { sessionId: session.sessionId, sequence: 2, toTick: 500, inputs: [] });
  assert.equal(frozen.endReason, "inactivity"); assert.equal(frozen.score, result.score);
  await f.call("session.start");
});
test("old simulation time cannot pause enemies or skip background time", async () => {
  const f = fixture(), session = await f.start(); f.advance(4000);
  await assert.rejects(f.call("session.checkpoint", { sessionId: session.sessionId, sequence: 1, toTick: 4, inputs: [] }), /cannot pause/);
  assert.equal((await f.call("result", { sessionId: session.sessionId })).score, 0);
});
test("at closing an unfinished run freezes its last verified checkpoint; later input and client timestamps cannot change it", async () => {
  const f = fixture(), session = await f.start(), { result } = await f.score(session);
  f.setTime(f.competition.endAt);
  const frozen = await f.call("session.checkpoint", { sessionId: session.sessionId, sequence: 2, toTick: 4, inputs: [], score: 1000000, clientTime: f.competition.endAt - 1 });
  assert.equal(frozen.endReason, "deadline"); assert.equal(frozen.score, result.score);
  await assert.rejects(f.call("session.start"), /not open/);
  assert.equal((await f.call("result", { sessionId: session.sessionId })).score, result.score);
});
test("ties retain earliest checkpoint time and public leaderboard exposes no private identities", async () => {
  const f = fixture(), first = await f.start(), a = await f.score(first); await f.call("session.abandon", { sessionId: first.sessionId });
  f.advance(1000); const second = await f.start("bob"), b = await f.score(second, "bob");
  assert.equal(a.result.score, b.result.score);
  const board = await f.call("leaderboard", { competitionId: f.competition.id });
  assert.equal(board.top[0].displayName, "Alice"); assert.equal(board.own.rank, 1);
  assert.equal(JSON.stringify(board).includes('"uid"'), false); assert.equal(JSON.stringify(board).includes("email"), false);
});
test("challenge snapshots are immutable; referrals qualify once on verified completion and exclude self-referrals", async () => {
  const f = fixture(), first = await f.start(); await f.score(first); await f.call("session.abandon", { sessionId: first.sessionId });
  const challenge = await f.call("challenge.create", { sessionId: first.sessionId });
  const recipient = await f.start("bob", challenge.token); await f.score(recipient, "bob");
  assert.equal((await f.store.scan("dashReferrals")).length, 0);
  await f.call("session.abandon", { sessionId: recipient.sessionId }, "bob");
  assert.equal((await f.store.scan("dashReferrals")).length, 1);
  const again = await f.start("bob", challenge.token); await f.score(again, "bob"); await f.call("session.abandon", { sessionId: again.sessionId }, "bob");
  assert.equal((await f.store.scan("dashReferrals")).length, 1);
  assert.equal((await f.call("challenge.resolve", { token: challenge.token })).score, challenge.score);
  const self = await f.start("alice", challenge.token); await f.score(self); await f.call("session.abandon", { sessionId: self.sessionId });
  assert.equal((await f.store.scan("dashReferrals")).length, 1);
  await f.call("challenge.resolve", { token: challenge.token, visitor: "unique-visitor-123" }, null);
  await f.call("challenge.resolve", { token: challenge.token, visitor: "unique-visitor-123" }, null);
  assert.equal((await f.call("challenges.summary")).opened, 1);
});
test("admin disqualification removes a score; winner confirmation and manual fulfilment require closure", async () => {
  const f = fixture(), first = await f.start(); await f.score(first); await f.call("session.abandon", { sessionId: first.sessionId });
  await assert.rejects(f.call("admin.report"), /Admin/);
  await assert.rejects(f.call("admin.winner", {}, "admin"), /closes/);
  await f.call("admin.review", { sessionId: first.sessionId, status: "disqualified", reason: "Test review" }, "admin");
  assert.equal((await f.call("leaderboard", { competitionId: f.competition.id })).top.length, 0);
  await f.call("admin.review", { sessionId: first.sessionId, status: "verified", reason: "Evidence reviewed" }, "admin");
  f.setTime(f.competition.endAt); await f.call("admin.winner", {}, "admin"); await f.call("admin.prize", {}, "admin");
  assert.equal((await f.call("admin.report", {}, "admin")).competition.prizeStatus, "sent");
  assert.ok((await f.store.scan("dashAudit")).length >= 4);
});
test("competition activation requires reviewed complete rules and locks entry conditions after play starts", async () => {
  const f = fixture();
  assert.throws(() => validateCompetition({ ...f.competition, legalReviewed: false }), /reviewed/);
  await f.start();
  await assert.rejects(f.call("admin.saveCompetition", { ...f.competition, endAt: f.competition.endAt + 1000 }, "admin"), /locked/);
});

test("an unclaimed winner can be replaced without another of their runs winning, and fulfilment cannot be forfeited", async () => {
  const f = fixture();
  for (const user of ["alice", "alice", "bob"]) {
    const session = await f.start(user); await f.score(session, user);
    await f.call("session.abandon", { sessionId: session.sessionId }, user); f.advance(1000);
  }
  f.setTime(f.competition.endAt); await f.call("admin.winner", {}, "admin");
  assert.equal((await f.call("admin.report", {}, "admin")).competition.winner.displayName, "Alice");
  await assert.rejects(f.call("admin.forfeitWinner", { reason: "" }, "admin"), /Record why/);
  await f.call("admin.forfeitWinner", { reason: "No response after the seven-day notification window" }, "admin");
  await f.call("admin.winner", {}, "admin");
  assert.equal((await f.call("admin.report", {}, "admin")).competition.winner.displayName, "Bob");
  await f.call("admin.prize", {}, "admin");
  await assert.rejects(f.call("admin.forfeitWinner", { reason: "Already sent" }, "admin"), /fulfilled/);
});
test("ranked activity renews session validity without a fixed run length; payload and attempt limits hold", async () => {
  const f = fixture(), session = await f.start(); let sequence = 0;
  // An empty input stream may die; keep using fresh verified runs to check renewal and shape validation.
  f.advance(4000); const next = await f.call("session.checkpoint", { sessionId: session.sessionId, sequence: ++sequence, toTick: 80, inputs: [] });
  assert.ok(next.expiresAt > session.expiresAt);
  await assert.rejects(f.call("session.checkpoint", { sessionId: session.sessionId, sequence: 2, toTick: 80, inputs: Array(241).fill({ tick: 1, direction: 1 }) }), /Too many/);
  for (let i = 0; i < 120; i++) { try { await f.call("config", {}, null); } catch {} }
  await assert.rejects(f.call("config", {}, null), /wait/);
});
test("zero is a valid verified score; disqualification is separate from an empty leaderboard", async () => {
  const f = fixture(), session = await f.start(); f.advance(200);
  await f.call("session.checkpoint", { sessionId: session.sessionId, sequence: 1, toTick: 4, inputs: [] });
  await f.call("session.abandon", { sessionId: session.sessionId });
  assert.equal((await f.call("leaderboard", { competitionId: f.competition.id })).top[0].score, 0);
  assert.equal((await f.call("challenge.create", { sessionId: session.sessionId })).score, 0);
  f.setTime(f.competition.endAt); await f.call("admin.winner", {}, "admin");
  assert.equal((await f.call("admin.report", {}, "admin")).competition.winner.score, 0);
});
test("scheduled maintenance closes expired runs without new points and freezes the month", async () => {
  const f = fixture(), session = await f.start(), { result } = await f.score(session);
  f.setTime(f.competition.endAt); await f.service.sweep();
  assert.equal((await f.call("result", { sessionId: session.sessionId })).score, result.score);
  assert.equal((await f.store.get(`dashCompetitions/${f.competition.id}`)).status, "closed");
});
test("reviewed scheduled competitions open on time and gameplay versions stay fixed", async () => {
  const f = fixture();
  await f.call("admin.saveCompetition", { ...f.competition, status: "scheduled", startAt: f.competition.startAt + 10000 }, "admin");
  await assert.rejects(f.start(), /not open/); f.advance(10000); await f.service.sweep(); await f.start();
  await assert.rejects(f.call("admin.saveCompetition", { ...f.competition, rules: "Changed rules" }, "admin"), /locked/);
});
test("opening an approved draft sets the start time from the server and refuses early or expired entry", async () => {
  const f = fixture();
  await f.call("admin.saveCompetition", { ...f.competition, status: "draft", legalReviewed: false }, "admin");
  await assert.rejects(f.call("admin.activate", {}, "alice"), /Admin access/);
  await assert.rejects(f.start(), /not open/);
  await assert.rejects(f.call("admin.activate", {}, "admin"), /Approve/);
  await f.call("admin.saveCompetition", { ...f.competition, status: "draft", legalReviewed: true }, "admin");
  f.setTime(105000);
  const activated = await f.call("admin.activate", {}, "admin");
  assert.equal(activated.live, true); assert.equal(activated.competition.startAt, 105000);
  const session = await f.start(); assert.equal(session.startedAt, 105000);
  await assert.rejects(f.call("admin.activate", {}, "admin"), /unused draft/);
  const expired = fixture();
  await expired.call("admin.saveCompetition", { ...expired.competition, status: "draft" }, "admin");
  expired.setTime(expired.competition.endAt);
  await assert.rejects(expired.call("admin.activate", {}, "admin"), /closing time has passed/);
});
test("disqualifying a referral's qualifying run removes its qualification; a later valid run can qualify once", async () => {
  const f = fixture(), sender = await f.start(); await f.score(sender); await f.call("session.abandon", { sessionId: sender.sessionId });
  const challenge = await f.call("challenge.create", { sessionId: sender.sessionId });
  const recipient = await f.start("bob", challenge.token); await f.score(recipient, "bob"); await f.call("session.abandon", { sessionId: recipient.sessionId }, "bob");
  assert.equal((await f.call("challenges.summary")).qualified, 1);
  await f.call("admin.review", { sessionId: recipient.sessionId, status: "disqualified", reason: "Fixture review" }, "admin");
  assert.equal((await f.call("challenges.summary")).qualified, 0);
  const later = await f.start("bob", challenge.token); await f.score(later, "bob"); await f.call("session.abandon", { sessionId: later.sessionId }, "bob");
  assert.equal((await f.call("challenges.summary")).qualified, 1);
});
