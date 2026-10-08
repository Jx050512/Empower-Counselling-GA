import type { Config } from '@netlify/functions';
import { verifySession } from './_lib/auth.mts';
import { mediaStore } from './_lib/store.mts';

export default async (req: Request) => {
  if (!verifySession(req)) return Response.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  const store = mediaStore();
  if (req.method === 'GET') {
    const result: any = await store.list();
    const items = (result.blobs || []).map((x: any) => ({ key: x.key, url: `/api/media/${encodeURIComponent(x.key)}` }));
    return Response.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (req.method === 'DELETE') {
    const key = new URL(req.url).searchParams.get('key') || '';
    if (!/^[a-f0-9-]{20,}\.(jpg|png|webp|gif)$/i.test(key)) return Response.json({ error: 'Invalid image.' }, { status: 400 });
    await store.delete(key);
    return Response.json({ ok: true });
  }
  return new Response('Method Not Allowed', { status: 405 });
};

export const config: Config = { path: '/api/admin/media' };
