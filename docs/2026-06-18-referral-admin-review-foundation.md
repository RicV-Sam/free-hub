# 2026-06-18 Referral Admin Review Foundation

## Summary

This sprint adds a private, noindex referral review foundation for Freehub Club referrals. It does not launch Refer & Win publicly and does not create any public leaderboard, winner flow, shortcode or automated reward logic.

## Admin Page

Generated private admin route:

```text
/admin/referrals/
```

SEO/privacy behavior:

- `noindex, nofollow`
- Not included in `sitemap.xml`
- Not linked from public navigation
- Requires Firebase sign-in and active Firestore admin allowlist access before loading referral records

## Admin Access Model

Admin access is controlled by a manually created Firestore document:

```text
admins/{uid}
```

Example:

```json
{
  "email": "riccardo.vallaro@gmail.com",
  "role": "owner",
  "active": true,
  "createdAt": "manual"
}
```

A user is treated as an admin only if:

- they are signed in with Firebase Auth;
- their signed-in UID has a document at `admins/{uid}`; and
- that document has `active: true`.

There is no public UI that lets a user create or edit an admin record.

## Review Features

The private admin page supports:

- Viewing referral attribution records by campaign month.
- Filtering by status:
  - `pending_verification`
  - `approved`
  - `rejected`
  - all statuses
- Viewing basic referrer and referred user context from `users/{uid}`.
- Approving pending referrals.
- Rejecting pending referrals with a required rejection reason.
- Showing monthly total, pending, approved and rejected counts.
- Showing a provisional monthly top-referrer summary.

## Firestore Behavior

Updated client helpers in `shared/firebase-client.js`:

- `getAdminProfile(userId)`
- `getReferralAttributions(options)`
- `updateReferralReview(attributionId, review, reviewer)`

Updated browser UI:

- `shared/referral-admin-ui.js`

Updated rules reference:

- `docs/migrations/firestore-structure.md`

Rules intent:

- Normal users can still only create pending referral attribution records for themselves.
- Normal users cannot read, approve, reject or list referral attribution records.
- Active admins can read/list referral attribution records.
- Active admins can update only pending referral attribution records.
- Admin updates are limited to review fields:
  - `status`
  - `verifiedAt`
  - `rejectionReason`
  - `reviewedAt`
  - `reviewedBy`
- Approved referrals require `verifiedAt`, `reviewedAt`, `reviewedBy` and `rejectionReason: null`.
- Rejected referrals require `reviewedAt`, `reviewedBy`, `verifiedAt: null` and a rejection reason.

## Guardrails Preserved

This sprint did not:

- make Refer & Win live;
- show a public leaderboard;
- auto-approve referrals;
- auto-select winners;
- announce winners;
- add SMS billing;
- add a shortcode;
- add Cloud Functions;
- change competition publication logic;
- publish held/private competitions;
- add `/out/` URLs to the sitemap.

## Manual Setup Step

Before using `/admin/referrals/`, create the admin document manually in Firebase Console:

1. Open Firebase project `freehub-3206e`.
2. Go to Firestore.
3. Create collection `admins` if it does not exist.
4. Add a document whose document ID is the Firebase Auth UID of the admin.
5. Add `active: true`.

After publishing the updated rules, sign in at `/admin/referrals/` with that Google account.
