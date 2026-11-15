// Service worker : limite la consommation de données et permet de relire hors ligne.
// - fichiers de l'application (JS, CSS, polices) : servis depuis le cache une fois téléchargés ;
// - données (GET /api) : réseau d'abord, dernière copie connue si la connexion manque.
const STATIC = 'ged-static-v1';
const DATA = 'ged-data-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('message', (e) => {
  if (e.data === 'clear-data') caches.delete(DATA); // à la déconnexion
});

const put = (cacheName, req, res) => {
  if (res.ok) {
    const copie = res.clone(); // cloner tout de suite, avant que la réponse soit lue
    caches.open(cacheName).then((c) => c.put(req, copie));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/auth')) return;
    e.respondWith(
      fetch(req)
        .then((res) => put(DATA, req, res))
        .catch(async () => (await caches.match(req)) || new Response(JSON.stringify({ error: 'Hors ligne : contenu pas encore consulté.' }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => put(STATIC, '/index.html', res))
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(STATIC, req, res))));
});
