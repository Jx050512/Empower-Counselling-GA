import { contentStore } from './store.mts';
import { defaultContent } from './default-content.mts';

export async function readFullContent() {
  const store = contentStore();
  const saved: any = await store.get('site-content', { type: 'json' });
  if (!saved) return defaultContent;
  return {
    ...defaultContent,
    ...saved,
    settings: { ...defaultContent.settings, ...(saved.settings || {}) },
    counsellor: { ...defaultContent.counsellor, ...(saved.counsellor || {}) },
    homeGuide: {
      ...defaultContent.homeGuide,
      ...(saved.homeGuide || {}),
      items: Array.isArray(saved.homeGuide?.items) ? saved.homeGuide.items : defaultContent.homeGuide.items
    },
    services: Array.isArray(saved.services) ? saved.services : defaultContent.services,
    programs: Array.isArray(saved.programs) ? saved.programs : defaultContent.programs,
    videos: Array.isArray(saved.videos) ? saved.videos : defaultContent.videos
  };
}

export async function writeFullContent(value: any) {
  const store = contentStore();
  const next = {
    ...value,
    version: Number(value?.version || 1),
    updatedAt: new Date().toISOString()
  };
  await store.setJSON('site-content', next);
  return next;
}

export function publicContent(value: any) {
  return {
    version: value?.version || 1,
    updatedAt: value?.updatedAt || '',
    settings: value?.settings || {},
    counsellor: value?.counsellor || {},
    homeGuide: value?.homeGuide || {},
    services: (value?.services || []).filter((x: any) => x?.active !== false).sort((a:any,b:any)=>(a.order||0)-(b.order||0)),
    programs: (value?.programs || []).filter((x: any) => x?.published !== false).sort((a:any,b:any)=>String(b.startDate||'').localeCompare(String(a.startDate||''))),
    videos: (value?.videos || []).filter((x: any) => x?.active !== false).sort((a:any,b:any)=>(a.order||0)-(b.order||0))
  };
}
