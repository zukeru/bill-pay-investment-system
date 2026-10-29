# Billionaire Pay API

Node 22+, Fastify 5, PostgreSQL, and Stripe's official Node SDK. All endpoints use `/api`; the gateway forwards that path unchanged. `npm start` migrates and optionally seeds, then listens on `0.0.0.0:3001`.

Environment:

- `DATABASE_URL` required PostgreSQL connection string.
- `SEED_DEMO=true` enables idempotent fictional records and three accounts listed in `../docs/API.md`. Existing passwords and request funding are preserved on restart.
- `APP_ORIGIN` comma-separated exact browser origins; default `http://localhost:8080`. HTTPS origins enable Secure cookies. Web clients send credentials; native clients use login's bearer token.
- `UPLOAD_DIR` private persistent directory; Docker uses `/app/uploads` owned by the unprivileged Node user.
- `PORT=3001`, `HOST=0.0.0.0`.
- `TRUST_PROXY_HOPS=1` enables one trusted gateway hop from loopback/private IP ranges only; default 0 ignores forwarded headers. Keep API unexposed and have nginx overwrite `X-Forwarded-For` with its direct client address.
- `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, `SMTP_FROM=noreply@billionairepay.local` provide local test email. Optional `SMTP_SECURE=true`, `SMTP_USER`, `SMTP_PASSWORD` configure an authenticated provider. Mailpit never sends real external mail. No account email token is returned by the API.
- `STRIPE_SECRET_KEY` accepts only `sk_test_` values. `STRIPE_WEBHOOK_SECRET` is also required for Checkout. Missing keys give an explicit 503; live keys refuse startup.
- `COUNTRY_ALLOWLIST` optional comma-separated registration countries; applies only to local demo registration. Live operations remain disabled in code. `/api/compliance` declares the US/Colorado pilot and unresolved launch requirements.

The HTTP-only session cookie is scoped to `/api`, SameSite=Lax, expires after seven days, and stores only a random token. PostgreSQL stores its SHA-256 digest. Passwords use per-account salted scrypt. Mutating browser requests require an allowed origin; cookie mutations without Origin require Sec-Fetch-Site=same-origin. CORS is restricted to the configured exact origins.

Private profiles and documents are returned only to their owner or an administrator. Admin request responses include `applicantProfile`, `applicantEmail`, and `applicantVerificationStatus`; these keys are absent from public discovery. Admin review changes are audited. Uploads accept at most 10 MB, PDF/JPEG/PNG MIME matched to magic bytes, stored under random private names and downloaded with attachment and sandbox headers. Files require a malware-scanning and retention policy before production use.

Amounts are integer USD cents. Demo contributions update the fictional funding ledger with `simulated` status. Project interest is nonbinding (`interest_recorded`) and does not alter funded balances. Request row locks and transaction-level idempotency locks serialize concurrent funding; database constraints independently prevent funded plus reserved balance exceeding the target.

Stripe Checkout reserves the requested balance before requesting a test session. A retry reuses the same database transaction, Stripe idempotency key, amount and expiry. A definitive Stripe authentication, permission or invalid-request rejection releases the reservation exactly once under row locks, marks `test_failed`, and records an audit entry; a new confirmation is required after configuration is corrected. An ambiguous provider failure preserves the reservation, because releasing it could allow a second payment. Retry the same operation promptly; if creation remains unresolved after 30 minutes, support must inspect the provider's idempotency/session records before releasing the reservation. Signed `checkout.session.expired` or `checkout.session.async_payment_failed` events release it once. A verified paid event changes status to `test_paid` and transfers reserved balance to funded balance. Redirect URLs never mark payment. A Stripe charge never establishes biller settlement, and this build has no bill-disbursement or live-investment path.

Configure the provider webhook at `/api/payments/webhook`, forwarding the unmodified JSON body. Supported events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Signature verification, test-mode checks, matching metadata/session/amount/currency, deduplication, row locks and updates occur before acknowledgment. Webhook failure is safe to replay. Local unit fixtures sign payloads using Stripe's official test helper; real Checkout creation still needs actual test credentials.

Run `npm run check` for source syntax. Integration tests use a real dedicated PostgreSQL database and intentionally reset its public schema; they refuse a database name without `test` and never fall back to `DATABASE_URL`:

```sh
TEST_DATABASE_URL=postgresql://postgres:tests@127.0.0.1:55432/billionaire_tests npm test
```

The suite covers auth/session/logout, origin guards, RBAC, profile and document privacy, evidence type validation, applicant review/audit, saved requests, strict amounts/consents, idempotency, concurrent oversubscription, nonbinding project interest, Stripe missing/live configuration, signature rejection, signed paid/unpaid events, amount mismatch rollback, replay and expiry. Docker uses PostgreSQL 17; local integration verification also passed with PostgreSQL 16.

Account recovery and verification use SHA-256 digests of random 32-byte one-time tokens. Verification expires after 24 hours, password reset after one hour. Resending invalidates older unconsumed tokens of that kind; successful reset revokes every session. Recovery responses have the same body for known and unknown emails. Login responses expose only `emailVerified`; email verification does not establish identity verification. Demo registration succeeds with `verificationEmailSent=false` if SMTP delivery fails, allowing the signed-in user to resend after local email is restored.

Recovery endpoints:

- `POST /api/auth/forgot-password {email}` returns a generic response.
- `POST /api/auth/reset-password {token,password}` changes password and revokes sessions.
- `POST /api/auth/verify-email {token}` consumes a verification link.
- `POST /api/auth/resend-verification` requires a signed-in session.

The local SMTP message links use `/?verifyEmail=...` and `/?resetPassword=...`. Mailpit inbox is available through the root Compose configuration on localhost:8025. Verification and recovery endpoints are rate-limited separately. The API never logs email content or raw tokens.

`GET /api/admin/transactions` exposes the test Checkout reconciliation queue to administrators, with Stripe session ID and `reconciliationRequired` for creation attempts without a session. This build intentionally has no automatic release for ambiguous failures. For a known session, inspect the provider's test Dashboard/CLI and replay its signed paid/expired/failed webhook. For an ambiguous attempt without a stored session, use the stable idempotency key `bp_checkout_<transaction UUID>` and `client_reference_id` / metadata to obtain definitive provider evidence before a support operator changes the database. Preserve that provider evidence in the audit record, lock the transaction then request, subtract the reservation and mark `test_failed` once only if the provider confirms no payable or paid session exists. Do not infer that confirmation from elapsed time, a client redirect, a network error, or absence in a partial search. A production reconciliation worker and auditable support workflow remain launch requirements.
