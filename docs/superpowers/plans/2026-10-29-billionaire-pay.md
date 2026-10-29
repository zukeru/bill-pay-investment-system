# Billionaire Pay Implementation Plan

> **For agentic workers:** Execute scoped tasks in parallel with defined interfaces; verify integration before completion.

**Goal:** Deliver a polished React Native universal app running locally in Docker with realistic, persisted workflows and separate backer/applicant accounts.
**Architecture:** Expo web/static build served by nginx, same-origin Node REST API, PostgreSQL. Native Expo clients consume the API with bearer sessions. Docker owns persistent state.
**Tech stack:** Expo, React Native, TypeScript, Fastify, PostgreSQL, Stripe Checkout test mode, nginx, Docker Compose.
**Spec:** docs/superpowers/specs/2026-10-29-billionaire-pay-design.md

## Global constraints
- Preserve requested payer/investor/applicant workflows and desktop/mobile access.
- No user email passwords or provider keys in tracked files.
- Test/demo status must be visible; no live payments or investment settlement without required approvals.
- Currency values are integer cents; sessions and evidence are private.

## Review focus
- Duplicate/replayed/concurrent funding cannot overfund or charge twice.
- Applicants cannot see another applicant's private evidence or financial profile.
- Investments are clearly nonbinding demo interests until partner onboarding.
- Checkout redirects do not create confirmed payment or bill-settlement records.
- No desktop overflow or hidden primary actions on small screens.

## Task 1 — API and data
Files: server/package.json, server/src/*, server/test/*.
- [x] Write integration assertions for authentication/RBAC, funding and privacy, observe failure.
- [x] Implement migrations, seed accounts, sessions, request discovery/submission/review, bookmarks, profile, documents, activity, demo contribution/interest and Stripe checkout/webhook.
- [x] Run server tests against PostgreSQL; fix failures.
Interfaces: API contract in docs/API.md; frontend uses /api relative paths.

## Task 2 — Universal app and design
Files: apps/mobile/package.json, App.tsx, src/*, assets/*.
- [x] Generate and inspect desktop/mobile concept; lock visual tokens in design/README.md.
- [x] Implement authentication, backer discovery, detailed review/confirmation, saved/activity/profile, applicant submission/dashboard, admin queue, legal pages, loading/error/empty states.
- [x] Typecheck, export web and verify desktop/mobile interactions.

## Task 3 — Legal/product documentation and verification
Files: docs/LEGAL-LAUNCH.md, docs/PRODUCT-PLAN.md, docs/TESTING.md.
- [x] Cite primary current sources and mark jurisdiction-dependent requirements unresolved.
- [x] Cover legal fields, verification architecture, data retention, consent, project issuer diligence, investment partner, biller reconciliation and launch gates.
- [x] Independently inspect implemented API for authorization/privacy/funding correctness.

## Task 4 — Docker and delivery
Files: Dockerfile, compose.yaml, nginx.conf, .env.example, README.md, scripts/*.
- [x] Start Docker Desktop, build containers, run migrations/seeds and health checks.
- [x] Verify API flows and persistence, browser login as both roles, capture desktop/mobile UI.
- [x] Attempt authorized Stripe registration without inventing business facts; document final verified state and blockers.
- [x] Deliver endpoint, distinct demo credentials and exact remaining external activation steps.

## Final boundaries
User elected to leave Stripe pending and use local demo. Signed store binaries, actual native-device execution and legal/provider activation remain external release work; see docs/TESTING.md and docs/NATIVE.md. All checked tasks above refer to the local release and explicit test integration.
