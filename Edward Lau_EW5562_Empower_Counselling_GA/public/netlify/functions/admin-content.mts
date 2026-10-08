import type { Config } from '@netlify/functions';
import { readFullContent, writeFullContent } from './_lib/content.mts';
import { verifySession } from './_lib/auth.mts';

function unauthorized() {
  return Response.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
}

export default async (req: Request) => {
  if (!verifySession(req)) return unauthorized();
  if (req.method === 'GET') {
    return Response.json(await readFullContent(), { headers: { 'Cache-Control': 'no-store' } });
  }
  if (req.method === 'PUT') {
    const raw = await req.text();
    if (raw.length > 2_000_000) return Response.json({ error: 'The submitted data is too large.' }, { status: 413 });
    let body: any;
    try { body = JSON.parse(raw); } catch { return Response.json({ error: 'Invalid JSON format.' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || !body.settings || !body.counsellor) {
      return Response.json({ error: 'The website content format is incomplete.' }, { status: 400 });
    }
    const saved = await writeFullContent(body);
    return Response.json({ ok: true, content: saved }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return new Response('Method Not Allowed', { status: 405 });
};

export const config: Config = { path: '/api/admin/content' };
