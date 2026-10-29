# Billionaire Pay — product and technical design

User-authorized full build, following the schematic discussed in this chat. React Native universal iOS/Android/web app, desktop and mobile layouts, Docker deployment and separate payer/investor and applicant test accounts. Existing workspace was empty.

## Proposed implementation decisions
- Expo / React Native / React Native Web + TypeScript. User-revised modern responsive HTML5 design: true white sidebar and surfaces, cool pale #F5F7FB canvas, charcoal #111827 text, cobalt #315BEE accents, DM Sans typography, restrained simple layout and documentary imagery. Shared React Native code exports the responsive website through React Native Web, with semantic HTML5 shell on web. Responsive sidebar on desktop and bottom navigation on mobile.
- REST API on Node/Fastify, PostgreSQL persistence, HTTP-only session cookie on web with bearer support for native clients, hashed passwords, origin checking, request validation, RBAC, private document uploads, audit history.
- One Docker Compose project: database, API and web gateway on http://localhost:8080. API reachable at /api through the gateway. No public database port. Volume-backed persistence.
- Separate Bills and Projects discovery feeds. Swipes select/pass; explicit confirmation for funding. Saved requests, activity, receipt details, applicant dashboard and submission workflow, profile/verification, admin queue.
- Local demo accounts and sample identities are fictional and labeled. Demo bill contributions simulate payment ledger activity; no claim that real billers received funds. Investment commitments are nonbinding demo reservations with no securities settlement.
- Stripe Checkout TEST MODE integration with signature-verified webhooks, idempotency and pending funding reservations. Do not use investment funds via Stripe. No live keys accepted by the default build. No Stripe charge represented as bill settlement. Actual biller disbursement is a separate launch gate.
- Applicant public records redact contact/address/account and identity-document data; originals are owner/admin only. Applicant can preview public content. Financial amounts are integer minor units; reserve and fund under database transactions.
- Provider signup authorized with the user-provided email. Never put supplied Gmail credentials into code or logs; do not invent legal entity, residence, banking or ownership facts. Stop any dependent real-world signup step at missing facts or required human authentication, while continuing local work.

## Roles and flows
Backer: login, explore verified bills/projects, filter, save, review, select amount, confirm demo contribution/test Checkout or nonbinding investment interest, see persisted activity. Applicant: register/login, profile, submit bill/project and evidence, private upload, track pending/rejected/approved and funding updates. Admin: review identity metadata/evidence and submissions, approve/reject with audit trail; approval is platform review, not a legal investment endorsement.

## Legal launch boundary
Confirmed operating jurisdiction: United States, Colorado. US adult pilot is a planning assumption. Actual entity name, incorporation, ownership, address, tax ID and served-state scope are still unanswered. Implement configurable country, legal name, DOB/adult confirmation, address, applicant/biller relationship and consent, business/project ownership, investment risk acknowledgment, privacy/terms acceptance and review states. No collection of raw bank/card details or government IDs outside appropriate provider-hosted verification. Local Terms/Privacy/Risk pages are clearly draft review documents; acceptance is versioned. KYC/AML/sanctions, securities eligibility, licensing, provider approval, tax/charity treatment, privacy retention, cybersecurity and dispute procedures require country-specific validation before real operation. No guarantee of legality, tax deductibility, returns, instant settlement, or completed identity checks.

## Alternatives
Separate apps versus one universal app: choose universal for lower build/maintenance cost. Browser-only React versus React Native universal: choose React Native to honor explicit mobile request. Live financial launch versus local test integration: finish the local product while blocking live transactions until factual and provider requirements are met.

## Verification
API integration tests: auth/session/logout, RBAC, private data isolation, input validation, funding amount validation, idempotency, concurrent oversubscription, legal consent, Stripe signature/replay, investment live gate. Expo web export and TypeScript checks. Desktop/mobile browser workflow and screenshot review for both roles. Docker health and API smoke tests, database persistence after restart. Document remaining external launch gates.
