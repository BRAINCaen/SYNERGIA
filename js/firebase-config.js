// Configuration Firebase
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-app.firebaseapp.com",
    projectId: "votre-app",
    storageBucket: "votre-app.appspot.com",
    messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// Référence aux services Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Paramètres Firestore
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
        console.error("Erreur d'activation de la persistance:", err);
    });

// Utilisateurs par défaut pour le développement (à supprimer en production)
const defaultUsers = {
    "paris@synergia.com": {
        password: "paris1234",
        displayName: "Paris Amélie",
        photoURL: "https://i.pravatar.cc/150?img=5",
        role: "Communication & Réseaux Sociaux",
        level: 3,
        xp: 245,
        motto: "Venez comme vous êtes",
        strengths: "L'écriture, l'humour, autodérision",
        weaknesses: "Stress, perfectionnisme",
        values: "Sympathie, respect, humour"
    },
    "red@synergia.com": {
        password: "red1234",
        displayName: "Red Houlette",
        photoURL: "https://i.pravatar.cc/150?img=10",
        role: "Mentorat & Formation",
        level: 2,
        xp: 175,
        motto: "La vie est une fête et je suis la piñata",
        strengths: "Adaptabilité, créativité",
        weaknesses: "Éparpillement (TDAH)",
        values: "Tolérance et santé mentale pour tous"
    },
    "leo@synergia.com": {
        password: "leo1234",
        displayName: "Léo Mercier",
        photoURL: "https://i.pravatar.cc/150?img=8",
        role: "Entretien, Réparations & Maintenance",
        level: 4,
        xp: 320,
        motto: "Je ne suis pas venu ici pour boire l'eau des pâtes",
        strengths: "Bricolage, créativité",
        weaknesses: "Tendance à l'isolement",
        values: "La famille et le respect"
    },
    "polar@synergia.com": {
        password: "polar1234",
        displayName: "Polar Caron",
        photoURL: "https://i.pravatar.cc/150?img=12",
        role: "Gestion des Avis et Réputation",
        level: 2,
        xp: 140,
        motto: "Fonce, sur un malentendu ça peut passer",
        strengths: "Adaptabilité, organisation",
        weaknesses: "Communication, trop gentil",
        values: "Prendre soin des autres, respect"
    },
    "allan@synergia.com": {
        password: "allan1234",
        displayName: "Allan Boehme",
        photoURL: "https://i.pravatar.cc/150?img=3",
        role: "Organisation Interne du Travail",
        level: 5,
        xp: 450,
        motto: "Ne meurent que ceux que l'on oublie",
        strengths: "Innovation, empathie",
        weaknesses: "Fatigue, surcharge",
        values: "Être juste, éthique"
    }
};

// Fonction pour initialiser les utilisateurs (développement uniquement)
async function initDefaultUsers() {
    for (const email in defaultUsers) {
        const userData = defaultUsers[email];
        try {
            // Vérifier si l'utilisateur existe déjà
            const userDoc = await db.collection('users').doc(email).get();
            
            if (!userDoc.exists) {
                // Créer l'utilisateur dans Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, userData.password);
                
                // Mettre à jour le profil
                await userCredential.user.updateProfile({
                    displayName: userData.displayName,
                    photoURL: userData.photoURL
                });
                
                // Enregistrer les données dans Firestore
                await db.collection('users').doc(email).set({
                    displayName: userData.displayName,
                    email: email,
                    photoURL: userData.photoURL,
                    role: userData.role,
                    level: userData.level,
                    xp: userData.xp,
                    motto: userData.motto,
                    strengths: userData.strengths,
                    weaknesses: userData.weaknesses, 
                    values: userData.values,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log(`Utilisateur créé: ${email}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création de l'utilisateur ${email}:`, error);
        }
    }
}

// Pour initialiser les utilisateurs en développement, décommentez la ligne suivante
// initDefaultUsers();
