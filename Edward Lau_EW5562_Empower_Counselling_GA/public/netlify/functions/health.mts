import type { Config } from '@netlify/functions';
import { credentialsConfigured } from './_lib/auth.mts';

export default async () => Response.json({
  ok: true,
  service: 'Empower Website Service',
  authConfigured: credentialsConfigured(),
  requestStorage: 'netlify-blobs'
}, { headers: { 'Cache-Control': 'no-store' } });

export const config: Config = { path: '/api/health' };
