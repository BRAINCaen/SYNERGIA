// sw.js - Service Worker pour SYNERGIA
const CACHE_NAME = 'synergia-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/synergia-style.css',
  '/js/firebase-manager.js',
  '/js/team-manager.js',
  '/js/quest-manager.js',
  '/js/ui-manager.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
