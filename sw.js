/* Grabucket — Service Worker v2 */
const CACHE = 'grabucket-v2';
const SHELL = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Don't cache AdSense or external scripts
  if (url.hostname !== self.location.hostname) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(req) || await cache.match('/');
        return cached || new Response('Grabucket is offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })
  );
});
