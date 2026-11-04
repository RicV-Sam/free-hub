const assert = require('node:assert/strict');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const { FieldValue } = require('firebase-admin/firestore');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { loadFirebaseAdmin, getEligibleRecipients, queueCampaignEmails, parseArgs } = require('../../scripts/queue-email-alerts.js');

test('modular Admin loads an existing default app and constructs queries without credentials or requests', async () => {
  const app = initializeApp({ projectId: 'demo-freehub-offline' });
  app.options.credential.getAccessToken = () => { throw new Error('Unexpected credential request in offline test'); };
  try {
    const first = loadFirebaseAdmin({});
    const second = loadFirebaseAdmin({});
    assert.equal(first.db, second.db);
    assert.equal(first.db.collectionGroup('alertPreferences').where('competitionAlerts', '==', true).constructor.name, 'Query');
    assert.equal(first.FieldValue.serverTimestamp().constructor, FieldValue.serverTimestamp().constructor);
  } finally { await deleteApp(app); }
});

test('dry run never initializes Firebase or accesses credentials', () => {
  const result = spawnSync(process.execPath, ['scripts/queue-email-alerts.js', '--service-account', 'does-not-exist.json'], {
    cwd: require('node:path').resolve(__dirname, '../..'), encoding: 'utf8',
    env: { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: 'does-not-exist.json' },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry-run|No published active competitions/);
  assert.equal(parseArgs([]).send, false);
});

test('recipient selection still requires both consent flags and an email', async () => {
  const candidates = [
    [{ email: 'yes@example.test', alertsMarketingConsent: true }, { marketingOptIn: true }],
    [{ email: 'no@example.test', alertsMarketingConsent: false }, { marketingOptIn: true }],
    [{ email: 'no@example.test', alertsMarketingConsent: true }, { marketingOptIn: false }],
    [{ alertsMarketingConsent: true }, { marketingOptIn: true }],
  ];
  const db = { collectionGroup(name) {
    assert.equal(name, 'alertPreferences');
    return { where(...args) {
      assert.deepEqual(args, ['competitionAlerts', '==', true]);
      return { async get() { return { docs: candidates.map(([user, preference], i) => ({
        ref: { parent: { parent: { id: String(i), async get() { return { exists: true, data: () => user }; } } } },
        data: () => preference,
      })) }; } };
    } };
  } };
  assert.deepEqual(await getEligibleRecipients(db, {}), [{ userId: '0', email: 'yes@example.test' }]);
});

test('queue uses real modular timestamp sentinels, skips existing recipients and keeps batch limits', async () => {
  const writes = [], sizes = []; let mailId = 0;
  function ref(path) { return {
    path, collection: name => collection(`${path}/${name}`),
    async get() { return { exists: path.endsWith('/already-queued') }; },
    async set(data) { writes.push({ path, data }); },
  }; }
  function collection(path) { return { doc: id => ref(`${path}/${id || ++mailId}`) }; }
  const db = { collection, batch() { const operations = []; return {
    set(target, data) { operations.push({ path: target.path, data }); },
    async commit() { sizes.push(operations.length); writes.push(...operations); },
  }; } };
  const recipients = [{ userId: 'already-queued', email: 'skip@example.test' }, ...Array.from({ length: 201 }, (_, i) => ({ userId: `u${i}`, email: `u${i}@example.test` }))];
  const result = await queueCampaignEmails(db, FieldValue, {
    campaignId: 'offline-test', competitions: [{ id: 'example' }], recipients,
    email: { subject: 'Offline test', text: 'No delivery' }, mailCollection: 'mail', campaignCollection: 'emailCampaigns',
  });
  assert.equal(result.queued, 201); assert.equal(result.skipped, 1);
  assert.deepEqual(sizes, [400, 2]);
  const mail = writes.filter(w => w.path.startsWith('mail/'));
  assert.equal(mail.length, 201);
  assert.equal(mail[0].data.createdAt.constructor, FieldValue.serverTimestamp().constructor);
  assert.deepEqual(mail[0].data.to, ['u0@example.test']);
  assert.equal(writes.at(-1).data.completedAt.constructor, FieldValue.serverTimestamp().constructor);
});
