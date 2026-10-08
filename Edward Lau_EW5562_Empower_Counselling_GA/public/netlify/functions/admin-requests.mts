import type { Config } from '@netlify/functions';
import { verifySession } from './_lib/auth.mts';
import { deleteStoredRequest, listStoredRequests, updateStoredRequest, type RequestKind } from './_lib/requests.mts';

const appointmentStatuses = new Set(['pending','confirmed','completed','cancelled']);
const enquiryStatuses = new Set(['new','in_progress','resolved']);
const idOk = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function json(data: any, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function kindFrom(type: string): RequestKind | null {
  if (type === 'appointment' || type === 'enquiry') return type;
  return null;
}

export default async (req: Request) => {
  if (!verifySession(req)) return json({ error: 'Your session has expired. Please sign in again.' }, 401);

  try {
    if (req.method === 'GET') {
      const [appointments, enquiries] = await Promise.all([
        listStoredRequests('appointment', 300),
        listStoredRequests('enquiry', 300)
      ]);
      return json({ storage: 'netlify-blobs', appointments, enquiries });
    }

    if (req.method === 'PATCH') {
      const body: any = await req.json().catch(() => ({}));
      const type = String(body?.type || '');
      const id = String(body?.id || '');
      const status = String(body?.status || '');
      const kind = kindFrom(type);
      if (!kind) return json({ error: 'Invalid record type.' }, 400);
      if (!idOk(id)) return json({ error: 'Invalid record ID.' }, 400);
      if (kind === 'appointment' && !appointmentStatuses.has(status)) return json({ error: 'Invalid appointment status.' }, 400);
      if (kind === 'enquiry' && !enquiryStatuses.has(status)) return json({ error: 'Invalid enquiry status.' }, 400);

      const item = await updateStoredRequest(kind, id, { status });
      if (!item) return json({ error: 'This record could not be found and may have been deleted.' }, 404);
      return json({ ok: true, item });
    }

    if (req.method === 'DELETE') {
      const u = new URL(req.url);
      const type = u.searchParams.get('type') || '';
      const id = u.searchParams.get('id') || '';
      const kind = kindFrom(type);
      if (!kind) return json({ error: 'Invalid record type.' }, 400);
      if (!idOk(id)) return json({ error: 'Invalid record ID.' }, 400);
      await deleteStoredRequest(kind, id);
      return json({ ok: true });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (error: any) {
    console.error('[admin-requests]', error);
    return json({ error: 'Bookings and enquiries are temporarily unavailable. Please try again later.' }, 500);
  }
};

export const config: Config = { path: '/api/admin/requests' };
