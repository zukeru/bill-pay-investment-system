# Billionaire Pay

A React Native / Expo universal app for discovering bill-support requests and reviewing projects, with separate backer, applicant and platform-review workflows. Desktop and mobile browser layouts share the native-compatible React Native codebase. The operating plan is a Colorado, United States pilot.

## Run locally

Docker Desktop must be running.

```sh
docker compose up -d --build
```

Open **http://localhost:8080**. The API health endpoint is **http://localhost:8080/api/health**. Docker exposes the web gateway only on this computer's loopback interface. PostgreSQL and private evidence files persist in named Docker volumes; they have no public ports.

| Role | Email | Password |
| --- | --- | --- |
| Investor / payer | investor@billionairepay.local | BackerDemo!2026 |
| Person requesting help / project owner | applicant@billionairepay.local | ApplicantDemo!2026 |
| Platform reviewer | admin@billionairepay.local | AdminDemo!2026 |

These accounts and passwords are deliberately public local-demo fixtures. They are not suitable for a public production service. Your personal email password was never used for these accounts or stored in this project.

## What you can test

- Backer: login, filter bill/project discovery, pass/save requests, open details, select full/partial amount, explicitly confirm simulated support or nonbinding investment interest, view persisted activity and update private profile.
- Applicant: login/register, create bill/project request, attach private PDF/image evidence, preview public content, see review and funding statuses, update profile.
- Admin: inspect pending requests/evidence, approve/reject with a review note and audit history.
- Mobile: responsive navigation, touch swipe and equivalent buttons, mobile forms and review sheets. Expo source can also run on native devices; native binary distribution/signing is a separate build step.

All sample stories are fictional. A demo contribution is a simulation, not a payment to a real biller. An expression of investment interest is nonbinding, not an executed securities transaction. Public verification language must distinguish platform document review from identity verification.

## Stripe test integration

The backend includes official Stripe Checkout test-mode creation, server-owned payment amounts, funding reservations, signature-verified webhook processing, deduplication and separate payment/bill-settlement states. It rejects live secret keys. Stripe integration does not provide real biller payout infrastructure or securities settlement.

After your Stripe account setup is complete, copy `.env.example` to `.env` and enter **test-mode only** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Never paste API secrets into chat or commit `.env`. Recreate the API container:

```sh
docker compose up -d --force-recreate api
```

For signed local Stripe event forwarding, use the official Stripe CLI on the host:

```sh
stripe listen --forward-to http://localhost:8080/api/payments/webhook
```

Use the signing secret displayed by your own CLI session in `.env`. Checkout success redirects do not prove a completed payment; the signed provider event is authoritative. No real Stripe session can be verified until genuine test credentials and webhook forwarding are configured.

## Verification and operations

```sh
node scripts/smoke.mjs
docker compose ps
docker compose logs --tail=80 api
scripts/test-api.sh
```

The test script creates/uses a separate `billionaire_tests` database. It never resets the running app database; the API suite refuses database names that do not contain `test`. The smoke script uses read-only seeded data and revokes its own sessions.

```sh
cd apps/mobile
npm ci
npm run typecheck
npx expo export --platform web
```

The React Native development service is also running on **http://localhost:8081**, with details and native execution limits in [NATIVE.md](docs/NATIVE.md). Use `docker compose --profile native up -d --build` to include it after a shutdown. Local verification/recovery emails appear at **http://localhost:8025**; Mailpit captures messages locally and sends no real email.

Restart: `docker compose restart`. Stop without deleting data: `docker compose down`. Do not add `--volumes` if you need to retain data. Back up PostgreSQL and private evidence together; see the deployment checklist before any public service.

## Documentation

- [Product plan](docs/PRODUCT-PLAN.md)
- [Native app and development endpoint](docs/NATIVE.md)
- [Verification record](docs/TESTING.md)
- [Colorado / US legal launch review](docs/LEGAL-LAUNCH.md)
- [API contract](docs/API.md)
- [Design and architecture](docs/superpowers/specs/2026-10-29-billionaire-pay-design.md)
- [Implementation plan](docs/superpowers/plans/2026-10-29-billionaire-pay.md)
- [Visual concept](design/concept-modern-desktop-mobile.png)

## Production launch boundary

This repository is a locally deployed product with demo financial flows and a gated Stripe test adapter. It is not a representation that a financial platform has been licensed, approved by Stripe, legally cleared, penetration tested, or launched to the public. Production operation requires real Colorado entity/business facts, payment-provider acceptance for the precise bill-support model, identity/sanctions and fraud operations, biller reconciliation/disbursement, investment intermediary/legal route, reviewed terms/privacy/risk notices, production email delivery and abuse controls, HTTPS, production secrets, backup/restore testing and operational monitoring. The linked legal review tracks these gates.
