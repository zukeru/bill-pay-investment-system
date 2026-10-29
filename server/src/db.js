import pg from 'pg';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
// SQL DATE values are calendar dates; retain their text across server timezones.
pg.types.setTypeParser(1082, value => value);
export const LEGAL_VERSION = '2026-10-29-draft-v1';
export async function hashPassword(password) { const salt=randomBytes(16).toString('hex');return `${salt}:${(await scrypt(password,salt,64)).toString('hex')}`; }
export async function verifyPassword(password,stored){const [salt,hex]=stored.split(':');const derived=await scrypt(password,salt,64);const expected=Buffer.from(hex,'hex');return expected.length===derived.length&&timingSafeEqual(expected,derived);}
export async function transaction(pool,fn){const c=await pool.connect();try{await c.query('BEGIN');const result=await fn(c);await c.query('COMMIT');return result;}catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}}
export async function setupDatabase(databaseUrl, seedDemo=false) {
 const pool=new pg.Pool({connectionString:databaseUrl,max:15});
 await transaction(pool,async(c)=>{
 await c.query("SELECT pg_advisory_xact_lock(7952351)");
 await c.query(`
 CREATE TABLE IF NOT EXISTS users(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,email text UNIQUE NOT NULL,password_hash text NOT NULL,
 role text NOT NULL CHECK(role IN ('backer','applicant','admin')),country text NOT NULL DEFAULT 'US',verification_status text NOT NULL DEFAULT 'not_started',
 profile jsonb NOT NULL DEFAULT '{}',terms_version text NOT NULL,terms_accepted_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now());
 ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
 CREATE TABLE IF NOT EXISTS account_tokens(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind text NOT NULL CHECK(kind IN('verify_email','reset_password')),expires_at timestamptz NOT NULL,consumed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS account_tokens_user_idx ON account_tokens(user_id,kind);
 CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
 CREATE TABLE IF NOT EXISTS requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES users(id),kind text NOT NULL CHECK(kind IN('bill','project')),
 title text NOT NULL,story text NOT NULL,category text NOT NULL,amount_cents integer NOT NULL CHECK(amount_cents>0 AND amount_cents<=1000000000),
 funded_cents integer NOT NULL DEFAULT 0 CHECK(funded_cents>=0),reserved_cents integer NOT NULL DEFAULT 0 CHECK(reserved_cents>=0),currency text NOT NULL DEFAULT 'USD' CHECK(currency='USD'),
 country text NOT NULL,city text NOT NULL DEFAULT '',due_date date,biller_name text NOT NULL DEFAULT '',relationship text NOT NULL DEFAULT '',project_summary text NOT NULL DEFAULT '',
 terms text NOT NULL DEFAULT '',risk_disclosure text NOT NULL DEFAULT '',status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 image text NOT NULL DEFAULT '',consent_version text NOT NULL DEFAULT '${LEGAL_VERSION}',consent_at timestamptz NOT NULL DEFAULT now(),review_note text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(funded_cents+reserved_cents<=amount_cents));
 CREATE INDEX IF NOT EXISTS requests_discovery_idx ON requests(status,kind,created_at DESC);
 CREATE TABLE IF NOT EXISTS documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_id uuid NOT NULL REFERENCES users(id),request_id uuid REFERENCES requests(id),name text NOT NULL,mime text NOT NULL,size integer NOT NULL CHECK(size>0 AND size<=10485760),storage_name text UNIQUE NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS saved_requests(user_id uuid REFERENCES users(id) ON DELETE CASCADE,request_id uuid REFERENCES requests(id) ON DELETE CASCADE,PRIMARY KEY(user_id,request_id));
 CREATE TABLE IF NOT EXISTS transactions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES users(id),request_id uuid NOT NULL REFERENCES requests(id),kind text NOT NULL CHECK(kind IN('contribution','investment_interest')),
 amount_cents integer NOT NULL CHECK(amount_cents>0 AND amount_cents<=1000000000),currency text NOT NULL DEFAULT 'USD',status text NOT NULL CHECK(status IN('simulated','interest_recorded','checkout_creating','checkout_pending','test_paid','checkout_expired','test_failed')),
 mode text NOT NULL CHECK(mode IN('demo','stripe_test')),idempotency_key text NOT NULL,stripe_session_id text UNIQUE,checkout_url text,consent_version text NOT NULL DEFAULT '${LEGAL_VERSION}',consent_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,idempotency_key));
 CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions(user_id,created_at DESC);
 CREATE TABLE IF NOT EXISTS audit_log(id bigserial PRIMARY KEY,actor_id uuid REFERENCES users(id),action text NOT NULL,target_id uuid NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS stripe_events(id text PRIMARY KEY,type text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 `);
 if(seedDemo)await seed(c);
 });
 return pool;
}
async function seed(c){
 const definitions=[['Alexander Morgan','investor@billionairepay.local','BackerDemo!2026','backer','US'],['Amara N.','applicant@billionairepay.local','ApplicantDemo!2026','applicant','CM'],['Demo Administrator','admin@billionairepay.local','AdminDemo!2026','admin','US']];
 for(const [name,email,password,role,country] of definitions){const existing=await c.query('SELECT id FROM users WHERE email=$1',[email]);if(!existing.rowCount)await c.query('INSERT INTO users(name,email,password_hash,role,country,terms_version) VALUES($1,$2,$3,$4,$5,$6)',[name,email,await hashPassword(password),role,country,LEGAL_VERSION]);}
 const owner=(await c.query("SELECT id FROM users WHERE email='applicant@billionairepay.local'")).rows[0].id;
 const samples=[
 ['a0000000-0000-4000-8000-000000000001','bill','Keep a family’s lights on','A fictional family is seeking help with an electricity bill after a difficult month. Your demo contribution supports this sample request.','Utilities',42000,28500,'CM','Douala','Fictional Energy Services','photo-1484154218962-a197022b5858'],
 ['a0000000-0000-4000-8000-000000000002','bill','A semester of possibility','A fictional student needs support for tuition and learning materials to continue their education. This is sample data for testing.','Education',125000,65000,'GH','Accra','Fictional Community College','photo-1503676260728-1c00da094a0b'],
 ['a0000000-0000-4000-8000-000000000003','bill','Care that cannot wait','A fictional household is seeking support with essential medical treatment. No real patient information is included.','Healthcare',87000,32000,'KE','Nairobi','Fictional Community Clinic','photo-1576091160399-112ba8d25d1d'],
 ['a0000000-0000-4000-8000-000000000004','bill','A secure place to call home','A fictional parent needs help with one month of rent to keep a stable home for their children. A demonstration request only.','Housing',65000,18000,'ZA','Cape Town','Fictional Housing Cooperative','photo-1600585154340-be6161a56a0c'],
 ['a0000000-0000-4000-8000-000000000005','project','Solar power, shared prosperity','A fictional founder proposes neighborhood solar installations. Explore this sample opportunity and record nonbinding interest; no investment is accepted.','Clean Energy',2500000,0,'CM','Yaoundé','','photo-1509391366360-2e959784a276'],
 ['a0000000-0000-4000-8000-000000000006','project','Growing a better food future','A fictional farming cooperative proposes cold storage and local distribution. All project figures are illustrative and interest is nonbinding.','Agriculture',1800000,0,'RW','Kigali','','photo-1500382017468-9049fed747ef']
 ];
 for(const [id,kind,title,story,category,amount,funded,country,city,biller,image]of samples){await c.query(`INSERT INTO requests(id,owner_id,kind,title,story,category,amount_cents,funded_cents,country,city,biller_name,image,status,due_date,relationship,project_summary,terms,risk_disclosure) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'approved',CURRENT_DATE+21,'Fictional account holder',$13,$14,$15) ON CONFLICT(id) DO NOTHING`,[id,owner,kind,title,story,category,amount,funded,country,city,biller,`https://images.unsplash.com/${image}?auto=format&fit=crop&w=1200&q=80`,kind==='project'?story:'',kind==='project'?'Illustrative target only. No offer, return promise or ownership transfer.':'Demo ledger only. Biller payment has not occurred.',kind==='project'?'All capital may be lost. No guaranteed returns. No live investment or securities settlement is available.':'']);}
}
