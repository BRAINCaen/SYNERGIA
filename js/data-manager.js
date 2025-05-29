/* ===== SYNERGIA DATA MANAGER - FOUNDATION ===== */

// Gestionnaire de données utilisateur
class SynergiaDataManager {
    constructor() {
        this.initDefaultData();
        this.loadUserData();
    }

    // Données par défaut
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
            preferences: {
                notifications: true,
                theme: "premium-dark"
            }
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
                completedQuests: 0
            }
        ];

        this.defaultQuests = [
            {
                id: 1,
                title: "Vérifier l'accueil",
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
                title: "Contrôle équipements",
                description: "Vérifier le bon fonctionnement des jeux",
                xp: 15,
                priority: "normal",
                assignedTo: null,
                completed: false,
                recurring: true,
                deadline: this.getTodayEnd()
            }
        ];
    }

    // Charger les données (localStorage ou défaut)
    loadUserData() {
        try {
            this.userData = JSON.parse(localStorage.getItem('synergia_user')) || this.defaultUser;
            this.teamData = JSON.parse(localStorage.getItem('synergia_team')) || this.defaultTeam;
            this.questsData = JSON.parse(localStorage.getItem('synergia_quests')) || this.defaultQuests;
        } catch (error) {
            console.warn('Erreur chargement données, utilisation des défauts:', error);
            this.userData = this.defaultUser;
            this.teamData = this.defaultTeam;
            this.questsData = this.defaultQuests;
        }
    }

    // Sauvegarder les données
    saveData() {
        try {
            localStorage.setItem('synergia_user', JSON.stringify(this.userData));
            localStorage.setItem('synergia_team', JSON.stringify(this.teamData));
            localStorage.setItem('synergia_quests', JSON.stringify(this.questsData));
            console.log('✅ Données sauvegardées');
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
        }
    }

    // Utilitaires
    getTodayEnd() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today.toISOString();
    }

    // Getters pour les données
    getUser() { return this.userData; }
    getTeam() { return this.teamData; }
    getQuests() { return this.questsData; }

    // Mise à jour utilisateur
    updateUser(newData) {
        this.userData = { ...this.userData, ...newData };
        this.saveData();
        this.updateUI();
    }

    // Calculer le pourcentage XP
    getXPPercentage() {
        return Math.min((this.userData.currentXP / this.userData.requiredXP) * 100, 100);
    }

    // Calculer le pourcentage de maîtrise du rôle
    getRoleMasteryPercentage() {
        return this.userData.role.mastery;
    }

    // Mise à jour de l'interface
    updateUI() {
        this.updateUserProfile();
        this.updateProgressBars();
        this.updateStats();
    }

    // Mettre à jour le profil utilisateur
    updateUserProfile() {
        // Remplacer "Chargement..."
        const userNameElements = document.querySelectorAll('.user-name, .user-info h2, .welcome-card h2');
        userNameElements.forEach(element => {
            if (element && (element.textContent.includes('Chargement') || element.textContent.trim() === '')) {
                element.textContent = `Bienvenue ${this.userData.name} !`;
            }
        });

        // Avatar utilisateur
        const avatarElements = document.querySelectorAll('.user-info img, .member-avatar');
        avatarElements.forEach(element => {
            if (element) {
                element.src = this.userData.avatar;
                element.alt = this.userData.name;
            }
        });

        // Niveau et titre
        const levelElements = document.querySelectorAll('.level-badge, .user-level');
        levelElements.forEach(element => {
            if (element) {
                element.textContent = this.userData.level;
            }
        });

        const levelNameElements = document.querySelectorAll('.level-name, .user-level-name');
        levelNameElements.forEach(element => {
            if (element) {
                element.textContent = this.userData.levelName;
            }
        });
    }

    // Mettre à jour les barres de progression
    updateProgressBars() {
        // Barre XP niveau
        const levelProgressBars = document.querySelectorAll('.level-progress .xp-progress, .xp-progress, #level-bar');
        levelProgressBars.forEach(bar => {
            if (bar) {
                const percentage = this.getXPPercentage();
                bar.style.width = `${percentage}%`;
                bar.style.background = 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)';
                bar.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.6)';
                
                // Texte XP
                const xpText = bar.parentElement?.querySelector('.xp-text, .level-text');
                if (xpText) {
                    xpText.textContent = `${this.userData.currentXP}/${this.userData.requiredXP} XP`;
                }
            }
        });

        // Barre maîtrise rôle
        const roleMasteryBars = document.querySelectorAll('.mastery-progress .mastery-bar, #mastery-bar');
        roleMasteryBars.forEach(bar => {
            if (bar) {
                const percentage = this.getRoleMasteryPercentage();
                bar.style.width = `${percentage}%`;
                bar.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
                bar.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.6)';
                
                // Texte maîtrise
                const masteryText = bar.parentElement?.querySelector('#mastery-text, .mastery-text');
                if (masteryText) {
                    masteryText.textContent = `${percentage}% maîtrisé`;
                }
            }
        });
    }

    // Mettre à jour les statistiques
    updateStats() {
        // Stats de performance
        const statsMapping = {
            '.perf-stat-number': [
                this.teamData.length, // Membres actifs
                this.userData.stats.totalXP, // XP total équipe
                this.userData.stats.completedQuests, // Quêtes réalisées
                this.userData.level // Niveau moyen
            ]
        };

        const statElements = document.querySelectorAll('.perf-stat-number');
        statElements.forEach((element, index) => {
            if (element && statsMapping['.perf-stat-number'][index] !== undefined) {
                element.textContent = statsMapping['.perf-stat-number'][index];
            }
        });

        // Stat values génériques
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach((element, index) => {
            if (element) {
                switch (index) {
                    case 0:
                        element.textContent = this.userData.level;
                        break;
                    case 1:
                        element.textContent = `${this.userData.currentXP} XP`;
                        break;
                    case 2:
                        element.textContent = this.userData.stats.completedQuests;
                        break;
                    default:
                        element.textContent = this.userData.stats.activeStreak;
                }
            }
        });
    }

    // Initialisation complète
    init() {
        console.log('🚀 Synergia Data Manager initialisé');
        this.updateUI();
        
        // Auto-save toutes les 30 secondes
        setInterval(() => {
            this.saveData();
        }, 30000);
    }
}

// Instance globale
const synergiaData = new SynergiaDataManager();

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    synergiaData.init();
    
    // Debug dans la console
    console.log('📊 Données utilisateur:', synergiaData.getUser());
    console.log('👥 Données équipe:', synergiaData.getTeam());
    console.log('🎯 Données quêtes:', synergiaData.getQuests());
});

// Fonctions utilitaires globales
window.SynergiaAPI = {
    // Mettre à jour XP
    addXP: (amount) => {
        const user = synergiaData.getUser();
        user.currentXP += amount;
        user.stats.totalXP += amount;
        
        // Vérifier level up
        if (user.currentXP >= user.requiredXP) {
            user.level++;
            user.currentXP = user.currentXP - user.requiredXP;
            user.requiredXP = Math.floor(user.requiredXP * 1.2); // +20% XP required
            
            // Notification level up
            showNotification(`🎉 Level Up ! Niveau ${user.level} atteint !`, 'success');
        }
        
        synergiaData.updateUser(user);
    },
    
    // Compléter une quête
    completeQuest: (questId) => {
        const quests = synergiaData.getQuests();
        const quest = quests.find(q => q.id === questId);
        
        if (quest && !quest.completed) {
            quest.completed = true;
            synergiaData.questsData = quests;
            
            // Ajouter XP
            SynergiaAPI.addXP(quest.xp);
            
            // Mettre à jour stats
            const user = synergiaData.getUser();
            user.stats.completedQuests++;
            synergiaData.updateUser(user);
            
            showNotification(`✅ Quête "${quest.title}" terminée ! +${quest.xp} XP`, 'success');
        }
    },
    
    // Données actuelles
    getUserData: () => synergiaData.getUser(),
    getTeamData: () => synergiaData.getTeam(),
    getQuestsData: () => synergiaData.getQuests()
};
