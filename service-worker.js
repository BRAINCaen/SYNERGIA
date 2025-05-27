// Service Worker SYNERGIA App
const CACHE_NAME = 'synergia-app-v1';

// Fichiers à mettre en cache lors de l'installation
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/badges.js',
  '/js/calendar.js',
  '/js/chat.js',
  '/js/dashboard.js',
  '/js/firebase-config.js',
  '/js/quests.js',
  '/js/roles.js',
  '/images/synergia-logo.png',
  '/images/default-avatar.png',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Poppins:wght@300;400;600;700&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation');
  
  // Mettre à jour immédiatement sans attendre que les onglets soient fermés
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache des ressources');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(error => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation');
  
  // Prendre le contrôle immédiatement
  self.clients.claim();
  
  // Supprimer les anciens caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de mise en cache : Network First avec fallback sur le cache
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes vers Firebase
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com') || 
      event.request.url.includes('firebasestorage.googleapis.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la réponse est valide, la mettre en cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec, essayer de récupérer depuis le cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Pour les requêtes de navigation, renvoyer la page index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Si pas dans le cache, renvoyer une erreur
            return new Response('Pas de connexion internet et ressource non mise en cache.', {
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Gérer les notifications push
self.addEventListener('push', event => {
  console.log('[Service Worker] Notification Push reçue');
  
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (error) {
    notificationData = {
      title: 'Nouvelle notification',
      body: event.data ? event.data.text() : 'Pas de détails disponibles',
      icon: '/images/icons/icon-192x192.png'
    };
  }
  
  const options = {
    body: notificationData.body || 'Nouvelle mise à jour!',
    icon: notificationData.icon || '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    data: notificationData.data || {},
    vibrate: [100, 50, 100]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'SYNERGIA',
      options
    )
  );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification cliquée');
  
  event.notification.close();
  
  // Récupérer les données de la notification
  const notificationData = event.notification.data;
  const url = notificationData.url || '/';
  
  // Ouvrir ou focaliser sur la fenêtre de l'application
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Chercher si l'application est déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        
        // Si non, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    console.log('[Service Worker] Tentative de synchronisation des messages');
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-quests') {
    console.log('[Service Worker] Tentative de synchronisation des quêtes');
    event.waitUntil(syncQuests());
  }
});

// Synchroniser les messages en attente
async function syncMessages() {
  try {
    // Récupérer les messages en attente depuis IndexedDB
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        // Envoyer le message
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Supprimer le message de la file d'attente
          await deletePendingMessage(message.id);
        }
      } catch (error) {
        console.error('[Service Worker] Échec de synchronisation d\'un message:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Échec de synchronisation des messages:', error);
    throw error;
  }
}

// Synchroniser les quêtes en attente
async function syncQuests() {
  try {
    // Récupérer les quêtes en attente depuis IndexedDB
    const pendingQuests = await getPendingQuests();
    
    for (const quest of pendingQuests) {
      try {
        // Envoyer la mise à jour de quête
        const response = await fetch('/api/quests/' + quest.id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(quest)
        });
        
        if (response.ok) {
          // Supprimer la quête de la file d'attente
          await deletePendingQuest(quest.id);
        }
      } catch (error) {
        console.error('[Service Worker] Échec de synchronisation d\'une quête:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Échec de synchronisation des quêtes:', error);
    throw error;
  }
}

// Fonctions d'accès à IndexedDB (à implémenter selon les besoins)
async function getPendingMessages() {
  // Récupérer les messages en attente depuis IndexedDB
  // Cette fonction devrait être implémentée selon la structure de votre base de données
  return [];
}

async function deletePendingMessage(id) {
  // Supprimer un message de la file d'attente
  // Cette fonction devrait être implémentée selon la structure de votre base de données
}

async function getPendingQuests() {
  // Récupérer les quêtes en attente depuis IndexedDB
  // Cette fonction devrait être implémentée selon la structure de votre base de données
  return [];
}

async function deletePendingQuest(id) {
  // Supprimer une quête de la file d'attente
  // Cette fonction devrait être implémentée selon la structure de votre base de données
}
