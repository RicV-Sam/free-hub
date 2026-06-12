# Optional Firebase Registration Foundation

This sprint adds an optional Firebase account layer for Freehub. It must not gate browsing, competition detail pages, or outbound `/out/` redirect pages.

## Configuration

Commit only example configuration:

- `firebase-config.example.json`
- `.env.example`

Do not commit `firebase-config.json`, service account keys, OAuth secrets, private Firebase Admin config, or downloaded project credentials. The browser client should initialize only when public Firebase web config exists.

Use `enabledAuthProviders` in `firebase-config.json` to keep the visible sign-in buttons aligned with Firebase Console. For example, use `["google", "emailLink"]` while Facebook is disabled.

## Authentication

Supported optional sign-in methods:

- Google
- Facebook
- Email link sign-in

Phone and SMS authentication are intentionally out of scope.

Email link sign-in is the static-site-friendly email option because the browser can request a one-time sign-in link through Firebase Authentication without Freehub storing a password.

## Proposed Firestore Structure

```text
users/{userId}
users/{userId}/savedCompetitions/{competitionId}
users/{userId}/ignoredCompetitions/{competitionId}
users/{userId}/alertPreferences/main
signupEvents/{eventId}
```

### `users/{userId}`

```json
{
  "userId": "firebase-auth-uid",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://...",
  "providerIds": ["google.com"],
  "acceptedPrivacyPolicy": true,
  "alertsMarketingConsent": false,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `users/{userId}/savedCompetitions/{competitionId}`

```json
{
  "competitionId": "brand-competition-slug-2026",
  "title": "Competition title",
  "category": "Cash",
  "path": "https://freehub.co.za/competition/brand-competition-slug-2026/",
  "savedAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `users/{userId}/ignoredCompetitions/{competitionId}`

```json
{
  "competitionId": "brand-competition-slug-2026",
  "title": "Competition title",
  "category": "Cash",
  "path": "https://freehub.co.za/competition/brand-competition-slug-2026/",
  "ignoredAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `users/{userId}/alertPreferences/main`

```json
{
  "competitionAlerts": true,
  "marketingOptIn": false,
  "source": "competition-detail",
  "updatedAt": "serverTimestamp"
}
```

### `signupEvents/{eventId}`

```json
{
  "eventId": "auto-id",
  "userId": "firebase-auth-uid",
  "provider": "google",
  "competitionId": "brand-competition-slug-2026",
  "alertsOptIn": false,
  "pagePath": "/competition/brand-competition-slug-2026/",
  "createdAt": "serverTimestamp"
}
```

## Example Security Rules

These rules are a starting point for manual review and deployment. Do not deploy them automatically from the static-site build.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function userFieldsAreAllowed() {
      return request.resource.data.keys().hasOnly([
        'userId',
        'email',
        'displayName',
        'photoURL',
        'providerIds',
        'acceptedPrivacyPolicy',
        'alertsMarketingConsent',
        'createdAt',
        'updatedAt'
      ]);
    }

    match /users/{userId} {
      allow create, update: if isOwner(userId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.acceptedPrivacyPolicy == true
        && userFieldsAreAllowed();
      allow read, delete: if isOwner(userId);

      match /savedCompetitions/{competitionId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId)
          && request.resource.data.competitionId == competitionId
          && request.resource.data.keys().hasOnly([
            'competitionId',
            'title',
            'category',
            'path',
            'savedAt',
            'updatedAt'
          ]);
      }

      match /ignoredCompetitions/{competitionId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId)
          && request.resource.data.competitionId == competitionId
          && request.resource.data.keys().hasOnly([
            'competitionId',
            'title',
            'category',
            'path',
            'ignoredAt',
            'updatedAt'
          ]);
      }

      match /alertPreferences/main {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId)
          && request.resource.data.keys().hasOnly([
            'competitionAlerts',
            'marketingOptIn',
            'source',
            'updatedAt'
          ]);
      }
    }

    match /signupEvents/{eventId} {
      allow create: if signedIn()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasOnly([
          'eventId',
          'userId',
          'provider',
          'competitionId',
          'alertsOptIn',
          'pagePath',
          'createdAt'
        ]);
      allow read, update, delete: if false;
    }
  }
}
```

Review these rules against production consent, retention and abuse-prevention requirements before deployment.
