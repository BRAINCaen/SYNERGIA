/* ===== SYNERGIA APP - POINT D'ENTRÉE PRINCIPAL ===== */

// Configuration globale
window.SYNERGIA_CONFIG = {
    version: '2.0.0',
    debug: true,
    autoSave: true,
    saveInterval: 30000
};

// Initialisation de l'application
class SynergiaApp {
    constructor() {
        this.modules = {};
        this.initialized = false;
    }

    // Enregistrer un module
    registerModule(name, module) {
        this.modules[name] = module;
        console.log(`📦 Module ${name} enregistré`);
    }

    // Initialiser l'application
    async init() {
        if (this.initialized) return;

        console.log('🚀 Initialisation Synergia v' + window.SYNERGIA_CONFIG.version);

        try {
            // Initialiser les modules core
            await this.initCoreModules();
            
            // Initialiser les features
            await this.initFeatureModules();
            
            // Initialiser l'UI
            await this.initUI();
            
            this.initialized = true;
            console.log('✅ Synergia initialisé avec succès');
            
            // Notification de succès
            showNotification('✨ Application initialisée !', 'success');
            
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            showNotification('❌ Erreur lors de l\'initialisation', 'error');
        }
    }

    // Initialiser les modules core
    async initCoreModules() {
        // Data Manager
        if (window.SynergiaDataManager) {
            this.registerModule('dataManager', new SynergiaDataManager());
            await this.modules.dataManager.init();
        }

        // UI Manager
        if (window.SynergiaUIManager) {
            this.registerModule('uiManager', new SynergiaUIManager());
            this.modules.uiManager.init();
        }
    }

    // Initialiser les modules features
    async initFeatureModules() {
        // Auth
        if (window.SynergiaAuth) {
            this.registerModule('auth', new SynergiaAuth());
        }

        // Quests
        if (window.SynergiaQuests) {
            this.registerModule('quests', new SynergiaQuests());
        }

        // Team
        if (window.SynergiaTeam) {
            this.registerModule('team', new SynergiaTeam());
        }

        // Admin
        if (window.SynergiaAdmin) {
            this.registerModule('admin', new SynergiaAdmin());
        }
    }

    // Initialiser l'UI
    async initUI() {
        if (this.modules.uiManager) {
            this.modules.uiManager.setupHeader();
            this.modules.uiManager.setupNavigation();
            this.modules.uiManager.cleanupInterface();
        }
    }

    // Obtenir un module
    getModule(name) {
        return this.modules[name];
    }
}

// Instance globale
window.synergiaApp = new SynergiaApp();

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.synergiaApp.init();
    }, 1000);
});

