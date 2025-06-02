/* ===== SYNERGIA DATA MANAGER - VERSION CORRIGÃ‰E COMPLÃˆTE ===== */

// Gestionnaire de donnÃ©es utilisateur
class SynergiaDataManager {
    constructor() {
        this.initDefaultData();
        this.loadUserData();
    }

    // Fonction utilitaire de sÃ©curisation
    sanitizeInput(input) {
        return String(input).replace(/[<>]/g, '');
    }

    // DonnÃ©es par dÃ©faut
    initDefaultData() {
        this.defaultUser = {
            name: "Boss",
            avatar: "./images/default-avatar.jpg",
            level: 4,
            levelName: "Expert",
            currentXP: 750,
            requiredXP: 1000,
            role: {
                name: "Entretien & Maintenance",
                icon: "fas fa-tools",
                mastery: 60
            },
            stats: {
                completedQuests: 0,
                totalXP: 750,
                activeStreak: 1,
                teamRank: 1
            },
            status: 'online',
            statusMessage: '',
            lastActivity: new Date().toISOString()
        };

        this.defaultTeam = [
            {
                id: 1,
                name: "Boss",
                role: "Manager",
                avatar: "./images/default-avatar.jpg",
                level: 4,
                xp: 750,
                status: "online",
                completedQuests: 0,
                lastActivity: new Date().toISOString()
            }
        ];

        this.defaultQuests = [
            {
                id: 1,
                title: "VÃ©rifier l'accueil",
                description: "S'assurer que l'espace d'accueil est propre et accueillant",
                xp: 10,
                priority: "normal",
                assignedTo: null,
                completed: false,
                recurring: false,
                deadline: this.getTodayEnd()
            },
            {
                id: 2,
                title: "ContrÃ´le Ã©quipements",
                description: "VÃ©rifier le bon fonctionnement des jeux",
                xp: 15,
                priority: "normal",
                assignedTo: null,
                completed: false,
                recurring: true,
                deadline: this.getTodayEnd()
            }
        ];
    }

    // Charger les donnÃ©es
    loadUserData() {
        try {
            this.userData = JSON.parse(localStorage.getItem('synergia_user')) || this.defaultUser;
            this.teamData = JSON.parse(localStorage.getItem('synergia_team')) || this.defaultTeam;
            this.questsData = JSON.parse(localStorage.getItem('synergia_quests')) || this.defaultQuests;
        } catch (error) {
            console.warn('Erreur chargement donnÃ©es:', error);
            this.userData = this.defaultUser;
            this.teamData = this.defaultTeam;
            this.questsData = this.defaultQuests;
        }
    }

    // Sauvegarder les donnÃ©es
    saveData() {
        try {
            localStorage.setItem('synergia_user', JSON.stringify(this.userData));
            localStorage.setItem('synergia_team', JSON.stringify(this.teamData));
            localStorage.setItem('synergia_quests', JSON.stringify(this.questsData));
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }

    // Utilitaires
    getTodayEnd() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today.toISOString();
    }

    // Getters
    getUser() { return this.userData; }
    getTeam() { return this.teamData; }
    getQuests() { return this.questsData; }

    // Mise Ã  jour utilisateur
    updateUser(newData) {
        this.userData = Object.assign(this.userData, newData);
        this.saveData();
        this.updateUI();
    }

    // Calculer pourcentages
    getXPPercentage() {
        return Math.min((this.userData.currentXP / this.userData.requiredXP) * 100, 100);
    }

    getRoleMasteryPercentage() {
        return this.userData.role.mastery;
    }

    // Mise Ã  jour de l'interface
    updateUI() {
        this.updateUserProfile();
        this.updateProgressBars();
        this.updateStats();
    }

    // Mettre Ã  jour le profil utilisateur
    updateUserProfile() {
        const userNameElements = document.querySelectorAll('.user-name, .user-info h2');
        userNameElements.forEach(element => {
            if (element && element.textContent.includes('Chargement')) {
               element.textContent = this.sanitizeInput(this.userData.name);
            }
        });

        const avatarElements = document.querySelectorAll('.user-info img, .member-avatar');
        avatarElements.forEach(element => {
            if (element) {
                element.src = this.userData.avatar;
                element.alt = this.sanitizeInput(this.userData.name);
            }
        });
    }

    // Mettre Ã  jour les barres de progression
    updateProgressBars() {
        const levelProgressBars = document.querySelectorAll('.level-progress .xp-progress, .xp-progress, #level-bar');
        levelProgressBars.forEach(bar => {
            if (bar) {
                const percentage = this.getXPPercentage();
                bar.style.width = percentage + '%';
                bar.style.background = 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)';
                bar.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.6)';
            }
        });

        const roleMasteryBars = document.querySelectorAll('.mastery-progress .mastery-bar, #mastery-bar');
        roleMasteryBars.forEach(bar => {
            if (bar) {
                const percentage = this.getRoleMasteryPercentage();
                bar.style.width = percentage + '%';
                bar.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            }
        });
    }

    // Mettre Ã  jour les statistiques
    updateStats() {
        const statElements = document.querySelectorAll('.perf-stat-number');
        const statsData = [
            this.teamData.length,
            this.userData.stats.totalXP,
            this.userData.stats.completedQuests,
            this.userData.level
        ];

        statElements.forEach((element, index) => {
            if (element && statsData[index] !== undefined) {
                element.textContent = statsData[index];
            }
        });
    }

    // Initialiser les features avancÃ©es
    initAdvancedFeatures() {
        if (!this.userData.status) {
            this.userData.status = 'online';
            this.userData.statusMessage = '';
            this.userData.lastActivity = new Date().toISOString();
        }

        this.teamData.forEach((member, index) => {
            if (!member.avatar) {
                member.avatar = './images/avatars/avatar-' + (index + 1) + '.jpg';
            }
            if (!member.status) {
                member.status = Math.random() > 0.5 ? 'online' : 'away';
                member.lastActivity = new Date().toISOString();
            }
        });

        this.saveData();
        this.updateUI();
    }

    // Notification sÃ©curisÃ©e
    showNotification(message, type = 'info') {
        // Supprimer anciennes notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        
        // SÃ©curiser le message
        const safeMessage = this.sanitizeInput(message);
        notification.innerHTML = '<i class="fas fa-info-circle"></i><span>' + safeMessage + '</span><button class="notification-close">&times;</button>';

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Initialisation complÃ¨te
    init() {
        console.log('ðŸš€ Synergia Data Manager initialisÃ©');
        this.updateUI();
        
        setInterval(() => {
            this.saveData();
        }, 30000);
    }
}

// Instance globale
const synergiaData = new SynergiaDataManager();

// Fonction globale pour les notifications (rÃ©trocompatibilitÃ©)
window.showNotification = function(message, type) {
    synergiaData.showNotification(message, type);
};

// API globale
window.SynergiaAPI = {
    addXP: function(amount) {
        const user = synergiaData.getUser();
        user.currentXP += amount;
        user.stats.totalXP += amount;
        
        if (user.currentXP >= user.requiredXP) {
            user.level++;
            user.currentXP = user.currentXP - user.requiredXP;
            user.requiredXP = Math.floor(user.requiredXP * 1.2);
            synergiaData.showNotification('ðŸŽ‰ Level Up ! Niveau ' + user.level + ' atteint !', 'success');
        }
        
        synergiaData.updateUser(user);
    },
    
    getUserData: function() { return synergiaData.getUser(); },
    getTeamData: function() { return synergiaData.getTeam(); },
    getQuestsData: function() { return synergiaData.getQuests(); }
};

// Export global
window.SynergiaDataManager = SynergiaDataManager;

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        synergiaData.init();
        synergiaData.initAdvancedFeatures();
        console.log('ðŸš€ Synergia Data Manager dÃ©marrÃ©');
        synergiaData.showNotification('âœ¨ Application initialisÃ©e !', 'success');
    }, 500);
});
