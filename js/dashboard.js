// dashboard.js - Gestion du tableau de bord principal

import { auth, db } from './firebase-config.js';
import rolesModule from './roles.js';
import questsModule from './quests.js';
import badgesModule from './badges.js';

// État local du tableau de bord
let userStats = {
    xp: 0,
    level: 1,
    roles: [],
    quests: {
        completed: 0,
        pending: 0
    },
    badges: []
};

let teamActivity = [];

// Initialiser le tableau de bord
function initDashboard() {
    const user = auth.currentUser;
    
    // Charger les données de l'utilisateur
    loadUserStats(user.uid);
    
    // Charger l'activité de l'équipe
    loadTeamActivity();
    
    // Rafraîchir les données toutes les 5 minutes
    setInterval(() => {
        loadUserStats(user.uid);
        loadTeamActivity();
    }, 300000);
}

// Charger les statistiques de l'utilisateur
function loadUserStats(userId) {
    // Récupérer les données utilisateur
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Mettre à jour les statistiques locales
                userStats.xp = userData.xp || 0;
                userStats.level = calculateLevel(userData.xp);
                userStats.roles = userData.roles || [];
                userStats.badges = userData.badges || [];
                
                // Mettre à jour l'affichage
                updateDashboardUI();
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des statistiques utilisateur:', error);
        });
    
    // Récupérer les quêtes de l'utilisateur
    db.collection('quests')
        .where('assignedTo', 'array-contains', userId)
        .get()
        .then(snapshot => {
            const quests = [];
            snapshot.forEach(doc => {
                quests.push({ id: doc.id, ...doc.data() });
            });
            
            // Compter les quêtes en attente et terminées
            userStats.quests.pending = quests.filter(quest => !quest.completed).length;
            userStats.quests.completed = quests.filter(quest => quest.completed).length;
            
            // Mettre à jour l'affichage des quêtes
            updateQuestsUI();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des quêtes utilisateur:', error);
        });
}

// Charger l'activité de l'équipe
function loadTeamActivity() {
    db.collection('activity')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            teamActivity = [];
            snapshot.forEach(doc => {
                teamActivity.push({ id: doc.id, ...doc.data() });
            });
            
            // Mettre à jour l'affichage de l'activité
            updateActivityUI();
        })
        .catch(error => {
            console.error('Erreur lors du chargement de l\'activité d\'équipe:', error);
        });
}

// Calculer le niveau en fonction de l'XP
function calculateLevel(xp) {
    // Formule: niveau = 1 + Math.floor(sqrt(xp / 100))
    return 1 + Math.floor(Math.sqrt(xp / 100));
}

// Calculer l'XP nécessaire pour le niveau suivant
function xpForNextLevel(level) {
    return 100 * Math.pow(level, 2);
}

// Mettre à jour l'interface utilisateur du tableau de bord
function updateDashboardUI() {
    // Mettre à jour le nom de l'utilisateur
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = auth.currentUser.displayName;
    }
    
    // Mettre à jour le niveau et la progression
    const levelBadge = document.getElementById('level-badge');
    const levelTitle = document.getElementById('level-title');
    const levelBar = document.getElementById('level-bar');
    const levelText = document.getElementById('level-text');
    
    if (levelBadge && levelTitle && levelBar && levelText) {
        const currentLevel = userStats.level;
        const nextLevel = currentLevel + 1;
        
        const xpCurrentLevel = xpForNextLevel(currentLevel);
        const xpNextLevel = xpForNextLevel(nextLevel);
        const xpNeeded = xpNextLevel - xpCurrentLevel;
        const xpProgress = userStats.xp - xpCurrentLevel;
        const progressPercentage = (xpProgress / xpNeeded) * 100;
        
        levelBadge.textContent = currentLevel;
        
        // Définir le titre du niveau
        const levelTitles = [
            'Novice',
            'Apprenti',
            'Initié',
            'Compétent',
            'Expert',
            'Maître',
            'Champion',
            'Légende'
        ];
        
        levelTitle.textContent = levelTitles[Math.min(currentLevel - 1, levelTitles.length - 1)];
        
        // Mettre à jour la barre de progression
        levelBar.style.width = `${progressPercentage}%`;
        levelText.textContent = `${xpProgress}/${xpNeeded} XP`;
    }
    
    // Mettre à jour le rôle principal
    const mainRole = userStats.roles[0]; // Premier rôle dans la liste
    
    if (mainRole) {
        const roleIcon = document.getElementById('role-icon');
        const roleName = document.getElementById('role-name');
        const masteryBar = document.getElementById('mastery-bar');
        const masteryText = document.getElementById('mastery-text');
        
        if (roleIcon && roleName && masteryBar && masteryText) {
            // Définir l'icône du rôle
            roleIcon.innerHTML = getRoleIcon(mainRole.role);
            
            // Définir le nom du rôle
            roleName.textContent = getRoleName(mainRole.role);
            
            // Mettre à jour la maîtrise
            const masteryPercentage = (mainRole.mastery / 100) * 100;
            masteryBar.style.width = `${masteryPercentage}%`;
            
            // Définir le niveau de maîtrise
            const masteryLevels = ['Novice', 'Intermédiaire', 'Avancé', 'Expert', 'Maître'];
            const masteryIndex = Math.min(Math.floor(mainRole.mastery / 20), masteryLevels.length - 1);
            masteryText.textContent = masteryLevels[masteryIndex];
        }
    }
}

// Obtenir l'icône d'un rôle
function getRoleIcon(roleId) {
    const roleIcons = {
        'maintenance': '<i class="fas fa-wrench"></i>',
        'reviews': '<i class="fas fa-star"></i>',
        'inventory': '<i class="fas fa-box"></i>',
        'organization': '<i class="fas fa-calendar-alt"></i>',
        'content': '<i class="fas fa-paint-brush"></i>',
        'mentoring': '<i class="fas fa-graduation-cap"></i>',
        'partnerships': '<i class="fas fa-handshake"></i>',
        'social': '<i class="fas fa-hashtag"></i>'
    };
    
    return roleIcons[roleId] || '<i class="fas fa-user"></i>';
}

// Obtenir le nom d'un rôle
function getRoleName(roleId) {
    const roleNames = {
        'maintenance': 'Entretien & Maintenance',
        'reviews': 'Gestion des Avis',
        'inventory': 'Gestion des Stocks',
        'organization': 'Organisation Interne',
        'content': 'Création de Contenu',
        'mentoring': 'Mentorat & Formation',
        'partnerships': 'Partenariats',
        'social': 'Communication & Réseaux Sociaux'
    };
    
    return roleNames[roleId] || 'Rôle non défini';
}

// Mettre à jour l'interface des quêtes
function updateQuestsUI() {
    const questsToday = document.getElementById('quests-today');
    if (questsToday) {
        questsToday.textContent = userStats.quests.pending;
    }
    
    // Afficher les quêtes du jour
    const dailyQuests = document.getElementById('daily-quests');
    if (dailyQuests) {
        // Vider le conteneur
        dailyQuests.innerHTML = '';
        
        // Récupérer les quêtes quotidiennes en cours
        db.collection('quests')
            .where('assignedTo', 'array-contains', auth.currentUser.uid)
            .where('type', '==', 'daily')
            .where('completed', '==', false)
            .limit(3)
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    dailyQuests.innerHTML = '<p class="no-quests">Aucune quête pour aujourd\'hui !</p>';
                    return;
                }
                
                snapshot.forEach(doc => {
                    const quest = { id: doc.id, ...doc.data() };
                    
                    // Utiliser le template de quête
                    const questTemplate = document.getElementById('quest-item-template');
                    const questItem = document.importNode(questTemplate.content, true);
                    
                    questItem.querySelector('.quest-title').textContent = quest.title;
                    questItem.querySelector('.quest-description').textContent = quest.description;
                    questItem.querySelector('.xp-amount').textContent = quest.xp;
                    
                    // Formatage de la deadline
                    const deadline = quest.deadline ? new Date(quest.deadline) : null;
                    const deadlineText = deadline ? formatDeadline(deadline) : 'Aujourd\'hui';
                    questItem.querySelector('.deadline-text').textContent = deadlineText;
                    
                    // Gestionnaire pour compléter la quête
                    const completeButton = questItem.querySelector('.btn-complete');
                    completeButton.addEventListener('click', () => {
                        showQuestModal(quest);
                    });
                    
                    dailyQuests.appendChild(questItem);
                });
            })
            .catch(error => {
                console.error('Erreur lors du chargement des quêtes:', error);
            });
    }
}

// Formater la date limite d'une quête
function formatDeadline(deadline) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    
    if (deadlineDate.getTime() === today.getTime()) {
        return "Aujourd'hui";
    } else if (deadlineDate.getTime() === tomorrow.getTime()) {
        return "Demain";
    } else {
        // Formater la date
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return deadline.toLocaleDateString('fr-FR', options);
    }
}

// Afficher la modale de validation de quête
function showQuestModal(quest) {
    const modal = document.getElementById('quest-modal');
    const titleElement = document.getElementById('quest-modal-title');
    const descriptionElement = document.getElementById('quest-modal-description');
    const xpElement = document.getElementById('quest-modal-xp');
    const form = document.getElementById('quest-validation-form');
    
    // Remplir les informations de la quête
    titleElement.textContent = quest.title;
    descriptionElement.textContent = quest.description;
    xpElement.textContent = quest.xp;
    
    // Afficher la modale
    modal.classList.remove('hidden');
    
    // Gestionnaire de soumission
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const comment = document.getElementById('quest-comment').value;
        const proofFile = document.getElementById('quest-proof').files[0];
        
        // Valider la quête
        completeQuest(quest.id, comment, proofFile);
        
        // Fermer la modale
        modal.classList.add('hidden');
        form.reset();
    };
    
    // Gestionnaire pour fermer la modale
    document.getElementById('close-quest-modal').onclick = function() {
        modal.classList.add('hidden');
        form.reset();
    };
}

// Compléter une quête
function completeQuest(questId, comment, proofFile) {
    const user = auth.currentUser;
    
    // Préparer les données de validation
    const completionData = {
        completed: true,
        completedBy: user.uid,
        completedAt: new Date().toISOString(),
        comment: comment || ''
    };
    
    // Si une preuve a été fournie, l'uploader d'abord
    let uploadPromise = Promise.resolve(null);
    
    if (proofFile) {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`quest_proofs/${questId}/${proofFile.name}`);
        
        uploadPromise = fileRef.put(proofFile)
            .then(() => fileRef.getDownloadURL())
            .then(url => {
                completionData.proofUrl = url;
                return url;
            });
    }
    
    // Mettre à jour la quête dans Firestore
    uploadPromise
        .then(() => {
            return db.collection('quests').doc(questId).update(completionData);
        })
        .then(() => {
            // Récupérer les détails de la quête pour l'XP
            return db.collection('quests').doc(questId).get();
        })
        .then(doc => {
            const quest = doc.data();
            const xp = quest.xp || 0;
            
            // Ajouter l'XP à l'utilisateur
            return db.collection('users').doc(user.uid).update({
                xp: firebase.firestore.FieldValue.increment(xp)
            })
            .then(() => {
                // Ajouter une entrée dans l'activité
                return db.collection('activity').add({
                    userId: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    type: 'quest_completed',
                    questId: questId,
                    questTitle: quest.title,
                    xp: xp,
                    timestamp: Date.now()
                });
            })
            .then(() => {
                // Mettre à jour les statistiques locales
                userStats.xp += xp;
                userStats.level = calculateLevel(userStats.xp);
                userStats.quests.completed++;
                userStats.quests.pending--;
                
                // Vérifier si des badges sont débloqués
                return badgesModule.checkForNewBadges(user.uid);
            })
            .then(newBadges => {
                // Afficher le message de succès
                showSuccessModal(quest.title, xp, newBadges);
                
                // Mettre à jour l'affichage
                updateDashboardUI();
                updateQuestsUI();
                
                // Recharger l'activité de l'équipe
                loadTeamActivity();
            });
        })
        .catch(error => {
            console.error('Erreur lors de la validation de la quête:', error);
            alert('Impossible de valider la quête, veuillez réessayer.');
        });
}

// Afficher la modale de succès
function showSuccessModal(questTitle, xp, newBadges) {
    const modal = document.getElementById('success-modal');
    const message = document.getElementById('success-message');
    const xpGained = document.getElementById('gained-xp');
    const badgeUnlocked = document.getElementById('badge-unlocked');
    const badgeName = document.getElementById('badge-name');
    const badgeIcon = document.querySelector('#badge-unlocked .badge-icon i');
    
    // Définir le message de succès
    message.textContent = `Tu as terminé la quête "${questTitle}" !`;
    
    // Afficher l'XP gagnée
    xpGained.textContent = xp;
    
    // Afficher le badge débloqué s'il y en a un
    if (newBadges && newBadges.length > 0) {
        const badge = newBadges[0]; // Prendre le premier badge
        badgeUnlocked.classList.remove('hidden');
        badgeName.textContent = badge.name;
        badgeIcon.className = badge.icon;
    } else {
        badgeUnlocked.classList.add('hidden');
    }
    
    // Afficher la modale
    modal.classList.remove('hidden');
    
    // Gestionnaire pour fermer la modale
    document.getElementById('close-success').onclick = function() {
        modal.classList.add('hidden');
    };
}

// Mettre à jour l'interface de l'activité de l'équipe
function updateActivityUI() {
    const feedContainer = document.getElementById('team-feed');
    if (!feedContainer) return;
    
    // Vider le conteneur
    feedContainer.innerHTML = '';
    
    if (teamActivity.length === 0) {
        feedContainer.innerHTML = '<p class="no-activity">Aucune activité récente</p>';
        return;
    }
    
    // Afficher les éléments d'activité
    teamActivity.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        // Formater le temps écoulé
        const timeAgo = formatTimeAgo(activity.timestamp);
        
        // Créer le contenu en fonction du type d'activité
        let content = '';
        
        switch (activity.type) {
            case 'quest_completed':
                content = `
                    <div class="activity-icon quest-completed">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.displayName}</strong> a terminé la quête <strong>${activity.questTitle}</strong> (+${activity.xp} XP)</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `;
                break;
            
            case 'badge_unlocked':
                content = `
                    <div class="activity-icon badge-unlocked">
                        <i class="fas fa-award"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.displayName}</strong> a débloqué le badge <strong>${activity.badgeName}</strong></p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `;
                break;
            
            case 'role_assigned':
                content = `
                    <div class="activity-icon role-assigned">
                        <i class="fas fa-user-tag"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.displayName}</strong> a été assigné(e) au rôle <strong>${getRoleName(activity.roleId)}</strong></p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `;
                break;
            
            case 'level_up':
                content = `
                    <div class="activity-icon level-up">
                        <i class="fas fa-level-up-alt"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.displayName}</strong> a atteint le niveau <strong>${activity.level}</strong></p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `;
                break;
            
            default:
                content = `
                    <div class="activity-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.displayName}</strong> a effectué une action</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `;
        }
        
        activityItem.innerHTML = content;
        feedContainer.appendChild(activityItem);
    });
}

// Formater le temps écoulé depuis une date
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return 'à l\'instant';
    }
}

// Initialiser la page du tableau de bord
function initDashboardPage() {
    // Vérifier si la page de tableau de bord est active
    const dashboardElement = document.querySelector('.dashboard');
    if (!dashboardElement) return;
    
    // Initialiser le tableau de bord
    initDashboard();
}

// Exporter les fonctions
export default {
    initDashboard,
    initDashboardPage,
    updateDashboardUI,
    formatTimeAgo
};
