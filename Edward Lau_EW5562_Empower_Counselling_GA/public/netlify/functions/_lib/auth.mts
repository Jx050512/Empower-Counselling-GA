import { createHmac, timingSafeEqual } from 'node:crypto';
declare const Netlify: any;

const enc = (v: string) => Buffer.from(v).toString('base64url');
const dec = (v: string) => Buffer.from(v, 'base64url').toString('utf8');

function env(name: string) {
  return String(Netlify.env.get(name) || '');
}

function secret() {
  return env('SESSION_SECRET').trim();
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function credentialsConfigured() {
  return Boolean(env('ADMIN_EMAIL').trim() && env('ADMIN_PASSWORD') && secret());
}

export function validateCredentials(email: string, password: string) {
  const expectedEmail = env('ADMIN_EMAIL').trim().toLowerCase();
  const expectedPassword = env('ADMIN_PASSWORD');
  return safeEqual(email.trim().toLowerCase(), expectedEmail) && safeEqual(password, expectedPassword);
}

export function createSession(email: string, hours = 8) {
  const payload = { sub: email.trim().toLowerCase(), exp: Math.floor(Date.now() / 1000) + hours * 3600 };
  const body = enc(JSON.stringify(payload));
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(req: Request) {
  const raw = req.headers.get('authorization') || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  if (!token || !secret()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(dec(body));
    if (!payload?.sub || !payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
