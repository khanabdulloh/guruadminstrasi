/* Service worker Portal SMK CALM: cangkang aplikasi tersedia cepat; permintaan data (POST ke Apps Script) tidak pernah disimpan. Naikkan V bila index.html berubah besar. */
const V = 'calm-v1', CDN = ['unpkg.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin && r.mode === 'navigate') { // halaman: utamakan versi terbaru, cadangan dari cache bila offline
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); return x; }).catch(() => caches.match(r).then(m => m || caches.match('./'))));
  } else if (CDN.indexOf(u.hostname) >= 0 || u.origin === location.origin) { // pustaka & font: tampil dari cache, perbarui di latar
    e.respondWith(caches.match(r).then(m => { const n = fetch(r).then(x => { if (x.ok) { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); } return x; }).catch(() => m); return m || n; }));
  }
});
