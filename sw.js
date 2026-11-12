// Keeps the app's own page on the device so it opens without internet; downloaded
// recitations are stored by the page itself (cache "qs-audio") and are not touched here.
const SHELL = 'qs-shell-v1';
const PRECACHE = ['./', 'index.html', 'manifest.json', 'icon-192.png',
  'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('qs-shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const page = req.mode === 'navigate';
  const own = url.origin === location.origin;
  const lib = url.href.startsWith('https://cdnjs.cloudflare.com/');
  if (!page && !own && !lib) return;            // streams, audio, APIs: straight to the network
  if (req.headers.has('range')) return;
  // the network first, so the site is always current; the saved copy when offline
  e.respondWith((async () => {
    const key = page ? new URL('index.html', self.registration.scope).href : req;
    try {
      const r = await fetch(req);
      if (r.ok && (r.type === 'basic' || r.type === 'cors')) {
        const copy = r.clone();
        caches.open(SHELL).then(c => c.put(key, copy)).catch(() => {});
      }
      return r;
    } catch (err) {
      const hit = await caches.match(key, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
