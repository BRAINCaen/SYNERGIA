// main.js - Gestion de la navigation et logique principale

// Variables globales
let currentPage = 'dashboard';

// Gestion de la navigation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application SYNERGIA initialisée');
    
    // Initialiser la navigation
    initNavigation();
    
    // Initialiser les onglets
    initTabs();
    
    // Charger les données initiales
    loadInitialData();
});

// Initialiser la navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const page = this.dataset.page;
            navigateToPage(page);
        });
    });
    
    console.log('Navigation initialisée');
}

// Navigation entre les pages
function navigateToPage(page) {
    // Désactiver tous les boutons de navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer le bouton sélectionné
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Charger la page
    loadPage(page);
    currentPage = page;
    
    console.log('Navigation vers:', page);
}

// Charger une page spécifique
function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'quests':
            loadQuests();
            break;
        case 'team':
            loadTeam();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'chat':
            loadChat();
            break;
        default:
            loadDashboard();
    }
}

// Charger le tableau de bord
function loadDashboard() {
    const template = document.getElementById('dashboard-template');
    if (!template) {
        console.error('Template dashboard non trouvé');
        return;
    }
    
    const content = template.content.cloneNode(true);
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = '';
    mainContent.appendChild(content);
    
    // Mettre à jour les données du dashboard
    updateDashboardData();
    
    console.log('Dashboard chargé');
}

// Charger les quêtes
function loadQuests() {
    const template = document.getElementById('quests-template');
    if (!template) {
        console.error('Template quests non trouvé');
        return;
    }
    
    const content = template.content.cloneNode(true);
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = '';
    mainContent.appendChild(content);
    
    // Initialiser les onglets des quêtes
    initQuestTabs();
    
    // Charger les quêtes
    if (typeof loadQuestData === 'function') {
        loadQuestData();
    }
    
    console.log('Quêtes chargées');
}

// Charger les autres pages (placeholder)
function loadTeam() {
    document.getElementById('main-content').innerHTML = `
        <div class="team-page">
            <h2>Équipe</h2>
            <p>Gestion de l'équipe - En cours de développement</p>
        </div>
    `;
}

function loadCalendar() {
    document.getElementById('main-content').innerHTML = `
        <div class="calendar-page">
            <h2>Planning</h2>
            <p>Calendrier et planification - En cours de développement</p>
        </div>
    `;
}

function loadChat() {
    document.getElementById('main-content').innerHTML = `
        <div class="chat-page">
            <h2>Chat</h2>
            <p>Messagerie d'équipe - En cours de développement</p>
        </div>
    `;
}

// Initialiser les onglets
function initTabs() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab')) {
            const tabs = e.target.parentElement.querySelectorAll('.tab');
            const tabContents = e.target.parentElement.parentElement.querySelectorAll('.tab-content');
            const targetTab = e.target.dataset.tab;
            
            // Désactiver tous les onglets
            tabs.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activer l'onglet sélectionné
            e.target.classList.add('active');
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        }
    });
}

// Initialiser les onglets des quêtes
function initQuestTabs() {
    const tabs = document.querySelectorAll('.quests-page .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Désactiver tous les onglets
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.quests-page .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activer l'onglet sélectionné
            this.classList.add('active');
            const targetContent = document.getElementById(`${tabName}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            console.log('Onglet quête activé:', tabName);
        });
    });
}

// Mettre à jour les données du dashboard
function updateDashboardData() {
    // Mettre à jour le nom d'accueil
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName && userProfile) {
        welcomeName.textContent = userProfile.displayName || 'Coéquipier';
    }
    
    // Mettre à jour le niveau
    const levelBadge = document.getElementById('level-badge');
    const levelTitle = document.getElementById('level-title');
    if (levelBadge && userProfile) {
        levelBadge.textContent = userProfile.level || 1;
        if (levelTitle) {
            levelTitle.textContent = getLevelTitle(userProfile.level || 1);
        }
    }
    
    // Mettre à jour le rôle
    const roleName = document.getElementById('role-name');
    if (roleName && userProfile && userProfile.roles) {
        const mainRole = userProfile.roles[0] || 'entretien';
        roleName.textContent = getRoleName(mainRole);
    }
    
    // Charger les quêtes du jour (version simple)
    loadDailyQuestPreview();
}

// Obtenir le titre du niveau
function getLevelTitle(level) {
    const titles = {
        1: 'Novice',
        2: 'Apprenti',
        3: 'Confirmé',
        4: 'Expert',
        5: 'Maître'
    };
    return titles[level] || 'Novice';
}

// Obtenir le nom du rôle
function getRoleName(roleKey) {
    const roleNames = {
        'entretien': 'Entretien & Maintenance',
        'accueil': 'Accueil Client',
        'animation': 'Animation',
        'securite': 'Sécurité'
    };
    return roleNames[roleKey] || 'Entretien & Maintenance';
}

// Charger un aperçu des quêtes du jour
function loadDailyQuestPreview() {
    const container = document.getElementById('daily-quests');
    if (!container) return;
    
    // Données d'exemple
    const dailyQuests = [
        {
            id: 1,
            title: "Vérifier l'accueil",
            description: "S'assurer que l'espace d'accueil est propre",
            xp: 10,
            deadline: "18h00"
        },
        {
            id: 2,
            title: "Contrôle équipements",
            description: "Vérifier le bon fonctionnement des jeux",
            xp: 15,
            deadline: "20h00"
        }
    ];
    
    if (dailyQuests.length === 0) {
        container.innerHTML = '<div class="no-quests">Aucune quête pour aujourd\'hui !</div>';
        return;
    }
    
    container.innerHTML = dailyQuests.map(quest => `
        <div class="quest-item">
            <div class="quest-info">
                <h4 class="quest-title">${quest.title}</h4>
                <p class="quest-description">${quest.description}</p>
                <div class="quest-meta">
                    <span class="quest-xp"><i class="fas fa-star"></i> ${quest.xp} XP</span>
                    <span class="quest-deadline"><i class="fas fa-clock"></i> ${quest.deadline}</span>
                </div>
            </div>
            <button class="btn-complete" onclick="completeQuest(${quest.id})">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `).join('');
}

// Charger les données initiales
function loadInitialData() {
    // Données de base déjà chargées via auth.js
    console.log('Données initiales chargées');
}

// Fonction pour compléter une quête
function completeQuest(questId) {
    alert(`Quête ${questId} terminée ! +XP gagné !`);
    // Ici on pourra ajouter la logique Firebase plus tard
}

// Fonction appelée depuis auth.js
window.loadPage = loadPage;
window.navigateToPage = navigateToPage;
