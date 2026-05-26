// ─── NeuroLearn Service Worker ────────────────────────────────────────────────
// Handles caching and offline support for PWA installation

const CACHE_NAME = 'neurolearn-v3';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
// Strategy: Network First with Cache Fallback
// - Always try the network first for fresh content
// - Fall back to cache if network is unavailable (offline)
// - Cache successful network responses for future offline use

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (Elata rPPG WASM, external APIs)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache a copy of successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — try the cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // If even the cache has nothing, return the cached index.html
          // so the app shell loads and shows a meaningful offline state
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }

          // Nothing available
          return new Response('Offline — content not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// ── Background Sync (future-ready) ────────────────────────────────────────────
// When Supabase integration is added (leaderboard phase),
// this will sync offline quiz results when connection is restored.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leaderboard') {
    // Placeholder for future Supabase sync logic
    console.log('[NeuroLearn SW] Background sync: leaderboard');
  }
});