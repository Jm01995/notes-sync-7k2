/* Away app service worker: caches the app SHELL only (public code). It never touches latest.enc / market.enc / live.enc /
   manifest.json / any cross-origin request: the last good snapshot is kept by the page as CIPHERTEXT and re-verified on every start.
   live.enc (the executor file under its OWN key, 11-20) is listed explicitly so a future same-origin relay can never be cached here. */
const VER = 'e486c7de4479';
const SHELL = 'away-shell-' + VER;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
// cache:'reload' bypasses the HTTP cache (GitHub Pages sends max-age=600): a new worker never caches a stale index.html
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => Promise.all(FILES.map(f => fetch(f, {cache: 'reload'}).then(r => { if (!r.ok) throw new Error(f); return c.put(f, r); })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || /latest\.enc$|market\.enc$|live\.enc$|manifest\.json$/.test(u.pathname)) return;
  e.respondWith(caches.match(r, {ignoreSearch: true}).then(m => m || fetch(r)));
});
