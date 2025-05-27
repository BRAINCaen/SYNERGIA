// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAvFX1mKk-YN_MJTB0CvA5aWeRw3fJb5rk",
  authDomain: "synergia-app-f27e7.firebaseapp.com",
  projectId: "synergia-app-f27e7",
  storageBucket: "synergia-app-f27e7.firebasestorage.app",
  messagingSenderId: "1015127389223",
  appId: "1:1015127389223:web:18c914e061add85c9f99613",
  measurementId: "G-V58F9EV7Q6"
};

// Initialisation de firebase (seulement si elle n'est pas déjà initialisée)
let firebaseApp;
try {
  firebaseApp = firebase.app(); 
} catch (e) {
  firebaseApp = firebase.initializeApp(firebaseConfig);
}

// Référence aux services firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Paramètres Firestore avec l'option merge: true
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  merge: true  // Ajouter cette ligne
});

// Activer la persistance seulement si ce n'est pas déjà fait
try {
  db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
      if (err.code !== 'failed-precondition') {
        console.error("Erreur d'activation de la persistance:", err);
      }
    });
} catch (e) {
  // La persistance est peut-être déjà activée
}

// Exporter les services
export { auth, db, storage, firebaseApp };
