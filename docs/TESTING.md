# Verification record — 2026-10-29

## Delivery state

Locally deployed Docker product; Stripe explicitly left pending by the user. Financial flows remain demo/test only. Operating plan: Colorado, United States. No real funds moved, no real biller settlement, no executed securities investment, and no claim of provider/legal approval.

## Automated verification

| Check | Result |
| --- | --- |
| Docker image build — API, static website and native Metro service | Passed |
| Dedicated PostgreSQL integration suite, executed from Docker | 18 passed, 0 failed |
| Deployed API smoke script through nginx | 18 checks passed |
| Final TypeScript check in the Docker native image | Passed |
| Expo doctor compatibility check | 20/20 passed |
| Web, iOS Hermes and Android Hermes exports | Passed |
| Running native Metro status and iOS manifest | Running; valid launch asset; runtime exposdk:58.0.0 |
| Backend production dependency audit | 0 reported vulnerabilities |
| PostgreSQL restart persistence | Passed: 7 requests, 1 private document, 2 transaction records, 1 review audit retained |

The API integration script uses a separate `billionaire_tests` database and refuses a database name without `test`; the app database is not reset. The suite tests session revocation/origin/RBAC, privacy projections, private evidence permissions and file types, review audit, saved requests, amounts/consent/idempotency, concurrent oversubscription, nonbinding investment boundaries, Stripe test/live configuration and signature checks, paid/unpaid/expiry/replay, definitive versus ambiguous Stripe errors, email-token expiry/reuse/session reset, date timezone stability, impossible calendar-date rejection and bounded proxy trust.

## Browser walkthrough on the deployed website

The Codex in-app browser was used for both desktop (1440×1000) and mobile (390×844) checks, plus 360 px and 768 px horizontal-fit checks, with no browser-console errors during inspected flows.

- Backer quick-login, public feed, save request, pass, category filter, contribution review and explicit confirmation. A $25 **simulated** contribution was recorded and the remaining demo balance updated.
- Project discovery, risk acknowledgment and $25 **nonbinding interest**. No funds collected and no ownership rights created.
- Activity displayed both correctly scoped records and accurate simulation/nonbinding labels after database restart.
- Mobile applicant login, create a fictional Colorado utility request, enter USD amount/biller/relationship/due date/story, upload a private generated PNG, preview public-only content, submit and see In review status.
- Desktop admin login, inspect private evidence and applicant metadata, approve the fictional request with a clear QA-only review note, verify it in the approved queue and then in backer discovery.
- Final accessibility pass: all 24 interactive Pressable controls have explicit roles; filter choices include selection state. It is not a full screen-reader audit.

Screenshots in `docs/screenshots` are actual browser renders. The applicant screenshot records the In review stage before the subsequent QA approval. Sample data includes international fictional records retained from the original concept; production US geography enforcement remains a launch configuration and legal review issue.

## Real local email verification

Using actual Compose PostgreSQL 17 + Mailpit SMTP, a fictional @example.test signup delivered a verification email, confirmation consumed its token, password recovery delivered another message, reset changed the password, the old session returned 401, and login with the new password returned 200. No real external email was sent and no raw tokens or private passwords were printed.

## Stripe evidence boundary

The official SDK test adapter, server-owned amounts, reservations, signatures and webhook states were tested with provider fixtures and Stripe's official signing helper against real PostgreSQL. Real externally hosted Stripe Checkout was not exercised because real test keys were not supplied and the user chose to leave Stripe pending. The registration page was prepared but not submitted. Tests do not establish Stripe business-model approval or biller disbursement.

## Native evidence boundary

Native source, compatibility checks, Hermes exports and running development manifest were verified. Actual iPhone/Android execution and signed APK/IPA distribution were not verified; Xcode simulator and adb were unavailable on this host. See NATIVE.md for endpoint and distribution requirements.

## Known release gates

This is a local test release, not a publicly launched or legally cleared financial platform. Production requires provider onboarding/acceptance, the actual Colorado entity and business facts, reviewed legal terms/privacy/risk/charitable solicitation treatment, identity/fraud/sanctions operations, biller authorization and payouts/reconciliation, a suitable investment intermediary/offering route, production email/abuse controls, account deletion/retention, malware scanning, HTTPS, secrets, backups/restore, monitoring and independent security/native-device testing.

Expo's pinned CLI/config dependency tree currently has 8 inherited build-tool audit entries (5 low, 3 high); the underlying advisory chains and unavailable compatible patches are documented in design/README.md. These tools are not served by the static nginx website and are excluded from exported native bundles. No breaking forced override or downgrade was applied. The development Metro container necessarily includes build tooling and is loopback-only.

## Repeat checks

```sh
node scripts/smoke.mjs
scripts/test-api.sh
docker compose --profile native ps
docker compose exec -T native npm run typecheck
```
