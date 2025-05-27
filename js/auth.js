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
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // L'utilisateur est connecté
        currentUser = user;
        
        try {
            // Récupérer le profil utilisateur depuis Firestore
            const userDoc = await db.collection('users').doc(user.email).get();
            
            if (userDoc.exists) {
                userProfile = userDoc.data();
                
                // Mettre à jour l'interface utilisateur
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                
                // Mettre à jour les informations d'utilisateur dans l'interface
                updateUserInterface();
                
                // Charger la page d'accueil (dashboard)
                navigateTo('dashboard');
            } else {
                // Profil non trouvé, déconnexion
                console.error("Profil utilisateur non trouvé");
                await auth.signOut();
                alert("Profil utilisateur non trouvé. Veuillez contacter l'administrateur.");
            }
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
            alert(`Erreur lors du chargement du profil: ${error.message}`);
            document.querySelector('.loading-progress').style.width = '0%';
        }
    } else {
        // L'utilisateur est déconnecté
        currentUser = null;
        userProfile = {};
        
        // Afficher l'écran de connexion
        document.getElementById('app').classList.add('hidden');
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

// Déconnexion
function logout() {
    auth.signOut();
}

// Mettre à jour l'interface utilisateur avec les informations de l'utilisateur
function updateUserInterface() {
    if (!currentUser) return;
    
    // Avatar et nom d'utilisateur
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    userAvatar.src = userProfile.photoURL || 'images/default-avatar.png';
    userName.textContent = userProfile.displayName || currentUser.email;
    
    // Barre d'XP
    updateXP(userProfile.xp || 0, userProfile.level || 1);
}

// Mise à jour de l'XP et du niveau
function updateXP(xp, level) {
    const xpProgress = document.getElementById('xp-progress');
    const xpText = document.getElementById('xp-text');
    
    // Calculer le XP nécessaire pour le niveau actuel
    const xpForCurrentLevel = 100 * level;
    
    // Calculer le pourcentage de progression dans le niveau actuel
    const xpInCurrentLevel = xp - (100 * (level - 1));
    const progressPercent = (xpInCurrentLevel / xpForCurrentLevel) * 100;
    
    // Mettre à jour l'interface
    xpProgress.style.width = `${progressPercent}%`;
    xpText.textContent = `${xp} XP`;
}
