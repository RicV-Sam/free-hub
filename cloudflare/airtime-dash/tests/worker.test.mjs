import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importPKCS8, SignJWT } from "jose";
import { Miniflare, convertV4MiniflareOptions, Response as MFResponse } from "miniflare";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url), E = require("../../../functions/airtime-dash/engine.js");
const key = await importPKCS8(await readFile(new URL("fixtures/signing-key.test.pem", import.meta.url), "utf8"), "RS256");
const cert = await readFile(new URL("fixtures/signing-cert.test.pem", import.meta.url), "utf8");
async function token(uid, audience = "freehub-test") {
  return new SignJWT({ auth_time: Math.floor(Date.now() / 1000) - 1 }).setProtectedHeader({ alg: "RS256", kid: "local-test" })
    .setSubject(uid).setAudience(audience).setIssuer(`https://securetoken.google.com/${audience}`).setIssuedAt().setExpirationTime("1h").sign(key);
}
const fixture = {
  FIREBASE_PROJECT_ID: "freehub-test", ALLOWED_ORIGINS: "https://freehub.test", TURNSTILE_HOSTNAMES: "freehub.test",
  RANKED_ENABLED: "true", TURNSTILE_SECRET: "synthetic-test-secret",
};
async function startRuntime(directory) {
  const options = convertV4MiniflareOptions({ name: "dash-test", modules: true, scriptPath: new URL("../.build/worker.js", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
    compatibilityDate: "2026-10-06", compatibilityFlags: ["nodejs_compat"], durableObjects: { DASH: { className: "AirtimeDash", useSQLite: true } },
    durableObjectsPersist: directory, bindings: fixture,
    outboundService: async request => {
      const url = new URL(request.url);
      if (url.hostname === "www.googleapis.com") return MFResponse.json({ "local-test": cert }, { headers: { "Cache-Control": "max-age=300" } });
      if (url.hostname === "challenges.cloudflare.com") {
        const body = new URLSearchParams(await request.text());
        return MFResponse.json({ success: body.get("response") === "valid-proof", action: "dash-start", hostname: "freehub.test" });
      }
      if (url.hostname === "firestore.googleapis.com") {
        if (url.pathname.endsWith("/admins/admin")) return MFResponse.json({ fields: { active: { booleanValue: true } } });
        if (url.pathname.includes("/admins/")) return MFResponse.json({ error: {} }, { status: 404 });
        return MFResponse.json({ fields: { acceptedPrivacyPolicy: { booleanValue: true }, email: { stringValue: "synthetic@example.test" } } });
      }
      throw new Error(`Unexpected outbound request to ${url.hostname}`);
    } });
  options.resourcePersistencePath = directory;
  return new Miniflare(options);
}
test("Cloudflare runtime verifies identities, protects ranked starts and persists concurrent checkpoints without duplicate credit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dash-worker-test-"));
  let mf = await startRuntime(directory);
  const alice = await token("alice"), admin = await token("admin"), badAudience = await token("alice", "other-project");
  async function call(action, data = {}, bearer = alice, proof = "valid-proof", origin = "https://freehub.test") {
    const response = await mf.dispatchFetch("https://worker.test/api", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, body: JSON.stringify({ action, data, turnstileToken: proof }) });
    return { status: response.status, body: await response.json() };
  }
  try {
    assert.equal((await call("session.start", {}, null)).status, 401);
    assert.equal((await call("session.start", {}, badAudience)).status, 401);
    assert.equal((await call("config", {}, alice, "", "https://malicious.test")).status, 403);
    assert.equal((await call("admin.report")).status, 403);
    assert.equal((await call("session.start", {}, alice, "invalid-proof")).status, 403);
    assert.equal((await call("admin.securityCheck", {}, admin, "invalid-proof")).status, 403);
    assert.equal((await call("admin.securityCheck", {}, alice)).status, 403);
    assert.deepEqual((await call("admin.securityCheck", {}, admin)).body.result, { verified: true });
    const now = Date.now(), competition = { id: "worker-test", title: "Fixture", prizeTitle: "Test only", startAt: now - 1000, endAt: now + 60000,
      status: "draft", legalReviewed: true, termsVersion: "test-1", claimDays: 7, rules: "Synthetic fixture only", eligibility: "Fixture", contactPolicy: "Fixture", winnerPolicy: "Nickname" };
    assert.equal((await call("admin.saveCompetition", competition, admin)).status, 200);
    assert.equal((await call("admin.activate", {}, admin)).status, 200);
    assert.equal((await call("terms.accept", { accepted: true, eligible: true, termsVersion: "test-1", displayName: "Alice" })).status, 200);
    const run = (await call("session.start")).body.result; assert.equal(run.lives, 3);
    const direction = [1, 2, 3, 4].find(d => E.available(run.state.walls, run.state.player, d));
    await new Promise(resolve => setTimeout(resolve, 300));
    const input = { sessionId: run.sessionId, sequence: 1, toTick: 4, inputs: [{ tick: 1, direction }], score: 999999999 };
    const results = await Promise.all(Array.from({ length: 5 }, () => call("session.checkpoint", input)));
    assert.ok(results.every(r => r.status === 200));
    assert.ok(results.every(r => r.body.result.score === results[0].body.result.score));
    const score = results[0].body.result.score; assert.ok(score > 0 && score < 1000);
    assert.equal((await call("leaderboard", { competitionId: competition.id })).body.result.top[0].score, score);
    // A real object restart must recover durable state rather than depend on process memory.
    await mf.dispose(); mf = await startRuntime(directory);
    const recovery = await call("result", { sessionId: run.sessionId });
    assert.equal(recovery.status, 200, JSON.stringify(recovery.body));
    const restored = recovery.body.result;
    assert.equal(restored.score, score); assert.equal(restored.sequence, 1);
    const leaked = JSON.stringify((await call("leaderboard", { competitionId: competition.id }, null)).body);
    assert.doesNotMatch(leaked, /synthetic@example|"uid"|"sessionId"/);
    assert.equal((await call("session.checkpoint", { ...input, sequence: 2, toTick: 10000, inputs: [] })).status, 400);
    assert.equal((await call("result", { sessionId: run.sessionId })).body.result.score, score);
  } finally { await mf.dispose(); }
});
