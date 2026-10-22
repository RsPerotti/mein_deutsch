/**
 * SERVICE WORKER — Mein Deutsch
 * Strategy: cache-first for all app assets.
 * v2: adds listening module files + audio Range request handling.
 * v3: QoL fixes (gesture nav, layout, exercise data cleanup).
 * v4: adds particles-data.js (Partikeln module — Session 29).
 * v5: Partikeln Phase 2+3 — module home UI + fill_blank_particle exercise engine.
 * v6: Partikeln Phase 4+5 — grammar lessons, soft gate, Alle Partikeln reference screen.
 * v7: Partikeln Phase 6 — content review pass (eben/halt, ohnehin/sowieso, schon/wohl integrity fixes).
 * v8: Grammatik curriculum Phases 3–4 — quiz engine, MC question renderer, pass/fail results, unlock gating on Verbs module home.
 * v9: Artikel module — 6 grammar lessons, Der/Die/Das exercise engine, article-grammar-data.js.
 * v10: Fix — data.js modules array updated to include Partikeln + Artikel (was missing from bundle).
 * v11: 7 bug fixes — Artikel cooldown, chevrons removed, Partikel cards simplified, CEFR selector
 *      removed, soft gate removed, Alle Partikeln button removed, particle list design + click fixed.
 * v12: Wörter Intake #1 + Ausdrücke module (Session 35).
 * v13: Deklinationen area (Session 36) — 5 lessons, 360 type_ending exercises, declension-data.js.
 * v14: Vorsilben module (Session 37) — 10th module. 35 verb prefixes, 5 lessons,
 *      330 select_prefix/select_feeling exercises, prefixes-data.js.
 * v15: Vorsilben fixes (Session 38) — progress recording, misfiled-quiz migration,
 *      semantic-overlap distractor rule.
 * v16: Vorsilben ↔ Verbs reconciliation (Session 38) — +133 prefix_variants,
 *      +1064 verb exercises, per-variant grammar override (verstehen case badge),
 *      js/data.js rebundled from data/*.json via _factory/bundle-data.py.
 * v17: Variant verification (Session 39) — durchgehen corrected to separable + sein,
 *      5 dual-reading glosses pinned to one reading, dictionary scaffolding stripped
 *      from English prompts. js/data.js rebundled.
 * v18: Wechselpräfix pairs (Session 39) — Lesson 5 now lists all 11 dual-reading
 *      verbs with both readings, generated from the Wiktionary cache. New "pairs"
 *      section renderer in grammar.js + CSS. Fixed the Lesson 5 überlaufen example,
 *      which contradicted the rule it was illustrating.
 * v19: Spaced repetition Phase 1 (Session 40) — js/srs.js binary SM-2 scheduler,
 *      app_srs store, all 8 grade sites funnelled through _recordAnswer, Artikel
 *      result recording fixed (recorded nothing since it shipped), one-shot
 *      backfill from app_exercise_history staggered over 14 days. No UI yet.
 * v20: Spaced repetition Phase 2 (Session 40) — Wiederholung home card and the
 *      cross-module review session. js/review.js builds one mixed due queue and
 *      hands it to the Main engine rather than duplicating its renderers; the
 *      engine gains a reviewMode branch in four places. Main-engine items only
 *      (verbs, nouns, adverbs, adjectives, prepositions, particles, expressions)
 *      — Deklination, Vorsilben and Artikel join in Phase 3.
 * v21: Spaced repetition Phase 3 (Session 40) — all four engines serve review.
 *      Review owns the queue, counters, requeue-on-miss and HUD; each engine is
 *      handed one item at a time and hands control back. Deklination, Vorsilben
 *      and Artikel items now appear in the Wiederholung queue.
 *
 * DEPLOY NOTE: bump the CACHE version string on every push that changes
 * JS/CSS files. The browser only installs a new SW when this file changes.
 * If the version is not bumped, users keep running the old cached code.
 */

const CACHE = 'mein-deutsch-v23';

const PRECACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/listening-data.js',
  './js/particles-data.js',
  './js/prefixes-data.js',
  './js/grammar-data.js',
  './js/article-grammar-data.js',
  './js/declension-data.js',
  './js/grammar.js',
  './js/app.js',
  './js/progress.js',
  './js/srs.js',
  './js/review.js',
  './js/scales.js',
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
