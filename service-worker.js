// Service Worker pour SYNERGIA

const CACHE_NAME = 'synergia-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/synergia-style.css',
  '/js/main.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://img.icons8.com/color/96/000000/s-key.png'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation et nettoyage 
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ignorer les requêtes des extensions Chrome
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Ignorer les requêtes Firebase (elles sont gérées par Firebase SDK)
  if (
    event.request.url.includes('firebaseio.com') || 
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Pour les requêtes de navigation, renvoyer index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return new Response('Offline content not available');
          });
      })
  );
});
