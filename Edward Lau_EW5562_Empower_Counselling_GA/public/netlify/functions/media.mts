import type { Config } from '@netlify/functions';
import { mediaStore } from './_lib/store.mts';

const typeFor = (key: string) => key.endsWith('.png') ? 'image/png' : key.endsWith('.webp') ? 'image/webp' : key.endsWith('.gif') ? 'image/gif' : 'image/jpeg';

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const pathname = new URL(req.url).pathname;
  const key = decodeURIComponent(pathname.replace(/^\/api\/media\//, ''));
  if (!/^[a-f0-9-]{20,}\.(jpg|png|webp|gif)$/i.test(key)) return new Response('Not Found', { status: 404 });
  const data = await mediaStore().get(key, { type: 'arrayBuffer' });
  if (!data) return new Response('Not Found', { status: 404 });
  return new Response(data, {
    headers: {
      'Content-Type': typeFor(key),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};

export const config: Config = { path: '/api/media/*' };
