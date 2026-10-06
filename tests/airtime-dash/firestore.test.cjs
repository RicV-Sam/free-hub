const test = require("node:test"), assert = require("node:assert/strict");
const { FirestoreStore } = require("../../functions/airtime-dash/store.cjs");
const { createService } = require("../../functions/airtime-dash/service.cjs");
const E = require("../../functions/airtime-dash/engine.js");
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
test("Firestore transactions persist replay state, serialize concurrent duplicate checkpoints and deny public database access", { skip: !emulator }, async () => {
  assert.match(emulator, /^(127\.0\.0\.1|localhost):\d+$/);
  const { createRequire } = require("node:module"), path = require("node:path");
  const backendRequire = createRequire(path.resolve(__dirname, "../../functions/airtime-dash/package.json"));
  const { initializeApp, deleteApp } = backendRequire("firebase-admin/app");
  const { getFirestore } = backendRequire("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-freehub-airtime-dash" }, "dash-emulator-test"), db = getFirestore(app);
  try {
    const store = new FirestoreStore(db); let now = Date.now();
    const competition = { id: "emulator-month", title: "Emulator only", prizeTitle: "Test only", startAt: now - 1000, endAt: now + 60000,
      status: "live", legalReviewed: true, termsVersion: "emulator-1", eligibility: "Fixture", rules: "Fixture", claimDays: 7, contactPolicy: "Fixture", winnerPolicy: "Fixture", versions: E.VERSION };
    await store.transaction(async tx => {
      tx.put("dashConfig/current", { competitionId: competition.id }); tx.put(`dashCompetitions/${competition.id}`, competition);
      tx.put("users/emulator-player", { acceptedPrivacyPolicy: true }); tx.put("admins/emulator-admin", { active: true });
    });
    const service = createService(store, { clock: () => now }), context = { uid: "emulator-player" };
    await service.handle("terms.accept", { termsVersion: "emulator-1", displayName: "Emulator Player", accepted: true, eligible: true }, context);
    const session = await service.handle("session.start", {}, context);
    const direction = [1, 2, 3, 4].find(d => E.available(session.state.walls, session.state.player, d));
    now += 200;
    const payload = { sessionId: session.sessionId, sequence: 1, toTick: 4, inputs: [{ tick: 1, direction }] };
    const responses = await Promise.all(Array.from({ length: 5 }, () => service.handle("session.checkpoint", payload, context)));
    assert.ok(responses[0].score > 0); for (const response of responses) assert.deepEqual(response, responses[0]);
    assert.equal((await store.scan("dashCheckpoints", [["sessionId", "==", session.sessionId]])).length, 1);
    const pub = await fetch(`http://${emulator}/v1/projects/demo-freehub-airtime-dash/databases/(default)/documents/dashSessions/${session.sessionId}`);
    assert.equal(pub.status, 403);
    const directWrite = await fetch(`http://${emulator}/v1/projects/demo-freehub-airtime-dash/databases/(default)/documents/dashBest/fake`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { score: { integerValue: "999999" } } }) });
    assert.equal(directWrite.status, 403);
    await service.handle("session.abandon", { sessionId: session.sessionId }, context);
    await service.handle("admin.review", { sessionId: session.sessionId, status: "disqualified", reason: "Emulator review" }, { uid: "emulator-admin" });
    assert.equal((await service.handle("leaderboard", { competitionId: competition.id }, context)).top.length, 0);
    assert.ok((await store.scan("dashAudit")).length > 0);
  } finally { await db.terminate(); await deleteApp(app); }
});
