const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { FirestoreStore } = require("./store.cjs");
const { createService, GameError } = require("./service.cjs");
if (!getApps().length) initializeApp();
const service = createService(new FirestoreStore(getFirestore()));
exports.airtimeDash = onCall({ region: "africa-south1", enforceAppCheck: true, maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" }, async request => {
  try {
    const input = request.data;
    if (!input || JSON.stringify(input).length > 50000) throw new HttpsError("invalid-argument", "Invalid or oversized request.");
    return await service.handle(input.action, input.data || {}, { uid: request.auth?.uid, ip: request.rawRequest.ip });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (error instanceof GameError) throw new HttpsError(error.code, error.message);
    console.error("Airtime Dash request failed", { code: error.code || "internal" });
    throw new HttpsError("internal", "The game service is temporarily unavailable. Please retry.");
  }
});
exports.airtimeDashMaintenance = onSchedule({ schedule: "every 1 minutes", region: "africa-south1", timeZone: "Africa/Johannesburg", timeoutSeconds: 300, maxInstances: 1 }, () => service.sweep());
