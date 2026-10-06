import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { SQLiteStore, budgetMeter } from "../src/sqlite-store.mjs";
function fixture() {
  const db = new DatabaseSync(":memory:");
  const storage = { sql: { exec(sql, ...bindings) {
    if (!bindings.length && sql.includes(";")) { db.exec(sql); return { toArray: () => [], rowsRead: 0, rowsWritten: 0 }; }
    const statement = db.prepare(sql);
    if (/^\s*(SELECT|PRAGMA)/i.test(sql)) { const rows = statement.all(...bindings); return { toArray: () => rows, rowsRead: rows.length, rowsWritten: 0 }; }
    const result = statement.run(...bindings); return { toArray: () => [], rowsRead: 0, rowsWritten: Number(result.changes) };
  } }, transactionSync(fn) {
    db.exec("BEGIN"); try { const result = fn(); db.exec("COMMIT"); return result; } catch (error) { db.exec("ROLLBACK"); throw error; }
  } };
  SQLiteStore.initialize(storage); return { storage, db, store: new SQLiteStore(storage) };
}
test("failed SQLite writes roll back, retention deletes bounded expired evidence, and free capacity reserves ranked progress", async () => {
  const { storage, store, db } = fixture();
  try {
    await assert.rejects(store.transaction(tx => { tx.put("dashSessions/test", { state: { score: 5 } }); tx.put("users/forbidden", {}); }), /record path/);
    assert.equal(await store.get("dashSessions/test"), null);
    await store.transaction(tx => { tx.put("dashRateLimits/old", { expiresAt: 1 }); tx.put("dashSessions/test", { state: { score: 5 }, competitionId: "month", status: "active" }); });
    store.prune(2); assert.equal(await store.get("dashRateLimits/old"), null); assert.equal((await store.get("dashSessions/test")).state.score, 5);
    assert.equal((await store.scan("dashSessions", [["status", "==", "active"]])).length, 1);
    await assert.rejects(store.scan("dashSessions", [["malicious')--", "==", "anything"]]), /Invalid query/);
    await store.transaction(tx => {
      tx.put("dashCompetitions/month", { endAt: 100 });
      tx.put("dashAudit/review", { competitionId: "month", action: "admin.review" });
      tx.put("dashEvents/open", { competitionId: "month" });
      tx.put("dashPlayers/player", { closesAt: 100 });
    });
    store.prune(100 + 90 * 86400000 - 1); assert.ok(await store.get("dashAudit/review"));
    store.prune(100 + 90 * 86400000);
    for (const path of ["dashCompetitions/month", "dashAudit/review", "dashEvents/open", "dashPlayers/player"]) assert.equal(await store.get(path), null);
    const meter = budgetMeter(storage, () => 100000); meter.usage.writes = 60000;
    assert.equal(meter.limited("session.start"), true); assert.equal(meter.limited("session.checkpoint"), false);
    meter.save(); assert.equal(budgetMeter(storage, () => 86400100).usage.writes, 0);
  } finally { db.close(); }
});
