import { randomUUID } from 'node:crypto';
import { requestsStore } from './store.mts';

export type RequestKind = 'appointment' | 'enquiry';

function keyFor(kind: RequestKind, id: string) {
  return `${kind}/${id}`;
}

export async function createStoredRequest(kind: RequestKind, value: Record<string, any>) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const item = {
    id,
    ...value,
    created_at: now,
    updated_at: now
  };
  await requestsStore().setJSON(keyFor(kind, id), item);
  return item;
}

export async function readStoredRequest(kind: RequestKind, id: string) {
  return await requestsStore().get(keyFor(kind, id), { type: 'json' });
}

export async function listStoredRequests(kind: RequestKind, limit = 300) {
  const store = requestsStore();
  const result: any = await store.list({ prefix: `${kind}/` });
  const keys = (result?.blobs || []).map((entry: any) => String(entry.key || '')).filter(Boolean);
  const rows = (await Promise.all(keys.map((key: string) => store.get(key, { type: 'json' })))).filter(Boolean);
  rows.sort((a: any, b: any) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')));
  return rows.slice(0, Math.max(1, limit));
}

export async function updateStoredRequest(kind: RequestKind, id: string, patch: Record<string, any>) {
  const store = requestsStore();
  const key = keyFor(kind, id);
  const current: any = await store.get(key, { type: 'json' });
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id || id, updated_at: new Date().toISOString() };
  await store.setJSON(key, next);
  return next;
}

export async function deleteStoredRequest(kind: RequestKind, id: string) {
  await requestsStore().delete(keyFor(kind, id));
}
