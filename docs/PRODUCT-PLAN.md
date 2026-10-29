# Billionaire Pay — product plan

Planning date: 29 October 2026. Read with [API contract](API.md), [design specification](superpowers/specs/2026-10-29-billionaire-pay-design.md), and [live launch gates](LEGAL-LAUNCH.md).

## Product and delivery boundary

Billionaire Pay connects people seeking bill assistance with backers and lets backers explore fictional project opportunities in a local product demonstration. The universal Expo / React Native / React Native Web client serves iOS, Android and responsive HTML5 web layouts against one API. Desktop uses a sidebar; mobile uses bottom navigation. The updated design uses white surfaces, charcoal text, cobalt accents and modern, readable sans-serif typography.

The current build targets a complete **local demonstration**, including persistent accounts, submissions, moderation, saved requests, simulated bill contributions, nonbinding project interest and optional Stripe test Checkout. The API contract defines this scope; it does not prove that an endpoint or screen has passed testing. Record actual built-and-tested evidence in `docs/TESTING.md` and the final delivery report. Native source compatibility does not establish that signed iOS/Android packages have been built, tested on devices or accepted by app stores.

The operator has identified **Colorado, United States** as the operating location. The planning assumption is an initial US pilot, with adult participants and a deliberately approved state/service scope; this assumption is not a legal authorization. Entity name/type, incorporation, actual address, ownership, permitted customer states, provider approval and investment intermediary remain unresolved. Fictional sample countries in the demo do not establish live support there.

The live bill-payment product and live investment product have separate release gates. Neither a working demo nor a successful test charge clears them. No real investment purchase, custody, payout or bill settlement is part of the local release. US federal and Colorado analysis, plus review of other served states, must precede a live release.

## Roles and permissions

| Product role | Current API role | Responsibilities and access |
| --- | --- | --- |
| Payor / backer | `backer` | Browse, filter, save, simulate bill contributions, optionally use bill-only test Checkout, record nonbinding project interest, view own activity/profile. |
| Prospective investor | `backer` | Explore fictional project information and record demo interest. The name does not establish investor eligibility or accreditation. |
| Bill applicant | `applicant` | Submit a bill and private evidence, preview public story, view own submissions and review status. |
| Project issuer | `applicant` | Submit fictional project details and risks. Separate issuer verification and offering eligibility are launch work. |
| Platform reviewer | `admin` | Review private submissions/evidence and approve or reject with an audit note. Approval is platform moderation. |
| Biller / regulated investment partner | No current login | Roadmap partners with separate onboarding, contracts, verification, reconciliation and operating permissions. |

Backer and applicant accounts are distinct. Never offer a client-controlled route to grant `admin` or change verification results. A reviewer must not treat their own access to a document as evidence that its contents are authentic.

## Screen inventory and acceptance behavior

The following table is the **local release scope**. A row is complete only after its API and visible workflow have been verified. It should not be presented as a list of already-tested features.

| Surface | Required content and actions | Acceptance condition |
| --- | --- | --- |
| Welcome / sign in | Brand, demo notice, email/password, separate demo role accounts, register entry | Successful login routes by role; errors reveal no account secrets. |
| Register | Name, email, password, role, country, linked draft Terms/Privacy acceptance | Persist user and session; reject missing consent and prohibited role values. |
| Backer discovery | Separate Bills/Projects tabs, request cards, category/search controls, progress, location, save/pass/select | Filtering persists in the view; swipe or card selection never transfers money. |
| Bill details | Applicant public alias, story, amount/currency, due date, biller, review label, funding progress, private-evidence count only | No DOB, contact details, account references or private-document URLs appear. |
| Contribution review | Amount, request, mode, acknowledgment, explicit confirmation | Server validates amount, remaining capacity, role, approval and idempotency. |
| Test Checkout / return | Provider-hosted test card entry; pending, canceled and completed-test results | Signed webhook controls payment state; redirect alone cannot confirm a charge or bill payment. |
| Project details | Summary, issuer display information, target, proposed terms and risk disclosure | Fictional/demo labels remain visible; no guaranteed returns or fictitious verified credentials. |
| Project interest | Amount and risk acknowledgment, explicit nonbinding confirmation | Records `interest_recorded`; no card collection, transfer, security issuance or ownership claim. |
| Saved | Saved bills/projects, detail navigation, remove save | Changes persist per user and cannot expose another user's saves. |
| Activity / detail | Own contributions/interests, mode, amount, time, reference and precise state | Demo receipt says simulated; test receipt says test; neither says bill settled or tax deductible. |
| Applicant dashboard | Own submissions, review/funding state, rejection note where appropriate, new submission | Empty/error/loading states work; cross-account requests remain inaccessible. |
| Submission flow | Bill/project selection, relevant fields, evidence upload, public preview, consent, submit | Server validates kind-specific data and evidence ownership; draft data is not a public listing. |
| Profile / verification | Common fields, role-specific details, privacy choices, verification state | Saving self-reported fields does not mark identity as verified. |
| Admin queue / review | Pending requests, private details/evidence, approve/reject note | Admin-only enforcement and audit history; public label means platform review. |
| Terms / Privacy / Risk | Accessible, versioned draft notices and demo limitations | Notices open before acceptance; no invented legal entity, address, license or partner. |
| Compliance / launch status | Demo mode and live blockers surfaced from API | `liveEnabled:false` remains server enforced across clients. |

Shared behavior: keyboard and screen-reader labels, readable contrast, visible focus, appropriate touch targets, scrolling on small screens, clear amount formatting, disabled duplicate submissions, and recoverable errors. Screen size must not hide a primary action. Network failure must not create a false success state.

## Data collection and publication

Collect information progressively for a defined purpose. **Contract** means the field exists in `docs/API.md`; **launch** means a later schema/workflow decision and is not an implemented compliance control. Identity, residency and source-of-funds answers are self-reported until checked through the selected process.

| Record | Contract fields / local use | Launch additions requiring a defined purpose |
| --- | --- | --- |
| All users | `name`, `email`, `country`, password at registration; profile `legalName`, `dob`, `address`, `city`, `postalCode`, `phone`, `privacyConsent` | US state/residency field, supported-state rule, adult/eligibility confirmation, consent event versions and timestamps, provider verification reference/status, notification choices; accessibility and language preferences as needed. |
| Payor / investor | `occupation`, `sourceOfFunds`, `investorType` | Provider-required KYC/AML answers, entity/beneficial owner data where applicable, risk classification and legally required eligibility evidence. `investorType` is a declaration, not accreditation. |
| Bill applicant | Common profile; request `title`, `story`, `category`, integer `amountCents`, `currency:'USD'`, `country`, `city`, `dueDate`, `billerName`, `relationship`, `consent`, owned `documentIds` | Private invoice reference, verified biller contact, authority to share the bill, beneficiary consent if different, duplicate check, biller-approved payment reference and actual balance. Keep full account identifiers off public cards. |
| Project issuer | `companyName`, `registrationNumber`; request `projectSummary`, `terms`, `riskDisclosure`, common request fields, private evidence | Legal entity/type, incorporation state/country, issuer authority, controllers/beneficial owners, use of proceeds, accounts, cap table, instrument, valuations/rights, conflicts, financial and business risks, offering/filing references and regulated partner approval. EIN, tax forms and sensitive eligibility evidence go through an authorized provider/partner process when needed. |
| Documents | Owner, ID, name, MIME and size; private PDF/JPEG/PNG upload up to 10 MB | Classified purpose, scan result, retention rule and access history. Identity and bank onboarding must use the appropriate provider-hosted flow. |
| Transactions | User/request IDs, amount/currency, `contribution` or `investment_interest`, mode, state, reference, timestamps | Provider event/payment/refund/payout IDs; reconciliation and settlement evidence; fees, FX and ledger separation. |
| Consents / reviews | Contract has acceptance booleans, legal version via compliance, moderation note/audit requirement | Append-only consent event: actor, document version, purpose, explicit action, timestamp, locale and minimal evidence. Do not claim complete consent auditing from a boolean alone. |

Public fields are limited to the documented safe request shape: title/story, public applicant display name, category, approximate location, funding amounts, biller display name, due date, project summary/terms/risks, image, review label and document count. Applicants must redact personal information from free text and images and preview the public result; server moderation/redaction remains necessary. An opaque private document ID is not permission to download it. Avoid collecting full medical records, card numbers, bank credentials or government ID scans through general uploads.

For the US pilot, provider/partner onboarding may require SSN/ITIN, EIN, identity, beneficial ownership, tax or bank evidence. Collect only what the selected service requires and send sensitive material directly through that provider's authorized hosted flow. Do not add these identifiers to the public API/profile schema or general document upload merely to make a form look complete. Provider-check results and eligibility determinations require provenance and an expiry/review policy.

## Funds and state model

**Bills:** review → approved discovery → explicit contribution → simulated record, or optional test Checkout reservation → signed test webhook → test charge recorded. Actual biller onboarding, remittance and reconciliation are roadmap steps. Funding progress must distinguish simulated/test funds from real settled funds. Reservations reduce remaining capacity; expiration, cancellation, failure and duplicate events must release or reconcile them safely.

**Projects:** platform review → fictional project discovery → explicit nonbinding demo interest → activity record. Display interest separately from funded/settled capital. No investment wallet, cash balance, escrow, tradable asset, dividend or return is created. Even a public real-world interest campaign requires country-specific review before it replaces fictional content.

**Live bill roadmap:** verified bill and beneficiary authority → approved payment method → cleared funds → authorized payment directly to the verified biller → biller confirmation → settled receipt. Final legal/provider review must approve that exact arrangement. Refund/chargeback and failed-remittance states must remain visible. Collection and payout are separate ledger events. A gift benefiting an individual is not presented as a deductible charitable contribution. Live investment settlement belongs to the approved regulated partner and its eligibility, subscription, cancellation, custody and reporting process.

## Roadmap and release criteria

| Phase | Deliverable | Exit evidence |
| --- | --- | --- |
| 0 — Local demonstration | Universal client, API/PostgreSQL, distinct roles, request moderation, private uploads, saves/activity, demo bill flow, nonbinding interest, optional test-only Checkout, Docker | Typecheck/export; auth, ownership, funding-concurrency and webhook tests; desktop/mobile walkthrough; database restart persistence; explicit verified-versus-untested report. |
| 1 — Operational preparation | Confirm Colorado operator entity and permitted US states; US/Colorado counsel decisions; provider business-model review; privacy/retention/security/dispute design | Named accountable owners, written decisions/approvals, actual service contracts and final notices. No live activation by configuration alone. |
| 2 — Limited live bill pilot | Contracted verified billers, provider-hosted onboarding, fraud review, safe disbursement, reconciliation, refunds/disputes, support | End-to-end real bill test with traceable settlement, independent access/security review, incident and refund rehearsals, country/provider gate satisfied. |
| 3 — Regulated project launch | US investment partner and counsel-selected offering route, such as eligible Reg CF offerings through a registered intermediary; issuer diligence, approved disclosures, partner-hosted subscription and settlement | Counsel and partner approval of actual screens, marketing and fund flow; federal/state registration or exemption analysis and eligibility; tested partner reconciliation and reporting. |
| 4 — Product expansion | Native signed releases, accessibility/device QA, notifications, localization, extra countries/currencies, recurring giving or organization teams if requested | Separate acceptance and legal/provider review for each material capability and territory. No automatic global rollout. |

Prioritize a reliable bill pilot over premature custody or securities infrastructure. Preserve the local app's requested role and discovery features while adding gated capabilities. Evaluate new screens and fields against the specific service they support; avoid collecting sensitive data simply because another financial app does.

Success measures should distinguish: completed demo tasks, approved applications, bill contributions, provider charges, actual settled bills, refunds/disputes, and project interest. Do not report demo/test amounts as real social impact, and do not count recorded interest as invested capital.
