# Firebase Email Alerts

Freehub can queue registered-user competition alerts through Firebase's official Trigger Email extension.

Official docs:

- Firebase Trigger Email extension: https://firebase.google.com/docs/extensions/official/firestore-send-email
- Firebase Extensions Hub listing: https://extensions.dev/extensions/firebase/firestore-send-email

## Architecture

```text
User signs in and opts into alerts
  -> users/{uid} stores email and alertsMarketingConsent
  -> users/{uid}/alertPreferences/main stores competitionAlerts and marketingOptIn
  -> Admin script selects approved competitions and opted-in users
  -> Admin script writes mail/{mailId}
  -> Firebase Trigger Email extension sends through SMTP provider
```

The public website must not write directly to `mail`. Keep `mail` and `emailCampaigns` Admin-only in Firestore rules.

## Firebase setup

1. Choose an SMTP provider supported by the extension setup, such as SendGrid, Mailgun or Mailchimp Transactional.
2. Install the Firebase Trigger Email extension in Firebase Console or with:

```bash
firebase ext:install firebase/firestore-send-email --project=<project-id>
```

3. Configure the extension to watch the `mail` collection.
4. Publish Firestore rules that deny public access to `mail` and `emailCampaigns`.

## Local setup

Install dependencies once:

```bash
npm install
```

Set an Admin SDK credential locally:

```bash
set FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\service-account.json
set FIREBASE_PROJECT_ID=your-firebase-project-id
```

Do not commit service-account files.

## Queue a dry run

Dry run prints the campaign and selected competitions without writing email documents:

```bash
npm run email:alerts -- --since 2026-06-11
```

For one competition:

```bash
npm run email:alerts -- --competition-id boxer-celebrate-win-samsung-a06-2026
```

## Queue real emails

Use a stable campaign ID so users do not receive duplicates if the script is rerun:

```bash
npm run email:alerts -- --since 2026-06-11 --campaign-id june-11-new-competitions --send
```

Small live test:

```bash
npm run email:alerts -- --since 2026-06-11 --campaign-id june-11-test --limit 1 --send
```

The script only sends to users where:

- `users/{uid}.email` exists.
- `users/{uid}.alertsMarketingConsent === true`.
- `users/{uid}/alertPreferences/main.competitionAlerts === true`.
- `users/{uid}/alertPreferences/main.marketingOptIn === true`.

## De-dupe

The script writes `emailCampaigns/{campaignId}/recipients/{uid}` for each queued user. If the same campaign ID is rerun, existing recipients are skipped.
