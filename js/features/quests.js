/* ===== SYNERGIA QUESTS MANAGER ===== */

class SynergiaQuests {
    constructor() {
        this.quests = [];
        this.categories = ['daily', 'weekly', 'monthly', 'special'];
        this.priorities = ['low', 'normal', 'high', 'urgent'];
        this.statuses = ['pending', 'in_progress', 'completed', 'failed'];
        this.init();
    }

    // Initialiser
    init() {
        this.loadQuests();
        this.setupEventListeners();
        console.log('🎯 Quests Manager initialisé');
    }

    // Charger les quêtes
    loadQuests() {
        const stored = localStorage.getItem('synergia_quests');
        if (stored) {
            this.quests = JSON.parse(stored);
        } else {
            this.quests = this.getDefaultQuests();
            this.saveQuests();
        }
    }

    // Quêtes par défaut
    getDefaultQuests() {
        return [
            {
                id: 'quest_001',
                title: 'Vérifier l\'accueil',
                description: 'S\'assurer que l\'espace d\'accueil est propre et accueillant',
                category: 'daily',
                priority: 'normal',
                xp: 10,
                duration: 15,
                assignedTo: null,
                status: 'pending',
                requiresPhoto: false,
                recurring: true,
                frequency: 'daily',
                createdAt: new Date(),
                deadline: this.getTodayEnd(),
                completedBy: null,
                completedAt: null,
                icon: 'fas fa-home',
                tags: ['accueil', 'nettoyage']
            },
            {
                id: 'quest_002', 
                title: 'Contrôle équipements',
                description: 'Vérifier le bon fonctionnement des jeux',
                category: 'daily',
                priority: 'high',
                xp: 15,
                duration: 30,
                assignedTo: null,
                status: 'pending',
                requiresPhoto: true,
                recurring: true,
                frequency: 'daily',
                createdAt: new Date(),
                deadline: this.getTodayEnd(),
                completedBy: null,
                completedAt: null,
                icon: 'fas fa-tools',
                tags: ['maintenance', 'sécurité']
            },
            {
                id: 'quest_003',
                title: 'Nettoyage complet',
                description: 'Nettoyage approfondi de toutes les zones',
                category: 'weekly',
                priority: 'normal',
                xp: 50,
                duration: 120,
                assignedTo: null,
                status: 'pending',
                requiresPhoto: true,
                recurring: true,
                frequency: 'weekly',
                createdAt: new Date(),
                deadline: this.getWeekEnd(),
                completedBy: null,
                completedAt: null,
                icon: 'fas fa-broom',
                tags: ['nettoyage', 'maintenance']
            }
        ];
    }

    // Sauvegarder les quêtes
    saveQuests() {
        localStorage.setItem('synergia_quests', JSON.stringify(this.quests));
        this.notifyUpdate();
    }

    // Créer une nouvelle quête
    createQuest(questData) {
        const quest = {
            id: 'quest_' + Date.now(),
            title: questData.title,
            description: questData.description,
            category: questData.category || 'daily',
            priority: questData.priority || 'normal',
            xp: parseInt(questData.xp) || 10,
            duration: parseInt(questData.duration) || 15,
            assignedTo: questData.assignedTo || null,
            status: 'pending',
            requiresPhoto: questData.requiresPhoto || false,
            recurring: questData.recurring || false,
            frequency: questData.frequency || 'daily',
            createdAt: new Date(),
            deadline: questData.deadline || this.getTodayEnd(),
            completedBy: null,
            completedAt: null,
            icon: questData.icon || this.getDefaultIcon(questData.category),
            tags: questData.tags || [],
            createdBy: window.currentUser?.uid || 'system'
        };

        this.quests.push(quest);
        this.saveQuests();
        
        console.log('✅ Quête créée:', quest.title);
        showNotification(`✅ Quête "${quest.title}" créée !`, 'success');
        
        return quest;
    }

    // Modifier une quête
    updateQuest(questId, updates) {
        const questIndex = this.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            throw new Error('Quête non trouvée');
        }

        this.quests[questIndex] = {
            ...this.quests[questIndex],
            ...updates,
            updatedAt: new Date()
        };

        this.saveQuests();
        console.log('✅ Quête modifiée:', questId);
        return this.quests[questIndex];
    }

    // Supprimer une quête
    deleteQuest(questId) {
        const questIndex = this.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            throw new Error('Quête non trouvée');
        }

        const quest = this.quests[questIndex];
        this.quests.splice(questIndex, 1);
        this.saveQuests();
        
        console.log('🗑️ Quête supprimée:', quest.title);
        showNotification(`🗑️ Quête "${quest.title}" supprimée`, 'info');
        
        return quest;
    }

    // Compléter une quête
    completeQuest(questId, completionData = {}) {
        const quest = this.getQuest(questId);
        if (!quest) {
            throw new Error('Quête non trouvée');
        }

        if (quest.status === 'completed') {
            throw new Error('Quête déjà complétée');
        }

        // Mettre à jour la quête
        const updates = {
            status: 'completed',
            completedBy: completionData.completedBy || window.currentUser?.uid || 'user',
            completedAt: new Date(),
            proof: completionData.proof || null, // Photo de preuve
            notes: completionData.notes || null
        };

        this.updateQuest(questId, updates);

        // Donner l'XP au joueur
        this.awardXP(quest.xp, updates.completedBy);

        // Gérer la récurrence
        if (quest.recurring) {
            this.createRecurringQuest(quest);
        }

        console.log('🎉 Quête complétée:', quest.title);
        showNotification(`🎉 Quête "${quest.title}" terminée ! +${quest.xp} XP`, 'success');

        return quest;
    }

    // Assigner une quête
    assignQuest(questId, userId) {
        const quest = this.getQuest(questId);
        if (!quest) {
            throw new Error('Quête non trouvée');
        }

        this.updateQuest(questId, {
            assignedTo: userId,
            status: 'in_progress',
            assignedAt: new Date()
        });

        console.log('👤 Quête assignée:', quest.title, 'à', userId);
        showNotification(`👤 Quête "${quest.title}" assignée !`, 'info');
    }

    // Obtenir une quête
    getQuest(questId) {
        return this.quests.find(q => q.id === questId);
    }

    // Filtrer les quêtes
    getQuests(filters = {}) {
        let filteredQuests = [...this.quests];

        if (filters.category) {
            filteredQuests = filteredQuests.filter(q => q.category === filters.category);
        }

        if (filters.status) {
            filteredQuests = filteredQuests.filter(q => q.status === filters.status);
        }

        if (filters.assignedTo) {
            filteredQuests = filteredQuests.filter(q => q.assignedTo === filters.assignedTo);
        }

        if (filters.priority) {
            filteredQuests = filteredQuests.filter(q => q.priority === filters.priority);
        }

        if (filters.tag) {
            filteredQuests = filteredQuests.filter(q => q.tags.includes(filters.tag));
        }

        return filteredQuests;
    }

    // Obtenir les quêtes du jour
    getTodayQuests() {
        const today = new Date();
        const todayStr = today.toDateString();

        return this.quests.filter(quest => {
            const deadline = new Date(quest.deadline);
            return deadline.toDateString() === todayStr && quest.status !== 'completed';
        });
    }

    // Obtenir les quêtes en retard
    getOverdueQuests() {
        const now = new Date();
        return this.quests.filter(quest => {
            const deadline = new Date(quest.deadline);
            return deadline < now && quest.status !== 'completed';
        });
    }

    // Statistiques des quêtes
    getQuestStats() {
        const total = this.quests.length;
        const completed = this.quests.filter(q => q.status === 'completed').length;
        const pending = this.quests.filter(q => q.status === 'pending').length;
        const inProgress = this.quests.filter(q => q.status === 'in_progress').length;
        const overdue = this.getOverdueQuests().length;

        return {
            total,
            completed,
            pending,
            inProgress,
            overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    // Créer une quête récurrente
    createRecurringQuest(originalQuest) {
        if (!originalQuest.recurring) return;

        const newDeadline = this.calculateNextDeadline(originalQuest.frequency);
        const recurringQuest = {
            ...originalQuest,
            id: 'quest_' + Date.now(),
            status: 'pending',
            assignedTo: null,
            completedBy: null,
            completedAt: null,
            deadline: newDeadline,
            createdAt: new Date()
        };

        this.quests.push(recurringQuest);
        this.saveQuests();

        console.log('🔄 Quête récurrente créée:', recurringQuest.title);
    }

    // Calculer la prochaine échéance
    calculateNextDeadline(frequency) {
        const now = new Date();
        switch (frequency) {
            case 'daily':
                now.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                now.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() + 1);
                break;
        }
        return now;
    }

    // Donner de l'XP
    awardXP(amount, userId) {
        const dataManager = window.synergiaApp?.getModule('dataManager');
        if (dataManager && window.SynergiaAPI) {
            window.SynergiaAPI.addXP(amount);
        }
    }

    // Event listeners
    setupEventListeners() {
        // Écouter les événements de quêtes
        document.addEventListener('synergia:quest:create', (e) => {
            this.createQuest(e.detail);
        });

        document.addEventListener('synergia:quest:complete', (e) => {
            this.completeQuest(e.detail.questId, e.detail.data);
        });

        document.addEventListener('synergia:quest:assign', (e) => {
            this.assignQuest(e.detail.questId, e.detail.userId);
        });
    }

    // Notifier les mises à jour
    notifyUpdate() {
        const event = new CustomEvent('synergia:quests:updated', {
            detail: { quests: this.quests }
        });
        document.dispatchEvent(event);
    }

    // Utilitaires
    getTodayEnd() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today;
    }

    getWeekEnd() {
        const today = new Date();
        const daysUntilSunday = 7 - today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() + daysUntilSunday);
        sunday.setHours(23, 59, 59, 999);
        return sunday;
    }

    getDefaultIcon(category) {
        const icons = {
            daily: 'fas fa-calendar-day',
            weekly: 'fas fa-calendar-week',
            monthly: 'fas fa-calendar-alt',
            special: 'fas fa-star'
        };
        return icons[category] || 'fas fa-tasks';
    }
}

// Export global
window.SynergiaQuests = SynergiaQuests;
