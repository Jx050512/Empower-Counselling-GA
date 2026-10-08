import type { Config } from '@netlify/functions';
import { createSession, credentialsConfigured, validateCredentials } from './_lib/auth.mts';

function json(data: any, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async (req: Request) => {
  if (req.method === 'GET') {
    return json({ ok: true, authConfigured: credentialsConfigured() });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  if (!credentialsConfigured()) {
    return json({
      error: 'The admin account is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET in the Public site environment variables.',
      code: 'AUTH_NOT_CONFIGURED'
    }, 503);
  }

  let body: any = {};
  try {
    const type = req.headers.get('content-type') || '';
    if (type.includes('application/json')) body = await req.json();
    else if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } else {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    }
  } catch {
    return json({ error: 'Invalid sign-in request. Refresh the page and try again.', code: 'INVALID_LOGIN_REQUEST' }, 400);
  }

  const email = String(body?.email || '').trim();
  const password = String(body?.password || '');
  if (!email || !password) return json({ error: 'Enter your email and password.', code: 'MISSING_CREDENTIALS' }, 400);

  if (!validateCredentials(email, password)) {
    return json({ error: 'Incorrect email or password.', code: 'INVALID_CREDENTIALS' }, 401);
  }

  return json({ token: createSession(email), expiresIn: 28800, email: email.toLowerCase() });
};

export const config: Config = { path: '/api/auth/login' };
