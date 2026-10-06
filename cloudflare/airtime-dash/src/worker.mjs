import { DurableObject } from "cloudflare:workers";
import serviceModule from "../../../functions/airtime-dash/service.cjs";
import { SQLiteStore, budgetMeter } from "./sqlite-store.mjs";
import { firebaseVerifier, firebaseProfiles } from "./firebase.mjs";
const { createService, GameError } = serviceModule;
const verify = firebaseVerifier();
const publicActions = new Set(["config", "leaderboard", "challenge.resolve"]);
const statusFor = { "invalid-argument": 400, "unauthenticated": 401, "permission-denied": 403, "not-found": 404, "resource-exhausted": 429, "failed-precondition": 409 };
const failure = (code, message) => ({ error: { code, message } });
function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return json({ service: "freehub-airtime-dash", storage: "sqlite-durable-object", rankedEnabled: env.RANKED_ENABLED === "true" });
    if (url.pathname !== "/api") return json(failure("not-found", "Not found."), 404);
    const origin = request.headers.get("Origin"), allowed = (env.ALLOWED_ORIGINS || "").split(",");
    if (origin && !allowed.includes(origin)) return json(failure("permission-denied", "Invalid origin."), 403);
    const cors = origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" } : {};
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json(failure("invalid-argument", "Use POST."), 405, cors);
    try {
      if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json(failure("invalid-argument", "Use JSON."), 400, cors);
      if (Number(request.headers.get("Content-Length") || 0) > 50000) return json(failure("invalid-argument", "Request too large."), 413, cors);
      const reader = request.body?.getReader(); if (!reader) return json(failure("invalid-argument", "Missing request."), 400, cors);
      const chunks = []; let bytes = 0;
      while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength;
        if (bytes > 50000) { await reader.cancel(); return json(failure("invalid-argument", "Request too large."), 413, cors); } chunks.push(value); }
      const body = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
      const input = JSON.parse(new TextDecoder().decode(body));
      if (!input || typeof input.action !== "string" || typeof input.data !== "object" || !input.data || Array.isArray(input.data)) return json(failure("invalid-argument", "Invalid request."), 400, cors);
      const authorization = request.headers.get("Authorization") || "";
      const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
      const stub = env.DASH.get(env.DASH.idFromName("freehub-airtime-dash-v1"));
      const result = await stub.request(input, { bearer, ip: request.headers.get("CF-Connecting-IP") || "unknown" });
      return json(result.error ? result : { result }, result.error ? statusFor[result.error.code] || 503 : 200, cors);
    } catch { return json(failure("invalid-argument", "Invalid or unavailable request. Please retry."), 400, cors); }
  }
};
export class AirtimeDash extends DurableObject {
  constructor(ctx, env) { super(ctx, env); SQLiteStore.initialize(ctx.storage); }
  async request(input, identity) {
    let uid;
    try {
      if (identity.bearer) uid = await verify(identity.bearer, this.env.FIREBASE_PROJECT_ID);
      if (!publicActions.has(input.action) && !uid) return failure("unauthenticated", "Sign in with your FreeHub account.");
    } catch { return failure("unauthenticated", "Please sign in again. Your sign-in could not be verified."); }
    if (input.action === "session.start" || input.action === "admin.securityCheck") {
      if (input.action === "session.start" && this.env.RANKED_ENABLED !== "true") return failure("failed-precondition", "Prize entry is not open yet.");
      if (!this.env.TURNSTILE_SECRET) return failure("failed-precondition", "The security check is not configured.");
      try {
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({
          secret: this.env.TURNSTILE_SECRET, response: input.turnstileToken || "", remoteip: identity.ip,
        }), signal: AbortSignal.timeout(5000) });
        const proof = await response.json();
        if (!response.ok || !proof.success || proof.action !== "dash-start" || !(this.env.TURNSTILE_HOSTNAMES || "").split(",").includes(proof.hostname)) return failure("permission-denied", "Complete the security check before starting.");
      } catch { return failure("failed-precondition", "The security check is temporarily unavailable."); }
    }
    const profiles = firebaseProfiles(this.env.FIREBASE_PROJECT_ID, identity.bearer);
    // Network calls for existing account permission checks happen before the game lock.
    try {
      if (["session.start", "terms.accept"].includes(input.action)) await profiles(`users/${uid}`);
      if (input.action.startsWith("admin.")) await profiles(`admins/${uid}`);
    } catch { return failure("failed-precondition", "FreeHub account verification is temporarily unavailable."); }
    return this.ctx.blockConcurrencyWhile(async () => {
      const meter = budgetMeter(this.ctx.storage);
      try {
        const storage = this.ctx.storage;
        // Stop new starts before consuming the entire free allowance; reserve progress capacity.
        if (meter.limited(input.action)) return failure("resource-exhausted", "Today's game capacity has been reached. Your verified score is saved; practice remains available.");
        const store = new SQLiteStore(storage, profiles, meter.sql), service = createService(store);
        const result = await service.handle(input.action, input.data, { uid, ip: identity.ip });
        if (!await storage.getAlarm()) await storage.setAlarm(Date.now() + 60000);
        return result;
      } catch (error) {
        if (error instanceof GameError) return failure(error.code, error.message);
        console.error("Airtime Dash unavailable", { action: input.action });
        return failure("unavailable", "The game service is temporarily unavailable. Your verified progress is preserved.");
      } finally { meter.save(); }
    });
  }
  async alarm() {
    return this.ctx.blockConcurrencyWhile(async () => {
      const meter = budgetMeter(this.ctx.storage), store = new SQLiteStore(this.ctx.storage, undefined, meter.sql), service = createService(store);
      try { if (!meter.limited("maintenance")) { await service.sweep(); store.prune(Date.now()); } }
      finally {
        const competition = await service.current();
        const active = await store.scan("dashSessions", [["status", "==", "active"]]);
        if (active.length || ["live", "scheduled"].includes(competition?.status)) await this.ctx.storage.setAlarm(Date.now() + 60000);
        else await this.ctx.storage.setAlarm(Date.now() + 86400000);
        meter.save();
      }
    });
  }
}
