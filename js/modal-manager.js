/* ===== SYNERGIA MODAL MANAGER - FIX CUMUL MOBILE ===== */

class SynergiaModalManager {
    constructor() {
        this.activeModals = new Set();
        this.modalQueue = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Gestionnaire global des clics
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && !e.target.querySelector('.modal-content').contains(e.target)) {
                this.closeTopModal();
            }
        });

        // Gestionnaire ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        this.isInitialized = true;
        console.log('🎭 Modal Manager initialisé');
    }

    // Créer un modal proprement
    createModal(options = {}) {
        const {
            id = 'modal_' + Date.now(),
            title = 'Modal',
            content = '',
            size = 'medium',
            closable = true,
            backdrop = true
        } = options;

        // Fermer tous les modals existants d'abord
        this.closeAllModals();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.setAttribute('data-modal-id', id);

        modal.innerHTML = `
            <div class="modal-content modal-${size}">
                <div class="modal-header">
                    <h3>${this.sanitize(title)}</h3>
                    ${closable ? '<button class="icon-btn modal-close" data-action="close"><i class="fas fa-times"></i></button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        // Event listeners pour ce modal
        if (closable) {
            modal.querySelector('.modal-close').addEventListener('click', () => {
                this.closeModal(id);
            });
        }

        if (backdrop) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(id);
                }
            });
        }

        document.body.appendChild(modal);
        this.activeModals.add(id);

        // Afficher avec animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        console.log(`✅ Modal ${id} créé`);
        return id;
    }

    // Fermer un modal spécifique
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            this.activeModals.delete(modalId);
            console.log(`❌ Modal ${modalId} fermé`);
        }, 300);
    }

    // Fermer le modal du dessus
    closeTopModal() {
        const modals = Array.from(this.activeModals);
        if (modals.length > 0) {
            const topModal = modals[modals.length - 1];
            this.closeModal(topModal);
        }
    }

    // Fermer TOUS les modals
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 100);
        });
        this.activeModals.clear();
        console.log('🧹 Tous les modals fermés');
    }

    // Sécuriser le contenu
    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Vérifier si un modal est ouvert
    isModalOpen(modalId = null) {
        if (modalId) {
            return this.activeModals.has(modalId);
        }
        return this.activeModals.size > 0;
    }

    // Obtenir la liste des modals actifs
    getActiveModals() {
        return Array.from(this.activeModals);
    }
}

// Instance globale
window.modalManager = new SynergiaModalManager();

// === FONCTIONS HELPER POUR L'APP ===

// Créer modal d'ajout de membre d'équipe
function showAddTeamMemberModal() {
    window.modalManager.closeAllModals();
    
    const content = `
        <form id="add-member-form" class="mobile-form">
            <div class="form-group">
                <label>Nom complet</label>
                <input type="text" id="member-name" placeholder="Prénom Nom" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="member-email" placeholder="email@example.com" required>
            </div>
            <div class="form-group">
                <label>Rôle</label>
                <select id="member-role" required>
                    <option value="">Sélectionner un rôle</option>
                    <option value="entretien">Entretien & Maintenance</option>
                    <option value="accueil">Accueil Client</option>
                    <option value="animation">Animation</option>
                    <option value="securite">Sécurité</option>
                    <option value="manager">Manager</option>
                </select>
            </div>
            <div class="form-group">
                <label>Niveau initial</label>
                <select id="member-level">
                    <option value="1">Débutant (Niveau 1)</option>
                    <option value="2">Novice (Niveau 2)</option>
                    <option value="3">Intermédiaire (Niveau 3)</option>
                    <option value="4">Avancé (Niveau 4)</option>
                    <option value="5">Expert (Niveau 5)</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick="modalManager.closeTopModal()">
                    Annuler
                </button>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-plus"></i> Ajouter le membre
                </button>
            </div>
        </form>
    `;

    const modalId = window.modalManager.createModal({
        title: 'Ajouter un membre',
        content: content,
        size: 'large'
    });

    // Gestionnaire du formulaire
    setTimeout(() => {
        const form = document.getElementById('add-member-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleAddTeamMember();
            });
        }
    }, 100);

    return modalId;
}

// Créer modal de création de quête
function showCreateQuestModal() {
    window.modalManager.closeAllModals();
    
    const content = `
        <form id="create-quest-form" class="mobile-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Titre de la quête</label>
                    <input type="text" id="quest-title" placeholder="Ex: Vérifier l'accueil" required>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select id="quest-type" required>
                        <option value="daily">Quotidienne</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuelle</option>
                        <option value="special">Spéciale</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="quest-description" placeholder="Décrivez ce qu'il faut faire..." rows="3" required></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>XP à gagner</label>
                    <input type="number" id="quest-xp" min="1" max="500" value="10" required>
                </div>
                <div class="form-group">
                    <label>Priorité</label>
                    <select id="quest-priority">
                        <option value="low">Faible</option>
                        <option value="normal">Normale</option>
                        <option value="high">Élevée</option>
                        <option value="urgent">Urgente</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="quest-recurring"> 
                    Quête récurrente
                </label>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick="modalManager.closeTopModal()">
                    Annuler
                </button>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-plus"></i> Créer la quête
                </button>
            </div>
        </form>
    `;

    const modalId = window.modalManager.createModal({
        title: 'Créer une nouvelle quête',
        content: content,
        size: 'large'
    });

    // Gestionnaire du formulaire
    setTimeout(() => {
        const form = document.getElementById('create-quest-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleCreateQuest();
            });
        }
    }, 100);

    return modalId;
}

// Créer modal de notification
function showNotificationModal(message, type = 'info', duration = 3000) {
    // Supprimer anciennes notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle', 
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icons[type]}"></i>
            <span>${window.modalManager.sanitize(message)}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Afficher
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Auto-fermeture
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);

    // Bouton fermeture
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// === HANDLERS DES FORMULAIRES ===

function handleAddTeamMember() {
    const name = document.getElementById('member-name').value;
    const email = document.getElementById('member-email').value;
    const role = document.getElementById('member-role').value;
    const level = document.getElementById('member-level').value;

    if (!name || !email || !role) {
        showNotificationModal('Veuillez remplir tous les champs requis', 'error');
        return;
    }

    // Simuler l'ajout (à remplacer par vraie logique)
    console.log('Ajout membre:', { name, email, role, level });
    
    window.modalManager.closeTopModal();
    showNotificationModal(`${name} ajouté à l'équipe !`, 'success');
    
    // Recharger la page équipe si on y est
    if (window.currentPage === 'team') {
        loadTeam();
    }
}

function handleCreateQuest() {
    const title = document.getElementById('quest-title').value;
    const type = document.getElementById('quest-type').value;
    const description = document.getElementById('quest-description').value;
    const xp = document.getElementById('quest-xp').value;
    const priority = document.getElementById('quest-priority').value;
    const recurring = document.getElementById('quest-recurring').checked;

    if (!title || !description) {
        showNotificationModal('Veuillez remplir tous les champs requis', 'error');
        return;
    }

    // Simuler la création (à remplacer par vraie logique)
    console.log('Création quête:', { title, type, description, xp, priority, recurring });
    
    window.modalManager.closeTopModal();
    showNotificationModal(`Quête "${title}" créée !`, 'success');
    
    // Recharger la page quêtes si on y est
    if (window.currentPage === 'quests') {
        loadQuests();
    }
}

// === REMPLACEMENTS DES FONCTIONS GLOBALES ===

// Remplacer les anciennes fonctions
window.addTeamMember = showAddTeamMemberModal;
window.addQuest = showCreateQuestModal;
window.openAdminModal = function() {
    showNotificationModal('Panel admin en développement', 'info');
};

// Fonction de notification globale
window.showNotification = showNotificationModal;

// Fonctions pour les messages et assignation
window.messageTeamMember = function(memberId) {
    showNotificationModal(`Message envoyé à ${memberId}`, 'info');
};

window.assignQuestToMember = function(questId, memberId) {
    showNotificationModal(`Quête ${questId} assignée à ${memberId}`, 'success');
};

console.log('🎭 Modal Manager chargé et fonctions globales remplacées');