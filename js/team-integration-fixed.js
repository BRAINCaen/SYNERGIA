/* ===== SYNERGIA TEAM INTEGRATION FIXED - CONNEXION AVEC L'APP ===== */

// 🚀 INITIALISATION DU SYSTÈME D'ÉQUIPE CORRIGÉE
class SynergiaTeamIntegration {
    constructor() {
        this.teamManager = null;
        this.teamUI = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔄 Initialisation du système d\'équipe...');

            // Attendre Firebase avec une approche différente
            if (!this.isFirebaseReady()) {
                console.log('⏳ Attente de Firebase...');
                await this.waitForFirebaseAdvanced();
            }

            // Créer et initialiser le Team Manager
            this.teamManager = new SynergiaTeamManager();
            const success = await this.teamManager.init(window.auth, window.db);
            
            if (!success) {
                throw new Error('Échec initialisation Team Manager');
            }

            // Créer et initialiser l'interface équipe
            this.teamUI = new SynergiaTeamUI();
            await this.teamUI.init(this.teamManager);

            // Intégrer avec le système existant
            this.integrateWithExistingApp();

            this.isInitialized = true;
            console.log('✅ Système d\'équipe initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation équipe:', error);
            // Mode dégradé sans Firebase
            this.initWithoutFirebase();
        }
    }

    isFirebaseReady() {
        return (
            typeof window.firebase !== 'undefined' && 
            window.firebase &&
            window.auth && 
            window.db &&
            typeof window.auth.onAuthStateChanged === 'function'
        );
    }

    async waitForFirebaseAdvanced() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // Plus d'essais
            
            const check = () => {
                attempts++;
                console.log(`🔍 Tentative Firebase ${attempts}/${maxAttempts}`);
                
                if (this.isFirebaseReady()) {
                    console.log('✅ Firebase détecté !');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ Firebase non détecté après', maxAttempts, 'tentatives');
                    reject(new Error('Firebase non disponible'));
                } else {
                    setTimeout(check, 200); // Plus de temps entre les vérifications
                }
            };
            
            check();
        });
    }

    // Mode dégradé sans Firebase
    initWithoutFirebase() {
        console.log('🔄 Mode dégradé sans Firebase');
        
        // Créer des données de test
        this.createMockTeamManager();
        this.teamUI = new SynergiaTeamUI();
        this.teamUI.init(this.teamManager);
        
        // Intégrer quand même
        this.integrateWithExistingApp();
        
        console.log('✅ Mode dégradé activé');
    }

    createMockTeamManager() {
        // Mock du team manager pour tests
        this.teamManager = {
            isInitialized: true,
            roles: new Map([
                ['admin', { 
                    id: 'admin', 
                    name: 'Administrateur', 
                    color: '#ef4444', 
                    icon: 'fa-crown', 
                    level: 5,
                    permissions: ['all'],
                    description: 'Accès complet à toutes les fonctionnalités'
                }],
                ['manager', { 
                    id: 'manager', 
                    name: 'Manager', 
                    color: '#8b5cf6', 
                    icon: 'fa-user-tie', 
                    level: 4,
                    permissions: ['team_manage'],
                    description: 'Gestion d\'équipe et supervision'
                }],
                ['entretien', { 
                    id: 'entretien', 
                    name: 'Entretien & Maintenance', 
                    color: '#10b981', 
                    icon: 'fa-tools', 
                    level: 3,
                    permissions: ['quest_complete'],
                    description: 'Responsable de la maintenance'
                }]
            ]),
            teamMembers: new Map([
                ['1', {
                    id: '1',
                    displayName: 'Allan Boehme',
                    email: 'alan.boehme61@gmail.com',
                    role: 'admin',
                    level: 5,
                    xp: 750,
                    status: 'active',
                    avatar: 'https://img.icons8.com/color/96/administrator-male.png',
                    stats: { questsCompleted: 15, totalXP: 750, lastLogin: new Date() },
                    skills: ['Management', 'Leadership', 'Administration']
                }],
                ['2', {
                    id: '2',
                    displayName: 'Emma Martin',
                    email: 'emma.martin@brain-caen.fr',
                    role: 'entretien',
                    level: 3,
                    xp: 450,
                    status: 'active',
                    avatar: 'https://img.icons8.com/color/96/user-female-circle--v1.png',
                    stats: { questsCompleted: 8, totalXP: 450, lastLogin: new Date() },
                    skills: ['Maintenance', 'Technique']
                }]
            ]),
            
            getRoles() { return Array.from(this.roles.values()); },
            getRole(id) { return this.roles.get(id); },
            getActiveMembers() { return Array.from(this.teamMembers.values()).filter(m => m.status === 'active'); },
            getMembers() { return Array.from(this.teamMembers.values()); },
            getMemberById(id) { return this.teamMembers.get(id); },
            getMembersByRole(roleId) { return this.getMembers().filter(m => m.role === roleId); },
            
            getTeamStats() {
                const members = this.getActiveMembers();
                const totalMembers = members.length;
                const roleDistribution = {};
                const levelDistribution = {};
                let totalXP = 0;
                let averageLevel = 0;

                members.forEach(member => {
                    roleDistribution[member.role] = (roleDistribution[member.role] || 0) + 1;
                    levelDistribution[member.level] = (levelDistribution[member.level] || 0) + 1;
                    totalXP += member.xp || 0;
                    averageLevel += member.level || 1;
                });

                if (totalMembers > 0) {
                    averageLevel = Math.round(averageLevel / totalMembers * 10) / 10;
                }

                return { totalMembers, activeMembers: totalMembers, totalXP, averageLevel, roleDistribution, levelDistribution };
            },
            
            async addTeamMember(data) {
                const newId = (this.teamMembers.size + 1).toString();
                const newMember = {
                    id: newId,
                    displayName: data.displayName,
                    email: data.email,
                    role: data.role,
                    level: parseInt(data.level) || 1,
                    xp: 0,
                    status: 'active',
                    avatar: data.avatar || this.getDefaultAvatar(data.role),
                    stats: { questsCompleted: 0, totalXP: 0, lastLogin: null },
                    skills: this.getRoleSkills(data.role)
                };
                this.teamMembers.set(newId, newMember);
                this.emit('memberAdded', newMember);
                return newMember;
            },
            
            async updateTeamMember(id, updates) {
                const member = this.teamMembers.get(id);
                if (member) {
                    Object.assign(member, updates);
                    this.emit('memberUpdated', member);
                    return member;
                }
                throw new Error('Membre non trouvé');
            },
            
            async removeTeamMember(id) {
                const member = this.teamMembers.get(id);
                if (member) {
                    member.status = 'inactive';
                    this.emit('memberRemoved', member);
                    return true;
                }
                throw new Error('Membre non trouvé');
            },
            
            getDefaultAvatar(role) {
                const avatars = {
                    admin: 'https://img.icons8.com/color/96/administrator-male.png',
                    manager: 'https://img.icons8.com/color/96/manager.png',
                    entretien: 'https://img.icons8.com/color/96/maintenance.png'
                };
                return avatars[role] || 'https://img.icons8.com/color/96/user-male-circle--v1.png';
            },
            
            getRoleSkills(roleId) {
                const skillsMap = {
                    admin: ['Management', 'Leadership', 'Administration'],
                    manager: ['Management', 'Communication', 'Organisation'],
                    entretien: ['Maintenance', 'Technique', 'Sécurité']
                };
                return skillsMap[roleId] || [];
            },
            
            on(event, callback) {
                document.addEventListener(`synergia:team:${event}`, callback);
            },
            
            emit(event, data) {
                document.dispatchEvent(new CustomEvent(`synergia:team:${event}`, { detail: data }));
            }
        };
    }

    integrateWithExistingApp() {
        // Remplacer la fonction loadTeam existante
        if (window.mobileContentManager) {
            const originalLoadTeam = window.mobileContentManager.loadTeam;
            
            window.mobileContentManager.loadTeam = async () => {
                const mainContent = document.getElementById('main-content');
                if (mainContent && this.teamUI) {
                    try {
                        mainContent.innerHTML = this.teamUI.renderTeamPage();
                        console.log('👥 Page équipe complète chargée');
                    } catch (error) {
                        console.error('❌ Erreur rendu page équipe:', error);
                        // Fallback vers l'ancienne méthode
                        await originalLoadTeam();
                    }
                } else {
                    // Fallback vers l'ancienne méthode
                    await originalLoadTeam();
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
            } else {
                // Fallback vers l'ancien modal
                if (window.modalManager) {
                    window.modalManager.createModal({
                        title: 'Ajouter un membre',
                        content: 'Système d\'équipe en cours d\'initialisation...'
                    });
                }
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

            await this.teamManager.addTeamMember(currentUserData);
            console.log('✅ Utilisateur actuel ajouté comme admin');
        } catch (error) {
            console.error('❌ Erreur création équipe par défaut:', error);
        }
    }
}

// 📊 STYLES CSS POUR LE SYSTÈME D'ÉQUIPE (VERSION CONDENSÉE)
const teamStylesCompact = `
<style>
/* ===== STYLES ÉQUIPE COMPACTE ===== */
.team-page { width: 100%; max-width: 100vw; overflow-x: hidden; }

.team-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 24px; gap: 16px;
}

.team-title h2 { color: white; font-size: 28px; margin: 0 0 8px 0; font-weight: 700; }

.team-stats-summary { display: flex; gap: 16px; flex-wrap: wrap; }
.team-stats-summary .stat {
    background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 4px 12px;
    border-radius: 16px; font-size: 14px; font-weight: 500;
}

.team-tabs { margin-bottom: 24px; }
.team-tabs .tab { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.team-tabs .tab i { font-size: 16px; }

.members-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
}

@media (max-width: 768px) {
    .members-grid { grid-template-columns: 1fr; gap: 16px; }
    .team-header { flex-direction: column; align-items: stretch; }
    .team-stats-summary { justify-content: center; }
}

.member-card {
    background: rgba(15, 15, 25, 0.95); border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px; padding: 20px; transition: all 0.3s ease;
    position: relative; overflow: hidden;
}

.member-card:hover {
    transform: translateY(-4px); box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
}

.member-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }

.member-avatar-container { position: relative; flex-shrink: 0; }

.member-avatar {
    width: 60px; height: 60px; border-radius: 50%;
    border: 3px solid rgba(139, 92, 246, 0.3); object-fit: cover;
}

.member-status {
    position: absolute; bottom: 2px; right: 2px; width: 16px; height: 16px;
    border-radius: 50%; border: 2px solid rgba(15, 15, 25, 1);
}

.status-online { background: #10b981; }
.status-away { background: #f59e0b; }
.status-offline { background: #6b7280; }

.member-level {
    position: absolute; top: -8px; right: -8px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white;
    font-size: 11px; font-weight: bold; width: 24px; height: 24px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2px solid rgba(15, 15, 25, 1);
}

.member-info { flex: 1; min-width: 0; }

.member-name {
    color: white; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.member-role {
    display: flex; align-items: center; gap: 6px; font-size: 14px;
    font-weight: 500; margin-bottom: 4px;
}

.member-xp { color: #f59e0b; font-size: 13px; font-weight: 600; }

.member-actions { display: flex; flex-direction: column; gap: 4px; }

.btn-icon {
    background: rgba(255, 255, 255, 0.1); border: none;
    color: rgba(255, 255, 255, 0.7); width: 32px; height: 32px;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s ease; font-size: 14px;
}

.btn-icon:hover {
    background: rgba(139, 92, 246, 0.2); color: #a78bfa; transform: scale(1.05);
}

.btn-icon.btn-danger:hover { background: rgba(239, 68, 68, 0.2); color: #f87171; }

.member-stats {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
    padding-top: 16px; border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.stat-item { text-align: center; }

.stat-label {
    display: block; color: rgba(255, 255, 255, 0.6); font-size: 12px; margin-bottom: 4px;
}

.stat-value { color: white; font-weight: 600; font-size: 14px; }

.member-skills { display: flex; flex-wrap: wrap; gap: 6px; }

.skill-tag {
    background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 4px 8px;
    border-radius: 12px; font-size: 11px; font-weight: 500;
}

/* États vides */
.empty-state {
    text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.6);
}

.empty-state i { color: rgba(139, 92, 246, 0.5); margin-bottom: 20px; }
.empty-state h3 { color: white; margin: 16px 0 8px; font-size: 24px; }
.empty-state p { margin-bottom: 24px; font-size: 16px; }

/* Rôles */
.roles-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
}

@media (max-width: 768px) {
    .roles-grid { grid-template-columns: 1fr; }
}

.role-card {
    background: rgba(15, 15, 25, 0.95); border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px; padding: 20px; transition: all 0.3s ease;
}

.role-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }

.role-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }

.role-icon {
    width: 48px; height: 48px; border-radius: 12px; background: rgba(255, 255, 255, 0.1);
    display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}

.role-info { flex: 1; }

.role-name { color: white; font-size: 18px; font-weight: 600; margin: 0 0 4px 0; }

.role-description {
    color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0; line-height: 1.4;
}

.role-level {
    background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white;
    padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; flex-shrink: 0;
}

.role-stats {
    display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px;
}

.role-members { color: #10b981; font-weight: 600; }
.role-permissions { color: rgba(255, 255, 255, 0.6); }

.permission-tag {
    background: rgba(139, 92, 246, 0.2); color: #a78bfa; padding: 2px 6px;
    border-radius: 8px; font-size: 10px; font-weight: 500;
}

/* Statistiques */
.stats-overview {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px; margin-bottom: 32px;
}

.stat-card {
    background: rgba(15, 15, 25, 0.95); border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 16px;
}

.stat-icon {
    width: 56px; height: 56px; border-radius: 16px; background: rgba(139, 92, 246, 0.2);
    display: flex; align-items: center; justify-content: center; color: #a78bfa; font-size: 24px;
}

.stat-number { color: white; font-size: 32px; font-weight: 700; line-height: 1; }
.stat-label { color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 500; }

/* Formulaires */
.team-form { width: 100%; }

.form-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;
}

@media (max-width: 768px) {
    .form-row { grid-template-columns: 1fr; gap: 12px; }
}

.form-actions {
    display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;
    padding-top: 20px; border-top: 1px solid rgba(139, 92, 246, 0.1);
}

@media (max-width: 768px) {
    .form-actions { justify-content: stretch; }
    .form-actions .btn-primary, .form-actions .btn-secondary { flex: 1; }
}
</style>
`;

// Ajouter les styles condensés
document.head.insertAdjacentHTML('beforeend', teamStylesCompact);

// 🚀 INITIALISATION RETARDÉE POUR ÉVITER LES CONFLITS
let initRetryCount = 0;
const maxRetries = 10;

function attemptTeamInit() {
    initRetryCount++;
    console.log(`🔄 Tentative initialisation équipe ${initRetryCount}/${maxRetries}`);
    
    try {
        window.teamIntegration = new SynergiaTeamIntegration();
        window.teamIntegration.init();
        console.log('✅ Team integration lancée');
    } catch (error) {
        console.error('❌ Erreur team integration:', error);
        
        if (initRetryCount < maxRetries) {
            setTimeout(attemptTeamInit, 2000);
        } else {
            console.warn('⚠️ Abandon après', maxRetries, 'tentatives');
        }
    }
}

// Démarrer l'initialisation après que tout soit chargé
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(attemptTeamInit, 3000); // Attendre 3 secondes
});

console.log('🚀 Team Integration Fixed chargé');