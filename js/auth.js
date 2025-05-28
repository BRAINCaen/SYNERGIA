// État d'authentification
let currentUser = null;
let userProfile = {};

// Gérer le formulaire de connexion
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Afficher la progression
        document.querySelector('.loading-progress').style.width = '50%';
        
        // Connexion avec Firebase
        await auth.signInWithEmailAndPassword(email, password);
        
        // La suite sera gérée par l'observateur d'état d'authentification
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert(`Erreur de connexion: ${error.message}`);
        document.querySelector('.loading-progress').style.width = '0%';
    }
});

// Observer les changements d'état d'authentification
auth.onAuthStateChanged(async user => {
    const loadingScreen = document.getElementById('loading-screen');
    const loginScreen = document.getElementById('login-screen');
    const app = document.getElementById('app');
    
    if (user) {
        currentUser = user;
        
        try {
            // Vérifier si le profil existe
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // CRÉER automatiquement le profil
                console.log('Création du profil utilisateur...');
                userProfile = await createUserProfile(user);
            } else {
                // Charger le profil existant
                userProfile = userDoc.data();
                console.log('Profil utilisateur chargé:', userProfile);
            }
            
            // Cacher les écrans de chargement/connexion
            loginScreen.classList.add('hidden');
            loadingScreen.classList.add('hidden');
            app.classList.remove('hidden');
            
            // Mettre à jour l'interface
            updateUserInterface();
            
            // Charger le dashboard
            if (typeof loadPage === 'function') {
                loadPage('dashboard');
            }
            
            console.log('Connexion réussie pour:', user.email);
            
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            // En cas d'erreur, utiliser des données par défaut
            handleMissingProfile(user);
        }
    } else {
        // L'utilisateur est déconnecté
        currentUser = null;
        userProfile = {};
        
        // Afficher l'écran de connexion
        app.classList.add('hidden');
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
});

// Fonction pour créer un profil utilisateur automatiquement
async function createUserProfile(user) {
    const defaultProfile = {
        displayName: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL || '',
        xp: 0,
        level: 1,
        roles: ['entretien'], // Rôle par défaut
        badges: [],
        completedQuests: [],
        joinedAt: new Date(),
        lastActive: new Date(),
        preferences: {
            notifications: true,
            theme: 'default'
        }
    };
    
    try {
        await db.collection('users').doc(user.uid).set(defaultProfile);
        console.log('Profil créé avec succès pour:', user.email);
        return defaultProfile;
    } catch (error) {
        console.error('Erreur création profil:', error);
        // Retourner le profil par défaut même en cas d'erreur Firebase
        return defaultProfile;
    }
}

// Fonction de secours si le profil pose problème
function handleMissingProfile(user) {
    console.log('Mode dégradé activé');
    userProfile = {
        displayName: user.email.split('@')[0],
        email: user.email,
        xp: 0,
        level: 1,
        roles: ['entretien']
    };
    
    // Cacher les écrans de chargement/connexion
    const loginScreen = document.getElementById('login-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    
    loginScreen.classList.add('hidden');
    loadingScreen.classList.add('hidden');
    app.classList.remove('hidden');
    
    updateUserInterface();
}

// Déconnexion
function logout() {
    auth.signOut();
}

// Mettre à jour l'interface utilisateur avec les informations de l'utilisateur
function updateUserInterface() {
    if (!currentUser || !userProfile) return;
    
    try {
        // Avatar et nom d'utilisateur
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const welcomeName = document.getElementById('welcome-name');
        
        if (userAvatar) {
            userAvatar.src = userProfile.photoURL || 'https://img.icons8.com/color/96/000000/user-male-circle--v1.png';
        }
        
        if (userName) {
            userName.textContent = userProfile.displayName || currentUser.email;
        }
        
        if (welcomeName) {
            welcomeName.textContent = userProfile.displayName || currentUser.email.split('@')[0];
        }
        
        // Barre d'XP
        updateXP(userProfile.xp || 0, userProfile.level || 1);
        
        console.log('Interface utilisateur mise à jour');
        
    } catch (error) {
        console.error('Erreur mise à jour interface:', error);
    }
}

// Mise à jour de l'XP et du niveau
function updateXP(xp, level) {
    try {
        const xpProgress = document.getElementById('xp-progress');
        const xpText = document.getElementById('xp-text');
        const levelBadge = document.getElementById('level-badge');
        
        // Calculer le XP nécessaire pour le niveau actuel
        const xpForCurrentLevel = 100 * level;
        const xpInCurrentLevel = xp - (100 * (level - 1));
        const progressPercent = Math.max(0, Math.min(100, (xpInCurrentLevel / 100) * 100));
        
        // Mettre à jour l'interface
        if (xpProgress) {
            xpProgress.style.width = `${progressPercent}%`;
        }
        
        if (xpText) {
            xpText.textContent = `${xp} XP`;
        }
        
        if (levelBadge) {
            levelBadge.textContent = level;
        }
        
    } catch (error) {
        console.error('Erreur mise à jour XP:', error);
    }
}
