const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../../shared/firebase-client.js'), 'utf8');
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const user = { uid: 'test-user', email: 'member@example.test', displayName: 'Test member', providerData: [] };
const userPath = 'users/test-user';
const preferencePath = `${userPath}/alertPreferences/main`;

async function fixture(initial = {}) {
  const records = new Map(Object.entries(initial).map(([key, value]) => [key, key === userPath ? { userId: user.uid, acceptedPrivacyPolicy: true, ...value } : value]));
  let rejectCommit = false;
  const snapshot = (ref) => ({ exists: () => records.has(ref), data: () => records.get(ref) });
  const validate = (writes) => {
    for (const [ref, data] of writes) {
      const next = { ...records.get(ref), ...data };
      if (ref === userPath && (next.userId !== user.uid || next.acceptedPrivacyPolicy !== true)) throw Error('Documented owner/privacy rule denied write');
    }
  };
  const apply = (ref, data) => records.set(ref, { ...records.get(ref), ...data });
  const firestore = {
    doc: (_, ...parts) => parts.join('/'),
    getDoc: async (ref) => snapshot(ref),
    serverTimestamp: () => 'new-timestamp',
    runTransaction: async (_, callback) => {
      const writes = [];
      await callback({ get: async (ref) => snapshot(ref), set: (...args) => writes.push(args) });
      if (rejectCommit) throw Error('Simulated write failure');
      validate(writes);
      writes.forEach(([ref, data]) => apply(ref, data));
    },
    writeBatch: () => {
      const writes = [];
      return {
        set: (...args) => writes.push(args),
        commit: async () => {
          if (rejectCommit) throw Error('Simulated write failure');
          validate(writes);
      writes.forEach(([ref, data]) => apply(ref, data));
        },
      };
    },
  };
  const { buildFirestoreHelpers } = await modulePromise;
  return { helpers: buildFirestoreHelpers({}, firestore), records, fail: () => { rejectCommit = true; } };
}

test('returning sign-in preserves a previous opt-in and its timestamp', async () => {
  const f = await fixture({ [userPath]: { alertsMarketingConsent: true, marketingConsent: true, marketingConsentUpdatedAt: 'original', acceptedPrivacyPolicy: true } });
  await f.helpers.upsertUserProfile(user, { alertsMarketingConsent: false });
  assert.equal(f.records.get(userPath).alertsMarketingConsent, true);
  assert.equal(f.records.get(userPath).marketingConsentUpdatedAt, 'original');
  assert.equal(f.records.get(userPath).acceptedPrivacyPolicy, true);
});

test('new account defaults off; sign-in itself never implies subscription', async () => {
  const f = await fixture();
  await f.helpers.upsertUserProfile(user, { acceptedPrivacyPolicy: true, alertsMarketingConsent: true });
  assert.equal(f.records.get(userPath).alertsMarketingConsent, false);
  assert.equal(f.records.get(userPath).acceptedPrivacyPolicy, true);
  assert.equal(f.records.has(preferencePath), false);
});

test('explicit subscribe and unsubscribe synchronize every recipient gate', async () => {
  const f = await fixture({ [userPath]: { email: user.email, alertsMarketingConsent: false } });
  for (const subscribed of [true, false]) {
    await f.helpers.setAlertPreferences(user.uid, { competitionAlerts: subscribed, marketingOptIn: subscribed, source: 'club-account' });
    assert.equal(f.records.get(userPath).alertsMarketingConsent, subscribed);
    assert.equal(f.records.get(userPath).marketingConsent, subscribed);
    assert.equal(f.records.get(preferencePath).competitionAlerts, subscribed);
    assert.equal(f.records.get(preferencePath).marketingOptIn, subscribed);
    assert.equal(f.records.get(userPath).email, user.email);
  }
});

test('failed preference write does not partially update consent', async () => {
  const f = await fixture({ [userPath]: { alertsMarketingConsent: false }, [preferencePath]: { competitionAlerts: false, marketingOptIn: false } });
  f.fail();
  await assert.rejects(f.helpers.setAlertPreferences(user.uid, { competitionAlerts: true, marketingOptIn: true }));
  assert.equal(f.records.get(userPath).alertsMarketingConsent, false);
  assert.equal(f.records.get(preferencePath).competitionAlerts, false);
});

test('missing or contradictory explicit preference fails closed', async () => {
  const f = await fixture({ [userPath]: {} });
  await f.helpers.setAlertPreferences(user.uid, { competitionAlerts: true });
  assert.equal(f.records.get(userPath).alertsMarketingConsent, false);
  assert.equal(f.records.get(preferencePath).competitionAlerts, false);
});

test('closed campaign preserves existing referral records without fabricating consent', async () => {
  global.window = { FREEHUB_REFER_WIN_CONFIG: { referWinCampaignEnabled: false } };
  try {
    const f = await fixture({ [userPath]: { referralCode: 'EXISTING', referWinTermsAccepted: true, alertsMarketingConsent: true } });
    const profile = await f.helpers.ensureClubProfile(user);
    assert.equal(profile.referralCode, 'EXISTING');
    assert.equal(profile.referWinTermsAccepted, true);
    assert.equal(profile.alertsMarketingConsent, true);
    assert.equal(profile.acceptedPrivacyPolicy, true);
    assert.equal(profile.clubTermsAccepted, undefined);
  } finally {
    delete global.window;
  }
});

test('auth hydration does not create an unaccepted profile or campaign records', async () => {
  const f = await fixture();
  assert.equal(await f.helpers.ensureClubProfile(user), null);
  assert.equal(f.records.size, 0);
});

test('missing or unaccepted profile requires explicit privacy acceptance before any write', async () => {
  for (const initial of [{}, { [userPath]: { acceptedPrivacyPolicy: false } }]) {
    const f = await fixture(initial);
    const before = JSON.stringify([...f.records]);
    await assert.rejects(f.helpers.upsertUserProfile(user), { code: 'freehub/privacy-required' });
    assert.equal(JSON.stringify([...f.records]), before);
    await f.helpers.upsertUserProfile(user, { acceptedPrivacyPolicy: true });
    assert.equal(f.records.get(userPath).acceptedPrivacyPolicy, true);
    assert.notEqual(f.records.get(userPath).alertsMarketingConsent, true);
  }
});
