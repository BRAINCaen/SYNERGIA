/* ===== SYNERGIA TEAM INTEGRATION - CONNEXION AVEC L'APP ===== */

// 🚀 INITIALISATION DU SYSTÈME D'ÉQUIPE
class SynergiaTeamIntegration {
    constructor() {
        this.teamManager = null;
        this.teamUI = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔄 Initialisation du système d\'équipe...');

            // Attendre que Firebase soit disponible
            if (!window.auth || !window.db) {
                console.log('⏳ Attente de Firebase...');
                await this.waitForFirebase();
            }

            // Créer et initialiser le Team Manager
            this.teamManager = new SynergiaTeamManager();
            await this.teamManager.init(window.auth, window.db);

            // Créer et initialiser l'interface équipe
            this.teamUI = new SynergiaTeamUI();
            await this.teamUI.init(this.teamManager);

            // Intégrer avec le système existant
            this.integrateWithExistingApp();

            this.isInitialized = true;
            console.log('✅ Système d\'équipe initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation équipe:', error);
        }
    }

    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const check = () => {
                attempts++;
                if (window.auth && window.db) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase non disponible'));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }

    integrateWithExistingApp() {
        // Remplacer la fonction loadTeam existante
        if (window.mobileContentManager) {
            window.mobileContentManager.loadTeam = async () => {
                const mainContent = document.getElementById('main-content');
                if (mainContent && this.teamUI) {
                    mainContent.innerHTML = this.teamUI.renderTeamPage();
                    console.log('👥 Page équipe complète chargée');
                }
            };
        }

        // Exposer les fonctions globalement
        window.teamManager = this.teamManager;
        window.teamUI = this.teamUI;

        // Remplacer les anciennes fonctions de modal
        window.showAddTeamMemberModal = () => {
            if (this.teamUI) {
                this.teamUI.showAddMemberModal();
            }
        };

        // Fonction pour les boutons admin
        window.openTeamManagement = () => {
            if (window.mobileContentManager) {
                window.mobileContentManager.navigateToPage('team');
            }
        };

        console.log('🔗 Intégration avec l\'app existante terminée');
    }

    // Méthodes utilitaires pour l'intégration
    async createDefaultTeam() {
        if (!this.teamManager || !window.currentUser) return;

        try {
            // Créer l'utilisateur actuel comme membre admin
            const currentUserData = {
                displayName: window.currentUser.displayName || 'Boss',
                email: window.currentUser.email,
                role: 'admin',
                level: 5,
                avatar: window.currentUser.photoURL
            };

            // Vérifier s'il existe déjà
            const existingMember = await this.teamManager.findMemberByEmail(currentUserData.email);
            if (!existingMember) {
                await this.teamManager.addTeamMember(currentUserData);
                console.log('✅ Utilisateur actuel ajouté comme admin');
            }
        } catch (error) {
            console.error('❌ Erreur création équipe par défaut:', error);
        }
    }
}

// 📊 STYLES CSS POUR LE SYSTÈME D'ÉQUIPE
const teamStyles = `
<style>
/* ===== STYLES ÉQUIPE COMPLÈTE ===== */

.team-page {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
}

.team-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
}

.team-title h2 {
    color: white;
    font-size: 28px;
    margin: 0 0 8px 0;
    font-weight: 700;
}

.team-stats-summary {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.team-stats-summary .stat {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
}

.team-tabs {
    margin-bottom: 24px;
}

.team-tabs .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.team-tabs .tab i {
    font-size: 16px;
}

/* Cartes membres */
.members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
}

@media (max-width: 768px) {
    .members-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .team-header {
        flex-direction: column;
        align-items: stretch;
    }
    
    .team-stats-summary {
        justify-content: center;
    }
}

.member-card {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.member-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
}

.member-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
}

.member-avatar-container {
    position: relative;
    flex-shrink: 0;
}

.member-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 3px solid rgba(139, 92, 246, 0.3);
    object-fit: cover;
}

.member-status {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(15, 15, 25, 1);
}

.status-online {
    background: #10b981;
}

.status-away {
    background: #f59e0b;
}

.status-offline {
    background: #6b7280;
}

.member-level {
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    color: white;
    font-size: 11px;
    font-weight: bold;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(15, 15, 25, 1);
}

.member-info {
    flex: 1;
    min-width: 0;
}

.member-name {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.member-role {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
}

.member-xp {
    color: #f59e0b;
    font-size: 13px;
    font-weight: 600;
}

.member-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.btn-icon {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: rgba(255, 255, 255, 0.7);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
}

.btn-icon:hover {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    transform: scale(1.05);
}

.btn-icon.btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
}

.member-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.stat-item {
    text-align: center;
}

.stat-label {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    margin-bottom: 4px;
}

.stat-value {
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.member-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.skill-tag {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
}

/* Cartes rôles */
.roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

@media (max-width: 768px) {
    .roles-grid {
        grid-template-columns: 1fr;
    }
}

.role-card {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;
}

.role-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.role-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
}

.role-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.role-info {
    flex: 1;
}

.role-name {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
}

.role-description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
}

.role-level {
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
}

.role-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 13px;
}

.role-members {
    color: #10b981;
    font-weight: 600;
}

.role-permissions {
    color: rgba(255, 255, 255, 0.6);
}

.role-permissions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.permission-tag {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 500;
}

.permission-more {
    color: rgba(255, 255, 255, 0.5);
    font-size: 10px;
    font-weight: 500;
}

/* Statistiques */
.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.stat-card {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(139, 92, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a78bfa;
    font-size: 24px;
}

.stat-number {
    color: white;
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
}

.stat-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 500;
}

/* Distribution */
.role-distribution,
.level-distribution {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
}

.role-distribution h3,
.level-distribution h3 {
    color: white;
    font-size: 20px;
    margin: 0 0 20px 0;
}

.distribution-item {
    margin-bottom: 16px;
}

.distribution-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.distribution-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
}

.distribution-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.role-name {
    color: white;
    font-weight: 500;
}

.role-count {
    color: rgba(255, 255, 255, 0.7);
}

.level-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.level-bar {
    display: flex;
    align-items: center;
    gap: 12px;
}

.level-number {
    color: white;
    font-weight: 600;
    font-size: 14px;
    width: 32px;
    text-align: center;
}

.level-progress {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.level-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
    border-radius: 4px;
    transition: width 0.5s ease;
}

.level-count {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    font-size: 14px;
    width: 32px;
    text-align: center;
}

/* État vide */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.6);
}

.empty-state i {
    color: rgba(139, 92, 246, 0.5);
    margin-bottom: 20px;
}

.empty-state h3 {
    color: white;
    margin: 16px 0 8px;
    font-size: 24px;
}

.empty-state p {
    margin-bottom: 24px;
    font-size: 16px;
}

/* Formulaires */
.team-form {
    width: 100%;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
}

@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
    }
}

.form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(139, 92, 246, 0.1);
}

@media (max-width: 768px) {
    .form-actions {
        justify-content: stretch;
    }
    
    .form-actions .btn-primary,
    .form-actions .btn-secondary {
        flex: 1;
    }
}

/* Détails membre */
.member-details {
    text-align: center;
}

.member-profile {
    margin-bottom: 24px;
}

.profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid rgba(139, 92, 246, 0.3);
    margin-bottom: 16px;
}

.member-profile h3 {
    color: white;
    font-size: 24px;
    margin: 0 0 4px 0;
}

.member-email {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin: 0 0 12px 0;
}

.member-role-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(139, 92, 246, 0.2);
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
}

.member-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.info-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 12px;
    text-align: center;
}

.info-item label {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    margin-bottom: 4px;
}

.info-item span {
    color: white;
    font-weight: 600;
    font-size: 16px;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    text-transform: capitalize;
}

.status-badge.status-active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.status-badge.status-pending {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.status-badge.status-inactive {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
}

.member-skills-section h4 {
    color: white;
    font-size: 16px;
    margin: 0 0 12px 0;
}

.skills-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
}
</style>
`;

// Ajouter les styles
document.head.insertAdjacentHTML('beforeend', teamStyles);

// 🚀 INITIALISATION AUTOMATIQUE
document.addEventListener('DOMContentLoaded', async () => {
    // Attendre un peu pour s'assurer que tout est chargé
    setTimeout(async () => {
        try {
            window.teamIntegration = new SynergiaTeamIntegration();
            await window.teamIntegration.init();
            
            // Créer l'équipe par défaut si nécessaire
            setTimeout(async () => {
                if (window.teamIntegration.teamManager && window.currentUser) {
                    await window.teamIntegration.createDefaultTeam();
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erreur initialisation team integration:', error);
        }
    }, 1000);
});

console.log('🚀 Team Integration chargé');