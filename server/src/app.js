import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, basename } from 'node:path';
import { BlockList, isIP } from 'node:net';
import { setupDatabase, transaction, hashPassword, verifyPassword, LEGAL_VERSION } from './db.js';

const proxyPeers=new BlockList();
for(const [address,prefix,family]of [['127.0.0.0',8,'ipv4'],['10.0.0.0',8,'ipv4'],['172.16.0.0',12,'ipv4'],['192.168.0.0',16,'ipv4'],['::1',128,'ipv6'],['fc00::',7,'ipv6'],['fe80::',10,'ipv6']])proxyPeers.addSubnet(address,prefix,family);
const trustedProxy=(address,hop)=>{if(hop!==0)return false;const normalized=address.replace(/^::ffff:/,'');const family=isIP(normalized);return family?proxyPeers.check(normalized,family===4?'ipv4':'ipv6'):false;};
const sha = (value)=>createHash('sha256').update(value).digest('hex');
const fail=(statusCode,message)=>{throw Object.assign(new Error(message),{statusCode});};
const uuid=(value)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const id=(value)=>{if(!uuid(value))fail(400,'Invalid identifier');return value;};
const object=(value)=>{if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'A JSON object is required');return value;};
const text=(value,label,max=500,required=false)=>{if(value===undefined||value===null){if(required)fail(400,`${label} is required`);return '';}if(typeof value!=='string')fail(400,`${label} must be text`);const s=value.trim();if(s.length>max||required&&!s)fail(400,`${label} must contain ${required?'1':'0'}–${max} characters`);return s;};
const cents=(value)=>{if(!Number.isSafeInteger(value)||value<1||value>1000000000)fail(400,'Amount must be integer USD cents between 1 and 1000000000');return value;};
const calendarDate=(value)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;
const safeUser=(u)=>({id:u.id,name:u.name,email:u.email,role:u.role,country:u.country,verificationStatus:u.verification_status,emailVerified:!!u.email_verified_at,profile:u.profile});
const safeTx=(t)=>({id:t.id,requestId:t.request_id,requestTitle:t.request_title||'',kind:t.kind,amountCents:t.amount_cents,currency:t.currency,status:t.status,mode:t.mode,createdAt:t.created_at,reference:`BP-${t.id.slice(0,8).toUpperCase()}`});
const blockers=['Colorado and United States regulatory review and operating legal entity require approval','Draft terms, privacy, risk disclosures and consent require legal approval','Provider onboarding, KYC, AML and sanctions controls are not activated','Biller authorization, disbursement and reconciliation are not activated','Licensed investment partner, issuer diligence and investor eligibility are not activated'];

export async function createApp(options={}){
 const databaseUrl=options.databaseUrl||process.env.DATABASE_URL;if(!databaseUrl)throw new Error('DATABASE_URL is required');
 const origins=(options.appOrigin||process.env.APP_ORIGIN||'http://localhost:8080').split(',').map(x=>x.trim());
 const uploadDir=options.uploadDir||process.env.UPLOAD_DIR||join(process.cwd(),'uploads');
 const secretKey=options.stripeSecretKey??process.env.STRIPE_SECRET_KEY??'';
 if(secretKey&&!secretKey.startsWith('sk_test_'))throw new Error('Only Stripe sk_test_ keys are accepted; live payments are disabled');
 const webhookSecret=options.stripeWebhookSecret??process.env.STRIPE_WEBHOOK_SECRET??'';
 const smtpHost=process.env.SMTP_HOST;
 const mailTransport=options.mailTransport!==undefined?options.mailTransport:smtpHost?nodemailer.createTransport({host:smtpHost,port:Number(process.env.SMTP_PORT||1025),secure:process.env.SMTP_SECURE==='true',...(process.env.SMTP_USER?{auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}}:{}),connectionTimeout:5000,socketTimeout:10000}):null;
 const mailFrom=process.env.SMTP_FROM||'Billionaire Pay Demo <noreply@billionairepay.local>';
 const stripe=options.stripeClient??(secretKey?new Stripe(secretKey,{maxNetworkRetries:2,timeout:15000}):null);
 const pool=await setupDatabase(databaseUrl,options.seedDemo??process.env.SEED_DEMO==='true');
 await mkdir(uploadDir,{recursive:true,mode:0o700});
 const proxyHops=options.trustProxyHops??Number(process.env.TRUST_PROXY_HOPS||0);if(![0,1].includes(proxyHops))throw new Error('TRUST_PROXY_HOPS must be 0 or 1');
 const app=Fastify({logger:options.logger??{level:'info',redact:['req.headers.authorization','req.headers.cookie','res.headers["set-cookie"]']},bodyLimit:1048576,trustProxy:proxyHops===1?trustedProxy:false});
 app.decorate('pool',pool);
 await app.register(cookie);
 await app.register(multipart,{limits:{fileSize:10485760,files:1,fields:5,parts:6}});
 await app.register(rateLimit,{max:200,timeWindow:'1 minute',keyGenerator:r=>r.ip});
 app.addContentTypeParser('application/json',{parseAs:'buffer'},(req,body,done)=>{req.rawBody=body;try{done(null,body.length?JSON.parse(body.toString('utf8')):{});}catch{done(Object.assign(new Error('Invalid JSON'),{statusCode:400}));}});
 app.addHook('onClose',async()=>{mailTransport?.close?.();await pool.end();});
 app.setErrorHandler((error,request,reply)=>{
  let status=error.statusCode||500;
  if(error.code==='23505')status=409;
  if(error.code==='23503'||error.code==='23514'||error.code==='22P02')status=400;
  if(status>=500)request.log.error({code:error.code,message:error.message},'API operation failed');
  reply.code(status).send({error:status>=500&&error.statusCode!==503?'Service temporarily unavailable. Please retry.':error.code==='23505'?'This record already exists':error.message});
 });
 app.addHook('onRequest',async(req,reply)=>{
  reply.header('X-Content-Type-Options','nosniff').header('Cache-Control','no-store').header('Referrer-Policy','strict-origin-when-cross-origin');
  const origin=req.headers.origin;
  if(req.url.startsWith('/api/payments/webhook'))return;
  if(origin){if(!origins.includes(origin))fail(403,'Origin is not permitted');reply.header('Access-Control-Allow-Origin',origin).header('Vary','Origin').header('Access-Control-Allow-Credentials','true');}
  if(req.method==='OPTIONS'){if(!origin)fail(403,'Origin is required');return reply.header('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS').header('Access-Control-Allow-Headers','Content-Type,Authorization').code(204).send();}
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
   if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Cross-site request blocked');
   if(req.cookies.bp_session&&!req.headers.authorization&&!origin&&req.headers['sec-fetch-site']!=='same-origin')fail(403,'Origin is required for cookie-authenticated changes');
  }
 });
 async function session(req,required=true){
  if(req.user)return req.user;
  const auth=req.headers.authorization;const token=auth?.startsWith('Bearer ')?auth.slice(7):req.cookies.bp_session;
  if(token&&token.length<=128){const r=await pool.query('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[sha(token)]);if(r.rowCount){req.user=r.rows[0];req.sessionToken=token;return req.user;}}
  if(required)fail(401,'Please sign in');return null;
 }
 const requireRole=(...roles)=>async(req)=>{const u=await session(req);if(!roles.includes(u.role))fail(403,'Your account cannot perform this action');};
 async function issueSession(user,reply){const token=randomBytes(32).toString('base64url');await pool.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'7 days\')',[sha(token),user.id]);reply.setCookie('bp_session',token,{path:'/api',httpOnly:true,sameSite:'lax',secure:origins.every(o=>o.startsWith('https:')),maxAge:604800});return {user:safeUser(user),token};}
 async function requestRows(where,params=[],viewer=null,client=pool,privateView=false){
  const userIndex=params.length+1;
  const result=await client.query(`SELECT r.*,u.name AS applicant_name,EXISTS(SELECT 1 FROM saved_requests s WHERE s.request_id=r.id AND s.user_id=$${userIndex}::uuid) AS saved,(SELECT count(*)::int FROM documents d WHERE d.request_id=r.id) AS document_count FROM requests r JOIN users u ON u.id=r.owner_id WHERE ${where} ORDER BY r.created_at DESC LIMIT 200`,[...params,viewer?.id||null]);
  const rows=result.rows.map(r=>({id:r.id,ownerId:r.owner_id,kind:r.kind,title:r.title,story:r.story,category:r.category,amountCents:r.amount_cents,fundedCents:r.funded_cents,reservedCents:r.reserved_cents,currency:r.currency,country:r.country,city:r.city,dueDate:r.due_date?new Date(r.due_date).toISOString().slice(0,10):null,billerName:r.biller_name,projectSummary:r.project_summary,terms:r.terms,riskDisclosure:r.risk_disclosure,status:r.status,image:r.image,createdAt:r.created_at,applicantName:r.applicant_name,saved:r.saved,verificationLabel:'Demo platform review · identity not verified',documentCount:r.document_count,...(privateView?{relationship:r.relationship,reviewNote:r.review_note,consentVersion:r.consent_version,consentAt:r.consent_at}: {})}));
  if(privateView)for(const r of rows){if(viewer?.role==='admin'){const applicant=(await client.query('SELECT email,profile,verification_status FROM users WHERE id=$1',[r.ownerId])).rows[0];r.applicantProfile=applicant.profile;r.applicantEmail=applicant.email;r.applicantVerificationStatus=applicant.verification_status;}const documents=await client.query('SELECT id,name,mime,size FROM documents WHERE request_id=$1',[r.id]);r.documents=documents.rows;}
  return rows;
 }
 async function singleRequest(requestId,viewer=null,privateView=false,client=pool){return (await requestRows('r.id=$1',[requestId],viewer,client,privateView))[0];}
 async function getTx(client,txId){const r=await client.query('SELECT t.*,r.title request_title FROM transactions t JOIN requests r ON r.id=t.request_id WHERE t.id=$1',[txId]);return r.rows[0];}
 async function sendAccountEmail(user,kind){
  if(!mailTransport)fail(503,'Account email is not configured. Set SMTP_HOST for local delivery.');
  const token=randomBytes(32).toString('base64url'),tokenHash=sha(token),verify=kind==='verify_email';
  await transaction(pool,async(c)=>{await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`account-token:${user.id}:${kind}`]);await c.query('DELETE FROM account_tokens WHERE user_id=$1 AND kind=$2 AND consumed_at IS NULL',[user.id,kind]);await c.query("INSERT INTO account_tokens(token_hash,user_id,kind,expires_at) VALUES($1,$2,$3,now()+$4::interval)",[tokenHash,user.id,kind,verify?'24 hours':'1 hour']);});
  const link=`${origins[0]}/?${verify?'verifyEmail':'resetPassword'}=${token}`;
  try{await mailTransport.sendMail({from:mailFrom,to:user.email,subject:verify?'Verify your Billionaire Pay demo email':'Reset your Billionaire Pay demo password',text:`${verify?'Verify your email address':'Reset your password'} using this one-time link:\n\n${link}\n\nThis link expires in ${verify?'24 hours':'1 hour'}. If you did not request it, ignore this email. Billionaire Pay is a local demonstration; no live financial services are enabled.`});}
  catch{await pool.query('DELETE FROM account_tokens WHERE token_hash=$1',[tokenHash]);fail(503,'Account email could not be delivered. Please retry.');}
 }
 const accountToken=(value)=>{if(typeof value!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(value))fail(400,'This account link is invalid or expired');return sha(value);};
 app.post('/api/auth/forgot-password',{config:{rateLimit:{max:10,timeWindow:'1 hour'}}},async(req)=>{
  const b=object(req.body),email=text(b.email,'Email',254,true).toLowerCase();if(!mailTransport)fail(503,'Account email is not configured. Set SMTP_HOST for local delivery.');
  const user=(await pool.query('SELECT id,email FROM users WHERE email=$1',[email])).rows[0];if(user)try{await sendAccountEmail(user,'reset_password');}catch{req.log.warn('Account recovery email delivery unavailable');}
  return {ok:true,message:'If an account exists for this email, a password reset link has been sent.'};
 });
 app.post('/api/auth/reset-password',{config:{rateLimit:{max:15,timeWindow:'1 hour'}}},async(req)=>{
  const b=object(req.body),tokenHash=accountToken(b.token),password=text(b.password,'Password',200,true);if(password.length<12)fail(400,'Password must have at least 12 characters');const hash=await hashPassword(password);
  await transaction(pool,async(c)=>{const token=(await c.query("SELECT * FROM account_tokens WHERE token_hash=$1 AND kind='reset_password' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",[tokenHash])).rows[0];if(!token)fail(400,'This account link is invalid or expired');await c.query('UPDATE users SET password_hash=$1 WHERE id=$2',[hash,token.user_id]);await c.query('UPDATE account_tokens SET consumed_at=now() WHERE token_hash=$1',[tokenHash]);await c.query('DELETE FROM sessions WHERE user_id=$1',[token.user_id]);await c.query("DELETE FROM account_tokens WHERE user_id=$1 AND kind='reset_password' AND token_hash<>$2",[token.user_id,tokenHash]);});
  return {ok:true,message:'Password updated. Sign in with your new password.'};
 });
 app.post('/api/auth/verify-email',{config:{rateLimit:{max:15,timeWindow:'1 hour'}}},async(req)=>{
  const tokenHash=accountToken(object(req.body).token);
  await transaction(pool,async(c)=>{const token=(await c.query("SELECT * FROM account_tokens WHERE token_hash=$1 AND kind='verify_email' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",[tokenHash])).rows[0];if(!token)fail(400,'This account link is invalid or expired');await c.query('UPDATE users SET email_verified_at=now() WHERE id=$1',[token.user_id]);await c.query('UPDATE account_tokens SET consumed_at=now() WHERE token_hash=$1',[tokenHash]);});
  return {ok:true,message:'Email address verified. Identity checks remain separate.'};
 });
 app.post('/api/auth/resend-verification',{config:{rateLimit:{max:5,timeWindow:'1 hour'}}},async(req)=>{const user=await session(req);if(user.email_verified_at)return {ok:true,alreadyVerified:true};await sendAccountEmail(user,'verify_email');return {ok:true,message:'Verification email sent.'};});
 app.get('/api/health',async()=>{await pool.query('SELECT 1');return {status:'ok',mode:'demo',paymentsConfigured:!!stripe&&!!webhookSecret,liveEnabled:false};});
 app.get('/api/compliance',async()=>({mode:'demo',liveEnabled:false,blockers,legalVersion:LEGAL_VERSION,operatingJurisdiction:{country:'US',state:'CO'},liveCountryAllowlist:['US'],bindingInvestmentsEnabled:false,billerSettlementEnabled:false}));
 app.post('/api/auth/login',{config:{rateLimit:{max:15,timeWindow:'1 minute'}}},async(req,reply)=>{
  const b=object(req.body);const email=text(b.email,'Email',254,true).toLowerCase();const password=text(b.password,'Password',200,true);
  const row=(await pool.query('SELECT * FROM users WHERE email=$1',[email])).rows[0];
  // A fixed-cost dummy hash prevents email enumeration through timing.
  const stored=row?.password_hash||'0123456789abcdef0123456789abcdef:75579bb27caa462986c17ce050c65f1434ae5392967506c00f398527ec8617b64a8c1c9bd7e69397600b93b25df8b0070b79ed2d5bd79fe24bebc6413acb232e';
  if(!await verifyPassword(password,stored)||!row)fail(401,'Email or password is incorrect');return issueSession(row,reply);
 });
 app.post('/api/auth/register',{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(req,reply)=>{
  const b=object(req.body);const name=text(b.name,'Name',100,true),email=text(b.email,'Email',254,true).toLowerCase(),password=text(b.password,'Password',200,true),country=text(b.country||'US','Country',100,true);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Enter a valid email');if(password.length<12)fail(400,'Password must have at least 12 characters');if(!['backer','applicant'].includes(b.role))fail(400,'Choose a backer or applicant account');if(b.acceptTerms!==true)fail(400,'You must accept the draft terms and privacy notice');
  const allow=(process.env.COUNTRY_ALLOWLIST||'').split(',').filter(Boolean);if(allow.length&&!allow.includes(country))fail(400,'This country is not enabled for this demo');
  const r=await pool.query('INSERT INTO users(name,email,password_hash,role,country,terms_version) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[name,email,await hashPassword(password),b.role,country,LEGAL_VERSION]);reply.code(201);const result=await issueSession(r.rows[0],reply);let verificationEmailSent=false;try{await sendAccountEmail(r.rows[0],'verify_email');verificationEmailSent=true;}catch{req.log.warn('Registration email delivery unavailable');}return {...result,verificationEmailSent};
 });
 app.get('/api/auth/me',async(req)=>({user:safeUser(await session(req))}));
 app.post('/api/auth/logout',async(req,reply)=>{await session(req,false);if(req.sessionToken)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[sha(req.sessionToken)]);reply.clearCookie('bp_session',{path:'/api'});return {ok:true};});
 app.patch('/api/profile',async(req)=>{
  const u=await session(req),b=object(req.body),profile={...u.profile};
  if(b.profile!==undefined){const p=object(b.profile);const limits={legalName:150,dob:10,address:300,city:100,state:100,postalCode:30,occupation:100,sourceOfFunds:500,investorType:100,phone:50,companyName:150,registrationNumber:100};for(const [key,max]of Object.entries(limits))if(p[key]!==undefined)profile[key]=text(p[key],key,max);
   if(p.dob){if(!calendarDate(p.dob))fail(400,'Enter a valid date of birth');const adult=new Date();adult.setUTCFullYear(adult.getUTCFullYear()-18);if(new Date(p.dob)>adult)fail(400,'You must be at least 18 to use this demo');}
   if(p.privacyConsent!==undefined){if(typeof p.privacyConsent!=='boolean')fail(400,'Privacy consent must be true or false');profile.privacyConsent=p.privacyConsent;if(p.privacyConsent){profile.privacyConsentVersion=LEGAL_VERSION;profile.privacyConsentAt=new Date().toISOString();}}
  }
  const r=await pool.query('UPDATE users SET name=$1,country=$2,profile=$3,verification_status=$4 WHERE id=$5 RETURNING *',[b.name!==undefined?text(b.name,'Name',100,true):u.name,b.country!==undefined?text(b.country,'Country',100,true):u.country,profile,profile.legalName&&profile.dob&&profile.address&&profile.privacyConsent?'submitted':'not_started',u.id]);return {user:safeUser(r.rows[0])};
 });
 app.get('/api/requests',async(req)=>{
  const viewer=await session(req,false),q=req.query;let where="r.status='approved'";const p=[];
  if(q.kind){if(!['bill','project'].includes(q.kind))fail(400,'Invalid request kind');p.push(q.kind);where+=` AND r.kind=$${p.length}`;}
  if(q.category){p.push(text(q.category,'Category',100));where+=` AND lower(r.category)=lower($${p.length})`;}
  if(q.search){p.push(`%${text(q.search,'Search',100).replace(/[\\%_]/g,'\\$&')}%`);where+=` AND (r.title ILIKE $${p.length} OR r.story ILIKE $${p.length} OR r.city ILIKE $${p.length})`;}
  if(q.saved==='true'){if(!viewer)fail(401,'Please sign in');p.push(viewer.id);where+=` AND EXISTS(SELECT 1 FROM saved_requests s WHERE s.request_id=r.id AND s.user_id=$${p.length})`;}
  return {requests:await requestRows(where,p,viewer)};
 });
 app.get('/api/requests/:id',async(req)=>{
  const requestId=id(req.params.id),u=await session(req,false);const row=await singleRequest(requestId,u);if(!row||(row.status!=='approved'&&row.ownerId!==u?.id&&u?.role!=='admin'))fail(404,'Request not found');return {request:row.ownerId===u?.id||u?.role==='admin'?await singleRequest(requestId,u,true):row};
 });
 app.get('/api/my/requests',{preHandler:requireRole('applicant')},async(req)=>({requests:await requestRows('r.owner_id=$1',[req.user.id],req.user,pool,true)}));
 app.post('/api/requests',{preHandler:requireRole('applicant')},async(req,reply)=>{
  const b=object(req.body);if(!['bill','project'].includes(b.kind))fail(400,'Choose bill or project');if(b.consent!==true)fail(400,'Public publication consent is required');if(b.currency!=='USD')fail(400,'This demo supports USD only');
  const title=text(b.title,'Title',150,true),story=text(b.story,'Story',5000,true),category=text(b.category,'Category',100,true),amount=cents(b.amountCents),country=text(b.country,'Country',100,true),city=text(b.city,'City',100,true);
  const biller=text(b.billerName,'Biller name',150,b.kind==='bill'),relationship=text(b.relationship,'Biller relationship',250,b.kind==='bill'),summary=text(b.projectSummary,'Project summary',3000,b.kind==='project'),terms=text(b.terms,'Terms',3000,b.kind==='project'),risk=text(b.riskDisclosure,'Risk disclosure',3000,b.kind==='project');
  let dueDate=null;if(b.dueDate){if(!calendarDate(b.dueDate))fail(400,'Invalid due date');dueDate=b.dueDate;}
  const documentIds=b.documentIds||[];if(!Array.isArray(documentIds)||documentIds.length>10||documentIds.some(x=>!uuid(x)))fail(400,'Invalid evidence list');
  const requestId=await transaction(pool,async(c)=>{
   if(documentIds.length){const docs=await c.query('SELECT id FROM documents WHERE id=ANY($1::uuid[]) AND owner_id=$2 AND request_id IS NULL FOR UPDATE',[documentIds,req.user.id]);if(docs.rowCount!==new Set(documentIds).size)fail(400,'Evidence must belong to your account and be unattached');}
   const r=await c.query('INSERT INTO requests(owner_id,kind,title,story,category,amount_cents,country,city,due_date,biller_name,relationship,project_summary,terms,risk_disclosure,consent_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id',[req.user.id,b.kind,title,story,category,amount,country,city,dueDate,biller,relationship,summary,terms,risk,LEGAL_VERSION]);
   if(documentIds.length)await c.query('UPDATE documents SET request_id=$1 WHERE id=ANY($2::uuid[])',[r.rows[0].id,documentIds]);return r.rows[0].id;
  });reply.code(201);return {request:await singleRequest(requestId,req.user,true)};
 });
 app.post('/api/requests/:id/save',async(req)=>{const u=await session(req),requestId=id(req.params.id),b=object(req.body);if(typeof b.saved!=='boolean')fail(400,'Saved must be true or false');const r=await pool.query("SELECT id FROM requests WHERE id=$1 AND status='approved'",[requestId]);if(!r.rowCount)fail(404,'Request not found');if(b.saved)await pool.query('INSERT INTO saved_requests(user_id,request_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.id,requestId]);else await pool.query('DELETE FROM saved_requests WHERE user_id=$1 AND request_id=$2',[u.id,requestId]);return {saved:b.saved};});
 app.get('/api/saved',async(req)=>{const u=await session(req);return {requests:await requestRows("r.status='approved' AND EXISTS(SELECT 1 FROM saved_requests s WHERE s.user_id=$1 AND s.request_id=r.id)",[u.id],u)};});
 app.get('/api/activity',async(req)=>{const u=await session(req);return {transactions:(await pool.query('SELECT t.*,r.title request_title FROM transactions t JOIN requests r ON r.id=t.request_id WHERE t.user_id=$1 ORDER BY t.created_at DESC LIMIT 200',[u.id])).rows.map(safeTx)};});
 app.get('/api/admin/requests',{preHandler:requireRole('admin')},async(req)=>({requests:await requestRows('TRUE',[],req.user,pool,true)}));
 app.get('/api/admin/transactions',{preHandler:requireRole('admin')},async()=>({transactions:(await pool.query("SELECT t.*,r.title request_title,r.reserved_cents FROM transactions t JOIN requests r ON r.id=t.request_id WHERE t.mode='stripe_test' ORDER BY t.created_at DESC LIMIT 200")).rows.map(t=>({...safeTx(t),stripeSessionId:t.stripe_session_id,reservedCents:t.reserved_cents,reconciliationRequired:t.status==='checkout_creating'&&!t.stripe_session_id}))}));
 app.patch('/api/admin/requests/:id',{preHandler:requireRole('admin')},async(req)=>{
  const requestId=id(req.params.id),b=object(req.body);if(!['approved','rejected'].includes(b.status))fail(400,'Review status must be approved or rejected');const note=text(b.note,'Review note',2000,true);
  await transaction(pool,async(c)=>{const r=await c.query('SELECT * FROM requests WHERE id=$1 FOR UPDATE',[requestId]);if(!r.rowCount)fail(404,'Request not found');if(b.status==='rejected'&&(r.rows[0].funded_cents||r.rows[0].reserved_cents))fail(409,'A funded or reserved request needs financial reconciliation before rejection');await c.query('UPDATE requests SET status=$1,review_note=$2 WHERE id=$3',[b.status,note,requestId]);await c.query('INSERT INTO audit_log(actor_id,action,target_id,details) VALUES($1,$2,$3,$4)',[req.user.id,`request_${b.status}`,requestId,{note,previousStatus:r.rows[0].status}]);});return {request:await singleRequest(requestId,req.user,true)};
 });
 async function recordFinancial(req,kind,mode){
  const b=object(req.body),requestId=id(b.requestId),amount=cents(b.amountCents),key=text(b.idempotencyKey,'Idempotency key',150,true);
  if(key.length<8)fail(400,'Idempotency key must have at least 8 characters');
  if(kind==='contribution'&&b.acceptTerms!==true)fail(400,'Confirm the draft payment terms');if(kind==='investment_interest'&&b.acknowledgeRisk!==true)fail(400,'Acknowledge nonbinding interest and investment risk');
  return transaction(pool,async(c)=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${req.user.id}:${key}`]);
   const existing=(await c.query('SELECT * FROM transactions WHERE user_id=$1 AND idempotency_key=$2',[req.user.id,key])).rows[0];
   if(existing){if(existing.request_id!==requestId||existing.amount_cents!==amount||existing.kind!==kind||existing.mode!==mode)fail(409,'Idempotency key was used for a different operation');return {tx:await getTx(c,existing.id),reused:true};}
   const r=(await c.query('SELECT * FROM requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];
   if(!r||r.status!=='approved')fail(404,'Approved request not found');if(r.owner_id===req.user.id)fail(400,'You cannot fund your own request');
   if(r.kind!==(kind==='contribution'?'bill':'project'))fail(400,kind==='contribution'?'Payments support bills only':'Interest supports projects only');
   if(kind==='contribution'&&amount>r.amount_cents-r.funded_cents-r.reserved_cents)fail(409,'Amount exceeds the available funding balance');
   const status=kind==='investment_interest'?'interest_recorded':mode==='demo'?'simulated':'checkout_creating';
   const t=(await c.query('INSERT INTO transactions(user_id,request_id,kind,amount_cents,currency,status,mode,idempotency_key,consent_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',[req.user.id,requestId,kind,amount,r.currency,status,mode,key,LEGAL_VERSION])).rows[0];
   if(kind==='contribution')await c.query(mode==='demo'?'UPDATE requests SET funded_cents=funded_cents+$1 WHERE id=$2':'UPDATE requests SET reserved_cents=reserved_cents+$1 WHERE id=$2',[amount,requestId]);
   return {tx:await getTx(c,t.id),reused:false};
  });
 }
 app.post('/api/contributions',{preHandler:requireRole('backer')},async(req,reply)=>{const {tx,reused}=await recordFinancial(req,'contribution','demo');reply.code(reused?200:201);return {transaction:safeTx(tx),request:await singleRequest(tx.request_id,req.user)};});
 app.post('/api/investments/interest',{preHandler:requireRole('backer')},async(req,reply)=>{const {tx,reused}=await recordFinancial(req,'investment_interest','demo');reply.code(reused?200:201);return {transaction:safeTx(tx)};});
 app.post('/api/payments/checkout',{preHandler:requireRole('backer')},async(req,reply)=>{
  // Validate kind before provider availability to make unsupported project payments explicit.
  const b=object(req.body),requestId=id(b.requestId);const candidate=(await pool.query("SELECT kind FROM requests WHERE id=$1 AND status='approved'",[requestId])).rows[0];if(!candidate)fail(404,'Approved request not found');if(candidate.kind!=='bill')fail(400,'Stripe Checkout is available for bills only; projects record nonbinding demo interest');
  if(!stripe||!webhookSecret)fail(503,'Stripe test Checkout is not configured. Add a test secret key and webhook signing secret; demo contributions are available.');
  if(cents(b.amountCents)<50)fail(400,'Stripe test Checkout requires at least 50 USD cents');
  const {tx,reused}=await recordFinancial(req,'contribution','stripe_test');
  if(tx.checkout_url&&tx.status==='checkout_pending')return {url:tx.checkout_url,transaction:safeTx(tx)};
  if(!['checkout_creating','checkout_pending'].includes(tx.status))fail(409,'This Checkout attempt has finished; use a new idempotency key for another attempt');
  // Stable idempotency and expiry let retries recover after an ambiguous network failure.
  const expires=Math.floor(new Date(tx.created_at).getTime()/1000)+3600;
  if(expires<Math.floor(Date.now()/1000)+1800)fail(409,'Checkout creation requires support reconciliation; reserved funds remain protected');
  let checkout;
  try{checkout=await stripe.checkout.sessions.create({mode:'payment',line_items:[{price_data:{currency:'usd',unit_amount:tx.amount_cents,product_data:{name:`TEST ONLY: ${tx.request_title}`,description:'Test contribution only. Biller settlement is separate and has not occurred.'}},quantity:1}],client_reference_id:tx.id,metadata:{transactionId:tx.id},expires_at:expires,success_url:`${origins[0]}/?checkout=success&transaction=${tx.id}`,cancel_url:`${origins[0]}/?checkout=cancelled&transaction=${tx.id}`},{idempotencyKey:`bp_checkout_${tx.id}`});}
  catch(error){
   if(['StripeAuthenticationError','StripePermissionError','StripeInvalidRequestError'].includes(error.type)){
    const released=await transaction(pool,async(c)=>{const current=(await c.query('SELECT * FROM transactions WHERE id=$1 FOR UPDATE',[tx.id])).rows[0];if(current.status!=='checkout_creating'||current.stripe_session_id)return false;await c.query('SELECT id FROM requests WHERE id=$1 FOR UPDATE',[tx.request_id]);await c.query('UPDATE requests SET reserved_cents=reserved_cents-$1 WHERE id=$2',[tx.amount_cents,tx.request_id]);await c.query("UPDATE transactions SET status='test_failed' WHERE id=$1",[tx.id]);await c.query('INSERT INTO audit_log(actor_id,action,target_id,details) VALUES($1,$2,$3,$4)',[req.user.id,'checkout_creation_rejected',tx.id,{providerErrorType:error.type,providerErrorCode:error.code||null,reservationReleased:true}]);return true;});
    req.log.warn({type:error.type,code:error.code},'Stripe definitively rejected test Checkout');
    fail(503,released?'Stripe rejected this test Checkout before payment creation. Your reservation was released. Check test configuration and try a new confirmation.':'Stripe rejected this test Checkout. Review its transaction status before retrying.');
   }
   req.log.warn({type:error.type,code:error.code},'Stripe test Checkout unavailable; retry the same idempotency key');fail(503,'Stripe test Checkout is unavailable. Retry with the same confirmation; your reservation is protected.');
  }
  if(checkout.livemode||!checkout.id.startsWith('cs_test_')||!checkout.url)fail(503,'Invalid Stripe test Checkout response');
  await pool.query("UPDATE transactions SET stripe_session_id=$1,checkout_url=$2,status=CASE WHEN status='checkout_creating' THEN 'checkout_pending' ELSE status END WHERE id=$3",[checkout.id,checkout.url,tx.id]);
  reply.code(reused?200:201);return {url:checkout.url,transaction:safeTx(await getTx(pool,tx.id))};
 });
 app.post('/api/payments/webhook',{config:{rateLimit:{max:300,timeWindow:'1 minute'}}},async(req)=>{
  if(!stripe||!webhookSecret)fail(503,'Stripe test webhook is not configured');
  const signature=req.headers['stripe-signature'];if(typeof signature!=='string'||!req.rawBody)fail(400,'Stripe signature is required');let event;
  try{event=stripe.webhooks.constructEvent(req.rawBody,signature,webhookSecret);}catch{fail(400,'Invalid Stripe webhook signature');}
  if(event.livemode!==false)fail(400,'Only Stripe test events are accepted');
  if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type))return {received:true,ignored:true};
  const sessionObject=event.data.object;
  if(!sessionObject.id?.startsWith('cs_test_')||sessionObject.mode!=='payment')fail(400,'Invalid test Checkout session');
  return transaction(pool,async(c)=>{
   const inserted=await c.query('INSERT INTO stripe_events(id,type) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING id',[event.id,event.type]);if(!inserted.rowCount)return {received:true,duplicate:true};
   const txId=sessionObject.metadata?.transactionId;
   if(!uuid(txId))return {received:true,ignored:true};
   const t=(await c.query("SELECT * FROM transactions WHERE id=$1 AND mode='stripe_test' FOR UPDATE",[txId])).rows[0];
   if(!t)return {received:true,ignored:true};
   if(t.stripe_session_id&&t.stripe_session_id!==sessionObject.id)fail(400,'Checkout session mismatch');
   if(sessionObject.currency!=='usd'||sessionObject.amount_total!==t.amount_cents)fail(400,'Checkout amount or currency mismatch');
   const r=(await c.query('SELECT * FROM requests WHERE id=$1 FOR UPDATE',[t.request_id])).rows[0];
   if(t.status==='test_paid')return {received:true};
   if(!['checkout_creating','checkout_pending'].includes(t.status))return {received:true,ignored:true};
   const isPaid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&sessionObject.payment_status==='paid';
   if(isPaid){if(r.reserved_cents<t.amount_cents)fail(409,'Checkout reservation requires reconciliation');await c.query('UPDATE requests SET reserved_cents=reserved_cents-$1,funded_cents=funded_cents+$1 WHERE id=$2',[t.amount_cents,t.request_id]);await c.query("UPDATE transactions SET status='test_paid',stripe_session_id=$1 WHERE id=$2",[sessionObject.id,t.id]);}
   else if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)){await c.query('UPDATE requests SET reserved_cents=reserved_cents-$1 WHERE id=$2',[t.amount_cents,t.request_id]);await c.query('UPDATE transactions SET status=$1,stripe_session_id=$2 WHERE id=$3',[event.type==='checkout.session.expired'?'checkout_expired':'test_failed',sessionObject.id,t.id]);}
   return {received:true};
  });
 });
 app.post('/api/documents',{preHandler:requireRole('applicant','admin')},async(req,reply)=>{
  const part=await req.file();if(!part)fail(400,'Select a PDF, JPEG or PNG file');const buffer=await part.toBuffer();if(part.file.truncated||buffer.length>10485760)fail(413,'File must be at most 10 MB');if(!buffer.length)fail(400,'File is empty');
  const detected=buffer.subarray(0,5).equals(Buffer.from('%PDF-'))?'application/pdf':buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':buffer[0]===255&&buffer[1]===216&&buffer[2]===255?'image/jpeg':null;
  if(!detected||detected!==part.mimetype)fail(400,'File content must match PDF, JPEG or PNG type');
  const name=text(basename(part.filename||'document').replace(/[\u0000-\u001f\u007f]/g,''),'Filename',200,true),storageName=randomUUID();await writeFile(join(uploadDir,storageName),buffer,{flag:'wx',mode:0o600});
  try{const d=(await pool.query('INSERT INTO documents(owner_id,name,mime,size,storage_name) VALUES($1,$2,$3,$4,$5) RETURNING id,name,mime,size',[req.user.id,name,detected,buffer.length,storageName])).rows[0];reply.code(201);return {document:d};}catch(error){await unlink(join(uploadDir,storageName));throw error;}
 });
 app.get('/api/documents/:id',async(req,reply)=>{const u=await session(req),documentId=id(req.params.id);const doc=(await pool.query('SELECT * FROM documents WHERE id=$1 AND (owner_id=$2 OR $3) ',[documentId,u.id,u.role==='admin'])).rows[0];if(!doc)fail(404,'Document not found');reply.header('Content-Type',doc.mime).header('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`).header('Content-Security-Policy',"sandbox; default-src 'none'");return reply.send(createReadStream(join(uploadDir,doc.storage_name)));});
 await app.ready();return app;
}
