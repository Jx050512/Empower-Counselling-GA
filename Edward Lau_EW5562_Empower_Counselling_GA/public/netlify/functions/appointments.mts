import type { Config } from '@netlify/functions';
import { readFullContent } from './_lib/content.mts';
import { createStoredRequest } from './_lib/requests.mts';

const clean = (v: any, max = 500) => String(v || '').trim().slice(0, max);
const emailOk = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v: string) => /^[+()\-\s\d]{7,24}$/.test(v);

function bad(error: string, status = 400) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return bad('Invalid request format.'); }
  if (clean(body?.company, 100)) return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });

  const fullName = clean(body?.fullName, 100);
  const email = clean(body?.email, 180).toLowerCase();
  const phone = clean(body?.phone, 40);
  const inquiryType = clean(body?.inquiryType, 80) || 'First-time Enquiry';
  const serviceId = clean(body?.serviceId, 100);
  const serviceLabel = clean(body?.serviceLabel, 180);
  const preferredDate = clean(body?.preferredDate, 10);
  const preferredTime = clean(body?.preferredTime, 120);
  const note = clean(body?.note, 1200);

  if (fullName.length < 2) return bad('Please enter your name.');
  if (!phoneOk(phone)) return bad('Please enter a valid phone number.');
  if (!emailOk(email)) return bad('Please enter a valid email address.');
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return bad('Invalid date format.');

  try {
    const content = await readFullContent();
    const service = (content.services || []).find((x: any) => String(x.id) === serviceId);
    const safeServiceId = service ? String(service.id) : null;
    const safeServiceLabel = service ? String(service.title) : (serviceLabel || 'Other Enquiry');

    const row = await createStoredRequest('appointment', {
      full_name: fullName,
      email: email || null,
      phone,
      inquiry_type: inquiryType,
      service_id: safeServiceId,
      service_label: safeServiceLabel,
      preferred_date: preferredDate || null,
      preferred_time: preferredTime || null,
      note: note || null,
      status: 'pending'
    });

    return Response.json(
      { ok: true, id: row.id, status: row.status },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('[appointments]', error);
    return bad('The booking request could not be submitted. Please contact Empower through WhatsApp.', 500);
  }
};

export const config: Config = { path: '/api/appointments' };
