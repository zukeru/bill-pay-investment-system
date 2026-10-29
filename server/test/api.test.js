import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import Stripe from 'stripe';
import { createApp } from '../src/app.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
let app, pool, uploads;
const deliveredMail=[];
const mailTransport={sendMail:async message=>{deliveredMail.push(message);return {messageId:'fixture'};}};
const credentials = {backer:['investor@billionairepay.local','BackerDemo!2026'],applicant:['applicant@billionairepay.local','ApplicantDemo!2026'],admin:['admin@billionairepay.local','AdminDemo!2026']};
const tokens = {};
const call = async (method,url,payload,role,headers={}) => app.inject({method,url,payload,headers:{...(role?{authorization:`Bearer ${tokens[role]}`} : {}),...headers}});
const json = (r) => { assert.ok(r.statusCode<500,r.body); return r.json(); };

before(async()=>{
  assert.ok(databaseUrl,'Set TEST_DATABASE_URL to a dedicated PostgreSQL test database');
  assert.match(new URL(databaseUrl).pathname,/test/i,'Refusing to reset a database whose name does not contain test');
  pool=new pg.Pool({connectionString:databaseUrl});
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  uploads=await mkdtemp(join(tmpdir(),'bp-tests-'));
  app=await createApp({databaseUrl,uploadDir:uploads,seedDemo:true,appOrigin:'http://localhost:8080',stripeSecretKey:'sk_test_fixture',stripeWebhookSecret:'whsec_fixture',logger:false,mailTransport});
});
after(async()=>{ await app?.close(); await pool?.end(); if(uploads)await rm(uploads,{recursive:true,force:true}); });

test('health is explicitly demo and never live',async()=>{
 const r=await call('GET','/api/health'); assert.equal(r.statusCode,200); assert.equal(r.json().liveEnabled,false);
});
test('auth requires password, secure session and origin; rejects privilege escalation',async()=>{
 assert.equal((await call('POST','/api/auth/login',{email:credentials.backer[0],password:'bad'})).statusCode,401);
 assert.equal((await call('POST','/api/auth/login',{email:credentials.backer[0],password:credentials.backer[1]},null,{origin:'https://evil.example'})).statusCode,403);
 assert.equal((await call('POST','/api/auth/register',{name:'Bad admin',email:'bad@example.com',password:'LongPassword!234',role:'admin',country:'US',acceptTerms:true})).statusCode,400);
 for(const [role,[email,password]]of Object.entries(credentials)){
  const r=await call('POST','/api/auth/login',{email,password}); assert.equal(r.statusCode,200,r.body);tokens[role]=r.json().token;
  assert.match(r.headers['set-cookie'],/HttpOnly/i);assert.match(r.headers['set-cookie'],/SameSite=Lax/i);
  assert.ok(!('password_hash'in r.json().user));
 }
 assert.equal((await call('GET','/api/auth/me',undefined,'backer')).json().user.role,'backer');
 const sessions=await pool.query('SELECT token_hash FROM sessions'); assert.ok(!sessions.rows.some(s=>Object.values(tokens).includes(s.token_hash)));
});
test('public discovery redacts private profile and cross-owner evidence',async()=>{
 const profile={state:'CO',legalName:'Private Legal Name',dob:'1990-01-01',address:'SECRET STREET',phone:'+123456789',privacyConsent:true};
 const updated=await call('PATCH','/api/profile',{profile},'applicant');assert.equal(updated.statusCode,200);assert.equal(updated.json().user.profile.state,'CO');
 const r=await call('GET','/api/requests'); assert.equal(r.statusCode,200);assert.ok(r.json().requests.length>=4);assert.ok(!r.body.includes('SECRET STREET'));assert.ok(!r.body.includes('Private Legal Name'));
 assert.equal((await call('GET','/api/admin/requests',undefined,'backer')).statusCode,403);
 const admin=await call('GET','/api/admin/requests',undefined,'admin');assert.equal(admin.statusCode,200);assert.ok(admin.json().requests.some(r=>r.applicantProfile?.address==='SECRET STREET'));
 const publicDetail=await call('GET',`/api/requests/${r.json().requests[0].id}`,undefined,'backer');assert.ok(!publicDetail.body.includes('SECRET STREET'));
 assert.equal((await call('POST','/api/requests',{},'backer')).statusCode,403);
});
test('applicants submit pending, admin reviews with audit and saved requests persist',async()=>{
 const body={kind:'bill',title:'Fixture utility bill',story:'A fictional request for integration testing.',category:'Utilities',amountCents:10000,currency:'USD',country:'US',city:'Austin',dueDate:'2027-01-15',billerName:'Fictional Utility',relationship:'Account holder',consent:true};
 const noConsent=await call('POST','/api/requests',{...body,consent:false},'applicant');assert.equal(noConsent.statusCode,400);
 const r=await call('POST','/api/requests',body,'applicant');assert.equal(r.statusCode,201,r.body);const id=r.json().request.id;
 assert.equal(r.json().request.status,'pending');assert.equal(r.json().request.dueDate,'2027-01-15'); assert.equal((await call('GET',`/api/requests/${id}`)).statusCode,404);
 assert.equal((await call('PATCH',`/api/admin/requests/${id}`,{status:'approved',note:'Reviewed fictional evidence'},'admin')).statusCode,200);
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM audit_log WHERE target_id=$1',[id])).rows[0].n,1);
 assert.equal((await call('POST',`/api/requests/${id}/save`,{saved:true},'backer')).statusCode,200);
 assert.ok((await call('GET','/api/saved',undefined,'backer')).json().requests.some(x=>x.id===id));
});
test('funding enforces cents, consent, kind and same-key payload matching',async()=>{
 const req=(await call('GET','/api/requests?kind=bill')).json().requests[0];
 for(const amountCents of [-1,0,1.2,'100',1000000001])assert.equal((await call('POST','/api/contributions',{requestId:req.id,amountCents,idempotencyKey:`bad-${String(amountCents)}`,acceptTerms:true},'backer')).statusCode,400);
 assert.equal((await call('POST','/api/contributions',{requestId:req.id,amountCents:100,idempotencyKey:'no-consent',acceptTerms:false},'backer')).statusCode,400);
 const payload={requestId:req.id,amountCents:100,idempotencyKey:'repeat-contribution-key',acceptTerms:true};
 const a=await call('POST','/api/contributions',payload,'backer');const b=await call('POST','/api/contributions',payload,'backer');assert.equal(a.statusCode,201,a.body);assert.equal(b.statusCode,200,b.body);assert.equal(a.json().transaction.id,b.json().transaction.id);assert.equal(a.json().transaction.status,'simulated');
 assert.equal((await call('POST','/api/contributions',{...payload,amountCents:200},'backer')).statusCode,409);
 assert.equal((await call('GET','/api/activity',undefined,'applicant')).json().transactions.length,0);
});
test('concurrent funding serializes the request and cannot overfund',async()=>{
 const owner=(await call('GET','/api/auth/me',undefined,'applicant')).json().user.id;
 const id='10000000-0000-4000-8000-000000000001';
 await pool.query("INSERT INTO requests(id,owner_id,kind,title,story,category,amount_cents,country,city,status) VALUES($1,$2,'bill','Concurrency fixture','Fixture','Utilities',1000,'US','Austin','approved')",[id,owner]);
 const results=await Promise.all(Array.from({length:12},(_,i)=>call('POST','/api/contributions',{requestId:id,amountCents:300,idempotencyKey:`concurrent-funding-${i}`,acceptTerms:true},'backer')));
 assert.equal(results.filter(r=>r.statusCode===201).length,3);assert.ok(results.filter(r=>r.statusCode!==201).every(r=>r.statusCode===409));
 assert.equal((await pool.query('SELECT funded_cents FROM requests WHERE id=$1',[id])).rows[0].funded_cents,900);
 const repeated=await Promise.all(Array.from({length:8},()=>call('POST','/api/contributions',{requestId:id,amountCents:100,idempotencyKey:'same-concurrent-key',acceptTerms:true},'backer')));
 assert.equal(new Set(repeated.map(r=>r.json().transaction?.id)).size,1);assert.equal((await pool.query('SELECT funded_cents FROM requests WHERE id=$1',[id])).rows[0].funded_cents,1000);
});
test('investment is nonbinding interest and cannot use bill payment checkout',async()=>{
 const req=(await call('GET','/api/requests?kind=project')).json().requests[0];const before=req.fundedCents;
 const r=await call('POST','/api/investments/interest',{requestId:req.id,amountCents:50000,idempotencyKey:'project-interest',acknowledgeRisk:true},'backer');assert.equal(r.statusCode,201,r.body);assert.equal(r.json().transaction.status,'interest_recorded');
 assert.equal((await call('GET',`/api/requests/${req.id}`)).json().request.fundedCents,before);
 assert.equal((await call('POST','/api/payments/checkout',{requestId:req.id,amountCents:100,idempotencyKey:'project-checkout',acceptTerms:true},'backer')).statusCode,400);
});
test('document validation uses magic bytes and evidence access is owner/admin only',async()=>{
 const boundary='bpFixtureBoundary'; const multipart=(name,mime,content)=>Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`),Buffer.from(content),Buffer.from(`\r\n--${boundary}--\r\n`)]);
 const headers={'content-type':`multipart/form-data; boundary=${boundary}`};
 assert.equal((await call('POST','/api/documents',multipart('bad.pdf','application/pdf','<html>bad</html>'),'applicant',headers)).statusCode,400);
 const r=await call('POST','/api/documents',multipart('evidence.pdf','application/pdf','%PDF-1.7\nfixture'),'applicant',headers);assert.equal(r.statusCode,201,r.body);const id=r.json().document.id;
 assert.equal((await call('GET',`/api/documents/${id}`,undefined,'backer')).statusCode,404);assert.equal((await call('GET',`/api/documents/${id}`,undefined,'admin')).statusCode,200);
 const second=await call('POST','/api/auth/register',{name:'Second applicant',email:'second@example.com',password:'StrongPass!2026',role:'applicant',country:'US',acceptTerms:true});assert.equal(second.statusCode,201,second.body);tokens.second=second.json().token;
 assert.equal((await call('GET',`/api/documents/${id}`,undefined,'second')).statusCode,404);
});
test('Stripe webhook requires signature, rejects live events, deduplicates genuine paid test event and never claims settlement',async()=>{
 assert.equal((await call('POST','/api/payments/webhook',{id:'fake'})).statusCode,400);
 const req=(await call('GET','/api/requests?kind=bill')).json().requests.find(x=>x.amountCents-x.fundedCents>500);
 const user=(await call('GET','/api/auth/me',undefined,'backer')).json().user;
 const tx='20000000-0000-4000-8000-000000000001';
 await pool.query("INSERT INTO transactions(id,user_id,request_id,kind,amount_cents,currency,status,mode,idempotency_key,stripe_session_id) VALUES($1,$2,$3,'contribution',500,'USD','checkout_pending','stripe_test','webhook-fixture','cs_test_fixture')",[tx,user.id,req.id]);
 await pool.query('UPDATE requests SET reserved_cents=reserved_cents+500 WHERE id=$1',[req.id]);
 const event={id:'evt_test_paid_fixture',type:'checkout.session.completed',livemode:false,data:{object:{id:'cs_test_fixture',mode:'payment',payment_status:'paid',amount_total:500,currency:'usd',metadata:{transactionId:tx}}}};
 const signed=async(e)=>{const payload=JSON.stringify(e);const sig=Stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_fixture'});return call('POST','/api/payments/webhook',payload,null,{'content-type':'application/json','stripe-signature':sig});};
 assert.equal((await signed({...event,id:'evt_live_fixture',livemode:true})).statusCode,400);
 const a=await signed(event),b=await signed(event);assert.equal(a.statusCode,200,a.body);assert.equal(b.statusCode,200,b.body);
 const record=(await pool.query('SELECT status FROM transactions WHERE id=$1',[tx])).rows[0];assert.equal(record.status,'test_paid');assert.notEqual(record.status,'bill_paid');
 assert.equal((await pool.query('SELECT funded_cents,reserved_cents FROM requests WHERE id=$1',[req.id])).rows[0].funded_cents,req.fundedCents+500);
 assert.equal((await pool.query('SELECT count(*)::int n FROM stripe_events WHERE id=$1',[event.id])).rows[0].n,1);
});
test('compliance identifies US Colorado pilot with binding settlement disabled',async()=>{
 const r=await call('GET','/api/compliance');assert.equal(r.json().operatingJurisdiction.country,'US');assert.equal(r.json().operatingJurisdiction.state,'CO');assert.equal(r.json().bindingInvestmentsEnabled,false);
});
test('missing Stripe configuration reports 503 and live key is refused',async()=>{
 const other=await createApp({databaseUrl,uploadDir:uploads,seedDemo:false,logger:false,stripeSecretKey:'',stripeWebhookSecret:''});
 try{const login=await other.inject({method:'POST',url:'/api/auth/login',payload:{email:credentials.backer[0],password:credentials.backer[1]}});const req=(await call('GET','/api/requests?kind=bill')).json().requests[0];
 const result=await other.inject({method:'POST',url:'/api/payments/checkout',headers:{authorization:`Bearer ${login.json().token}`},payload:{requestId:req.id,amountCents:100,idempotencyKey:'missing-config-key',acceptTerms:true}});assert.equal(result.statusCode,503);assert.match(result.json().error,/not configured/i);
 }finally{await other.close();}
 await assert.rejects(createApp({databaseUrl,stripeSecretKey:'sk_live_forbidden'}),/Only Stripe sk_test_/);
});
test('unpaid completion does not fund; signed expiration releases reservation once',async()=>{
 const req=(await call('GET','/api/requests?kind=bill')).json().requests.find(x=>x.amountCents-x.fundedCents>250);
 const user=(await call('GET','/api/auth/me',undefined,'backer')).json().user,tx='20000000-0000-4000-8000-000000000002';
 await pool.query("INSERT INTO transactions(id,user_id,request_id,kind,amount_cents,currency,status,mode,idempotency_key,stripe_session_id) VALUES($1,$2,$3,'contribution',250,'USD','checkout_pending','stripe_test','expiration-fixture','cs_test_expiring')",[tx,user.id,req.id]);await pool.query('UPDATE requests SET reserved_cents=reserved_cents+250 WHERE id=$1',[req.id]);
 const base={livemode:false,data:{object:{id:'cs_test_expiring',mode:'payment',payment_status:'unpaid',amount_total:250,currency:'usd',metadata:{transactionId:tx}}}};
 const signed=async(event)=>{const payload=JSON.stringify(event);return call('POST','/api/payments/webhook',payload,null,{'content-type':'application/json','stripe-signature':Stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_fixture'})});};
 assert.equal((await signed({...base,id:'evt_unpaid_fixture',type:'checkout.session.completed'})).statusCode,200);
 assert.equal((await pool.query('SELECT funded_cents FROM requests WHERE id=$1',[req.id])).rows[0].funded_cents,req.fundedCents);
 const invalid={...base,id:'evt_wrong_amount',type:'checkout.session.completed',data:{object:{...base.data.object,amount_total:251,payment_status:'paid'}}};assert.equal((await signed(invalid)).statusCode,400);assert.equal((await pool.query('SELECT id FROM stripe_events WHERE id=$1',[invalid.id])).rowCount,0);
 const expiry={...base,id:'evt_expiration_fixture',type:'checkout.session.expired'};assert.equal((await signed(expiry)).statusCode,200);assert.equal((await signed(expiry)).statusCode,200);
 const after=(await pool.query('SELECT funded_cents,reserved_cents FROM requests WHERE id=$1',[req.id])).rows[0];assert.equal(after.funded_cents,req.fundedCents);assert.equal(after.reserved_cents,req.reservedCents);assert.equal((await pool.query('SELECT status FROM transactions WHERE id=$1',[tx])).rows[0].status,'checkout_expired');
});
test('logout invalidates bearer session and cookie origin CSRF is denied',async()=>{
 const login=await call('POST','/api/auth/login',{email:credentials.backer[0],password:credentials.backer[1]});const cookie=login.headers['set-cookie'].split(';')[0];
 assert.equal((await call('POST','/api/auth/logout',{},null,{cookie,origin:'https://evil.example'})).statusCode,403);
 assert.equal((await call('POST','/api/auth/logout',{},'backer')).statusCode,200);assert.equal((await call('GET','/api/auth/me',undefined,'backer')).statusCode,401);
});

test('email verification and password recovery deliver one-time hashed tokens and revoke sessions',async()=>{
 const email='recovery@example.com';const registration=await call('POST','/api/auth/register',{name:'Recovery Test',email,password:'InitialPassword!2026',role:'backer',country:'US',acceptTerms:true});
 assert.equal(registration.statusCode,201);assert.equal(registration.json().user.emailVerified,false);assert.equal(registration.json().verificationEmailSent,true);
 const verifyMail=deliveredMail.find(m=>m.to===email&&m.subject.includes('Verify'));assert.ok(verifyMail);const verifyToken=verifyMail.text.match(/verifyEmail=([A-Za-z0-9_-]+)/)[1];assert.ok(!registration.body.includes(verifyToken));
 const stored=await pool.query('SELECT token_hash FROM account_tokens');assert.ok(stored.rowCount);assert.ok(!stored.rows.some(r=>r.token_hash===verifyToken));
 assert.equal((await call('POST','/api/auth/verify-email',{token:verifyToken})).statusCode,200);assert.equal((await call('POST','/api/auth/verify-email',{token:verifyToken})).statusCode,400);
 const headers={authorization:`Bearer ${registration.json().token}`};assert.equal((await call('GET','/api/auth/me',undefined,null,headers)).json().user.emailVerified,true);
 const known=await call('POST','/api/auth/forgot-password',{email}),unknown=await call('POST','/api/auth/forgot-password',{email:'unknown@example.com'});assert.equal(known.statusCode,200);assert.deepEqual(known.json(),unknown.json());
 const resetMail=deliveredMail.find(m=>m.to===email&&m.subject.includes('Reset'));assert.ok(resetMail);const resetToken=resetMail.text.match(/resetPassword=([A-Za-z0-9_-]+)/)[1];assert.ok(!known.body.includes(resetToken));
 assert.equal((await call('POST','/api/auth/reset-password',{token:resetToken,password:'short'})).statusCode,400);
 assert.equal((await call('POST','/api/auth/reset-password',{token:resetToken,password:'UpdatedPassword!2026'})).statusCode,200);
 assert.equal((await call('GET','/api/auth/me',undefined,null,headers)).statusCode,401);
 assert.equal((await call('POST','/api/auth/login',{email,password:'InitialPassword!2026'})).statusCode,401);assert.equal((await call('POST','/api/auth/login',{email,password:'UpdatedPassword!2026'})).statusCode,200);
 assert.equal((await call('POST','/api/auth/reset-password',{token:resetToken,password:'UpdatedAgain!2026'})).statusCode,400);
});
test('expired recovery tokens and verification resend cannot be abused',async()=>{
 const result=await call('POST','/api/auth/register',{name:'Expired Recovery',email:'expiry@example.com',password:'InitialPassword!2026',role:'backer',country:'US',acceptTerms:true});assert.equal(result.statusCode,201);
 const firstMail=deliveredMail.find(m=>m.to==='expiry@example.com');const firstToken=firstMail.text.match(/verifyEmail=([A-Za-z0-9_-]+)/)[1];
 const resend=await call('POST','/api/auth/resend-verification',{},null,{authorization:`Bearer ${result.json().token}`});assert.equal(resend.statusCode,200);
 assert.equal((await call('POST','/api/auth/verify-email',{token:firstToken})).statusCode,400);
 const secondMail=deliveredMail.filter(m=>m.to==='expiry@example.com').at(-1);const secondToken=secondMail.text.match(/verifyEmail=([A-Za-z0-9_-]+)/)[1];
 await pool.query('UPDATE account_tokens SET expires_at=now()-interval \'1 second\' WHERE user_id=$1',[result.json().user.id]);
 assert.equal((await call('POST','/api/auth/verify-email',{token:secondToken})).statusCode,400);
 assert.equal((await call('POST','/api/auth/resend-verification',{})).statusCode,401);
});

test('definitive Stripe rejection releases exactly once; ambiguous failure retains safe idempotent retry',async()=>{
 const req=(await call('GET','/api/requests?kind=bill')).json().requests.find(x=>x.amountCents-x.fundedCents-x.reservedCents>1000);
 let failureType='StripeAuthenticationError',attempts=0,seenKeys=[];
 const fakeStripe={checkout:{sessions:{create:async(params,options)=>{assert.ok(!('payment_method_types' in params),'Use Stripe dynamic payment methods');attempts++;seenKeys.push(options.idempotencyKey);if(failureType)throw Object.assign(new Error('fixture provider error'),{type:failureType});return {id:'cs_test_retry_success',url:'https://checkout.stripe.com/c/pay/cs_test_retry_success',livemode:false};}}}};
 const other=await createApp({databaseUrl,uploadDir:uploads,seedDemo:false,logger:false,stripeSecretKey:'sk_test_fixture',stripeWebhookSecret:'whsec_fixture',stripeClient:fakeStripe});
 try{
  const login=await other.inject({method:'POST',url:'/api/auth/login',payload:{email:credentials.backer[0],password:credentials.backer[1]}});const headers={authorization:`Bearer ${login.json().token}`};
  const post=(key)=>other.inject({method:'POST',url:'/api/payments/checkout',headers,payload:{requestId:req.id,amountCents:100,idempotencyKey:key,acceptTerms:true}});
  for(const type of ['StripeAuthenticationError','StripePermissionError','StripeInvalidRequestError']){
   failureType=type;const key=`definitive-${type}`;const result=await post(key);assert.equal(result.statusCode,503,result.body);
   assert.equal((await pool.query('SELECT reserved_cents FROM requests WHERE id=$1',[req.id])).rows[0].reserved_cents,req.reservedCents);
   assert.equal((await pool.query('SELECT status FROM transactions WHERE user_id=$1 AND idempotency_key=$2',[login.json().user.id,key])).rows[0].status,'test_failed');
   const count=attempts;assert.equal((await post(key)).statusCode,409);assert.equal(attempts,count);
  }
  failureType='StripeConnectionError';const key='ambiguous-network-retry';assert.equal((await post(key)).statusCode,503);
  assert.equal((await pool.query('SELECT reserved_cents FROM requests WHERE id=$1',[req.id])).rows[0].reserved_cents,req.reservedCents+100);
  failureType=null;const recovered=await post(key);assert.equal(recovered.statusCode,200,recovered.body);assert.equal(recovered.json().transaction.status,'checkout_pending');assert.equal(seenKeys.at(-1),seenKeys.at(-2));
  const before=attempts;assert.equal((await post(key)).statusCode,200);assert.equal(attempts,before);
  assert.equal((await pool.query('SELECT reserved_cents FROM requests WHERE id=$1',[req.id])).rows[0].reserved_cents,req.reservedCents+100);
 }finally{await other.close();}
 const queue=await call('GET','/api/admin/transactions',undefined,'admin');assert.equal(queue.statusCode,200);assert.ok(queue.json().transactions.some(t=>t.status==='checkout_pending'));
 assert.equal((await call('GET','/api/admin/transactions',undefined,'applicant')).statusCode,403);
});

test('bounded trusted proxy separates real clients and ignores an injected forwarding prefix',async()=>{
 const proxied=await createApp({databaseUrl,uploadDir:uploads,seedDemo:false,logger:false,trustProxyHops:1});
 const attempt=(forwarded)=>proxied.inject({method:'POST',url:'/api/auth/login',remoteAddress:'172.18.0.2',headers:{'x-forwarded-for':forwarded},payload:{email:credentials.backer[0],password:'wrongPassword!2026'}});
 try{
  for(let i=0;i<15;i++)assert.equal((await attempt('203.0.113.1')).statusCode,401);
  assert.equal((await attempt('203.0.113.1')).statusCode,429);
  assert.equal((await attempt('203.0.113.2')).statusCode,401);
  assert.equal((await attempt('198.51.100.66, 203.0.113.1')).statusCode,429);
 }finally{await proxied.close();}
});

test('private profile rejects impossible calendar dates rather than normalizing them',async()=>{
 const login=await call('POST','/api/auth/login',{email:credentials.backer[0],password:credentials.backer[1]});
 assert.equal(login.statusCode,200,login.body);
 const result=await call('PATCH','/api/profile',{profile:{dob:'1985-02-31'}},null,{authorization:`Bearer ${login.json().token}`});
 assert.equal(result.statusCode,400,result.body);
});
