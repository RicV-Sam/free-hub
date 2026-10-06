const auditCollections = new Set(["dashCompetitions", "dashTerms", "dashSessions", "dashBest", "dashAudit", "dashExclusions"]);
const threeYearsAfter = value => { const date = new Date(value); date.setUTCFullYear(date.getUTCFullYear() + 3); return date.getTime(); };
export class SQLiteStore {
  constructor(storage, profiles = async () => null, sql = storage.sql) {
    this.storage = storage; this.sql = sql; this.profiles = profiles;
  }
  static initialize(storage) {
    storage.sql.exec(`CREATE TABLE IF NOT EXISTS records (
      path TEXT PRIMARY KEY, collection TEXT NOT NULL, value TEXT NOT NULL,
      expiresAt INTEGER
    ) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS records_collection ON records(collection);
    CREATE INDEX IF NOT EXISTS records_expiry ON records(expiresAt) WHERE expiresAt IS NOT NULL;
    CREATE INDEX IF NOT EXISTS records_active ON records(json_extract(value, '$.status')) WHERE collection = 'dashSessions';
    CREATE INDEX IF NOT EXISTS records_competition ON records(json_extract(value, '$.competitionId'));
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);`);
    if (!storage.sql.exec("SELECT version FROM schema_migrations WHERE version = 2").toArray().length) storage.transactionSync(() => {
      // Extend the unopened staging records' old 90-day expiry without deleting evidence.
      storage.sql.exec(`UPDATE records SET expiresAt = CAST(strftime('%s',expiresAt/1000.0,'unixepoch','-90 days','+3 years') AS INTEGER)*1000 + expiresAt%1000
        WHERE collection IN ('dashCompetitions','dashTerms','dashSessions','dashBest','dashAudit','dashExclusions') AND expiresAt IS NOT NULL;
        INSERT INTO schema_migrations(version) VALUES(2);`);
    });
  }
  async get(path) {
    if (/^(users|admins)\//.test(path)) return this.profiles(path);
    const row = this.sql.exec("SELECT value FROM records WHERE path = ?", path).toArray()[0];
    return row ? JSON.parse(row.value) : null;
  }
  async scan(collection, filters = []) {
    const clauses = ["collection = ?"], bindings = [collection];
    for (const [field, op, value] of filters) {
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(field) || !["==", "<="].includes(op)) throw new Error("Invalid query.");
      // Field/operator are allow-listed; embedding the field lets SQLite use expression indexes.
      clauses.push(`json_extract(value, '$.${field}') ${op === "==" ? "=" : "<="} ?`); bindings.push(value);
    }
    const rows = this.sql.exec(`SELECT path, value FROM records WHERE ${clauses.join(" AND ")} LIMIT 10001`, ...bindings).toArray();
    if (rows.length > 10000) throw new Error("Review dataset exceeds the bounded query limit.");
    return rows.map(row => ({ ...JSON.parse(row.value), id: row.path.split("/")[1] }));
  }
  async transaction(fn) {
    // Caller blocks concurrent object events; async reads finish before the atomic commit.
    const pending = new Map();
    const result = await fn({ get: path => this.get(path), scan: (collection, filters) => this.scan(collection, filters),
      put: (path, value) => pending.set(path, structuredClone(value)) });
    this.storage.transactionSync(() => {
      for (const [path, value] of pending) {
        const collection = path.split("/")[0];
        if (!/^dash[A-Za-z]+\/[a-zA-Z0-9_-]+$/.test(path)) throw new Error("Invalid game record path.");
        let expires = collection === "dashRateLimits" ? value.expiresAt : null;
        const competitionPath = value.competitionId ? `dashCompetitions/${value.competitionId}` : null;
        const saved = competitionPath ? this.sql.exec("SELECT value FROM records WHERE path = ?", competitionPath).toArray()[0] : null;
        const competition = competitionPath ? pending.get(competitionPath) || (saved ? JSON.parse(saved.value) : null) : null;
        const closes = collection === "dashCompetitions" ? value.endAt : competition?.endAt ?? value.closesAt;
        if (Number.isSafeInteger(closes)) expires = auditCollections.has(collection)
          ? threeYearsAfter(Math.max(closes, ...[value.at, value.updatedAt, value.prizeSentAt, competition?.prizeSentAt].filter(Number.isSafeInteger)))
          : closes + 90 * 86400000;
        this.sql.exec("INSERT INTO records(path, collection, value, expiresAt) VALUES (?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET value=excluded.value, expiresAt=excluded.expiresAt",
          path, collection, JSON.stringify(value), expires);
      }
      for (const [path, competition] of pending) {
        if (!path.startsWith("dashCompetitions/") || !Number.isSafeInteger(competition.endAt)) continue;
        const expires = threeYearsAfter(Math.max(competition.endAt, ...[competition.updatedAt, competition.prizeSentAt].filter(Number.isSafeInteger)));
        // Later prize administration extends every related retained entry and result.
        this.sql.exec(`UPDATE records SET expiresAt = ? WHERE json_extract(value, '$.competitionId') = ?
          AND collection IN ('dashTerms','dashSessions','dashBest','dashAudit','dashExclusions') AND expiresAt < ?`,
          expires, path.split("/")[1], expires);
      }
    });
    return result;
  }
  prune(now) {
    // Bound each cleanup batch; score and session summaries remain available for winner review.
    this.sql.exec("DELETE FROM records WHERE path IN (SELECT path FROM records WHERE expiresAt <= ? LIMIT 200)", now);
  }
}

export function budgetMeter(storage, clock = Date.now) {
  const day = Math.floor(clock() / 86400000), cursor = storage.sql.exec("SELECT value FROM records WHERE path='dashBudget/current'");
  const row = cursor.toArray()[0], prior = row ? JSON.parse(row.value) : null;
  const usage = prior?.day === day ? prior : { day, requests: 0, reads: 0, writes: 0 };
  usage.reads += cursor.rowsRead; usage.requests++;
  const sql = { exec(query, ...bindings) {
    const cursor = storage.sql.exec(query, ...bindings), rows = cursor.toArray();
    usage.reads += cursor.rowsRead; usage.writes += cursor.rowsWritten;
    return { toArray: () => rows };
  } };
  return { usage, sql,
    limited(action) { return usage.requests > 75000 || usage.reads > 3500000 || usage.writes > 75000 || (action === "session.start" && (usage.writes > 50000 || usage.reads > 2500000 || storage.sql.databaseSize > 1000000000)); },
    save() {
      // Reserve a conservative allowance for writing this budget row and its indexes.
      usage.writes += 4;
      storage.sql.exec("INSERT INTO records(path,collection,value) VALUES('dashBudget/current','dashBudget',?) ON CONFLICT(path) DO UPDATE SET value=excluded.value", JSON.stringify(usage));
    }
  };
}
