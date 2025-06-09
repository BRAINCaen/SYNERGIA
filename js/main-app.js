// Configuration Google Calendar
const GOOGLE_CONFIG = {
apiKey: 'AIzaSyCScckTMndwRM1USdc381Jz64oOjojEseY',
clientId: '187598928508-q8h0j0almvtl1lfv9741p3bfu8hvhga1.apps.googleusercontent.com',
discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
scopes: 'https://www.googleapis.com/auth/calendar'
};

// Variables globales
let currentUser = null;
let currentCompany = null;
let isGoogleCalendarConnected = false;
let tokenClient = null;
let synergia = null;

// Classe principale SYNERGIA
class SynergiaApp {
constructor() {
this.users = [];
this.events = [];
this.quests = [];
this.messages = [];
this.userProgress = { level: 1, xp: 0, coins: 0 };
this.storeItems = [];
this.transactions = [];
this.transfers = [];
this.completedQuests = []; // Tracking des missions complétées
this.questRequests = []; // Tracking des demandes de missions spéciales
this.unsubscribers = [];

this.init();
}

async init() {
console.log('🚀 Initialisation SYNERGIA v3.0 Production');

// Attendre Firebase
if (window.firebaseReady) {
this.onFirebaseReady();
} else {
window.addEventListener('firebaseReady', () => this.onFirebaseReady());
}
}

async onFirebaseReady() {
this.updateLoadingStatus('Firebase connecté, configuration de l\'authentification...');

// Configurer l'authentification
this.setupAuth();

// Configurer les event listeners
this.setupEventListeners();

// Configurer Google Calendar
await this.setupGoogleCalendar();

this.updateLoadingStatus('Prêt !');

setTimeout(() => {
this.hideLoadingScreen();
}, 1000);
}

setupAuth() {
window.firebase.onAuthStateChanged(window.auth, (user) => {
if (user) {
currentUser = user;
console.log(`✅ Utilisateur connecté: ${user.email}`);

// Charger les données utilisateur
this.loadUserData().then(() => {
// Configurer les listeners en temps réel
this.setupRealtimeListeners();

// Masquer le modal d'auth et afficher l'interface
this.hideAuthModal();
this.showMainInterface();

// Mettre à jour l'interface utilisateur
this.updateUserInterface();

this.showToast(`Bienvenue ${user.displayName || user.email} !`, 'success');
}).catch(error => {
console.error('Erreur chargement données utilisateur:', error);
this.showToast('Erreur lors du chargement des données', 'error');
});

} else {
currentUser = null;
console.log('❌ Aucun utilisateur connecté');
this.showAuthModal();
this.hideMainInterface();
}
});
}

async loadUserData() {
try {
if (!window.db || !currentUser) {
throw new Error('Firebase non initialisé ou utilisateur non connecté');
}

// Charger ou créer le profil utilisateur
const userDoc = await window.firebase.getDoc(
window.firebase.doc(window.db, 'users', currentUser.uid)
);

if (!userDoc.exists()) {
// Première connexion - créer le profil
await this.createUserProfile();
}

// Charger ou créer l'entreprise
await this.loadOrCreateCompany();

console.log('✅ Données utilisateur chargées');
} catch (error) {
console.error('❌ Erreur chargement données:', error);
this.showToast('Erreur lors du chargement des données', 'error');
throw error;
}
}

async createUserProfile() {
const userData = {
email: currentUser.email,
displayName: currentUser.displayName || currentUser.email.split('@')[0],
photoURL: currentUser.photoURL || null,
level: 1,
xp: 0,
coins: 0,
totalCoinsEarned: 0,
totalCoinsSpent: 0,
joinedAt: window.firebase.serverTimestamp(),
lastLogin: window.firebase.serverTimestamp(),
status: 'online'
};

await window.firebase.setDoc(
window.firebase.doc(window.db, 'users', currentUser.uid),
userData
);

console.log('✅ Profil utilisateur créé');
}

async loadOrCreateCompany() {
// Vérifier si l'utilisateur appartient à une entreprise
const userCompaniesQuery = window.firebase.query(
window.firebase.collection(window.db, 'companies'),
window.firebase.where('members', 'array-contains', currentUser.uid)
);

const companiesSnapshot = await window.firebase.getDocs(userCompaniesQuery);

if (!companiesSnapshot.empty) {
// Utilisateur appartient à une entreprise existante
currentCompany = { id: companiesSnapshot.docs[0].id, ...companiesSnapshot.docs[0].data() };
console.log('✅ Entreprise configurée:', currentCompany.name);
} else {
// Créer une nouvelle entreprise
await this.createCompany();
}
}

async createCompany() {
const companyName = prompt('Nom de votre entreprise:', 'Mon Entreprise') || 'Mon Entreprise';

const companyData = {
name: companyName,
owner: currentUser.uid,
members: [currentUser.uid],
createdAt: window.firebase.serverTimestamp(),
settings: {
timezone: 'Europe/Paris',
workingHours: { start: '09:00', end: '17:00' },
googleCalendarEnabled: false
}
};

const companyRef = await window.firebase.addDoc(
window.firebase.collection(window.db, 'companies'),
companyData
);

currentCompany = { id: companyRef.id, ...companyData };

// Créer les missions par défaut
await this.createDefaultQuests();

// Créer les avantages par défaut de la boutique
await this.createDefaultStoreItems();

console.log('✅ Entreprise créée:', companyName);
}

async createDefaultQuests() {
const defaultQuests = [
{
title: 'Première connexion',
description: 'Connectez-vous à SYNERGIA pour la première fois',
type: 'special',
xp: 100,
difficulty: 'easy',
icon: '🚀',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
},
{
title: 'Pointage quotidien',
description: 'Marquez votre présence chaque jour',
type: 'daily',
xp: 50,
difficulty: 'easy',
icon: '⏰',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
},
{
title: 'Message d\'équipe',
description: 'Envoyez un message dans le chat d\'équipe',
type: 'daily',
xp: 30,
difficulty: 'easy',
icon: '💬',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
},
{
title: 'Configuration Google Calendar',
description: 'Connectez et configurez Google Calendar',
type: 'special',
xp: 150,
difficulty: 'medium',
icon: '📅',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
}
];

const promises = defaultQuests.map(quest => 
window.firebase.addDoc(
window.firebase.collection(window.db, 'quests'),
quest
)
);

await Promise.all(promises);
}

async createDefaultStoreItems() {
const defaultItems = [
{
name: 'Heure de pause supplémentaire',
description: 'Bénéficiez d\'une heure de pause en plus',
price: 100,
category: 'time',
stock: 50,
icon: '⏰',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
},
{
name: 'Place de parking VIP',
description: 'Place de parking réservée près de l\'entrée',
price: 200,
category: 'perks',
stock: 5,
icon: '🚗',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
},
{
name: 'Café premium',
description: 'Café de qualité supérieure à la machine',
price: 50,
category: 'social',
stock: 100,
icon: '☕',
active: true,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
}
];

const promises = defaultItems.map(item => 
window.firebase.addDoc(
window.firebase.collection(window.db, 'store_items'),
item
)
);

await Promise.all(promises);
}

setupRealtimeListeners() {
if (!currentCompany) return;

// Écouter les utilisateurs de l'entreprise
const usersQuery = window.firebase.query(
window.firebase.collection(window.db, 'users')
);

const unsubUsers = window.firebase.onSnapshot(usersQuery, (snapshot) => {
this.users = [];
snapshot.forEach(doc => {
this.users.push({ id: doc.id, ...doc.data() });
});
this.updateTeamDisplay();
this.updateDashboardStats();
this.updateLeaderboard();
});

// Écouter les missions
const questsQuery = window.firebase.query(
window.firebase.collection(window.db, 'quests'),
window.firebase.where('companyId', '==', currentCompany.id),
window.firebase.where('active', '==', true)
);

const unsubQuests = window.firebase.onSnapshot(questsQuery, (snapshot) => {
this.quests = [];
snapshot.forEach(doc => {
this.quests.push({ id: doc.id, ...doc.data() });
});
this.updateQuestsDisplay();
this.updateDashboardStats();
});

// Écouter les completions de missions de l'utilisateur
const questCompletionsQuery = window.firebase.query(
window.firebase.collection(window.db, 'quest_completions'),
window.firebase.where('userId', '==', currentUser.uid),
window.firebase.where('companyId', '==', currentCompany.id)
);

const unsubQuestCompletions = window.firebase.onSnapshot(questCompletionsQuery, (snapshot) => {
this.completedQuests = [];
snapshot.forEach(doc => {
this.completedQuests.push({ id: doc.id, ...doc.data() });
});
// Force la mise à jour de l'affichage
setTimeout(() => {
this.updateQuestsDisplay();
}, 100);
});

// Écouter les événements
const eventsQuery = window.firebase.query(
window.firebase.collection(window.db, 'events'),
window.firebase.where('companyId', '==', currentCompany.id),
window.firebase.orderBy('date', 'asc')
);

const unsubEvents = window.firebase.onSnapshot(eventsQuery, (snapshot) => {
this.events = [];
snapshot.forEach(doc => {
this.events.push({ id: doc.id, ...doc.data() });
});
this.updateEventsDisplay();
this.updateDashboardStats();
});

// Écouter les messages du chat
const messagesQuery = window.firebase.query(
window.firebase.collection(window.db, 'messages'),
window.firebase.where('companyId', '==', currentCompany.id),
window.firebase.orderBy('timestamp', 'asc'),
window.firebase.limit(50)
);

const unsubMessages = window.firebase.onSnapshot(messagesQuery, (snapshot) => {
this.messages = [];
snapshot.forEach(doc => {
this.messages.push({ id: doc.id, ...doc.data() });
});
this.updateChatDisplay();
});

// Écouter les articles de la boutique
const storeQuery = window.firebase.query(
window.firebase.collection(window.db, 'store_items'),
window.firebase.where('companyId', '==', currentCompany.id),
window.firebase.where('active', '==', true)
);

const unsubStore = window.firebase.onSnapshot(storeQuery, (snapshot) => {
this.storeItems = [];
snapshot.forEach(doc => {
this.storeItems.push({ id: doc.id, ...doc.data() });
});
this.updateStoreDisplay();
});

// Écouter les transactions
const transactionsQuery = window.firebase.query(
window.firebase.collection(window.db, 'transactions'),
window.firebase.where('userId', '==', currentUser.uid),
window.firebase.orderBy('timestamp', 'desc'),
window.firebase.limit(20)
);

const unsubTransactions = window.firebase.onSnapshot(transactionsQuery, (snapshot) => {
this.transactions = [];
snapshot.forEach(doc => {
this.transactions.push({ id: doc.id, ...doc.data() });
});
this.updateTransactionsDisplay();
});

// Écouter les transferts
const transfersQuery = window.firebase.query(
window.firebase.collection(window.db, 'transfers'),
window.firebase.where('participants', 'array-contains', currentUser.uid),
window.firebase.orderBy('timestamp', 'desc'),
window.firebase.limit(10)
);

const unsubTransfers = window.firebase.onSnapshot(transfersQuery, (snapshot) => {
this.transfers = [];
snapshot.forEach(doc => {
this.transfers.push({ id: doc.id, ...doc.data() });
});
this.updateTransfersDisplay();
});

// Écouter les demandes de missions spéciales
const questRequestsQuery = window.firebase.query(
window.firebase.collection(window.db, 'quest_requests'),
window.firebase.where('userId', '==', currentUser.uid),
window.firebase.where('companyId', '==', currentCompany.id)
);

const unsubQuestRequests = window.firebase.onSnapshot(questRequestsQuery, (snapshot) => {
this.questRequests = [];
snapshot.forEach(doc => {
this.questRequests.push({ id: doc.id, ...doc.data() });
});
// Force la mise à jour de l'affichage
setTimeout(() => {
this.updateQuestsDisplay();
}, 100);
});

// Stocker les unsubscribers pour les nettoyer plus tard
this.unsubscribers = [unsubUsers, unsubQuests, unsubQuestCompletions, unsubQuestRequests, unsubEvents, unsubMessages, unsubStore, unsubTransactions, unsubTransfers];
}

setupEventListeners() {
// Navigation - vérifier existence
const navLinks = document.querySelectorAll('.nav-link');
if (navLinks.length > 0) {
navLinks.forEach(link => {
link.addEventListener('click', (e) => {
e.preventDefault();
this.switchSection(link.dataset.section);
});
});
}

// Auth tabs - vérifier existence
const authTabs = document.querySelectorAll('.auth-tab');
if (authTabs.length > 0) {
authTabs.forEach(tab => {
tab.addEventListener('click', () => {
this.switchAuthTab(tab.dataset.tab);
});
});
}

// Forms avec vérification
const loginForm = document.getElementById('login-form');
if (loginForm) {
loginForm.addEventListener('submit', (e) => {
e.preventDefault();
this.handleLogin();
});
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
registerForm.addEventListener('submit', (e) => {
e.preventDefault();
this.handleRegister();
});
}

const googleLoginBtn = document.getElementById('google-login-btn');
if (googleLoginBtn) {
googleLoginBtn.addEventListener('click', () => {
this.handleGoogleLogin();
});
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
logoutBtn.addEventListener('click', () => {
this.handleLogout();
});
}

// Événements
const addEventBtn = document.getElementById('add-event-btn');
if (addEventBtn) {
addEventBtn.addEventListener('click', () => {
this.showModal('add-event-modal');
});
}

const eventForm = document.getElementById('event-form');
if (eventForm) {
eventForm.addEventListener('submit', (e) => {
e.preventDefault();
this.createEvent();
});
}

// Membres
const addMemberBtn = document.getElementById('add-member-btn');
if (addMemberBtn) {
addMemberBtn.addEventListener('click', () => {
this.showModal('add-member-modal');
});
}

const memberForm = document.getElementById('member-form');
if (memberForm) {
memberForm.addEventListener('submit', (e) => {
e.preventDefault();
this.addMember();
});
}

// Missions
const questForm = document.getElementById('quest-form');
if (questForm) {
questForm.addEventListener('submit', (e) => {
e.preventDefault();
this.createQuest();
});
}

const questTabs = document.querySelectorAll('.quest-tab');
if (questTabs.length > 0) {
questTabs.forEach(tab => {
tab.addEventListener('click', () => {
this.filterQuests(tab.dataset.type);
});
});
}

// Store
const storeTabs = document.querySelectorAll('.store-tab');
if (storeTabs.length > 0) {
storeTabs.forEach(tab => {
tab.addEventListener('click', () => {
this.filterStoreItems(tab.dataset.category);
});
});
}

// Transfers
const sendTransferBtn = document.getElementById('send-transfer-btn');
if (sendTransferBtn) {
sendTransferBtn.addEventListener('click', () => {
this.showModal('send-transfer-modal');
this.populateTransferOptions();
});
}

const requestTransferBtn = document.getElementById('request-transfer-btn');
if (requestTransferBtn) {
requestTransferBtn.addEventListener('click', () => {
this.showModal('request-transfer-modal');
this.populateTransferOptions();
});
}

const sendTransferForm = document.getElementById('send-transfer-form');
if (sendTransferForm) {
sendTransferForm.addEventListener('submit', (e) => {
e.preventDefault();
this.sendTransfer();
});
}

const requestTransferForm = document.getElementById('request-transfer-form');
if (requestTransferForm) {
requestTransferForm.addEventListener('submit', (e) => {
e.preventDefault();
this.requestTransfer();
});
}

// Chat
const sendMessageBtn = document.getElementById('send-message-btn');
if (sendMessageBtn) {
sendMessageBtn.addEventListener('click', () => {
this.sendMessage();
});
}

const messageInput = document.getElementById('message-input');
if (messageInput) {
messageInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
this.sendMessage();
}
});
}

// Profil
const profileForm = document.getElementById('profile-form');
if (profileForm) {
profileForm.addEventListener('submit', (e) => {
e.preventDefault();
this.updateProfile();
});
}

// Google Calendar
const connectGoogleCalendarBtn = document.getElementById('connect-google-calendar');
if (connectGoogleCalendarBtn) {
connectGoogleCalendarBtn.addEventListener('click', () => {
this.connectGoogleCalendar();
});
}

// Refresh buttons
const refreshDashboardBtn = document.getElementById('refresh-dashboard');
if (refreshDashboardBtn) {
refreshDashboardBtn.addEventListener('click', () => {
this.refreshDashboard();
});
}

// Fermeture des modales
document.addEventListener('click', (e) => {
if (e.target.classList.contains('modal')) {
this.closeModal(e.target.id);
}
});
}

async setupGoogleCalendar() {
try {
this.updateLoadingStatus('Configuration Google Calendar...');

// Charger l'API Google
await this.loadGoogleAPI();

// Initialiser le token client
if (typeof google !== 'undefined' && google.accounts) {
tokenClient = google.accounts.oauth2.initTokenClient({
client_id: GOOGLE_CONFIG.clientId,
scope: GOOGLE_CONFIG.scopes,
callback: (response) => this.handleGoogleCalendarAuth(response)
});

console.log('✅ Google Calendar API prête');
} else {
console.warn('⚠️ Google Identity Services non disponible');
}
} catch (error) {
console.error('❌ Erreur Google Calendar:', error);
this.showToast('Google Calendar non disponible', 'warning');
}
}

async loadGoogleAPI() {
return new Promise((resolve, reject) => {
if (typeof gapi !== 'undefined') {
gapi.load('client', () => {
gapi.client.init({
apiKey: GOOGLE_CONFIG.apiKey,
discoveryDocs: [GOOGLE_CONFIG.discoveryDoc]
}).then(resolve).catch(reject);
});
} else {
reject(new Error('Google API non chargée'));
}
});
}

// Méthodes d'authentification
handleLogin() {
const email = document.getElementById('login-email').value.trim();
const password = document.getElementById('login-password').value;

if (!email || !password) {
this.showToast('Veuillez remplir tous les champs', 'error');
return;
}

this.updateLoadingStatus('Connexion en cours...');
this.showLoadingScreen();

window.firebase.signInWithEmailAndPassword(window.auth, email, password).then(() => {
// Connexion réussie, l'event handler se chargera du reste
}).catch(error => {
this.hideLoadingScreen();
console.error('Erreur de connexion:', error);

let message = 'Erreur de connexion';
if (error.code === 'auth/user-not-found') {
message = 'Aucun compte trouvé avec cet email';
} else if (error.code === 'auth/wrong-password') {
message = 'Mot de passe incorrect';
} else if (error.code === 'auth/invalid-email') {
message = 'Email invalide';
}

this.showToast(message, 'error');
});
}

handleRegister() {
const name = document.getElementById('register-name').value.trim();
const email = document.getElementById('register-email').value.trim();
const password = document.getElementById('register-password').value;
const company = document.getElementById('register-company').value.trim();

if (!name || !email || !password || !company) {
this.showToast('Veuillez remplir tous les champs', 'error');
return;
}

if (password.length < 6) {
this.showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
return;
}

this.updateLoadingStatus('Création du compte...');
this.showLoadingScreen();

window.firebase.createUserWithEmailAndPassword(window.auth, email, password).then(userCredential => {
// Mettre à jour le profil
return window.firebase.updateProfile(userCredential.user, {
displayName: name
});
}).then(() => {
console.log('✅ Compte créé avec succès');
}).catch(error => {
this.hideLoadingScreen();
console.error('Erreur inscription:', error);

let message = 'Erreur lors de la création du compte';
if (error.code === 'auth/email-already-in-use') {
message = 'Cet email est déjà utilisé';
} else if (error.code === 'auth/weak-password') {
message = 'Le mot de passe est trop faible';
} else if (error.code === 'auth/invalid-email') {
message = 'Email invalide';
}

this.showToast(message, 'error');
});
}

handleGoogleLogin() {
this.updateLoadingStatus('Connexion avec Google...');
this.showLoadingScreen();

const provider = new window.firebase.GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

window.firebase.signInWithPopup(window.auth, provider).then(() => {
// Connexion réussie, l'event handler se chargera du reste
}).catch(error => {
this.hideLoadingScreen();
console.error('Erreur connexion Google:', error);

if (error.code !== 'auth/popup-closed-by-user') {
this.showToast('Erreur de connexion avec Google', 'error');
}
});
}

handleLogout() {
if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
// Nettoyer les listeners
this.unsubscribers.forEach(unsubscribe => unsubscribe());
this.unsubscribers = [];

window.firebase.signOut(window.auth).then(() => {
this.showToast('Déconnexion réussie', 'success');
}).catch(error => {
console.error('Erreur déconnexion:', error);
this.showToast('Erreur lors de la déconnexion', 'error');
});
}
}

// Méthodes de gestion de l'interface
updateLoadingStatus(status) {
const statusElement = document.getElementById('loading-status');
if (statusElement) {
statusElement.textContent = status;
}
}

showLoadingScreen() {
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
loadingScreen.style.display = 'flex';
}
}

hideLoadingScreen() {
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
loadingScreen.style.display = 'none';
}
}

showAuthModal() {
const authModal = document.getElementById('auth-modal');
if (authModal) {
authModal.style.display = 'flex';
}
}

hideAuthModal() {
const authModal = document.getElementById('auth-modal');
if (authModal) {
authModal.style.display = 'none';
}
}

showMainInterface() {
const navbar = document.querySelector('.navbar');
const mainContent = document.querySelector('.main-content');
if (navbar) navbar.style.display = 'block';
if (mainContent) mainContent.style.display = 'block';
}

hideMainInterface() {
const navbar = document.querySelector('.navbar');
const mainContent = document.querySelector('.main-content');
if (navbar) navbar.style.display = 'none';
if (mainContent) mainContent.style.display = 'none';
}

updateUserInterface() {
if (currentUser) {
const userNameElement = document.getElementById('user-name');
if (userNameElement) {
userNameElement.textContent = currentUser.displayName || currentUser.email;
}

// Mettre à jour l'avatar
const avatar = document.getElementById('user-avatar');
if (avatar) {
if (currentUser.photoURL) {
avatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
} else {
const initial = (currentUser.displayName || currentUser.email).charAt(0).toUpperCase();
avatar.innerHTML = initial;
}
}

// Mettre à jour les champs du profil
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileCompany = document.getElementById('profile-company');

if (profileName) profileName.value = currentUser.displayName || '';
if (profileEmail) profileEmail.value = currentUser.email || '';
if (profileCompany) profileCompany.value = currentCompany?.name || '';

// Charger les données utilisateur pour les gains/XP
this.loadUserProgress();
}
}

async loadUserProgress() {
try {
const userDoc = await window.firebase.getDoc(
window.firebase.doc(window.db, 'users', currentUser.uid)
);

if (userDoc.exists()) {
const userData = userDoc.data();
this.userProgress = {
level: userData.level || 1,
xp: userData.xp || 0,
coins: userData.coins || 0
};

this.updateCoinsDisplay();
this.updateProgressDisplay();
}
} catch (error) {
console.error('Erreur chargement progression:', error);
}
}

updateCoinsDisplay() {
const elements = [
'user-coins',
'user-coins-dashboard',
'store-coins',
'quest-coins-display',
'wallet-total-coins'
];

elements.forEach(id => {
const element = document.getElementById(id);
if (element) {
element.textContent = this.userProgress.coins;
}
});
}

updateProgressDisplay() {
const levelElement = document.getElementById('user-level-display');
const xpElement = document.getElementById('user-xp-display');
const xpProgressElement = document.getElementById('quest-xp-progress');
const levelProgressElement = document.getElementById('next-level-info');

if (levelElement) levelElement.textContent = `Niveau ${this.userProgress.level}`;
if (xpElement) xpElement.textContent = `${this.userProgress.xp} XP`;

const nextLevelXP = this.userProgress.level * 100;
const currentLevelXP = (this.userProgress.level - 1) * 100;
const progressPercent = ((this.userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

if (xpProgressElement) xpProgressElement.style.width = `${Math.min(progressPercent, 100)}%`;
if (levelProgressElement) levelProgressElement.textContent = `${nextLevelXP - this.userProgress.xp} XP vers niveau ${this.userProgress.level + 1}`;
}

switchSection(sectionId) {
// Masquer toutes les sections
document.querySelectorAll('.content-section').forEach(section => {
section.classList.remove('active');
});

// Retirer l'active de tous les liens de nav
document.querySelectorAll('.nav-link').forEach(link => {
link.classList.remove('active');
});

// Activer la section demandée
const targetSection = document.getElementById(sectionId);
if (targetSection) {
targetSection.classList.add('active');
}

// Activer le lien de nav correspondant
const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
if (activeLink) {
activeLink.classList.add('active');
}
}

switchAuthTab(tabName) {
// Masquer tous les contenus d'onglets
document.querySelectorAll('.auth-tab-content').forEach(content => {
content.style.display = 'none';
});

// Retirer l'active de tous les onglets
document.querySelectorAll('.auth-tab').forEach(tab => {
tab.classList.remove('active');
});

// Activer l'onglet demandé
const targetTab = document.getElementById(`${tabName}-tab`);
if (targetTab) targetTab.style.display = 'block';

const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
if (activeTab) activeTab.classList.add('active');
}

showModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'flex';
}
}

closeModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'none';
}
}

// Méthodes de mise à jour de l'affichage (simplifiées pour éviter les erreurs)
updateTeamDisplay() {
const container = document.getElementById('team-members-list');
if (!container) return;

container.innerHTML = '';
if (this.users.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucun membre à afficher</p>';
return;
}

this.users.forEach(user => {
const card = document.createElement('div');
card.className = 'team-member-card animate-slide-up';
card.innerHTML = `
<div class="member-avatar">
<div style="width: 60px; height: 60px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">
${(user.displayName || user.email).charAt(0).toUpperCase()}
</div>
</div>
<div>
<h3>${user.displayName || user.email}</h3>
<p style="color: #666;">Niveau ${user.level || 1} - ${user.xp || 0} XP</p>
</div>
`;
container.appendChild(card);
});
}

updateQuestsDisplay() {
const container = document.getElementById('quests-list');
if (!container) return;

container.innerHTML = '';

if (this.quests.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucune mission disponible</p>';
return;
}

// Récupérer les IDs des missions complétées
const completedQuestIds = this.completedQuests.map(completion => completion.questId);

// Récupérer les IDs des missions avec demandes en cours
const requestedQuestIds = this.questRequests
.filter(request => request.status === 'pending')
.map(request => request.questId);

this.quests.forEach(quest => {
const isCompleted = completedQuestIds.includes(quest.id);
const isRequested = requestedQuestIds.includes(quest.id);

const card = document.createElement('div');
card.className = 'quest-card animate-slide-up';

// Interface différente selon le statut
if (isCompleted) {
// Mission déjà complétée
card.style.opacity = '0.6';
card.style.background = '#f8f9fa';
card.innerHTML = `
<div style="font-size: 2rem; margin-bottom: 1rem;">${quest.icon || '🎯'}</div>
<h3>${quest.title}</h3>
<p style="color: #666; margin-bottom: 1rem;">${quest.description}</p>
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
<span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.xp} XP</span>
<span style="background: #28a745; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.type}</span>
</div>
<button class="btn btn-success" style="width: 100%;" disabled>
<i class="fas fa-check-circle"></i>
✅ Complétée
</button>
`;
} else if (isRequested) {
// Mission avec demande en cours
card.style.background = '#fff3cd';
card.innerHTML = `
<div style="font-size: 2rem; margin-bottom: 1rem;">${quest.icon || '🎯'}</div>
<h3>${quest.title}</h3>
<p style="color: #666; margin-bottom: 1rem;">${quest.description}</p>
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
<span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.xp} XP</span>
<span style="background: #28a745; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.type}</span>
</div>
<button class="btn btn-secondary" style="width: 100%;" disabled>
<i class="fas fa-clock"></i>
📋 Demande en cours
</button>
`;
} else if (quest.type === 'special') {
// Mission spéciale : nécessite une demande
card.innerHTML = `
<div style="font-size: 2rem; margin-bottom: 1rem;">${quest.icon || '🎯'}</div>
<h3>${quest.title}</h3>
<p style="color: #666; margin-bottom: 1rem;">${quest.description}</p>
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
<span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.xp} XP</span>
<span style="background: #fd7e14; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">Spéciale</span>
</div>
<button onclick="window.synergia?.requestSpecialQuest?.('${quest.id}')" class="btn btn-primary" style="width: 100%; background: linear-gradient(135deg, #fd7e14 0%, #dc3545 100%);">
<i class="fas fa-paper-plane"></i>
📋 Demander validation
</button>
`;
} else {
// Mission normale disponible
card.innerHTML = `
<div style="font-size: 2rem; margin-bottom: 1rem;">${quest.icon || '🎯'}</div>
<h3>${quest.title}</h3>
<p style="color: #666; margin-bottom: 1rem;">${quest.description}</p>
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
<span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.xp} XP</span>
<span style="background: #28a745; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">${quest.type}</span>
</div>
<button onclick="window.synergia?.acceptQuest?.('${quest.id}')" class="btn btn-primary" style="width: 100%;">
<i class="fas fa-check"></i>
Accepter
</button>
`;
}

container.appendChild(card);
});
}

updateEventsDisplay() {
const container = document.getElementById('events-list');
if (!container) return;

container.innerHTML = '';

if (this.events.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucun événement à afficher</p>';
return;
}

this.events.slice(0, 5).forEach(event => {
const item = document.createElement('div');
item.className = 'activity-item';

let date;
if (event.date && event.date.seconds) {
date = new Date(event.date.seconds * 1000);
} else {
date = new Date();
}

item.innerHTML = `
<i class="fas fa-calendar" style="color: #667eea;"></i>
<div style="flex: 1;">
<strong>${event.title}</strong>
<br><small style="color: #666;">${event.description || ''}</small>
<br><small style="color: #28a745; font-weight: bold;">${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</small>
</div>
`;
container.appendChild(item);
});
}

updateChatDisplay() {
const container = document.getElementById('messages-area');
if (!container) return;

// Garder les premiers messages (bienvenue)
const welcomeMessage = container.querySelector('div[style*="text-align: center"]');
container.innerHTML = '';

if (welcomeMessage && this.messages.length === 0) {
container.appendChild(welcomeMessage);
}

this.messages.forEach(message => {
const messageDiv = document.createElement('div');
const isOwnMessage = message.userId === currentUser.uid;
let timestamp;

if (message.timestamp && message.timestamp.seconds) {
timestamp = new Date(message.timestamp.seconds * 1000);
} else {
timestamp = new Date();
}

messageDiv.style.cssText = `display: flex; gap: 1rem; padding: 0.5rem 1rem; margin-bottom: 0.5rem; ${isOwnMessage ? 'flex-direction: row-reverse;' : ''}`;

messageDiv.innerHTML = `
<div style="width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
${message.userName.charAt(0).toUpperCase()}
</div>
<div style="${isOwnMessage ? 'text-align: right;' : ''}">
<div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; ${isOwnMessage ? 'flex-direction: row-reverse;' : ''}">
<strong>${isOwnMessage ? 'Vous' : message.userName}</strong>
<small style="color: #666;">${timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
</div>
<div class="message-bubble ${isOwnMessage ? 'own' : 'other'}">
${message.text}
</div>
</div>
`;

container.appendChild(messageDiv);
});

// Scroll vers le bas
container.scrollTop = container.scrollHeight;
}

updateStoreDisplay() {
const container = document.getElementById('store-items');
if (!container) return;

container.innerHTML = '';

if (this.storeItems.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Aucun article disponible</p>';
return;
}

this.storeItems.forEach(item => {
const card = document.createElement('div');
card.className = 'store-item-card animate-slide-up';

const canAfford = this.userProgress.coins >= item.price;
const buttonClass = canAfford && item.stock > 0 ? 'btn-primary' : 'btn-secondary';
const buttonText = item.stock <= 0 ? 'Rupture de stock' : !canAfford ? 'Gains insuffisants' : 'Acheter';
const buttonDisabled = !canAfford || item.stock <= 0;

card.innerHTML = `
<div style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">${item.icon}</div>
<h3>${item.name}</h3>
<p style="color: #666; margin-bottom: 1rem;">${item.description}</p>
<div style="display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; margin-bottom: 1rem;">
<i class="fas fa-coins"></i>
${item.price} gains
</div>
<div style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
Stock: ${item.stock}
</div>
<button onclick="window.synergia?.purchaseItem?.('${item.id}')" class="btn ${buttonClass}" style="width: 100%;" ${buttonDisabled ? 'disabled' : ''}>
<i class="fas fa-shopping-cart"></i>
${buttonText}
</button>
`;

container.appendChild(card);
});
}

updateTransactionsDisplay() {
const container = document.getElementById('recent-transactions');
if (!container) return;

container.innerHTML = '';

if (this.transactions.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Aucune transaction récente</p>';
return;
}

this.transactions.slice(0, 10).forEach(transaction => {
const item = document.createElement('div');
item.className = 'transaction-item';

const isIncome = transaction.amount > 0;
const iconClass = isIncome ? 'income' : 'expense';

let timestamp;
if (transaction.timestamp && transaction.timestamp.seconds) {
timestamp = new Date(transaction.timestamp.seconds * 1000);
} else {
timestamp = new Date();
}

item.innerHTML = `
<div class="transaction-icon ${iconClass}">
<i class="fas fa-coins"></i>
</div>
<div style="flex: 1;">
<strong>${transaction.description}</strong>
<br><small style="color: #666;">${transaction.type || 'Transaction'}</small>
<br><small style="color: #666;">${timestamp.toLocaleDateString('fr-FR')} à ${timestamp.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</small>
</div>
<div style="text-align: right;">
<strong style="color: ${isIncome ? '#28a745' : '#dc3545'};">
${isIncome ? '+' : ''}${transaction.amount} gains
</strong>
</div>
`;

container.appendChild(item);
});
}

updateTransfersDisplay() {
const container = document.getElementById('member-transfers');
if (!container) return;

container.innerHTML = '';

if (this.transfers.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Aucun échange en cours</p>';
return;
}

this.transfers.forEach(transfer => {
const item = document.createElement('div');
item.className = 'transaction-item';

const isOutgoing = transfer.fromUserId === currentUser.uid;
const otherUser = isOutgoing ? transfer.toUserName : transfer.fromUserName;

let timestamp;
if (transfer.timestamp && transfer.timestamp.seconds) {
timestamp = new Date(transfer.timestamp.seconds * 1000);
} else {
timestamp = new Date();
}

item.innerHTML = `
<div class="transaction-icon transfer">
<i class="fas ${isOutgoing ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
</div>
<div style="flex: 1;">
<strong>${isOutgoing ? 'Envoyé à' : 'Reçu de'} ${otherUser}</strong>
<br><small style="color: #666;">${transfer.message || 'Aucun message'}</small>
<br><small style="color: #666;">${timestamp.toLocaleDateString('fr-FR')}</small>
</div>
<div style="text-align: right;">
<strong style="color: ${transfer.status === 'completed' ? '#28a745' : '#ffc107'};">
${transfer.amount} gains
</strong>
<br><small style="color: #666;">${transfer.status === 'pending' ? 'En attente' : 'Terminé'}</small>
${transfer.status === 'pending' && !isOutgoing ? `
<br><button onclick="window.synergia?.acceptTransfer?.('${transfer.id}')" class="btn btn-success" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.8rem;">
Accepter
</button>
` : ''}
</div>
`;

container.appendChild(item);
});
}

updateLeaderboard() {
const container = document.getElementById('coins-leaderboard');
if (!container) return;

// Trier les utilisateurs par gains totaux
const sortedUsers = [...this.users].sort((a, b) => (b.totalCoinsEarned || 0) - (a.totalCoinsEarned || 0));

container.innerHTML = '';

if (sortedUsers.length === 0) {
container.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Aucun classement disponible</p>';
return;
}

sortedUsers.slice(0, 10).forEach((user, index) => {
const item = document.createElement('div');
item.className = 'leaderboard-item';

const rank = index + 1;
if (rank <= 3) {
item.classList.add('top3');
}

const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
const currentUserClass = user.id === currentUser.uid ? 'style="background: rgba(102, 126, 234, 0.1);"' : '';

item.innerHTML = `
<div class="leaderboard-rank ${rankClass}">
${rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
</div>
<div style="flex: 1;" ${currentUserClass}>
<strong>${user.displayName || user.email}</strong>
<br><small style="color: #666;">Niveau ${user.level || 1}</small>
</div>
<div style="text-align: right;">
<strong style="color: #667eea;">${user.totalCoinsEarned || 0} gains</strong>
<br><small style="color: #666;">gagnés au total</small>
</div>
`;

container.appendChild(item);
});
}

updateDashboardStats() {
const elements = {
'team-count': this.users.length,
'active-quests': this.quests.length,
'events-today': this.getTodayEventsCount(),
'user-level': this.userProgress.level,
'user-xp': this.userProgress.xp,
'user-coins-dashboard': this.userProgress.coins
};

Object.entries(elements).forEach(([id, value]) => {
const element = document.getElementById(id);
if (element) {
element.textContent = value;
}
});

this.updateProgressDisplay();
this.updateCoinsDisplay();

// Mettre à jour les stats du portefeuille
const today = new Date();
const todayTransactions = this.transactions.filter(t => {
if (!t.timestamp || !t.timestamp.seconds) return false;
const transactionDate = new Date(t.timestamp.seconds * 1000);
return transactionDate.toDateString() === today.toDateString() && t.amount > 0;
});

const todayEarned = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
const walletEarnedElement = document.getElementById('wallet-earned-today');
if (walletEarnedElement) walletEarnedElement.textContent = todayEarned;

const pendingTransfers = this.transfers.filter(t => t.status === 'pending').length;
const walletTransfersElement = document.getElementById('wallet-transfers');
if (walletTransfersElement) walletTransfersElement.textContent = pendingTransfers;

const thisMonth = new Date();
thisMonth.setDate(1);
const monthlySpent = this.transactions
.filter(t => {
if (!t.timestamp || !t.timestamp.seconds) return false;
const transactionDate = new Date(t.timestamp.seconds * 1000);
return transactionDate >= thisMonth && t.amount < 0;
})
.reduce((sum, t) => sum + Math.abs(t.amount), 0);

const walletSpentElement = document.getElementById('wallet-spent');
if (walletSpentElement) walletSpentElement.textContent = monthlySpent;
}

getTodayEventsCount() {
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

return this.events.filter(event => {
if (!event.date || !event.date.seconds) return false;
const eventDate = new Date(event.date.seconds * 1000);
return eventDate >= today && eventDate < tomorrow;
}).length;
}

// Méthodes d'actions
async createEvent() {
const title = document.getElementById('event-title').value.trim();
const description = document.getElementById('event-description').value.trim();
const date = document.getElementById('event-date').value;
const time = document.getElementById('event-time').value;
const type = document.getElementById('event-type').value;

if (!title || !date || !time || !type) {
this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
return;
}

try {
const eventData = {
title,
description,
date: new Date(`${date}T${time}`),
type,
companyId: currentCompany.id,
createdBy: currentUser.uid,
createdAt: window.firebase.serverTimestamp()
};

await window.firebase.addDoc(
window.firebase.collection(window.db, 'events'),
eventData
);

this.closeModal('add-event-modal');
this.showToast(`Événement "${title}" créé avec succès`, 'success');

// Réinitialiser le formulaire
const eventForm = document.getElementById('event-form');
if (eventForm) eventForm.reset();

} catch (error) {
console.error('Erreur création événement:', error);
this.showToast('Erreur lors de la création de l\'événement', 'error');
}
}

async addMember() {
const name = document.getElementById('member-name').value.trim();
const email = document.getElementById('member-email').value.trim();
const role = document.getElementById('member-role').value;
const department = document.getElementById('member-department').value;

if (!name || !email || !role) {
this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
return;
}

try {
const memberData = {
name,
email,
role,
department,
companyId: currentCompany.id,
level: 1,
xp: 0,
status: 'offline',
joinedAt: window.firebase.serverTimestamp()
};

await window.firebase.addDoc(
window.firebase.collection(window.db, 'users'),
memberData
);

this.closeModal('add-member-modal');
this.showToast(`Membre "${name}" ajouté avec succès`, 'success');

// Réinitialiser le formulaire
const memberForm = document.getElementById('member-form');
if (memberForm) memberForm.reset();

} catch (error) {
console.error('Erreur ajout membre:', error);
this.showToast('Erreur lors de l\'ajout du membre', 'error');
}
}

async createQuest() {
const title = document.getElementById('quest-title').value.trim();
const description = document.getElementById('quest-description').value.trim();
const type = document.getElementById('quest-type').value;
const xp = parseInt(document.getElementById('quest-xp').value);
const difficulty = document.getElementById('quest-difficulty').value;

if (!title || !description || !xp) {
this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
return;
}

try {
const questData = {
title,
description,
type,
xp,
difficulty,
icon: this.getQuestIcon(type),
active: true,
companyId: currentCompany.id,
createdBy: currentUser.uid,
createdAt: window.firebase.serverTimestamp()
};

await window.firebase.addDoc(
window.firebase.collection(window.db, 'quests'),
questData
);

this.showToast(`Mission "${title}" créée avec succès`, 'success');

// Réinitialiser le formulaire
const questForm = document.getElementById('quest-form');
if (questForm) questForm.reset();

} catch (error) {
console.error('Erreur création mission:', error);
this.showToast('Erreur lors de la création de la mission', 'error');
}
}

async sendMessage() {
const messageInput = document.getElementById('message-input');
if (!messageInput) return;

const messageText = messageInput.value.trim();

if (!messageText) return;

try {
const messageData = {
text: messageText,
userId: currentUser.uid,
userName: currentUser.displayName || currentUser.email,
userPhoto: currentUser.photoURL,
companyId: currentCompany.id,
timestamp: window.firebase.serverTimestamp()
};

await window.firebase.addDoc(
window.firebase.collection(window.db, 'messages'),
messageData
);

messageInput.value = '';

} catch (error) {
console.error('Erreur envoi message:', error);
this.showToast('Erreur lors de l\'envoi du message', 'error');
}
}

async updateProfile() {
const name = document.getElementById('profile-name').value.trim();
const company = document.getElementById('profile-company').value.trim();

try {
const updatePromises = [];

// Mettre à jour le profil Firebase Auth
if (name && name !== currentUser.displayName) {
updatePromises.push(
window.firebase.updateProfile(currentUser, {
displayName: name
})
);
}

// Mettre à jour le document utilisateur
updatePromises.push(
window.firebase.updateDoc(
window.firebase.doc(window.db, 'users', currentUser.uid),
{
displayName: name,
lastUpdated: window.firebase.serverTimestamp()
}
)
);

// Mettre à jour l'entreprise si nécessaire
if (company && company !== currentCompany.name) {
updatePromises.push(
window.firebase.updateDoc(
window.firebase.doc(window.db, 'companies', currentCompany.id),
{
name: company,
lastUpdated: window.firebase.serverTimestamp()
}
)
);
currentCompany.name = company;
}

await Promise.all(updatePromises);

this.showToast('Profil mis à jour avec succès', 'success');
this.updateUserInterface();

} catch (error) {
console.error('Erreur mise à jour profil:', error);
this.showToast('Erreur lors de la mise à jour du profil', 'error');
}
}

async acceptQuest(questId) {
const quest = this.quests.find(q => q.id === questId);
if (!quest) return;

// Vérifier si la mission n'est pas déjà complétée
const isAlreadyCompleted = this.completedQuests.some(completion => completion.questId === questId);
if (isAlreadyCompleted) {
this.showToast('Cette mission a déjà été complétée !', 'warning');
return;
}

try {
// Vérifier à nouveau dans la base de données (au cas où)
const existingCompletionQuery = window.firebase.query(
window.firebase.collection(window.db, 'quest_completions'),
window.firebase.where('questId', '==', questId),
window.firebase.where('userId', '==', currentUser.uid),
window.firebase.where('companyId', '==', currentCompany.id)
);

const existingCompletions = await window.firebase.getDocs(existingCompletionQuery);

if (!existingCompletions.empty) {
this.showToast('Cette mission a déjà été complétée !', 'warning');
return;
}

// Enregistrer la completion AVANT d'ajouter l'XP
await window.firebase.addDoc(
window.firebase.collection(window.db, 'quest_completions'),
{
questId: quest.id,
userId: currentUser.uid,
companyId: currentCompany.id,
xpGained: quest.xp,
completedAt: window.firebase.serverTimestamp()
}
);

// Puis ajouter l'XP à l'utilisateur
await this.addXP(quest.xp);

this.showToast(`🎉 Mission complétée ! +${quest.xp} XP`, 'success');

// Forcer la mise à jour de l'affichage
setTimeout(() => {
this.updateQuestsDisplay();
this.updateUserProgress();
}, 500);

} catch (error) {
console.error('Erreur completion mission:', error);
this.showToast('Erreur lors de la completion de la mission', 'error');
}
}

async addXP(amount) {
try {
const userRef = window.firebase.doc(window.db, 'users', currentUser.uid);
const userDoc = await window.firebase.getDoc(userRef);

if (userDoc.exists()) {
const currentXP = userDoc.data().xp || 0;
const currentLevel = userDoc.data().level || 1;
const currentCoins = userDoc.data().coins || 0;
const totalCoinsEarned = userDoc.data().totalCoinsEarned || 0;

const newXP = currentXP + amount;
const newLevel = Math.floor(newXP / 100) + 1; // 100 XP par niveau
const newCoins = currentCoins + amount; // 1 XP = 1 gain
const newTotalCoinsEarned = totalCoinsEarned + amount;

await window.firebase.updateDoc(userRef, {
xp: newXP,
level: newLevel,
coins: newCoins,
totalCoinsEarned: newTotalCoinsEarned
});

// Enregistrer la transaction
await this.recordTransaction('quest_reward', amount, `Mission complétée: +${amount} XP/gains`);

this.userProgress = { level: newLevel, xp: newXP, coins: newCoins };
this.updateProgressDisplay();
this.updateCoinsDisplay();

// Animations et notifications
this.animateCoinsGain(amount);

if (newLevel > currentLevel) {
this.showToast(`🎊 Niveau ${newLevel} atteint !`, 'success');
}
}
} catch (error) {
console.error('Erreur ajout XP:', error);
throw error;
}
}

async recordTransaction(type, amount, description) {
try {
await window.firebase.addDoc(
window.firebase.collection(window.db, 'transactions'),
{
userId: currentUser.uid,
type: type,
amount: amount,
description: description,
companyId: currentCompany.id,
timestamp: window.firebase.serverTimestamp()
}
);
} catch (error) {
console.error('Erreur enregistrement transaction:', error);
}
}

async purchaseItem(itemId) {
const item = this.storeItems.find(i => i.id === itemId);
if (!item) return;

try {
const userRef = window.firebase.doc(window.db, 'users', currentUser.uid);
const userDoc = await window.firebase.getDoc(userRef);

if (!userDoc.exists()) return;

const userCoins = userDoc.data().coins || 0;

if (userCoins < item.price) {
this.showToast('Gains insuffisants pour cet achat', 'error');
return;
}

if (item.stock <= 0) {
this.showToast('Article en rupture de stock', 'error');
return;
}

// Afficher modal de confirmation
this.showPurchaseModal(item);

} catch (error) {
console.error('Erreur achat:', error);
this.showToast('Erreur lors de l\'achat', 'error');
}
}

showPurchaseModal(item) {
const modal = document.getElementById('purchase-modal');
const details = document.getElementById('purchase-details');

if (!modal || !details) return;

details.innerHTML = `
<div style="text-align: center; margin-bottom: 2rem;">
<div style="font-size: 4rem; margin-bottom: 1rem;">${item.icon}</div>
<h3>${item.name}</h3>
<p style="color: #666; margin: 1rem 0;">${item.description}</p>
<div style="display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; margin: 1rem auto;">
<i class="fas fa-coins"></i>
${item.price} gains
</div>
<p style="font-size: 0.9rem; color: #666;">
Gains disponibles: <strong>${this.userProgress.coins}</strong>
</p>
</div>
`;

const confirmBtn = document.getElementById('confirm-purchase-btn');
if (confirmBtn) {
confirmBtn.onclick = () => this.confirmPurchase(item.id);
}

this.showModal('purchase-modal');
}

async confirmPurchase(itemId) {
try {
const item = this.storeItems.find(i => i.id === itemId);
if (!item) return;

// Décrémenter les gains de l'utilisateur
const userRef = window.firebase.doc(window.db, 'users', currentUser.uid);
const userDoc = await window.firebase.getDoc(userRef);
const currentCoins = userDoc.data().coins || 0;
const totalSpent = userDoc.data().totalCoinsSpent || 0;

await window.firebase.updateDoc(userRef, {
coins: currentCoins - item.price,
totalCoinsSpent: totalSpent + item.price
});

// Décrémenter le stock
const itemRef = window.firebase.doc(window.db, 'store_items', itemId);
await window.firebase.updateDoc(itemRef, {
stock: item.stock - 1
});

// Enregistrer l'achat
await window.firebase.addDoc(
window.firebase.collection(window.db, 'purchases'),
{
userId: currentUser.uid,
userName: currentUser.displayName || currentUser.email,
itemId: itemId,
itemName: item.name,
price: item.price,
companyId: currentCompany.id,
status: 'pending',
timestamp: window.firebase.serverTimestamp()
}
);

// Enregistrer la transaction
await this.recordTransaction('purchase', -item.price, `Achat: ${item.name}`);

this.userProgress.coins = currentCoins - item.price;
this.updateCoinsDisplay();

this.closeModal('purchase-modal');
this.showToast(`🎉 "${item.name}" acheté avec succès !`, 'success');

} catch (error) {
console.error('Erreur achat:', error);
this.showToast('Erreur lors de l\'achat', 'error');
}
}

populateTransferOptions() {
const recipientSelect = document.getElementById('transfer-recipient');
const requestFromSelect = document.getElementById('request-from');

// Nettoyer les options existantes
if (recipientSelect) {
recipientSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
}
if (requestFromSelect) {
requestFromSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
}

// Ajouter les autres membres de l'équipe
this.users.forEach(user => {
if (user.id !== currentUser.uid) {
const option = `<option value="${user.id}">${user.displayName || user.email}</option>`;
if (recipientSelect) recipientSelect.innerHTML += option;
if (requestFromSelect) requestFromSelect.innerHTML += option;
}
});
}

async sendTransfer() {
const recipientId = document.getElementById('transfer-recipient').value;
const amount = parseInt(document.getElementById('transfer-amount').value);
const message = document.getElementById('transfer-message').value.trim();

if (!recipientId || !amount || amount <= 0) {
this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
return;
}

try {
const userRef = window.firebase.doc(window.db, 'users', currentUser.uid);
const userDoc = await window.firebase.getDoc(userRef);
const currentCoins = userDoc.data().coins || 0;

if (currentCoins < amount) {
this.showToast('Gains insuffisants pour cet envoi', 'error');
return;
}

// Créer le transfert
await window.firebase.addDoc(
window.firebase.collection(window.db, 'transfers'),
{
fromUserId: currentUser.uid,
fromUserName: currentUser.displayName || currentUser.email,
toUserId: recipientId,
toUserName: this.users.find(u => u.id === recipientId)?.displayName || 'Utilisateur',
amount: amount,
message: message,
status: 'pending',
companyId: currentCompany.id,
participants: [currentUser.uid, recipientId],
timestamp: window.firebase.serverTimestamp()
}
);

this.closeModal('send-transfer-modal');
this.showToast('Demande de transfert envoyée', 'success');

const sendTransferForm = document.getElementById('send-transfer-form');
if (sendTransferForm) sendTransferForm.reset();

} catch (error) {
console.error('Erreur transfert:', error);
this.showToast('Erreur lors du transfert', 'error');
}
}

async requestTransfer() {
const fromUserId = document.getElementById('request-from').value;
const amount = parseInt(document.getElementById('request-amount').value);
const reason = document.getElementById('request-reason').value.trim();

if (!fromUserId || !amount || !reason || amount <= 0) {
this.showToast('Veuillez remplir tous les champs obligatoires', 'error');
return;
}

try {
await window.firebase.addDoc(
window.firebase.collection(window.db, 'transfers'),
{
fromUserId: fromUserId,
fromUserName: this.users.find(u => u.id === fromUserId)?.displayName || 'Utilisateur',
toUserId: currentUser.uid,
toUserName: currentUser.displayName || currentUser.email,
amount: amount,
message: reason,
status: 'pending',
type: 'request',
companyId: currentCompany.id,
participants: [currentUser.uid, fromUserId],
timestamp: window.firebase.serverTimestamp()
}
);

this.closeModal('request-transfer-modal');
this.showToast('Demande de gains envoyée', 'success');

const requestTransferForm = document.getElementById('request-transfer-form');
if (requestTransferForm) requestTransferForm.reset();

} catch (error) {
console.error('Erreur demande:', error);
this.showToast('Erreur lors de la demande', 'error');
}
}

async acceptTransfer(transferId) {
try {
const transfer = this.transfers.find(t => t.id === transferId);
if (!transfer || transfer.status !== 'pending') return;

// Vérifier que l'expéditeur a assez de gains
const senderRef = window.firebase.doc(window.db, 'users', transfer.fromUserId);
const senderDoc = await window.firebase.getDoc(senderRef);
const senderCoins = senderDoc.data().coins || 0;

if (senderCoins < transfer.amount) {
this.showToast('L\'expéditeur n\'a plus assez de gains', 'error');
return;
}

// Effectuer le transfert
const batch = window.firebase.writeBatch(window.db);

// Décrémenter les gains de l'expéditeur
batch.update(senderRef, {
coins: senderCoins - transfer.amount
});

// Incrémenter les gains du destinataire
const receiverRef = window.firebase.doc(window.db, 'users', currentUser.uid);
const receiverDoc = await window.firebase.getDoc(receiverRef);
const receiverCoins = receiverDoc.data().coins || 0;

batch.update(receiverRef, {
coins: receiverCoins + transfer.amount
});

// Marquer le transfert comme complété
const transferRef = window.firebase.doc(window.db, 'transfers', transferId);
batch.update(transferRef, {
status: 'completed',
completedAt: window.firebase.serverTimestamp()
});

await batch.commit();

// Enregistrer les transactions
await this.recordTransaction('transfer_received', transfer.amount, `Reçu de ${transfer.fromUserName}`);

// Mettre à jour l'affichage local
this.userProgress.coins = receiverCoins + transfer.amount;
this.updateCoinsDisplay();

this.showToast(`${transfer.amount} gains reçus de ${transfer.fromUserName}`, 'success');

} catch (error) {
console.error('Erreur acceptation transfert:', error);
this.showToast('Erreur lors de l\'acceptation du transfert', 'error');
}
}

async requestSpecialQuest(questId) {
const quest = this.quests.find(q => q.id === questId);
if (!quest) return;

// Vérifier s'il y a déjà une demande en cours
const existingRequest = this.questRequests.find(request => 
request.questId === questId && request.status === 'pending'
);

if (existingRequest) {
this.showToast('Une demande est déjà en cours pour cette mission', 'warning');
return;
}

try {
await window.firebase.addDoc(
window.firebase.collection(window.db, 'quest_requests'),
{
questId: quest.id,
questTitle: quest.title,
questXp: quest.xp,
userId: currentUser.uid,
userName: currentUser.displayName || currentUser.email,
userEmail: currentUser.email,
companyId: currentCompany.id,
status: 'pending',
message: '',
requestedAt: window.firebase.serverTimestamp()
}
);

this.showToast('📋 Demande envoyée à l\'administrateur', 'success');

// Forcer la mise à jour de l'affichage
setTimeout(() => {
this.updateQuestsDisplay();
}, 500);

} catch (error) {
console.error('Erreur demande mission:', error);
this.showToast('Erreur lors de la demande', 'error');
}
}

// Méthode pour les admins pour approuver/rejeter les demandes
async handleQuestRequest(requestId, action, adminMessage = '') {
try {
const requestRef = window.firebase.doc(window.db, 'quest_requests', requestId);
const requestDoc = await window.firebase.getDoc(requestRef);

if (!requestDoc.exists()) return;

const requestData = requestDoc.data();

if (action === 'approve') {
// Approuver et compléter automatiquement la mission
await window.firebase.updateDoc(requestRef, {
status: 'approved',
adminMessage: adminMessage,
approvedAt: window.firebase.serverTimestamp(),
approvedBy: currentUser.uid
});

// Compléter la mission pour l'utilisateur
await this.completeQuestForUser(requestData.questId, requestData.userId, requestData.questXp);

this.showToast(`✅ Demande approuvée pour ${requestData.userName}`, 'success');

} else if (action === 'reject') {
await window.firebase.updateDoc(requestRef, {
status: 'rejected',
adminMessage: adminMessage,
rejectedAt: window.firebase.serverTimestamp(),
rejectedBy: currentUser.uid
});

this.showToast(`❌ Demande rejetée pour ${requestData.userName}`, 'info');
}

} catch (error) {
console.error('Erreur traitement demande:', error);
this.showToast('Erreur lors du traitement de la demande', 'error');
}
}

async completeQuestForUser(questId, userId, xpAmount) {
try {
// Enregistrer la completion
await window.firebase.addDoc(
window.firebase.collection(window.db, 'quest_completions'),
{
questId: questId,
userId: userId,
companyId: currentCompany.id,
xpGained: xpAmount,
completedAt: window.firebase.serverTimestamp(),
approvedByAdmin: true
}
);

// Mettre à jour l'XP et les gains de l'utilisateur
const userRef = window.firebase.doc(window.db, 'users', userId);
const userDoc = await window.firebase.getDoc(userRef);

if (userDoc.exists()) {
const currentData = userDoc.data();
const currentXP = currentData.xp || 0;
const currentLevel = currentData.level || 1;
const currentCoins = currentData.coins || 0;
const totalCoinsEarned = currentData.totalCoinsEarned || 0;

const newXP = currentXP + xpAmount;
const newLevel = Math.floor(newXP / 100) + 1;
const newCoins = currentCoins + xpAmount;
const newTotalCoinsEarned = totalCoinsEarned + xpAmount;

await window.firebase.updateDoc(userRef, {
xp: newXP,
level: newLevel,
coins: newCoins,
totalCoinsEarned: newTotalCoinsEarned
});

// Enregistrer la transaction
await window.firebase.addDoc(
window.firebase.collection(window.db, 'transactions'),
{
userId: userId,
type: 'special_quest_reward',
amount: xpAmount,
description: `Mission spéciale approuvée: +${xpAmount} XP/gains`,
companyId: currentCompany.id,
timestamp: window.firebase.serverTimestamp()
}
);
}

} catch (error) {
console.error('Erreur completion mission utilisateur:', error);
throw error;
}
}

async connectGoogleCalendar() {
if (!tokenClient) {
this.showToast('Google Calendar non disponible', 'error');
return;
}

try {
this.showToast('Connexion à Google Calendar...', 'info');
tokenClient.requestAccessToken();

} catch (error) {
console.error('Erreur Google Calendar:', error);
this.showToast('Erreur de connexion à Google Calendar', 'error');
}
}

async handleGoogleCalendarAuth(response) {
if (response.error) {
console.error('Erreur auth Google Calendar:', response.error);
return;
}

try {
isGoogleCalendarConnected = true;

// Mettre à jour l'interface
this.updateGoogleCalendarStatus();

// Synchroniser les événements
await this.syncGoogleCalendar();

this.showToast('Google Calendar connecté avec succès !', 'success');

} catch (error) {
console.error('Erreur traitement auth Google:', error);
}
}

async syncGoogleCalendar() {
if (!isGoogleCalendarConnected) return;

try {
const now = new Date();
const timeMin = now.toISOString();
const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

const response = await gapi.client.calendar.events.list({
calendarId: 'primary',
timeMin: timeMin,
timeMax: timeMax,
showDeleted: false,
singleEvents: true,
orderBy: 'startTime'
});

const googleEvents = response.result.items || [];
console.log(`📅 ${googleEvents.length} événements Google Calendar trouvés`);

// Sauvegarder les événements dans Firebase
for (const event of googleEvents) {
await this.saveGoogleEvent(event);
}

this.showToast(`${googleEvents.length} événements synchronisés`, 'success');

} catch (error) {
console.error('Erreur sync Google Calendar:', error);
this.showToast('Erreur de synchronisation', 'error');
}
}

async saveGoogleEvent(googleEvent) {
try {
const eventData = {
title: googleEvent.summary || 'Sans titre',
description: googleEvent.description || '',
date: new Date(googleEvent.start?.dateTime || googleEvent.start?.date),
type: 'google',
source: 'google_calendar',
googleEventId: googleEvent.id,
companyId: currentCompany.id,
createdAt: window.firebase.serverTimestamp()
};

// Vérifier si l'événement existe déjà
const existingQuery = window.firebase.query(
window.firebase.collection(window.db, 'events'),
window.firebase.where('googleEventId', '==', googleEvent.id),
window.firebase.where('companyId', '==', currentCompany.id)
);

const existingDocs = await window.firebase.getDocs(existingQuery);

if (existingDocs.empty) {
await window.firebase.addDoc(
window.firebase.collection(window.db, 'events'),
eventData
);
}

} catch (error) {
console.error('Erreur sauvegarde événement Google:', error);
}
}

updateGoogleCalendarStatus() {
const statusElements = [
document.getElementById('google-calendar-status'),
document.getElementById('google-status')
];

statusElements.forEach(element => {
if (element) {
if (isGoogleCalendarConnected) {
element.className = 'connection-status connected';
element.innerHTML = '<i class="fas fa-check"></i> Connecté';
} else {
element.className = 'connection-status disconnected';
element.innerHTML = '<i class="fas fa-times"></i> Non connecté';
}
}
});

// Mettre à jour le bouton
const connectBtn = document.getElementById('connect-google-calendar');
if (connectBtn) {
if (isGoogleCalendarConnected) {
connectBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Synchroniser';
connectBtn.onclick = () => this.syncGoogleCalendar();
} else {
connectBtn.innerHTML = '<i class="fab fa-google"></i> Connecter Google Calendar';
connectBtn.onclick = () => this.connectGoogleCalendar();
}
}
}

// Méthodes utilitaires
animateCoinsGain(amount) {
// Animation des gains dans la navbar
const coinsElement = document.getElementById('user-coins');
if (coinsElement) {
coinsElement.parentElement.classList.add('coins-animation');
setTimeout(() => {
coinsElement.parentElement.classList.remove('coins-animation');
}, 500);
}

// Notification spéciale pour les gains
this.showCoinsNotification(`+${amount} gains gagnés !`);
}

showCoinsNotification(message) {
const toast = document.createElement('div');
toast.className = 'notification coins-notification';

toast.innerHTML = `
<div style="display: flex; align-items: center; gap: 0.5rem;">
<i class="fas fa-coins"></i>
<span>${message}</span>
</div>
`;

const container = document.getElementById('toast-container');
if (container) {
container.appendChild(toast);

setTimeout(() => {
toast.remove();
}, 3000);
}
}

filterStoreItems(category) {
// Retirer l'active de tous les onglets
document.querySelectorAll('.store-tab').forEach(tab => {
tab.classList.remove('active');
});

// Activer l'onglet cliqué
const activeTab = document.querySelector(`[data-category="${category}"]`);
if (activeTab) activeTab.classList.add('active');

// Mettre à jour l'affichage
this.updateStoreDisplay();
}

filterQuests(type) {
// Retirer l'active de tous les onglets
document.querySelectorAll('.quest-tab').forEach(tab => {
tab.classList.remove('active');
});

// Activer l'onglet cliqué
const activeTab = document.querySelector(`[data-type="${type}"]`);
if (activeTab) activeTab.classList.add('active');

// Mettre à jour l'affichage
this.updateQuestsDisplay();
}

getQuestIcon(type) {
const icons = {
daily: '⭐',
weekly: '🗓️',
special: '🎁'
};
return icons[type] || '🎯';
}

refreshDashboard() {
this.showToast('Dashboard actualisé', 'success');
this.updateDashboardStats();
this.updateQuestsDisplay();
this.updateUserProgress();
console.log('🔄 Dashboard refresh:', {
completedQuests: this.completedQuests.length,
questRequests: this.questRequests.length,
quests: this.quests.length
});

// Force refresh avec logs détaillés
console.log('🔄 Force refreshing quests display...');
setTimeout(() => {
this.updateQuestsDisplay();
}, 100);
}

updateUserProgress() {
// Recharger les données utilisateur depuis Firebase
this.loadUserProgress();
}

// Méthode publique pour ouvrir le portefeuille
openWallet() {
this.switchSection('wallet');
this.updateLeaderboard();
}

showToast(message, type = 'info', duration = 3000) {
const toast = document.createElement('div');
toast.className = `notification ${type}`;

const icon = type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation' : 'info';

toast.innerHTML = `
<div style="display: flex; align-items: center; gap: 0.5rem;">
<i class="fas fa-${icon}"></i>
<span>${message}</span>
</div>
`;

const container = document.getElementById('toast-container');
if (container) {
container.appendChild(toast);

setTimeout(() => {
toast.remove();
}, duration);
}
}
}

// Fermeture des modales (fonction globale)
function closeModal(modalId) {
const modal = document.getElementById(modalId);
if (modal) {
modal.style.display = 'none';
}
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
console.log('🚀 Démarrage SYNERGIA v3.0 Production Firebase');

// Attendre que Firebase soit prêt
function initializeApp() {
if (window.firebaseReady) {
// Créer l'instance globale
window.synergia = new SynergiaApp();
console.log('✅ SYNERGIA initialisé avec Firebase');
} else {
// Attendre Firebase
window.addEventListener('firebaseReady', function() {
window.synergia = new SynergiaApp();
console.log('✅ SYNERGIA initialisé après Firebase');
});
}
}

initializeApp();
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js")
            .then(() => console.log("Service worker enregistré"));
    }
});
