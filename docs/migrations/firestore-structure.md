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
admins/{uid}
referralCodes/{code}
referralAttribution/{attributionId}
signupEvents/{eventId}
competitionSubmissions/{submissionId}
mail/{mailId}
emailCampaigns/{campaignId}
emailCampaigns/{campaignId}/recipients/{userId}
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
  "marketingConsent": false,
  "marketingConsentUpdatedAt": "serverTimestamp",
  "referralCode": "FH7K92",
  "clubTermsAccepted": true,
  "clubTermsAcceptedAt": "serverTimestamp",
  "referWinTermsAccepted": false,
  "referWinTermsAcceptedAt": null,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `users/{userId}/savedCompetitions/{competitionId}`

```json
{
  "competitionId": "brand-competition-slug-2026",
  "slug": "brand-competition-slug-2026",
  "title": "Competition title",
  "brand": "Brand",
  "category": "Cash",
  "closingDate": "2026-07-31",
  "path": "https://freehub.co.za/competition/brand-competition-slug-2026/",
  "status": "interested",
  "savedAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

`status` must be one of:

- `interested`
- `entered`
- `skipped`

### `referralCodes/{code}`

Public reverse lookup for a generated Freehub Club referral code. These records are not a reward ledger and should not be listable by clients.

```json
{
  "code": "FH7K92",
  "userId": "firebase-auth-uid",
  "createdAt": "serverTimestamp"
}
```

### `admins/{uid}`

Manual allowlist for private Freehub admin tools. Create this document manually in Firebase Console. There is no public UI for creating or updating admin records.

```json
{
  "email": "riccardo.vallaro@gmail.com",
  "role": "owner",
  "active": true,
  "createdAt": "manual"
}
```

Admin access requires:

- Firebase Auth sign-in.
- A document at `admins/{uid}` for the signed-in user.
- `active: true`.

### `referralAttribution/{attributionId}`

Pending-only referral attribution captured when a new signed-in user arrives with `?ref=FH7K92`. Refer & Win is not live; these records are stored as `pending_verification` only.

```json
{
  "attributionId": "referredUid_FH7K92",
  "referredUid": "firebase-auth-uid",
  "referrerUid": "other-firebase-auth-uid",
  "referralCode": "FH7K92",
  "landingPath": "/club/?ref=FH7K92",
  "capturedAt": "2026-06-18T14:00:00.000Z",
  "registeredAt": "serverTimestamp",
  "campaignMonth": "2026-06",
  "status": "pending_verification",
  "verifiedAt": null,
  "rejectionReason": null,
  "reviewedAt": null,
  "reviewedBy": null
}
```

Admin review may later set:

```json
{
  "status": "approved",
  "verifiedAt": "serverTimestamp",
  "reviewedAt": "serverTimestamp",
  "reviewedBy": "admin-auth-uid",
  "rejectionReason": null
}
```

or:

```json
{
  "status": "rejected",
  "verifiedAt": null,
  "reviewedAt": "serverTimestamp",
  "reviewedBy": "admin-auth-uid",
  "rejectionReason": "Duplicate account or invalid attribution evidence"
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

### `competitionSubmissions/{submissionId}`

Company, brand and agency submissions from `/submit-a-competition/`. These records are private review-queue items and must never auto-publish to `data/competitions.json`.

View incoming submissions in Firebase Console under Firestore Database -> `competitionSubmissions`. New rows are created with `reviewStatus: "pending-review"`.

```json
{
  "submissionId": "auto-id",
  "companyName": "Brand or Company",
  "contactName": "Marketing Contact",
  "contactEmail": "contact@example.com",
  "competitionTitle": "Win a prize",
  "officialUrl": "https://example.com/competition",
  "termsUrl": "https://example.com/terms",
  "campaignImageUrl": "https://example.com/campaign-image.jpg",
  "closingDate": "2026-07-31",
  "prizeDetails": "Prize summary",
  "entryMethod": "online-form",
  "requirements": "Purchase, eligibility or account notes",
  "notes": "Extra review notes",
  "reviewStatus": "pending-review",
  "source": "submit-a-competition-page",
  "pagePath": "/submit-a-competition/",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `mail/{mailId}`

This collection is reserved for the Firebase Trigger Email extension. Public/client access should be denied. Only trusted Admin SDK scripts or Cloud Functions should write documents here.

```json
{
  "to": ["user@example.com"],
  "message": {
    "subject": "New Freehub competitions",
    "html": "<p>New competitions...</p>",
    "text": "New competitions..."
  },
  "freehub": {
    "campaignId": "new-competitions-since-2026-06-11",
    "userId": "firebase-auth-uid",
    "competitionIds": ["competition-id"],
    "type": "competition-alert"
  },
  "createdAt": "serverTimestamp"
}
```

### `emailCampaigns/{campaignId}`

Admin-only campaign records used to avoid sending the same alert campaign to the same user more than once.

```json
{
  "campaignId": "new-competitions-since-2026-06-11",
  "competitionIds": ["competition-id"],
  "mailCollection": "mail",
  "subject": "New Freehub competitions",
  "queued": 10,
  "skipped": 2,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "completedAt": "serverTimestamp"
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

    function isActiveAdmin() {
      return signedIn()
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid))
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.active == true;
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
        'marketingConsent',
        'marketingConsentUpdatedAt',
        'referralCode',
        'clubTermsAccepted',
        'clubTermsAcceptedAt',
        'referWinTermsAccepted',
        'referWinTermsAcceptedAt',
        'createdAt',
        'updatedAt'
      ]);
    }

    match /users/{userId} {
      allow create, update: if isOwner(userId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.acceptedPrivacyPolicy == true
        && userFieldsAreAllowed();
      allow read: if isOwner(userId) || isActiveAdmin();
      allow delete: if isOwner(userId);

      match /savedCompetitions/{competitionId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId)
          && request.resource.data.competitionId == competitionId
          && request.resource.data.keys().hasOnly([
            'competitionId',
            'slug',
            'title',
            'brand',
            'category',
            'closingDate',
            'path',
            'status',
            'savedAt',
            'updatedAt'
          ])
          && (!request.resource.data.keys().hasAny(['status'])
            || request.resource.data.status in ['interested', 'entered', 'skipped']);
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

    match /referralCodes/{code} {
      allow get: if true;
      allow list: if false;
      allow create: if signedIn()
        && request.resource.data.code == code
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasOnly([
          'code',
          'userId',
          'createdAt'
        ]);
      allow update, delete: if false;
    }

    match /admins/{adminId} {
      allow get: if isActiveAdmin() && request.auth.uid == adminId;
      allow list, create, update, delete: if false;
    }

    match /referralAttribution/{attributionId} {
      allow create: if signedIn()
        && request.resource.data.attributionId == attributionId
        && request.resource.data.referredUid == request.auth.uid
        && request.resource.data.referrerUid != request.auth.uid
        && request.resource.data.status == 'pending_verification'
        && request.resource.data.verifiedAt == null
        && request.resource.data.rejectionReason == null
        && request.resource.data.keys().hasOnly([
          'attributionId',
          'referredUid',
          'referrerUid',
          'referralCode',
          'landingPath',
          'capturedAt',
          'registeredAt',
          'campaignMonth',
          'status',
          'verifiedAt',
          'rejectionReason'
        ]);
      allow read: if isActiveAdmin();
      allow update: if isActiveAdmin()
        && resource.data.status == 'pending_verification'
        && request.resource.data.attributionId == resource.data.attributionId
        && request.resource.data.referredUid == resource.data.referredUid
        && request.resource.data.referrerUid == resource.data.referrerUid
        && request.resource.data.referralCode == resource.data.referralCode
        && request.resource.data.landingPath == resource.data.landingPath
        && request.resource.data.capturedAt == resource.data.capturedAt
        && request.resource.data.registeredAt == resource.data.registeredAt
        && request.resource.data.campaignMonth == resource.data.campaignMonth
        && request.resource.data.reviewedBy == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'status',
          'verifiedAt',
          'rejectionReason',
          'reviewedAt',
          'reviewedBy'
        ])
        && (
          (
            request.resource.data.status == 'approved'
            && request.resource.data.verifiedAt is timestamp
            && request.resource.data.reviewedAt is timestamp
            && request.resource.data.rejectionReason == null
          )
          ||
          (
            request.resource.data.status == 'rejected'
            && request.resource.data.verifiedAt == null
            && request.resource.data.reviewedAt is timestamp
            && request.resource.data.rejectionReason is string
            && request.resource.data.rejectionReason.size() >= 3
            && request.resource.data.rejectionReason.size() <= 500
          )
        );
      allow delete: if false;
    }

    match /competitionSubmissions/{submissionId} {
      allow create: if request.resource.data.submissionId == submissionId
        && request.resource.data.reviewStatus == 'pending-review'
        && request.resource.data.source == 'submit-a-competition-page'
        && request.resource.data.pagePath == '/submit-a-competition/'
        && request.resource.data.companyName is string
        && request.resource.data.companyName.size() >= 2
        && request.resource.data.companyName.size() <= 120
        && request.resource.data.contactName is string
        && request.resource.data.contactName.size() >= 2
        && request.resource.data.contactName.size() <= 120
        && request.resource.data.contactEmail is string
        && request.resource.data.contactEmail.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
        && request.resource.data.contactEmail.size() <= 160
        && request.resource.data.competitionTitle is string
        && request.resource.data.competitionTitle.size() >= 3
        && request.resource.data.competitionTitle.size() <= 160
        && request.resource.data.officialUrl is string
        && request.resource.data.officialUrl.matches('^https?://.+')
        && request.resource.data.officialUrl.size() <= 500
        && request.resource.data.termsUrl is string
        && request.resource.data.termsUrl.size() <= 500
        && (request.resource.data.termsUrl == '' || request.resource.data.termsUrl.matches('^https?://.+'))
        && request.resource.data.campaignImageUrl is string
        && request.resource.data.campaignImageUrl.size() <= 500
        && (request.resource.data.campaignImageUrl == '' || request.resource.data.campaignImageUrl.matches('^https?://.+'))
        && request.resource.data.closingDate is string
        && request.resource.data.closingDate.matches('^\\d{4}-\\d{2}-\\d{2}$')
        && request.resource.data.prizeDetails is string
        && request.resource.data.prizeDetails.size() >= 3
        && request.resource.data.prizeDetails.size() <= 1200
        && request.resource.data.entryMethod in [
          'online-form',
          'app',
          'whatsapp',
          'sms',
          'ussd',
          'till-slip',
          'in-store',
          'social',
          'paid-ticket',
          'other'
        ]
        && request.resource.data.requirements is string
        && request.resource.data.requirements.size() <= 1200
        && request.resource.data.notes is string
        && request.resource.data.notes.size() <= 1200
        && request.resource.data.keys().hasOnly([
          'submissionId',
          'companyName',
          'contactName',
          'contactEmail',
          'competitionTitle',
          'officialUrl',
          'termsUrl',
          'campaignImageUrl',
          'closingDate',
          'prizeDetails',
          'entryMethod',
          'requirements',
          'notes',
          'reviewStatus',
          'source',
          'pagePath',
          'createdAt',
          'updatedAt'
        ]);
      allow read, update, delete: if false;
    }

    match /mail/{mailId} {
      allow read, write: if false;
    }

    match /emailCampaigns/{campaignId} {
      allow read, write: if false;

      match /recipients/{userId} {
        allow read, write: if false;
      }
    }
  }
}
```

Review these rules against production consent, retention and abuse-prevention requirements before deployment.
