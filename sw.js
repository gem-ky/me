const CACHE = 'seans-shell-v1';
const SHELL = [
  './',
  './index.html',
  './search.html',
  './anime.html',
  './watch.html',
  './profile.html',
  './settings.html',
  './css/style.css',
  './js/api.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// shell-first for same-origin static files, network-first for everything else (API calls etc.)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(url.origin === location.origin && SHELL.some(p => url.pathname.endsWith(p.replace('./','')))){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
