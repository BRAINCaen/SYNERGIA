// Service Worker pour SYNERGIA - Version améliorée et corrigée

const CACHE_NAME = 'synergia-cache-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/synergia-style.css',
  '/images/synergia-logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Poppins:wght@300;400;600;700&display=swap',
  'https://img.icons8.com/color/96/000000/s-key.png',
  'https://www.transparenttextures.com/patterns/subtle-dark-vertical.png'
];

// Installation
self.addEventListener('install', event => {
  console.log('Service Worker: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Erreur lors de la mise en cache:', error);
      })
  );
  self.skipWaiting();
});

// Activation et nettoyage 
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
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
  // Vérification du schéma d'URL valide
  if (!event.request.url.startsWith('http')) {
    return; // Ignorer les schémas non-HTTP comme chrome-extension://
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
      .then(response => {
        // Vérifier si la réponse est valide
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Cloner la réponse car elle ne peut être utilisée qu'une fois
        const responseToCache = response.clone();
        
        // Mettre en cache la nouvelle réponse si c'est une requête HTTP valide
        if (event.request.url.startsWith('http')) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.error('Erreur lors de la mise en cache:', err);
            });
        }
          
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, essayer de récupérer depuis le cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Pour les requêtes de navigation, renvoyer la page d'accueil
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Retourner une réponse par défaut pour les autres requêtes
            return new Response('Contenu non disponible hors ligne', {
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

console.log('Service Worker: Initialisation terminée');
