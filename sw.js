// sw.js — the page works offline after one visit: it keeps its own files (the page, the kernels, the records) and
// serves them when there is no network. It fetches nothing else and sends nothing anywhere.
const CACHE = 'pattern-libraries-v2';
const FILES = ['./', 'index.html', 'app.mjs', 'src/extract.mjs', 'src/cycle.mjs', 'src/build.mjs', 'src/value.mjs', 'src/oauth.mjs', 'src/night.mjs',
  'vendor/patlib/patlib.mjs', 'vendor/mint/src/baseline.mjs', 'vendor/mint/src/experiment.mjs', 'vendor/mint/src/journal.mjs', 'vendor/mint/vendor/fall-kit/light/sha256.mjs',
  'vendor/spendwall/src/wall.mjs', 'vendor/spendwall/vendor/wallet/wallet.mjs', 'data/doc/summary.json', 'data/doc/state.json', 'data/libraries.json', 'data/witness.json', 'data/prices.json',
  'src/finance.mjs', 'data/finance/summary.json', 'data/finance/state.json'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
// the network first (so the records stay fresh), the kept copy when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
