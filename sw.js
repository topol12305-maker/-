const VERSION = '1.0.1';                 // ← бампай при каждом релизе вместе с APP_VERSION
const CACHE   = 'kubiya-' + VERSION;
const ASSETS  = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  // skipWaiting() НЕ вызываем — ждём подтверждения игрока
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // чужие домены не трогаем

  // version.json — всегда из сети, кэш только как запасной
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith((async () => {
      try {
        const r = await fetch(req, { cache: 'no-store' });
        const c = await caches.open(CACHE);
        c.put(req, r.clone());
        return r;
      } catch (_) {
        return (await caches.match(req)) ||
               new Response('{"version":"0.0.0"}', { headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  // навигация — сеть, офлайн — из кэша
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await fetch(req); }
      catch (_) { return (await caches.match('./index.html')) || (await caches.match('./')); }
    })());
    return;
  }

  // остальное — cache-first + тихое обновление в фоне
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const net = fetch(req).then(r => {
      if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => null);
    return cached || (await net) || new Response('', { status: 504 });
  })());
});
