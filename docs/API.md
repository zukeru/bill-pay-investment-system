# Shared API contract
All routes under /api; JSON unless document upload. Error {error: string}; response collections {requests: []}, {transactions: []}. Same-origin credentials include; Authorization: Bearer <token> for native. Login returns {user, token}; web also gets HTTP-only cookie. User {id,name,email,role: backer|applicant|admin,country,verificationStatus,profile}; safe public data only.

GET /health => {status,mode,paymentsConfigured,liveEnabled:false}
POST /auth/login {email,password} => {user,token}
POST /auth/register {name,email,password,role:backer|applicant,country,acceptTerms:true} => {user,token}
GET /auth/me => {user}; POST /auth/logout
GET /requests?kind=bill|project&category=&search=&saved=true => {requests}
GET /requests/:id => {request}
POST /requests {kind,title,story,category,amountCents,currency:'USD',country,city,dueDate,billerName,relationship,projectSummary,terms,riskDisclosure,consent:true,documentIds?:[]} => {request}; applicant only
GET /my/requests => {requests}; applicant only
POST /requests/:id/save {saved:boolean} => {saved}
GET /saved => {requests}
POST /contributions {requestId,amountCents,idempotencyKey,acceptTerms:true} => {transaction,request}; backer only, demo simulation
POST /investments/interest {requestId,amountCents,idempotencyKey,acknowledgeRisk:true} => {transaction}; nonbinding demo interest only
POST /payments/checkout {requestId,amountCents,idempotencyKey,acceptTerms:true} => {url,transaction}; Stripe test-only bill flow
POST /payments/webhook => signed Stripe raw body
GET /activity => {transactions}; signed in, scoped own records
PATCH /profile {name,country,profile:{legalName,dob,address,city,postalCode,occupation,sourceOfFunds,investorType,phone,companyName,registrationNumber,privacyConsent}} => {user}; no fake verified status
POST /documents multipart file => {document:{id,name,mime,size}}; max 10 MB PDF/JPEG/PNG, owner/admin access only
GET /documents/:id => file; owner/admin only
GET /admin/requests => {requests}; admin only
PATCH /admin/requests/:id {status:'approved'|'rejected',note} => {request}; audit logged
GET /compliance => {mode:'demo', liveEnabled:false, blockers:[], legalVersion}

Request public shape: {id,ownerId,kind,title,story,category,amountCents,fundedCents,reservedCents,currency,country,city,dueDate,billerName,projectSummary,terms,riskDisclosure,status,image,createdAt,applicantName,saved,verificationLabel,documentCount}. No PII, DOB, private metadata or documents in public discovery. My/admin detail may contain own/private documents. Transaction {id,requestId,requestTitle,kind:'contribution'|'investment_interest',amountCents,currency,status,mode:'demo'|'stripe_test',createdAt,reference}. Demo contribution status='simulated'; never 'bill_paid'. Investment status='interest_recorded'.

Seed logins (local demo only): investor@billionairepay.local / BackerDemo!2026; applicant@billionairepay.local / ApplicantDemo!2026; admin@billionairepay.local / AdminDemo!2026. Seed investor name Alexander Morgan; applicant Amara N., sample bills and project records all fictional. Stripe registration email is NOT an app demo account and supplied private passwords must never enter files.

## Implemented authentication extensions
User responses include `emailVerified: boolean` (email confirmation is distinct from identity verification).

- `POST /auth/forgot-password {email}` returns a generic recovery response; an eligible account receives a one-time reset link through the configured SMTP transport.
- `POST /auth/reset-password {token,password}` consumes a hashed, expiring, one-use token and revokes all existing sessions.
- `POST /auth/verify-email {token}` consumes the one-use confirmation token.
- `POST /auth/resend-verification` requires a session and invalidates superseded confirmation tokens.
- `GET /admin/transactions` requires admin and lists transactions for reconciliation; it does not itself release funds or establish provider settlement.

Local SMTP is Mailpit. No user mailbox credentials are used. Browser links target `/?verifyEmail=...` and `/?resetPassword=...`; gateway access logs omit query strings so raw tokens are not recorded in request logs.
