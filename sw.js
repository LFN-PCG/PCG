const CACHE = 'protocols-2026.09.15-39381fdd'; // set by tools/release.py
const FILES = ['./', 'index.html', 'data.json', 'pdf.min.js', 'pdf.worker.min.js', 'manifest.webmanifest', 'changes.json', 'peds.json', 'fonts/atkinson-400.woff2', 'fonts/atkinson-700.woff2', 'icon.svg', 'icon-180.png', 'icon-512.png', 'guidelines.pdf'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll()).then(cs => cs.forEach(c => c.postMessage('cached'))));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // Cache first; ignore Range headers so the PDF is always served whole from cache.
  e.respondWith(caches.open(CACHE).then(c => c.match(url.pathname.endsWith('/') ? './' : e.request, {ignoreSearch: true}).then(r => r || fetch(e.request))));
});
