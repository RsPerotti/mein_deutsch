/**
 * SERVICE WORKER — Mein Deutsch
 * Strategy: cache-first for all app assets.
 * v2: adds listening module files + audio Range request handling.
 * v3: QoL fixes (gesture nav, layout, exercise data cleanup).
 * v4: adds particles-data.js (Partikeln module — Session 29).
 * v5: Partikeln Phase 2+3 — module home UI + fill_blank_particle exercise engine.
 *
 * DEPLOY NOTE: bump the CACHE version string on every push that changes
 * JS/CSS files. The browser only installs a new SW when this file changes.
 * If the version is not bumped, users keep running the old cached code.
 */

const CACHE = 'mein-deutsch-v5';

const PRECACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/listening-data.js',
  './js/particles-data.js',
  './js/app.js',
  './js/progress.js',
  './js/exercises.js',
  './js/wordlist.js',
  './js/wordpractice.js',
  './js/listening.js',
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
  const url = event.request.url;
  const rangeHeader = event.request.headers.get('Range');

  // Audio Range request: serve from cache if available, else network
  if (rangeHeader && url.includes('/content/listening/') && url.endsWith('.mp3')) {
    event.respondWith(serveAudioRange(event.request, rangeHeader));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache data files and listening content on first network access
        const shouldCache =
          (url.includes('/data/') || url.includes('/content/listening/')) &&
          response.ok;
        if (shouldCache) {
          caches.open(CACHE).then(c => c.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => Response.error());
    })
  );
});

/**
 * Serve an audio range request from cache.
 * If the full file is cached, synthesise a correct 206 response by slicing the blob.
 * If not cached, fetch it — store the full response first, then slice.
 */
async function serveAudioRange(request, rangeHeader) {
  // Build a no-range request for cache lookup
  const fullRequest = new Request(request.url, { headers: {} });
  const cache = await caches.open(CACHE);
  let fullResponse = await cache.match(fullRequest);

  if (!fullResponse) {
    // Fetch and store full file
    try {
      const networkResp = await fetch(fullRequest);
      if (networkResp.ok) {
        await cache.put(fullRequest, networkResp.clone());
        fullResponse = networkResp;
      } else {
        return networkResp;
      }
    } catch {
      return Response.error();
    }
  }

  // Parse range header: bytes=START-[END]
  const [, rangeVal] = rangeHeader.split('=');
  const [startStr, endStr] = rangeVal.split('-');
  const blob  = await fullResponse.clone().blob();
  const start = parseInt(startStr, 10) || 0;
  const end   = endStr ? parseInt(endStr, 10) : blob.size - 1;
  const sliced = blob.slice(start, end + 1);

  return new Response(sliced, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range':  `bytes ${start}-${end}/${blob.size}`,
      'Content-Length': String(sliced.size),
      'Content-Type':   fullResponse.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges':  'bytes'
    }
  });
}
