const CACHE = 'protocols-2026.09.15-81c37998'; // set by tools/release.py
const FILES = ['./', 'index.html', 'data.json', 'pdf.min.js', 'pdf.worker.min.js', 'manifest.webmanifest', 'changes.json', 'peds.json', 'comms.json', 'calc.js', 'tracker.js', 'fonts/atkinson-400.woff2', 'fonts/atkinson-700.woff2', 'icon.svg', 'icon-180.png', 'icon-512.png', 'guidelines.pdf'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll()).then(cs => cs.forEach(c => c.postMessage('cached'))));
});
// The page and its small data files are network-first (3 s timeout, then cache) so a refresh
// always shows the latest deploy when online. The big PDF and pdf.js stay cache-first.
const FRESH = /(\/|index\.html|data\.json|changes\.json|peds\.json|comms\.json|calc\.js|tracker\.js|manifest\.webmanifest)$/;
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const key = url.pathname.endsWith('/') ? './' : e.request;
  if (e.request.mode === 'navigate' || FRESH.test(url.pathname)){
    e.respondWith(caches.open(CACHE).then(c => {
      const net = fetch(e.request, {cache: 'no-cache'}).then(r => { if (r.ok) c.put(key, r.clone()); return r; });
      const timeout = new Promise((_, rej) => setTimeout(rej, 3000));
      return Promise.race([net, timeout]).catch(() => c.match(key, {ignoreSearch: true}).then(r => r || net));
    }));
    return;
  }
  // Cache first; ignore Range headers so the PDF is always served whole from cache.
  e.respondWith(caches.open(CACHE).then(c => c.match(key, {ignoreSearch: true}).then(r => r || fetch(e.request))));
});
