import type { Config } from '@netlify/functions';
import { createStoredRequest } from './_lib/requests.mts';

const clean = (v: any, max = 500) => String(v || '').trim().slice(0, max);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v: string) => !v || /^[+()\-\s\d]{7,24}$/.test(v);
const bad = (error: string, status = 400) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return bad('Invalid request format.'); }
  if (clean(body?.company, 100)) return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });

  const name = clean(body?.name, 100);
  const email = clean(body?.email, 180).toLowerCase();
  const phone = clean(body?.phone, 40);
  const subject = clean(body?.subject, 160);
  const message = clean(body?.message, 1500);
  if (name.length < 2) return bad('Please enter your name.');
  if (!emailOk(email)) return bad('Please enter a valid email address.');
  if (!phoneOk(phone)) return bad('Invalid phone number format.');
  if (subject.length < 2) return bad('Please enter a subject.');
  if (message.length < 5) return bad('Please enter your message.');

  try {
    const row = await createStoredRequest('enquiry', {
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: 'new'
    });
    return Response.json(
      { ok: true, id: row.id, status: row.status },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('[enquiries]', error);
    return bad('The enquiry could not be submitted. Please contact Empower through WhatsApp.', 500);
  }
};

export const config: Config = { path: '/api/enquiries' };
