// Service Worker — Partidas Pro PWA
const CACHE = 'partidas-pro-v2';

// ── WEB PUSH ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: 'Partidas Pro', body: event.data ? event.data.text() : '' }; }

  const title = payload.title || 'Partidas Pro';
  const options = {
    body: payload.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag || 'match-update',
    renotify: true,
    data: { url: payload.url || '/dashboard' },
    vibrate: [80, 40, 80],
  };

  event.waitUntil((async () => {
    // Se já existe uma aba aberta e visível, deixa o popup in-app cuidar (evita duplicar)
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = clientsArr.some((c) => c.visibilityState === 'visible');
    if (visible) return;
    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clientsArr.find((c) => c.url.includes(url));
    if (existing) { existing.focus(); return; }
    if (clientsArr[0]) { clientsArr[0].focus(); clientsArr[0].navigate(url); return; }
    await self.clients.openWindow(url);
  })());
});

const APP_SHELL = ['/', '/dashboard', '/icon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Só GET, mesma origem (nunca interceptar Supabase / POST)
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: network-first com fallback ao cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Estáticos: cache-first
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached)
    )
  );
});
