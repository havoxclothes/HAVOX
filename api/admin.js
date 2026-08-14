import { neon } from '@neondatabase/serverless';
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

const sql = neon(process.env.DATABASE_URL);
const secret = process.env.HAVOX_AUTH_SECRET;
const ownerUsername = process.env.HAVOX_OWNER_USERNAME;
const ownerPassword = process.env.HAVOX_OWNER_PASSWORD;

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
function b64url(value) { return Buffer.from(value).toString('base64url'); }
function sign(value) { return createHmac('sha256', secret || '').update(value).digest('base64url'); }
function makeToken(user) {
  const payload = b64url(JSON.stringify({ id: user.id, username: user.username, role: user.role, exp: Date.now() + 8 * 60 * 60 * 1000 }));
  return `${payload}.${sign(payload)}`;
}
function auth(req) {
  if (!secret) throw new Error('HAVOX_AUTH_SECRET is not configured');
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature !== sign(payload)) return null;
  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return user.exp > Date.now() ? user : null;
  } catch { return null; }
}

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS havox_admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner','admin')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
}
async function ensureOwner() {
  if (!ownerUsername || !ownerPassword) return;
  const rows = await sql`SELECT id FROM havox_admins LIMIT 1`;
  if (rows.length) return;
  await sql`INSERT INTO havox_admins (username,password_hash,role) VALUES (${ownerUsername.trim()},${hashPassword(ownerPassword)},'owner') ON CONFLICT (username) DO NOTHING`;
}

export default async function handler(req, res) {
  try {
    await ensureTable();
    await ensureOwner();

    if (req.method === 'POST' && req.body?.action === 'login') {
      const username = String(req.body.username || '').trim();
      const password = String(req.body.password || '');
      if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
      const rows = await sql`SELECT id, username, password_hash, role FROM havox_admins WHERE LOWER(username)=LOWER(${username}) AND active=true LIMIT 1`;
      const user = rows[0];
      if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid username or password' });
      return res.status(200).json({ ok: true, token: makeToken(user), user: { id: user.id, username: user.username, role: user.role } });
    }

    const user = auth(req);
    if (!user) return res.status(401).json({ error: 'Admin login required' });

    if (req.method === 'GET') {
      const admins = await sql`SELECT id, username, role, active, created_at FROM havox_admins ORDER BY role DESC, created_at ASC`;
      return res.status(200).json({ ok: true, user, admins });
    }

    if (req.method === 'POST' && req.body?.action === 'create') {
      if (user.role !== 'owner') return res.status(403).json({ error: 'Only the owner can create co-admins' });
      const username = String(req.body.username || '').trim();
      const password = String(req.body.password || '');
      if (!username || password.length < 8) return res.status(400).json({ error: 'Username and password (minimum 8 characters) are required' });
      const [created] = await sql`INSERT INTO havox_admins (username,password_hash,role) VALUES (${username},${hashPassword(password)},'admin') RETURNING id, username, role, active, created_at`;
      return res.status(201).json({ ok: true, admin: created });
    }

    if (req.method === 'POST' && req.body?.action === 'disable') {
      if (user.role !== 'owner') return res.status(403).json({ error: 'Only the owner can disable co-admins' });
      const id = Number(req.body.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid admin id' });
      await sql`UPDATE havox_admins SET active=false WHERE id=${id} AND role='admin'`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(409).json({ error: error.message || 'Admin operation failed' });
  }
}
