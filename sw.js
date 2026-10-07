/* Service worker Portal Akademik SMK CALM v2
 * - Halaman (navigasi): jaringan dulu, salinan terakhir dipakai bila offline → aplikasi tetap terbuka tanpa sinyal.
 * - Aset statis (Vue, font, logo): stale-while-revalidate → buka lebih cepat, diperbarui di latar belakang.
 * - API Apps Script TIDAK pernah dicegat/di-cache (data selalu dari server; antrean offline ditangani aplikasi). */
const VER = 'smk-calm-v2', SHELL = VER + '-shell', ASET = VER + '-aset';
const CDN = ['unpkg.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'blogger.googleusercontent.com'];

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nama = await caches.keys();
    await Promise.all(nama.filter(n => n.indexOf(VER) !== 0).map(n => caches.delete(n))); // buang cache versi lama (mis. smk-calm-v1)
    await self.clients.claim();
  })());
});

const layak = r => r && r.status === 200 && r.type !== 'opaque' && r.type !== 'error';
async function ambil(req) { // lintas-origin: minta lewat CORS agar bisa disimpan tanpa kuota "opaque" yang besar
  if (new URL(req.url).origin === self.location.origin) return fetch(req);
  try { return await fetch(req.url, { mode: 'cors', credentials: 'omit' }); } catch (e) { return fetch(req); }
}
async function halaman(req) {
  const c = await caches.open(SHELL);
  try {
    const r = await fetch(req);
    if (layak(r)) c.put(req, r.clone()).catch(() => {});
    return r;
  } catch (e) {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match(self.registration.scope)) || new Response('Anda sedang offline dan halaman belum tersimpan. Sambungkan internet lalu muat ulang.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
async function aset(req) {
  const c = await caches.open(ASET), ada = await c.match(req);
  const segar = ambil(req).then(r => { if (layak(r)) c.put(req, r.clone()).catch(() => {}); return r; });
  if (ada) { segar.catch(() => {}); return ada; }
  try { return await segar; } catch (e) { return new Response('', { status: 504 }); }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const u = new URL(req.url);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
  if (req.mode === 'navigate') { e.respondWith(halaman(req)); return; }
  if (u.origin === self.location.origin || CDN.indexOf(u.hostname) >= 0) e.respondWith(aset(req));
  // selain itu (termasuk script.google.com / API): biarkan browser menangani langsung
});
