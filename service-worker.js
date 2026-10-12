/**
 * OPERAÇÃO DESTINAÇÃO FINAL — PWA SERVICE WORKER
 * Versão v20.0.0 — Resiliência Total Standalone & PWABuilder 100%
 */

const VERSION = 'v20.0.0';
const CACHE_NAME = `destinacao-final-${VERSION}`;

const CORE_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  'assets/icon-192.png',
  'asset/icon-192.png',
  'assets/icon-512.png',
  'asset/icon-512.png',
  'assets/logo-entalpia.png',
  'asset/logo-entalpia.png',
  'assets/banner.jpg',
  'asset/banner.jpg',
  'assets/watermark.jpg',
  'asset/watermark.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_RESOURCES.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response && response.status === 200) {
              await cache.put(url, response);
            }
          } catch (_) {}
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!request.url.startsWith('http')) return;
  if (request.method !== 'GET') return;

  // Tratamento da inicialização e navegação do App (evita tela branca/erro)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request, { ignoreSearch: true })
            || await cache.match('./index.html')
            || await cache.match('index.html')
            || await cache.match('./');
          return cached;
        })
    );
    return;
  }

  // Recursos estáticos (imagens, ícones, fontes, scripts)
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});