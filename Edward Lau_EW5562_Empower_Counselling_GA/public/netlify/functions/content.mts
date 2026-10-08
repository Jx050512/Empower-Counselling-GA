import type { Config } from '@netlify/functions';
import { publicContent, readFullContent } from './_lib/content.mts';

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const content = publicContent(await readFullContent());
  return Response.json(content, {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};

export const config: Config = { path: '/api/content' };
