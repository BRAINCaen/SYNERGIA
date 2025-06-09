// js/firebase-init.js
// Firebase initialization extracted from index.html

// Import des modules Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    onSnapshot,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    writeBatch,
    enableNetwork,
    disableNetwork
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import {
    getAnalytics,
    logEvent
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Configuration Firebase - VOS VRAIES CLÉS
const firebaseConfig = {
    apiKey: "AIzaSyD7uBuAQaOhZ02owkZEuMKC5Vji6PrB2f8",
    authDomain: "synergia-app-f27e7.firebaseapp.com",
    projectId: "synergia-app-f27e7",
    storageBucket: "synergia-app-f27e7.appspot.com",
    messagingSenderId: "201912738922",
    appId: "1:201912738922:web:2fcc1e49293bb632899613",
    measurementId: "G-EGJ79SCMWX"
};

// Fonction d'initialisation Firebase
function initializeFirebase() {
    return new Promise((resolve, reject) => {
        try {
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const storage = getStorage(app);
            const analytics = getAnalytics(app);

            // Configurer la persistance
            setPersistence(auth, browserLocalPersistence).then(() => {
                // Exposer globalement
                window.firebaseApp = app;
                window.auth = auth;
                window.db = db;
                window.storage = storage;
                window.analytics = analytics;

                // Exposer les fonctions Firebase
                window.firebase = {
                    // Auth
                    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
                    signOut, updateProfile, signInWithPopup, GoogleAuthProvider,

                    // Firestore
                    collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc,
                    onSnapshot, setDoc, query, where, orderBy, limit, serverTimestamp,
                    writeBatch, enableNetwork, disableNetwork,

                    // Storage
                    ref, uploadBytes, getDownloadURL, deleteObject,

                    // Analytics
                    logEvent
                };

                window.firebaseReady = true;

                console.log('✅ Firebase initialisé avec succès en mode production');

                // Événement personnalisé pour signaler que Firebase est prêt
                window.dispatchEvent(new CustomEvent('firebaseReady'));

                resolve();
            }).catch(reject);

        } catch (error) {
            console.error('❌ Erreur initialisation Firebase:', error);
            window.firebaseReady = false;

            // Afficher une erreur critique
            setTimeout(() => {
                document.body.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa; font-family: Arial, sans-serif;">
                        <div style="text-align: center; max-width: 600px; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc3545; margin-bottom: 1rem;"></i>
                            <h1 style="color: #dc3545; margin-bottom: 1rem;">Erreur de Configuration Firebase</h1>
                            <p style="color: #666; margin-bottom: 2rem;">Impossible de se connecter à Firebase. Veuillez vérifier votre configuration.</p>
                            <pre style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: left; font-size: 0.9rem; color: #dc3545;">${error.message}</pre>
                            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Réessayer
                            </button>
                        </div>
                    </div>
                `;
            }, 1000);

            reject(error);
        }
    });
}

// Initialiser Firebase dès le chargement du module
initializeFirebase().catch(error => {
    console.error('Échec initialisation Firebase:', error);
});

export { initializeFirebase };
