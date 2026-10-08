import { getDeployStore, getStore } from '@netlify/blobs';
declare const Netlify: any;

function isProduction() {
  return Netlify?.context?.deploy?.context === 'production';
}

function persistentStore(name: string) {
  return isProduction()
    ? getStore(name, { consistency: 'strong' })
    : getDeployStore(name);
}

export function contentStore() {
  return persistentStore('empower-content');
}

export function mediaStore() {
  return persistentStore('empower-media');
}

export function requestsStore() {
  return persistentStore('empower-requests');
}
