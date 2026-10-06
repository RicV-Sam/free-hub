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
    for (const path of ["dashEvents/open", "dashPlayers/player"]) assert.equal(await store.get(path), null);
    for (const path of ["dashCompetitions/month", "dashAudit/review"]) assert.ok(await store.get(path));
    const expiry = Date.UTC(1973, 0, 1, 0, 0, 0, 100);
    store.prune(expiry - 1); assert.ok(await store.get("dashAudit/review"));
    store.prune(expiry); assert.equal(await store.get("dashAudit/review"), null);
    const meter = budgetMeter(storage, () => 100000); meter.usage.writes = 60000;
    assert.equal(meter.limited("session.start"), true); assert.equal(meter.limited("session.checkpoint"), false);
    meter.save(); assert.equal(budgetMeter(storage, () => 86400100).usage.writes, 0);
  } finally { db.close(); }
});

test("retention migration preserves old audit records through three calendar years, including leap years", () => {
  const { storage, db } = fixture();
  try {
    const closes = Date.parse("2026-11-01T00:00:00+02:00");
    storage.sql.exec("INSERT INTO records VALUES(?,?,?,?)", "dashAudit/old", "dashAudit", "{}", closes + 90 * 86400000);
    db.exec("DELETE FROM schema_migrations"); SQLiteStore.initialize(storage);
    assert.equal(storage.sql.exec("SELECT expiresAt FROM records WHERE path='dashAudit/old'").toArray()[0].expiresAt, Date.parse("2029-11-01T00:00:00+02:00"));
    SQLiteStore.initialize(storage);
    assert.equal(storage.sql.exec("SELECT expiresAt FROM records WHERE path='dashAudit/old'").toArray()[0].expiresAt, Date.parse("2029-11-01T00:00:00+02:00"));
  } finally { db.close(); }
});

test("later prize fulfilment extends existing accepted entries and verified results", async () => {
  const { store, db, storage } = fixture();
  try {
    const endAt = Date.parse("2026-11-01T00:00:00+02:00"), prizeSentAt = Date.parse("2026-11-09T12:00:00+02:00");
    await store.transaction(tx => {
      tx.put("dashCompetitions/month", { endAt });
      for (const collection of ["dashTerms", "dashSessions", "dashBest", "dashAudit", "dashExclusions"])
        tx.put(`${collection}/record`, { competitionId: "month" });
    });
    await store.transaction(tx => tx.put("dashCompetitions/month", { endAt, prizeSentAt }));
    for (const row of storage.sql.exec("SELECT expiresAt FROM records").toArray())
      assert.equal(row.expiresAt, Date.parse("2029-11-09T12:00:00+02:00"));
  } finally { db.close(); }
});
