// Service worker: кэширует "оболочку" сайта (HTML/CSS/JS), чтобы интерфейс
// открывался даже без интернета. Данные каталога (Shikimori) требуют сети —
// офлайн работает сама оболочка, не живой контент.

const CACHE_NAME = 'tunime-shell-v1';
const SHELL_FILES = [
  'index.html',
  'login.html',
  'list.html',
  'watch.html',
  'style.css',
  'app.js',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Запросы к API всегда идут в сеть — кэшировать список аниме/аккаунт не нужно,
  // это живые данные
  if (url.pathname.startsWith('/api')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('index.html'));
    })
  );
});
