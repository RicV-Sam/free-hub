# Free account and email preferences review — 17 September 2026

## Agreed direction

Replace the public Freehub Club branding with **My competitions**, a free account for saving listings, tracking entries and choosing competition emails. No paid membership, billing or new ad-free promise. Retain `/club/`, `/club/dashboard/` and `/club/account/` so existing links, canonicals, account data and attribution continue working.

## Findings and implemented changes

- **Consent was overwritten on return visits.** Profile refresh now preserves saved subscription choices. An unchecked optional signup box does not revoke an existing subscription; the form explains this. Account settings provide an explicit unsubscribe control.
- **The visible alerts setting could disagree with email eligibility.** Explicit subscribe/unsubscribe writes the user flags and preference document together in a Firestore batch. The screen checks the same three flags as the recipient selector. Signup opt-in and later opt-in both use this path.
- **An authenticated user could have no user profile.** Explicit opt-in refreshes their own accepted profile before saving consent; users with missing privacy acceptance are taken through account setup first. This is not a bulk subscription or migration of existing users.
- **Account Google sign-in bypassed the email choice.** Account entry now opens the shared Google/email-link form with an unchecked, optional email checkbox and clearer benefits.
- **Account/profile writes and some saved-list failures looked successful.** Essential signup writes now surface a recovery message. Failed save/remove operations retain the visible selection/item and display an error. Failed local imports remain on the device; concurrent import calls share one operation.
- **The account area promoted an ended campaign and buried saved competitions.** Saved competitions now lead the dashboard. Utilities and old referral information are expandable. The closed campaign does not render its participation form or allocate new referral codes. Existing referral and participation records remain available.
- **Settings lacked a subscription control.** Both dashboard and account pages now show the stored subscription state and a Save email preference button, independent of referral participation.
- **Secondary buttons had poor contrast.** Account secondary buttons now have dark text on a light surface. Added focus wrapping/restoration and Escape handling to the shared sign-in dialog, and enlarged its close target.
- **Email template had no preference link.** Both text and HTML templates now link to account email preferences. This requires sign-in; it is not a token-based, one-click unsubscribe endpoint. No emails were queued or sent.
- **Outdated membership/ad messaging remained across navigation and related pages.** Updated account branding and benefit copy, including the homepage, About page, shared navigation/footer and account FAQs. Advertising behaviour itself is unchanged.

## Validation

- Production-feature build completed with opportunities and offers enabled.
- Lifecycle suite: **117 passed**, including eight consent/profile regression tests.
- Existing browser smoke checks passed for account pages without Firebase, the About journey and Google-sign-in action completion. The Google smoke test now isolates the auth flow from the external Journey consent banner.
- Browser checks with synthetic Firebase responses exercised new opt-in, returning unchecked sign-in, unsubscribe, failed preference writes, retry, missing-profile opt-in, failed removal and partial local imports.
- Account layout checked at 320, 768 and 1440 CSS pixels; mobile dashboard reviewed at 390 pixels. No horizontal page overflow in the checked account widths. Checked 200% text, reduced-motion setting, keyboard wrapping, Escape, focus restoration and privacy validation.
- Inspected rendered mobile account/dashboard screenshots. Existing URLs, public landing-page canonical/indexing and private-page noindex remain intact.
- JavaScript syntax and diff whitespace checks passed. Performance baseline has no hard failures; total CSS is above its older warning threshold.

## Existing wider checks and limits

- SEO baseline still fails two expectations for `/tag/win-a-car/` (robots and sitemap inclusion). Free Stuff and Samples checks each report a generated-page count mismatch of 467 versus 466. The same failures were reproduced on unchanged commit `ec29f09` in a separate control checkout. Account title/description/H1 expectations were updated only for the intentional account changes.
- Full link lint is not green: it reports external opportunity-source failures and stale source evidence. Competition data and source-evidence records were not edited in this task.
- Real Google OAuth, production Firestore security rules and live subscription changes were not exercised. Browser writes used synthetic records only. These checks were performed locally before deployment.
- The original export checked 16 Firestore user profiles and produced 11 unique eligible emails. This is not a count of Firebase Authentication registrations or a measured decline rate. A read-only Auth-versus-profile reconciliation remains necessary to quantify missing profiles and inconsistent historic preferences. Do not automatically subscribe those accounts.
- Account unsubscribe changes Freehub's stored preference for future recipient selection. Any separately exported mailing-platform audience must also honour its own unsubscribe/suppression records.

Preview artifacts are under `output/playwright/` (ignored): `my-competitions-final.png`, `account-mobile-final.png`, account viewport screenshots and browser-check logs. These show a synthetic demo account.

## Pre-release privacy-rule correction

The documented user-write rules require `acceptedPrivacyPolicy === true`. Auth hydration now reads a profile without creating an unaccepted record. Profile writes reject missing acceptance unless the stored profile already records it. An authenticated person with a missing/unaccepted profile sees **Finish account setup** and must make the privacy choice in the shared form. Completing signup reloads the account state, preventing the earlier hydration race from leaving a false error.

Unit fixtures now enforce the documented owner/privacy write condition; the browser fixture enforces the same condition for user writes. The new missing-profile recovery scenario passed without any write before acceptance and reached the ready account state afterward. This tests the documented contract, not a live rules deployment or real Google OAuth.
# Follow-up: signed-in account setup could not save

The live Firebase console was inspected after the user reported a successful Google sign-in with the signup dialog still open. The deployed rules (July 9 revision, inspected September 17) directly read `request.resource.data.referWinParticipant` inside `validUserCampaignFields()`. Ordinary new profiles omitted that field, causing the profile write to be denied before signup completion could close the dialog.

The client now supplies `referWinParticipant: false` only when the field is absent. Existing campaign participation and consent are preserved. Preference updates use a transaction to provide the same missing-field default for legacy profiles while atomically saving both preference records. Successful popup, email-link and resumed sign-in completion close the dialog through the shared completion handler. Failures remain visible.

Validation: 119 lifecycle tests and three existing browser smoke tests passed. A browser check confirmed successful new and returning signup closes the dialog, consent remains correct, and failed preference updates remain visible. Firebase SDK 10.12.5 against the local Firestore emulator reproduced the original missing-field denial using the relevant deployed user rules, then accepted corrected signup, subscribe/unsubscribe and returning sign-in. Existing participation was preserved; cross-account writes and writes removing privacy acceptance remained denied. Production security rules and subscriber records were not changed. The final live OAuth retry remains a user check.
