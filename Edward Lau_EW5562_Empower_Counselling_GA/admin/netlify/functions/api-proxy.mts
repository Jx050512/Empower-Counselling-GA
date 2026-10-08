import type { Config } from '@netlify/functions';

declare const Netlify: any;


function publicOrigin() {
  const configured = String(
    Netlify.env.get('PUBLIC_API_ORIGIN') || ''
  ).trim();

  return configured.replace(/\/$/, '');
}

function getTargetPath(req: Request) {
  const incoming = new URL(req.url);

  const path = String(
    incoming.searchParams.get('path') || '/api/health'
  ).trim();

  if (!path.startsWith('/api/')) {
    throw new Error('Invalid API path');
  }

  return path;
}

function upstreamHeaders(req: Request) {
  const headers = new Headers();

  const accept = req.headers.get('accept');
  const contentType = req.headers.get('content-type');
  const authorization = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');

  if (accept) headers.set('accept', accept);
  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);
  if (cookie) headers.set('cookie', cookie);

  headers.set('cache-control', 'no-store');

  return headers;
}

export default async (req: Request) => {
  let path = '/api/health';

  try {
    path = getTargetPath(req);
  } catch {
    return Response.json(
      { error: 'Invalid API path.' },
      { status: 400 }
    );
  }

  const origin = publicOrigin();
  if (!origin) {
    return Response.json(
      { error: 'PUBLIC_API_ORIGIN is not configured for this GA Admin site.', code: 'PUBLIC_API_ORIGIN_MISSING' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const target = `${origin}${path}`;

  const init: RequestInit = {
    method: req.method,
    headers: upstreamHeaders(req),
    redirect: 'manual'
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();

    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }

    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    responseHeaders.set('cache-control', 'no-store');
    responseHeaders.set('x-empower-api-origin', origin);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('[api-proxy]', {
      target,
      method: req.method,
      error
    });

    return Response.json(
      {
        error: 'The Admin site cannot currently connect to the configured Public site API.',
        code: 'PUBLIC_API_PROXY_FAILED'
      },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
};

export const config: Config = {};
