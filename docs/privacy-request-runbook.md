# FreeHub privacy requests

Handle requests manually through the FreeHub inbox. Revisit self-service if request volume increases.

## Intake and email opt-outs

- Acknowledge the request promptly. Distinguish an unsubscribe from a request to delete an account. If the scope is unclear, ask whether the person wants emails stopped, the account deleted, or both. For an unsubscribe, turn off the applicable alert and marketing preferences, check for pending sends, and confirm the change.
- For deletion, match the request to the registered account and confirm the requester is authorised before making changes. If the email or authority is unclear, ask for the minimum information needed through an appropriate channel. For a formal POPIA request, provide the Information Regulator's Form 2 or a substantially similar form free of charge. Process requests as soon as reasonably practicable. [POPIA, section 24](https://www.justice.gov.za/legislation/acts/2013-004.pdf) · [Amended regulations, regulation 3](https://inforegulator.org.za/wp-content/uploads/2025/04/POPIA-2021-Regulations-FINAL-21-Jan-2025.pdf) · [Information Regulator forms](https://inforegulator.org.za/popia-forms/)

## Account deletion checklist

1. In the correct Firebase project, open **Authentication → Users**, match the registered email, and **copy the full UID before deleting the sign-in**.
2. In Firestore, open `users/<UID>` and check its subcollections, including `savedCompetitions`, `ignoredCompetitions` and `alertPreferences`. Query `signupEvents` by `userId` using the full UID.
3. Check other stores as applicable. Search `referralCodes.userId` and `referralAttribution.referredUid` or `referrerUid` by UID. Search `publicReferralLeads.contactValue` and `competitionSubmissions.contactEmail` by registered email. For alerts, check queued mail and campaign recipient records. For FreeHub-run competitions, check the relevant competition store and review any retention requirements before deleting records. Airtime Dash records are stored separately. [Airtime Dash retention](airtime-dash.md)
4. Delete the Authentication user and the verified Firestore documents within scope. Include profile subcollections. Check each deletion before closing the request by repeating the Authentication search and reopening document paths or rerunning Firestore queries. If the sign-in is already absent and the UID is unknown, search `users.email` to recover it. If that fails, keep UID-only checks marked unverified.
5. Record the request date, action taken, verification outcome and reply date in the restricted support record. Keep request emails, UIDs and other case details out of Git. Route unresolved identity, retention or deletion questions to the person responsible for privacy before sending a completion confirmation.

## Written outcome

Reply promptly once the outcome is known. Regulation 3.6 requires written notification of the action taken within 30 days of receipt of the outcome. The official Form 2 is for submitting the request. The Act and amended regulation do not prescribe a confirmation email template. [POPIA, section 24(4)](https://www.justice.gov.za/legislation/acts/2013-004.pdf) · [Amended regulations, regulation 3.6](https://inforegulator.org.za/wp-content/uploads/2025/04/POPIA-2021-Regulations-FINAL-21-Jan-2025.pdf)

**Subject** Your FreeHub account deletion request

> Dear [first name],
>
> We completed your FreeHub account deletion request on [date]. We verified that your [list the records actually deleted] were removed.
>
> Kind regards,
>
> FreeHub

If any records were retained, add what was retained, why and the applicable retention period or review date. If any part of the request could not be completed or verified, explain its status and the next step. Keep the reply focused on the outcome.
