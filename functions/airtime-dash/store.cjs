const clone = value => value === undefined ? null : structuredClone(value);
class MemoryStore {
  constructor(seed = {}) { this.data = new Map(Object.entries(seed)); this.queue = Promise.resolve(); }
  async get(path) { return clone(this.data.get(path)); }
  async scan(collection, filters = []) {
    return [...this.data.entries()].filter(([path, value]) => path.startsWith(collection + "/") && path.split("/").length === 2 &&
      filters.every(([key, op, target]) => op === "==" ? value[key] === target : op === "<=" ? value[key] <= target : false))
      .map(([path, value]) => ({ ...clone(value), id: path.split("/")[1] }));
  }
  transaction(fn) {
    const work = this.queue.then(async () => {
      const pending = new Map();
      const result = await fn({ get: path => this.get(path), scan: (collection, filters) => this.scan(collection, filters), put: (path, value) => pending.set(path, clone(value)) });
      for (const [path, value] of pending) this.data.set(path, value);
      return result;
    });
    this.queue = work.catch(() => {}); return work;
  }
}
class FirestoreStore {
  constructor(db) { this.db = db; }
  query(collection, filters = []) {
    let query = this.db.collection(collection);
    for (const [key, op, value] of filters) query = query.where(key, op, value);
    return query.limit(10001);
  }
  rows(result) {
    if (result.size > 10000) throw new Error("Review dataset exceeds the bounded query limit; partition the competition before continuing.");
    return result.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }
  async get(path) { const doc = await this.db.doc(path).get(); return doc.exists ? doc.data() : null; }
  async scan(collection, filters = []) {
    return this.rows(await this.query(collection, filters).get());
  }
  transaction(fn) {
    return this.db.runTransaction(async transaction => {
      // Queue writes so every transaction read occurs before its first write.
      const pending = new Map();
      const result = await fn({
        get: async path => { const doc = await transaction.get(this.db.doc(path)); return doc.exists ? doc.data() : null; },
        scan: async (collection, filters) => this.rows(await transaction.get(this.query(collection, filters))),
        put: (path, value) => pending.set(path, structuredClone(value)),
      });
      for (const [path, value] of pending) transaction.set(this.db.doc(path), value);
      return result;
    });
  }
}
module.exports = { MemoryStore, FirestoreStore };
