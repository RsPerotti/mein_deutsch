/**
 * SERVICE WORKER — Mein Deutsch
 * Strategy: cache-first for all app assets.
 * Data files (/data/) are cached on first load and updated in background.
 */

const CACHE = 'mein-deutsch-v1';

const PRECACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/app.js',
  './js/progress.js',
  './js/exercises.js',
  './js/wordlist.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// --- Install: pre-cache all app files ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// --- Activate: remove old caches ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// --- Fetch: cache-first, network fallback ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache data files on first network access
        if (event.request.url.includes('/data/') && response.ok) {
          caches.open(CACHE).then(c => c.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
