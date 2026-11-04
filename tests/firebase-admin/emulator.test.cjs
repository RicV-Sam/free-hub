const test = require('node:test');
const assert = require('node:assert/strict');
const { getApp, deleteApp } = require('firebase-admin/app');
const { loadFirebaseAdmin, getEligibleRecipients, queueCampaignEmails } = require('../../scripts/queue-email-alerts.js');

test('email queue persists timestamps and deduplicates on local Firestore', { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):\d+$/);
  const { db, FieldValue } = loadFirebaseAdmin({ projectId: 'demo-freehub-admin-upgrade' });
  try {
    await db.doc('users/consenting').set({ email: 'test@example.test', alertsMarketingConsent: true });
    await db.doc('users/consenting/alertPreferences/email').set({ competitionAlerts: true, marketingOptIn: true });
    await db.doc('users/no-consent').set({ email: 'no@example.test', alertsMarketingConsent: false });
    await db.doc('users/no-consent/alertPreferences/email').set({ competitionAlerts: true, marketingOptIn: true });
    const recipients = await getEligibleRecipients(db, {});
    assert.deepEqual(recipients, [{ userId: 'consenting', email: 'test@example.test' }]);
    const context = { campaignId: 'local-upgrade-test', recipients, competitions: [{ id: 'local-fixture' }],
      mailCollection: 'offlineTestMail', campaignCollection: 'offlineTestCampaigns',
      email: { subject: 'Emulator only', text: 'Never delivered' } };
    assert.equal((await queueCampaignEmails(db, FieldValue, context)).queued, 1);
    const retry = await queueCampaignEmails(db, FieldValue, context);
    assert.equal(retry.queued, 0); assert.equal(retry.skipped, 1);
    const mail = await db.collection('offlineTestMail').get();
    assert.equal(mail.size, 1);
    assert.ok(mail.docs[0].data().createdAt.toMillis() > 0);
    assert.deepEqual(mail.docs[0].data().to, ['test@example.test']);
  } finally { await deleteApp(getApp()); }
});
