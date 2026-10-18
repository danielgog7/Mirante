// Mirante — service worker: abre sem internet e atualiza-se sozinho quando há ligação.
// As três apps partilham o mesmo endereço (e por isso a mesma área de cache): aqui só se apagam as caches do Mirante.
const CACHE = 'mirante-v7';
const FICHEIROS = ['./', './index.html', './estilo.css', './ia-comum.js', './dados.js', './demo.js', './calc.js', './pele.js', './ceu.js', './corpo.js', './graficos.js', './ilustracoes.js', './forja-cena.js', './vigia.js', './vistas.js', './app.js',
  './exercicios.json', './fraunces.woff2', './cinzel.woff2', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('mirante-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Só os ficheiros da própria app; os pedidos ao GitHub e ao Gemini passam diretos.
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'})
      .then(r => { if (r.ok){ const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); } return r; })
      .catch(() => caches.open(CACHE).then(c => c.match(e.request, {ignoreSearch: true}).then(r => r || c.match('./index.html'))))
  );
});
