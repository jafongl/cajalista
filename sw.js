// ══════════════════════════════════════════════════
//  CajaLista — Service Worker v3
//  Auto-actualiza a todos los usuarios al detectar
//  una nueva versión del app
// ══════════════════════════════════════════════════

const CACHE_NAME = 'cajalista-v3';
const FILES = ['/', '/index.html', '/manifest.json', '/env.js'];

// ── INSTALL: guarda archivos en caché ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting()) // activa inmediatamente sin esperar
  );
});

// ── ACTIVATE: borra cachés viejas y toma control ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // toma control de todas las tabs abiertas
  );
});

// ── FETCH: red primero, caché como respaldo ──
self.addEventListener('fetch', event => {
  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('fonts.google')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request)
          .then(cached => cached || caches.match('/index.html'))
      )
  );
});

// ── MENSAJE: fuerza actualización cuando el cliente lo pide ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
