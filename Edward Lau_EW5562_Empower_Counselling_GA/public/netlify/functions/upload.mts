import type { Config } from '@netlify/functions';
import { randomUUID } from 'node:crypto';
import { verifySession } from './_lib/auth.mts';
import { mediaStore } from './_lib/store.mts';

const allowed: Record<string,string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  if (!verifySession(req)) return Response.json({ error: 'Your session has expired. Please sign in again.' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Please select an image file.' }, { status: 400 });
  const ext = allowed[file.type];
  if (!ext) return Response.json({ error: 'Only JPG, PNG, WEBP or GIF images are supported.' }, { status: 415 });
  if (file.size > 6 * 1024 * 1024) return Response.json({ error: 'Images must not exceed 6 MB.' }, { status: 413 });
  const key = `${randomUUID()}.${ext}`;
  await mediaStore().set(key, await file.arrayBuffer());
  return Response.json({ key, url: `/api/media/${key}` }, { headers: { 'Cache-Control': 'no-store' } });
};

export const config: Config = { path: '/api/admin/upload' };
