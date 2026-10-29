# Billionaire Pay — legal and operational launch gates

Research date: 29 October 2026. The operator has identified **Colorado, United States** as the operating location. This document is a launch decision register and proposed operating requirements. It is not a legal opinion, provider approval, license, completed KYC/AML program or representation that the service is lawful worldwide. The legal entity, incorporation, actual business address/ownership and intended customer-state scope remain unanswered. Planning assumes an initial US pilot with adult participants; counsel/provider must approve the precise scope.

## What the local product may represent

The local release can demonstrate fictional requests, account workflows, private evidence review, simulated bill contributions and nonbinding project interest. Optional Stripe integration is **test mode for bills only**. Test credentials, sample profiles and fictional seed stories must remain visibly labeled. No live keys or real investment settlement are authorized by the local build's default configuration.

`approved` means a platform reviewer approved a listing. It does not mean the applicant, bill, business, investment, accreditation or legal eligibility has been independently verified. Saving a profile or uploading evidence cannot create a verified badge. Until an actual provider/process result exists, use labels such as **Not verified**, **Self-reported**, **Awaiting review**, or **Platform reviewed**. If provider verification is later integrated, name the check and date accurately without implying endorsement or guaranteed accuracy.

A simulated contribution is not money received; a test Checkout success is not a live payment; a collected charge is not a settled bill. A project-interest acknowledgment creates no investment, shareholding, loan or contractual reservation. Fictional demo activity generates no deductible donation receipt or investment return.

## Decisions required from the operator

| Decision | Evidence required before live use |
| --- | --- |
| Entity and accountability | Colorado operating location confirmed; real legal name/type, incorporation state/country, EIN where applicable, actual address, owners/controllers, authorized representative and responsible compliance/support contacts still required. Do not invent facts to complete provider forms. |
| Geographic scope | Define permitted US states for payors, applicants, billers, issuers and investors; residency/adult eligibility and any foreign-person restrictions; counsel review of federal, Colorado and other served-state obligations. International access/flows are a separately gated expansion. |
| Bill-service classification | Written analysis of payment-services/money-transmission, charitable fundraising, consumer, tax and relevant bill categories; merchant/payment recipient and contractual fund-flow roles. |
| Project-service classification | Separate analysis of securities, financial promotions, solicitation, investment advice, crowdfunding, issuer eligibility and intermediary permissions. Choose a regulated investment partner where required. |
| Provider support | Approval of the actual bill-assistance platform model, supported countries, payment methods, connected accounts, beneficiary/payout arrangement and anticipated volumes. Test access is not this approval. |
| Economic and loss policy | Fees, FX, timing, funding shortfalls/overpayments, cancellation, failure, refund, fraud, chargebacks, reserve obligations and who bears each loss. |
| Privacy and records | Data controller/processor roles, lawful purposes, sensitive-data handling, hosting/transfers, required notices and rights, approved retention/deletion schedule. |
| Operational readiness | Named review and escalation owners, fraud/AML procedures, security testing, incident response, biller reconciliation, complaints and dispute handling. |

Colorado operation alone does not authorize nationwide payment or investment services. US/Colorado counsel must analyze the actual money-transmission/payment-services role, any provider/agent arrangement or exemption, and obligations in other served states. A “direct to biller” label does not by itself resolve that analysis.

Colorado's Secretary of State describes registration requirements for charitable organizations soliciting contributions, certain professional fundraising consultants and paid solicitors, with exemptions. Counsel must classify this platform's real activities, fees and beneficiary structure before relying on an exemption; do not infer nonprofit or tax-exempt status from helping someone with a bill. [Colorado charities/fundraiser registration FAQ](https://www.sos.state.co.us/pubs/charities/FAQ/registration.html).

For federal income-tax marketing, gifts to individuals are not deductible charitable contributions. Do not issue a charitable deduction receipt for this personal bill-assistance model. A future qualified-charity route needs separate tax/legal design and evidence of the recipient organization's status and control of funds. [IRS charitable contributions guidance](https://www.irs.gov/taxtopics/tc506).

## Provider approval and identity architecture

Stripe's restricted-business rules cover crowdfunding platforms and several financial-services categories and require additional due diligence; approval is specific to the offered service. A platform cannot infer eligibility from creating an account or receiving test keys. Submit the real model and fund flow to the selected provider before live collection. [Stripe restricted businesses](https://stripe.com/legal/restricted-businesses).

Stripe's general country availability is a starting check, not confirmation that every product, connected account, currency or payment corridor supports this service. Recheck the operator's actual country and the proposed recipient arrangement at launch. Do not select an invented overseas entity or residence to bypass availability. [Stripe global availability](https://stripe.com/global).

Use the selected provider's hosted onboarding for identity, beneficial owner and payout-bank evidence rather than placing government IDs or bank credentials in the app's general upload store. Stripe-hosted Connect onboarding dynamically collects information for the connected account's country, business type and requested capabilities. [Stripe-hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding).

Maintain provider reference, result/status, outstanding requirements and timestamps, with a least-privilege link to provider records. A return from hosted onboarding is not proof that all checks passed. Provider capabilities such as `charges_enabled` and `payouts_enabled` must be checked separately and monitored for changes. [Stripe verification requirements and status](https://docs.stripe.com/connect/handling-api-verification).

The app's profile fields and private bill/project documents are a demo intake and review mechanism. They are not an implemented KYC/AML system. Before live use, determine which party must perform customer and business identification, beneficial ownership checks, sanctions/PEP screening, risk assessment, source-of-funds/wealth inquiries, transaction monitoring, suspicious-activity escalation/reporting and periodic refresh. Allocate responsibilities in contracts and procedures; do not assume a payment provider covers every platform obligation. Store raw identity documents with an appropriate provider only when required and authorized.

## Keep bill assistance and investment operations separate

For **bills**, plan payment directly to an approved verified biller, with the precise payor → provider → biller path approved before live use. Document who accepts the payment, who owns/controls funds at each stage, and who is authorized to pay the biller. Verify biller identity, current bill/balance, duplicate claims, payment reference, applicant relationship and any third-party beneficiary authority. Decide whether partial funding is held, refunded, supplemented or sent, and explain that policy before charging. Do not promise escrow unless a legally valid escrow arrangement actually exists.

Track collection, fees, refunds, reversals, biller remittance and biller settlement as distinct events. A provider charge receipt may state payment was collected; only traceable biller/provider confirmation permits a claim that the bill was paid. Reconcile daily during a pilot and investigate mismatches. Define treatment of canceled bills, rejected remittances, overpayments, insolvent billers and expired requests. Never fund one applicant from another person's reserved money.

For **projects**, the local action remains nonbinding interest with no funds movement. Publicizing genuine issuers, indicative financial terms or investment calls to action can require legal review even before money is accepted. Before a real campaign, the investment partner and counsel must approve eligible audience, issuer diligence, disclosure, advertising, investor classification/limits, subscription, cancellation, custody/escrow where applicable, settlement, ownership records and continuing reports. Do not route project investments through the bill Checkout endpoint.

For the proposed US pilot, **Regulation Crowdfunding is a candidate route, not a selected exemption or platform license**. It requires transactions through an SEC-registered intermediary, either a broker-dealer or funding portal, and includes issuer disclosure and investor-limit rules. Counsel and the partner must confirm eligibility and the federal/state requirements for each offering. [SEC Regulation Crowdfunding overview](https://www.sec.gov/resources-small-businesses/exempt-offerings/regulation-crowdfunding). A registered funding portal is subject to activity limits, including restrictions on advice, solicitation and handling investor funds; the platform must not perform those restricted functions under a presumed portal role. [SEC funding-portal registration guide](https://www.sec.gov/files/divisions/marketreg/tmcompliance/fpregistrationguide.htm).

Accredited-investor status is a separate concept and is not a universal prerequisite for every Reg CF investor. If counsel instead chooses a Regulation D route, eligibility and verification depend on that route. SEC guidance distinguishes the reasonable-belief standard under Rule 506(b) from reasonable steps to verify under Rule 506(c), and explains that an unsupported checkbox is insufficient. Leave `investorType` self-reported until the authorized partner completes its required process. [SEC assessing accredited investors](https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/assessing-accredited-investors-under-regulation-d). Individual accreditation may arise through financial or qualifying professional criteria; a high claimed balance or the platform name is not evidence. [SEC accredited investors](https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/accredited-investors).

## Consent, disclosure and claims

Each affirmative acceptance should record actor, purpose, legal-document version, timestamp and the action that showed agreement. Keep Terms acceptance separate from optional marketing consent and sensitive public-story publication consent. Present relevant fee, refund, timing and risk disclosures before confirmation. Reconfirm changed material terms when required; retain the accepted version. A `true` boolean alone is insufficient evidence of the complete consent process.

An applicant must confirm accuracy, authority to submit the bill/project, and permission to publish the previewed story/images. Where the beneficiary differs from the submitter, obtain appropriate authority and consent. Encourage redaction and avoid unnecessary medical, financial or third-party identity details. Withdrawal of story-publication consent and deletion requests require an operational workflow, subject to lawful record preservation.

Assess Colorado Privacy Act coverage against actual thresholds, exclusions and processing; do not assume the pilot is exempt or automatically covered. The Colorado Attorney General explains consumer access/correction/deletion and opt-out rights, sensitive-data consent, privacy notices and assessments for covered processing. Broad Terms acceptance is not valid sensitive-data consent. Keep sensitive details out of public stories and make notices/rights controls readable on mobile and web. [Colorado Attorney General: Colorado Privacy Act](https://coag.gov/resources/colorado-privacy-act/).

Do not advertise guaranteed returns, risk-free investments, verified wealth, licensed status, tax deductibility, guaranteed funding, instant settlement, provider endorsement, insurance or investor protection without documented support. Project projections must be labeled assumptions; interest totals must not be labeled capital raised. The platform name does not establish that a backer is a billionaire or financially qualified. Support counts, completed bills and impact metrics must exclude simulated/test data from live claims.

## Security, retention and dispute requirements

The local contract calls for hashed passwords, scoped sessions, role checks, private owner/admin document access, validated request inputs, audit trails, integer amounts, transaction-safe capacity checks, idempotency and signed Stripe webhooks. Verification of those controls belongs in the test report; listing a requirement is not proof it is implemented.

Before exposing real personal data or money, complete an independent review of authentication, session revocation, account recovery, admin protection/MFA, object-level authorization, upload scanning, storage encryption/key management, HTTPS, secrets handling, rate limiting, dependency updates, backups/restore and incident response. General uploads need content validation and safe download headers. Avoid recording secrets, full documents, DOBs or bank data in logs and analytics. Separate demo/test/live databases and keys; prevent a single client flag from enabling live transactions. Changes to banking, recipient details or admin privileges need enhanced review and audit.

Native launch must define OS-protected token storage, logout/session revocation, photo/file permissions limited to user-selected uploads and safe provider return/deep links. Browser launch must define secure session cookies, origin/CSRF controls and document caching. Review analytics/advertising SDK data collection, browser storage and app-store privacy disclosures against actual behavior; no sensitive identifiers or story/document contents belong in telemetry. Collect SSN/ITIN, EIN, tax or bank evidence only where required, through the authorized provider/partner process; the general profile/upload forms must not become an identity-document repository.

Adopt a purpose-specific retention schedule instead of inventing a universal legal period. The following decisions are **launch requirements**, not implemented deletion promises:

| Data | Retention/deletion decision |
| --- | --- |
| Fictional demo data | Keep resettable and isolated; purge accidental real sensitive uploads promptly under an incident procedure. |
| Raw identity/bank documents | Prefer no app copy; provider retention and deletion governed by applicable duties and contracts. |
| Bills, issuer evidence and review records | Define the minimum service/fraud need, legally required period, access restrictions and expiry trigger. |
| Payment, consent and audit records | Determine applicable financial/tax/claims duties; preserve only necessary fields and legal holds. |
| Public stories and images | Provide correction/unpublish procedures; define cache/search removal and any necessary evidentiary archive. |
| Backups and service logs | Set bounded rolling retention and deletion propagation; document restoration and access controls. |

Publish a real support channel and complaints owner before live use. Capture reference, request/transaction, complaint type and acknowledgment; triage unauthorized payments, fraud, privacy, inaccurate stories, payment failures and investment complaints to the responsible party. Set response/escalation targets and deadlines based on applicable law and provider rules. Give users a clear path to request review, refund/correction or external escalation where required. Preserve relevant evidence, communicate state changes and reconcile any remedy. Investment disputes must follow the partner's agreed process and required investor protections.

## Draft in-app legal pages

These short texts are suitable for a clearly labeled local preview and must be expanded, reviewed and populated with actual operator/contact details before live use. They do not establish a live contract or final privacy notice. Preserve the page version accepted by a demo user.

**Draft Terms — local demonstration.** “Billionaire Pay is operating as a local demonstration. Sample identities and requests are fictional. Bill contributions are simulated unless a screen explicitly says Stripe test mode; test mode uses no real payment. Project interest is nonbinding and does not create an investment or ownership right. Submit only information you are authorized to share and avoid sensitive identity or banking documents. Platform review is limited and does not guarantee a claim's truth, funding, payment, investment performance or legal eligibility. Live services require separate approval and final terms.”

**Draft Privacy — local demonstration.** “This demo stores account, profile, request, upload, consent and activity information to demonstrate the service. Public discovery shows the story and display fields you submit; private profile fields and original evidence are restricted to the account owner and authorized platform reviewers. Use fictional data during testing. Card entry, if enabled, takes place on Stripe's test Checkout. The operator, contact address, applicable rights, processors, international transfers and retention periods will be specified in the final notice before real operation. Demo acceptance does not authorize marketing or unnecessary sensitive-data collection.”

**Draft Project Risk — local demonstration.** “Project information is illustrative. Recording interest is nonbinding; no money is invested, no security is issued and no return is promised. Real project investing can involve loss of all capital, illiquidity, dilution, business failure, conflicts and limited information. Eligibility, disclosures and settlement would be handled only through an approved country-specific process and regulated partner where required. Platform listing review is not investment advice or a recommendation.”

## Live enablement checklist

Keep the API's live gate closed until accountable owners retain evidence for all applicable items:

1. Actual entity, countries, service classifications and counsel decisions documented.
2. Provider approves the precise bill model, countries and fund flow; real onboarding complete.
3. Biller contracts, verification, disbursement, reconciliation, refund and complaint operations tested.
4. Final Terms/Privacy/disclosures and retention/security policies approved and implemented.
5. Applicable KYC/AML/sanctions, tax and reporting duties allocated and operational.
6. Independent security/privacy testing and incident/restore rehearsal complete.
7. For projects separately: regulated partner, issuer/offer and investor eligibility, permitted promotion and settlement process approved and tested.
8. Explicit release decision recorded for the enabled capability and countries; monitoring and a stop mechanism active.

Payment-provider onboarding, store distribution, backend deployment and legal clearance are separate facts. The local product may be delivered and reviewed while these external launch conditions remain open.
