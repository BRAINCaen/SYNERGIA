// main.js - Point d'entrée principal de l'application

// Importer les modules
import { auth, db } from './firebase-config.js';
import authModule from './auth.js';
import rolesModule from './roles.js';
import questsModule from './quests.js';
import badgesModule from './badges.js';
import calendarModule from './calendar.js';
import chatModule from './chat.js';
import dashboardModule from './dashboard.js';

// État global de l'application
let currentPage = 'dashboard';
let currentUser = null;
let isInitialized = false;

// Initialiser l'application
function initApp() {
    // Écouteur d'authentification
    auth.onAuthStateChanged(user => {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const appScreen = document.getElementById('app');
        
        if (user) {
            // Utilisateur connecté
            currentUser = user;
            
            // Masquer l'écran de connexion et afficher l'application
            loginScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            
            // Initialiser l'application si ce n'est pas déjà fait
            if (!isInitialized) {
                initializeModules();
                setupEventListeners();
                loadUserInfo();
                isInitialized = true;
            }
            
            // Charger la page actuelle
            loadPage(currentPage);
            
            // Masquer l'écran de chargement
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
        } else {
            // Utilisateur non connecté
            currentUser = null;
            
            // Masquer l'application et afficher l'écran de connexion
            appScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            
            // Masquer l'écran de chargement
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
            
            // Initialiser le formulaire de connexion
            setupLoginForm();
        }
    });
}

// Initialiser tous les modules
function initializeModules() {
    // Initialiser les modules principaux
    chatModule.initChat();
    questsModule.initQuests();
    rolesModule.initRoles();
    badgesModule.initBadges();
}

// Configurer les écouteurs d'événements globaux
function setupEventListeners() {
    // Navigation principale
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = button.getAttribute('data-page');
            loadPage(page);
        });
    });
    
    // Boutons de navigation secondaires
    document.addEventListener('click', e => {
        if (e.target.matches('[data-page]') || e.target.closest('[data-page]')) {
            const button = e.target.matches('[data-page]') ? e.target : e.target.closest('[data-page]');
            const page = button.getAttribute('data-page');
            loadPage(page);
            e.preventDefault();
        }
    });
    
    // Panneau de notifications
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsPanel = document.getElementById('notifications-panel');
    const closeNotifications = document.getElementById('close-notifications');
    
    notificationsBtn.addEventListener('click', () => {
        notificationsPanel.classList.toggle('hidden');
        loadNotifications();
    });
    
    closeNotifications.addEventListener('click', () => {
        notificationsPanel.classList.add('hidden');
    });
    
    // Fermer les panneaux en cliquant à l'extérieur
    document.addEventListener('click', e => {
        if (!notificationsPanel.classList.contains('hidden') && 
            !notificationsPanel.contains(e.target) && 
            e.target !== notificationsBtn &&
            !notificationsBtn.contains(e.target)) {
            notificationsPanel.classList.add('hidden');
        }
    });
    
    // Fermer les modales avec la touche Echap
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            // Fermer toutes les modales
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
            
            // Fermer les panneaux
            notificationsPanel.classList.add('hidden');
        }
    });
}

// Configurer le formulaire de connexion
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Afficher l'écran de chargement
        document.getElementById('loading-screen').classList.remove('hidden');
        
        // Tenter la connexion
        authModule.loginWithEmail(email, password)
            .catch(error => {
                // Masquer l'écran de chargement
                document.getElementById('loading-screen').classList.add('hidden');
                
                // Afficher un message d'erreur
                alert(`Erreur de connexion: ${error.message}`);
            });
    });
}

// Charger les informations de l'utilisateur
function loadUserInfo() {
    const user = auth.currentUser;
    
    // Mettre à jour l'avatar et le nom
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    userAvatar.src = user.photoURL || 'images/default-avatar.png';
    userName.textContent = user.displayName;
    
    // Charger les statistiques utilisateur
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Mettre à jour la barre d'XP
                const xpProgress = document.getElementById('xp-progress');
                const xpText = document.getElementById('xp-text');
                
                const xp = userData.xp || 0;
                const level = calculateLevel(xp);
                const nextLevelXP = xpForNextLevel(level);
                const currentLevelXP = xpForNextLevel(level - 1);
                const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100;
                
                xpProgress.style.width = `${progress}%`;
                xpText.textContent = `${xp} XP`;
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des informations utilisateur:', error);
        });
}

// Calculer le niveau en fonction de l'XP
function calculateLevel(xp) {
    return 1 + Math.floor(Math.sqrt(xp / 100));
}

// Calculer l'XP nécessaire pour le niveau suivant
function xpForNextLevel(level) {
    return 100 * Math.pow(level, 2);
}

// Charger une page
function loadPage(page) {
    // Mettre à jour la page courante
    currentPage = page;
    
    // Mettre à jour les boutons de navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        if (button.getAttribute('data-page') === page) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Récupérer le template de la page
    const template = document.getElementById(`${page}-template`);
    if (!template) {
        console.error(`Template non trouvé pour la page ${page}`);
        return;
    }
    
    // Cloner le contenu du template
    const content = document.importNode(template.content, true);
    
    // Effacer le contenu actuel
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    
    // Ajouter le nouveau contenu
    mainContent.appendChild(content);
    
    // Initialiser la page spécifique
    switch (page) {
        case 'dashboard':
            dashboardModule.initDashboardPage();
            break;
        case 'quests':
            questsModule.initQuestsPage();
            break;
        case 'team':
            rolesModule.initTeamPage();
            break;
        case 'calendar':
            calendarModule.initCalendarPage();
            break;
        case 'chat':
            chatModule.initChatPage();
            break;
    }
    
    // Faire défiler vers le haut
    window.scrollTo(0, 0);
}

// Charger les notifications
function loadNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '<p class="loading">Chargement des notifications...</p>';
    
    // Récupérer les notifications de l'utilisateur
    db.collection('notifications')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            notificationsList.innerHTML = '';
            
            if (snapshot.empty) {
                notificationsList.innerHTML = '<p class="no-notifications">Aucune notification</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const notification = { id: doc.id, ...doc.data() };
                
                // Utiliser le template de notification
                const notifTemplate = document.getElementById('notification-item-template');
                const notifItem = document.importNode(notifTemplate.content, true);
                
                // Définir l'icône en fonction du type
                const iconElement = notifItem.querySelector('.notification-icon i');
                const notifType = notification.type || 'info';
                
                const icons = {
                    'quest': 'fa-tasks',
                    'badge': 'fa-award',
                    'level': 'fa-level-up-alt',
                    'role': 'fa-user-tag',
                    'message': 'fa-comment',
                    'info': 'fa-info-circle'
                };
                
                iconElement.className = `fas ${icons[notifType]}`;
                
                // Ajouter la classe de type
                notifItem.querySelector('.notification-icon').classList.add(`type-${notifType}`);
                
                // Remplir le contenu
                notifItem.querySelector('.notification-text').textContent = notification.text;
                
                // Formater la date
                const time = formatNotificationTime(notification.timestamp);
                notifItem.querySelector('.notification-time').textContent = time;
                
                // Ajouter un gestionnaire de clic si nécessaire
                if (notification.actionPage) {
                    const item = notifItem.querySelector('.notification-item');
                    item.classList.add('clickable');
                    item.setAttribute('data-page', notification.actionPage);
                    item.addEventListener('click', () => {
                        // Marquer comme lue
                        db.collection('notifications').doc(notification.id).update({
                            read: true
                        }).catch(error => {
                            console.error('Erreur lors de la mise à jour de la notification:', error);
                        });
                        
                        // Charger la page associée
                        loadPage(notification.actionPage);
                        
                        // Fermer le panneau
                        document.getElementById('notifications-panel').classList.add('hidden');
                    });
                }
                
                notificationsList.appendChild(notifItem);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des notifications:', error);
            notificationsList.innerHTML = '<p class="error">Erreur lors du chargement des notifications</p>';
        });
}

// Formater le temps d'une notification
function formatNotificationTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `il y a ${hours} h`;
    } else if (minutes > 0) {
        return `il y a ${minutes} min`;
    } else {
        return 'à l\'instant';
    }
}

// Afficher une notification
function showNotification(title, text, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="toast-header">
            <i class="fas ${icons[type]}"></i>
            <strong>${title}</strong>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">${text}</div>
    `;
    
    // Ajouter au conteneur de notifications
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    })();
    
    toastContainer.appendChild(notification);
    
    // Ajouter la classe active pour déclencher l'animation
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    // Fermer la notification au clic sur le bouton
    notification.querySelector('.toast-close').addEventListener('click', () => {
        notification.classList.remove('active');
        
        // Supprimer après l'animation
        setTimeout(() => {
            notification.remove();
            
            // Supprimer le conteneur s'il est vide
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    });
    
    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('active');
            
            setTimeout(() => {
                notification.remove();
                
                // Supprimer le conteneur s'il est vide
                if (toastContainer.children.length === 0) {
                    toastContainer.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Exporter les fonctions et variables
export default {
    initApp,
    loadPage,
    showNotification,
    currentPage,
    currentUser,
};

// Démarrer l'application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
