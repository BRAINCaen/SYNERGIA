/* ===== SYNERGIA MOBILE CONTENT MANAGER - FIX CUMUL ===== */

class SynergiaMobileContentManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.isTransitioning = false;
        this.contentCache = new Map();
        this.init();
    }

    init() {
        console.log('📱 Mobile Content Manager initialisé');
        this.setupContentContainer();
        this.bindNavigationEvents();
    }

    setupContentContainer() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.transform = 'translateX(0)';
            mainContent.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        }
    }

    bindNavigationEvents() {
        // Override des fonctions de navigation existantes
        window.navigateToPage = (page) => this.navigateToPage(page);
        window.loadPage = (page) => this.loadPage(page);
        window.loadDashboard = () => this.loadDashboard();
        window.loadQuests = () => this.loadQuests();
        window.loadTeam = () => this.loadTeam();
        window.loadCalendar = () => this.loadCalendar();
        window.loadChat = () => this.loadChat();
    }

    // Navigation principale avec animation mobile
    navigateToPage(page) {
        if (this.isTransitioning || page === this.currentPage) return;
        
        console.log(`📱 Navigation mobile vers: ${page}`);
        
        // Fermer tous les modals avant navigation
        if (window.modalManager) {
            window.modalManager.closeAllModals();
        }

        // Mettre à jour la navigation
        this.updateNavigation(page);
        
        // Charger la page avec animation
        this.loadPageWithAnimation(page);
        
        this.currentPage = page;
    }

    // Mise à jour de la navigation bottom
    updateNavigation(activePage) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === activePage) {
                btn.classList.add('active');
            }
        });
    }

    // Chargement de page avec animation mobile
    async loadPageWithAnimation(page) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const mainContent = document.getElementById('main-content');
        
        if (!mainContent) {
            console.error('❌ Main content non trouvé');
            this.isTransitioning = false;
            return;
        }

        try {
            // Animation de sortie
            mainContent.style.opacity = '0';
            mainContent.style.transform = 'translateX(-20px)';
            
            // Attendre l'animation
            await this.wait(150);
            
            // VIDER LE CONTENU (fix du cumul!)
            mainContent.innerHTML = '';
            
            // Charger le nouveau contenu
            await this.loadPage(page);
            
            // Animation d'entrée
            mainContent.style.transform = 'translateX(20px)';
            await this.wait(50);
            
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateX(0)';
            
        } catch (error) {
            console.error('❌ Erreur navigation:', error);
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateX(0)';
        } finally {
            this.isTransitioning = false;
        }
    }

    // Attendre un délai
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Charger une page spécifique
    async loadPage(page) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // IMPORTANT: Vider le contenu avant de charger
        mainContent.innerHTML = '';

        switch(page) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'quests':
                await this.loadQuests();
                break;
            case 'team':
                await this.loadTeam();
                break;
            case 'calendar':
                await this.loadCalendar();
                break;
            case 'chat':
                await this.loadChat();
                break;
            default:
                await this.loadDashboard();
        }

        // Scroll vers le haut après chargement
        mainContent.scrollTop = 0;
        
        console.log(`✅ Page ${page} chargée`);
    }

    // === CHARGEMENT DES PAGES ===

    async loadDashboard() {
        const template = document.getElementById('dashboard-template');
        const mainContent = document.getElementById('main-content');
        
        if (!template) {
            mainContent.innerHTML = this.getFallbackDashboard();
            return;
        }

        const content = template.content.cloneNode(true);
        mainContent.appendChild(content);
        
        // Initialiser les données du dashboard
        this.initDashboardData();
        
        console.log('📊 Dashboard mobile chargé');
    }

    async loadQuests() {
        const template = document.getElementById('quests-template');
        const mainContent = document.getElementById('main-content');
        
        if (!template) {
            mainContent.innerHTML = this.getFallbackQuests();
        } else {
            const content = template.content.cloneNode(true);
            mainContent.appendChild(content);
        }
        
        // Initialiser les onglets des quêtes
        this.initQuestTabs();
        
        console.log('🎯 Quêtes mobiles chargées');
    }

    async loadTeam() {
        const mainContent = document.getElementById('main-content');
        
        mainContent.innerHTML = `
            <div class="team-page">
                <div class="section-header mb-mobile">
                    <h2>Équipe</h2>
                    <button class="btn-primary" onclick="showAddTeamMemberModal()">
                        <i class="fas fa-plus"></i> Ajouter
                    </button>
                </div>
                
                <div class="tabs">
                    <button class="tab active" data-tab="members">Membres</button>
                    <button class="tab" data-tab="assignments">Missions</button>
                    <button class="tab" data-tab="performance">Stats</button>
                </div>
                
                <div class="tab-content active" id="members-tab">
                    <div class="team-grid" id="team-members-grid">
                        ${this.getTeamMembersHTML()}
                    </div>
                </div>
                
                <div class="tab-content" id="assignments-tab">
                    <div class="placeholder-content">
                        <i class="fas fa-tasks fa-3x"></i>
                        <h3>Missions d'équipe</h3>
                        <p>Fonctionnalité en développement</p>
                    </div>
                </div>
                
                <div class="tab-content" id="performance-tab">
                    <div class="placeholder-content">
                        <i class="fas fa-chart-line fa-3x"></i>
                        <h3>Performances</h3>
                        <p>Statistiques à venir</p>
                    </div>
                </div>
            </div>
        `;
        
        // Initialiser les onglets équipe
        this.initTeamTabs();
        
        console.log('👥 Équipe mobile chargée');
    }

    async loadCalendar() {
        const mainContent = document.getElementById('main-content');
        
        mainContent.innerHTML = `
            <div class="calendar-page">
                <div class="section-header mb-mobile">
                    <h2>Planning</h2>
                    <button class="btn-primary">
                        <i class="fas fa-plus"></i> Événement
                    </button>
                </div>
                
                <div class="calendar-widget">
                    <div class="calendar-header">
                        <button class="btn-secondary">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3>Juin 2025</h3>
                        <button class="btn-secondary">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="placeholder-content">
                        <i class="fas fa-calendar fa-3x"></i>
                        <h3>Calendrier</h3>
                        <p>Planning en cours de développement</p>
                    </div>
                </div>
            </div>
        `;
        
        console.log('📅 Calendrier mobile chargé');
    }

    async loadChat() {
        const mainContent = document.getElementById('main-content');
        
        mainContent.innerHTML = `
            <div class="chat-page">
                <div class="section-header mb-mobile">
                    <h2>Chat Équipe</h2>
                    <button class="btn-primary">
                        <i class="fas fa-users"></i> Nouveau groupe
                    </button>
                </div>
                
                <div class="chat-list">
                    <div class="chat-item">
                        <div class="chat-avatar">
                            <img src="https://img.icons8.com/color/48/user-group-man-man.png" alt="Groupe">
                        </div>
                        <div class="chat-info">
                            <h4>Équipe Générale</h4>
                            <p>Dernier message: Salut l'équipe !</p>
                        </div>
                        <div class="chat-time">14:30</div>
                    </div>
                </div>
                
                <div class="placeholder-content">
                    <i class="fas fa-comments fa-3x"></i>
                    <h3>Chat d'équipe</h3>
                    <p>Messagerie en cours de développement</p>
                </div>
            </div>
        `;
        
        console.log('💬 Chat mobile chargé');
    }

    // === INITIALISATIONS ===

    initDashboardData() {
        // Mettre à jour les données du dashboard
        if (window.synergiaData || window.SynergiaAPI) {
            try {
                const userData = window.SynergiaAPI?.getUserData() || {};
                const welcomeName = document.getElementById('welcome-name');
                if (welcomeName && userData.displayName) {
                    welcomeName.textContent = userData.displayName;
                }
            } catch (error) {
                console.warn('Données utilisateur non disponibles');
            }
        }
    }

    initQuestTabs() {
        const tabs = document.querySelectorAll('.quests-page .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Désactiver tous les onglets
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.quests-page .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Activer l'onglet cliqué
                tab.classList.add('active');
                const targetContent = document.getElementById(`${tabName}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                console.log(`🎯 Onglet quête: ${tabName}`);
            });
        });
    }

    initTeamTabs() {
        const tabs = document.querySelectorAll('.team-page .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Désactiver tous les onglets
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.team-page .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Activer l'onglet cliqué
                tab.classList.add('active');
                const targetContent = document.getElementById(`${tabName}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                console.log(`👥 Onglet équipe: ${tabName}`);
            });
        });
    }

    // === FALLBACKS HTML ===

    getFallbackDashboard() {
        return `
            <div class="dashboard">
                <div class="welcome-card">
                    <h2>Bienvenue, Boss !</h2>
                    <p class="stat-highlight">2 quêtes aujourd'hui</p>
                </div>
                
                <div class="stats-card">
                    <h3>Niveau 4 - Expert</h3>
                    <div class="level-progress">
                        <div class="xp-progress" style="width: 60%;"></div>
                        <span>240/400 XP</span>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <button class="btn-primary" onclick="navigateToPage('quests')">
                        <i class="fas fa-tasks"></i> Voir les quêtes
                    </button>
                    <button class="btn-secondary" onclick="navigateToPage('team')">
                        <i class="fas fa-users"></i> Gérer l'équipe
                    </button>
                </div>
            </div>
        `;
    }

    getFallbackQuests() {
        return `
            <div class="quests-page">
                <div class="section-header mb-mobile">
                    <h2>Quêtes</h2>
                    <button class="btn-primary" onclick="showCreateQuestModal()">
                        <i class="fas fa-plus"></i> Créer
                    </button>
                </div>
                
                <div class="placeholder-content">
                    <i class="fas fa-tasks fa-3x"></i>
                    <h3>Aucune quête</h3>
                    <p>Créez votre première quête !</p>
                </div>
            </div>
        `;
    }

    getTeamMembersHTML() {
        const members = [
            {
                name: 'Allan Boehme',
                role: 'Manager',
                avatar: 'https://img.icons8.com/color/56/user-male-circle--v1.png',
                status: 'online',
                level: 4
            },
            {
                name: 'Emma Martin',
                role: 'Accueil',
                avatar: 'https://img.icons8.com/color/56/user-female-circle--v1.png',
                status: 'online',
                level: 3
            }
        ];

        return members.map(member => `
            <div class="team-member">
                <img src="${member.avatar}" alt="${member.name}" class="member-avatar">
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p class="member-role">${member.role} - Niveau ${member.level}</p>
                    <span class="member-status status-${member.status}">
                        <i class="fas fa-circle"></i> ${member.status === 'online' ? 'En ligne' : 'Absent'}
                    </span>
                </div>
                <div class="member-actions">
                    <button class="btn-secondary btn-small" onclick="messageTeamMember('${member.name}')">
                        <i class="fas fa-message"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// === STYLES ADDITIONNELS POUR MOBILE ===
const additionalMobileStyles = `
<style>
.placeholder-content {
    text-align: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.6);
}

.placeholder-content i {
    color: rgba(139, 92, 246, 0.5);
    margin-bottom: 20px;
}

.placeholder-content h3 {
    color: white;
    margin: 16px 0 8px;
    font-size: 20px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-header h2 {
    color: white;
    font-size: 24px;
    margin: 0;
    font-weight: 600;
}

.quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
}

.chat-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 12px;
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.chat-avatar img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
}

.chat-info {
    flex: 1;
}

.chat-info h4 {
    color: white;
    margin: 0 0 4px;
    font-size: 16px;
}

.chat-info p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 14px;
}

.chat-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
}

.member-status {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}

.status-online i {
    color: #10b981;
}

.status-away i {
    color: #f59e0b;
}

.member-actions {
    display: flex;
    gap: 8px;
}

.btn-small {
    padding: 8px 12px;
    font-size: 14px;
    min-height: 36px;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.calendar-header h3 {
    color: white;
    margin: 0;
    font-size: 20px;
}
</style>
`;

// Ajouter les styles
document.head.insertAdjacentHTML('beforeend', additionalMobileStyles);

// Initialiser le gestionnaire mobile
window.mobileContentManager = new SynergiaMobileContentManager();

console.log('📱 Mobile Content Manager initialisé et actif');