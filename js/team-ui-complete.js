/* ===== SYNERGIA TEAM UI - INTERFACE COMPLÈTE ===== */

class SynergiaTeamUI {
    constructor() {
        this.teamManager = null;
        this.currentTab = 'members';
        this.editingMemberId = null;
        this.isLoading = false;
        
        console.log('🎨 Team UI créé');
    }

    // 🚀 INITIALISATION
    async init(teamManager) {
        this.teamManager = teamManager;
        
        if (!this.teamManager) {
            console.error('❌ Team Manager requis pour Team UI');
            return false;
        }

        // Écouter les événements du team manager
        this.setupEventListeners();
        
        console.log('✅ Team UI initialisé');
        return true;
    }

    setupEventListeners() {
        // Événements du team manager
        this.teamManager.on('teamLoaded', () => this.refreshTeamDisplay());
        this.teamManager.on('memberAdded', (e) => this.onMemberAdded(e.detail));
        this.teamManager.on('memberUpdated', (e) => this.onMemberUpdated(e.detail));
        this.teamManager.on('memberRemoved', (e) => this.onMemberRemoved(e.detail));
    }

    // 📄 RENDU DE LA PAGE ÉQUIPE
    renderTeamPage() {
        const members = this.teamManager.getActiveMembers();
        const roles = this.teamManager.getRoles();
        const stats = this.teamManager.getTeamStats();

        return `
            <div class="team-page">
                <!-- Header avec stats -->
                <div class="team-header">
                    <div class="team-title">
                        <h2>Équipe</h2>
                        <div class="team-stats-summary">
                            <span class="stat">${stats.totalMembers} membres</span>
                            <span class="stat">Niveau moyen: ${stats.averageLevel}</span>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="teamUI.showAddMemberModal()">
                        <i class="fas fa-user-plus"></i> Ajouter un membre
                    </button>
                </div>

                <!-- Onglets -->
                <div class="tabs team-tabs">
                    <button class="tab ${this.currentTab === 'members' ? 'active' : ''}" 
                            onclick="teamUI.switchTab('members')">
                        <i class="fas fa-users"></i> Membres (${stats.totalMembers})
                    </button>
                    <button class="tab ${this.currentTab === 'roles' ? 'active' : ''}" 
                            onclick="teamUI.switchTab('roles')">
                        <i class="fas fa-user-tag"></i> Rôles (${roles.length})
                    </button>
                    <button class="tab ${this.currentTab === 'stats' ? 'active' : ''}" 
                            onclick="teamUI.switchTab('stats')">
                        <i class="fas fa-chart-bar"></i> Statistiques
                    </button>
                </div>

                <!-- Contenu des onglets -->
                <div class="tab-content active" id="members-tab">
                    ${this.renderMembersTab(members)}
                </div>

                <div class="tab-content" id="roles-tab">
                    ${this.renderRolesTab(roles)}
                </div>

                <div class="tab-content" id="stats-tab">
                    ${this.renderStatsTab(stats)}
                </div>
            </div>
        `;
    }

    renderMembersTab(members) {
        if (members.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-users fa-3x"></i>
                    <h3>Aucun membre d'équipe</h3>
                    <p>Commencez par ajouter votre premier membre</p>
                    <button class="btn-primary" onclick="teamUI.showAddMemberModal()">
                        <i class="fas fa-plus"></i> Ajouter un membre
                    </button>
                </div>
            `;
        }

        return `
            <div class="members-grid">
                ${members.map(member => this.renderMemberCard(member)).join('')}
            </div>
        `;
    }

    renderMemberCard(member) {
        const role = this.teamManager.getRole(member.role);
        const statusClass = member.status === 'active' ? 'online' : 'away';
        const lastLogin = member.stats?.lastLogin ? 
            new Date(member.stats.lastLogin.toDate()).toLocaleDateString() : 'Jamais';

        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-header">
                    <div class="member-avatar-container">
                        <img src="${member.avatar}" alt="${member.displayName}" class="member-avatar">
                        <div class="member-status status-${statusClass}"></div>
                        <div class="member-level">N${member.level}</div>
                    </div>
                    <div class="member-info">
                        <h4 class="member-name">${member.displayName}</h4>
                        <div class="member-role" style="color: ${role?.color || '#8b5cf6'}">
                            <i class="fas ${role?.icon || 'fa-user'}"></i>
                            ${role?.name || member.role}
                        </div>
                        <div class="member-xp">${member.xp || 0} XP</div>
                    </div>
                    <div class="member-actions">
                        <button class="btn-icon" onclick="teamUI.editMember('${member.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="teamUI.showMemberDetails('${member.id}')" title="Détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="teamUI.removeMember('${member.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="member-stats">
                    <div class="stat-item">
                        <span class="stat-label">Quêtes</span>
                        <span class="stat-value">${member.stats?.questsCompleted || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Dernière connexion</span>
                        <span class="stat-value">${lastLogin}</span>
                    </div>
                </div>

                ${member.skills && member.skills.length > 0 ? `
                    <div class="member-skills">
                        ${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderRolesTab(roles) {
        return `
            <div class="roles-section">
                <div class="section-header">
                    <h3>Rôles disponibles</h3>
                    <button class="btn-secondary" onclick="teamUI.showCreateRoleModal()">
                        <i class="fas fa-plus"></i> Créer un rôle
                    </button>
                </div>
                
                <div class="roles-grid">
                    ${roles.map(role => this.renderRoleCard(role)).join('')}
                </div>
            </div>
        `;
    }

    renderRoleCard(role) {
        const memberCount = this.teamManager.getMembersByRole(role.id).length;
        
        return `
            <div class="role-card" style="border-left: 4px solid ${role.color}">
                <div class="role-header">
                    <div class="role-icon" style="color: ${role.color}">
                        <i class="fas ${role.icon}"></i>
                    </div>
                    <div class="role-info">
                        <h4 class="role-name">${role.name}</h4>
                        <p class="role-description">${role.description}</p>
                    </div>
                    <div class="role-level">N${role.level}</div>
                </div>
                
                <div class="role-stats">
                    <span class="role-members">${memberCount} membre(s)</span>
                    <span class="role-permissions">${role.permissions.length} permission(s)</span>
                </div>

                <div class="role-permissions-list">
                    ${role.permissions.slice(0, 3).map(perm => `
                        <span class="permission-tag">${this.formatPermission(perm)}</span>
                    `).join('')}
                    ${role.permissions.length > 3 ? `<span class="permission-more">+${role.permissions.length - 3}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderStatsTab(stats) {
        return `
            <div class="stats-section">
                <!-- Statistiques générales -->
                <div class="stats-overview">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.totalMembers}</div>
                            <div class="stat-label">Membres actifs</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.totalXP.toLocaleString()}</div>
                            <div class="stat-label">XP total</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-level-up"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${stats.averageLevel}</div>
                            <div class="stat-label">Niveau moyen</div>
                        </div>
                    </div>
                </div>

                <!-- Distribution par rôles -->
                <div class="role-distribution">
                    <h3>Distribution par rôles</h3>
                    <div class="distribution-chart">
                        ${Object.entries(stats.roleDistribution).map(([roleId, count]) => {
                            const role = this.teamManager.getRole(roleId);
                            const percentage = (count / stats.totalMembers * 100).toFixed(1);
                            return `
                                <div class="distribution-item">
                                    <div class="distribution-bar">
                                        <div class="distribution-fill" 
                                             style="width: ${percentage}%; background: ${role?.color || '#8b5cf6'}">
                                        </div>
                                    </div>
                                    <div class="distribution-label">
                                        <span class="role-name">${role?.name || roleId}</span>
                                        <span class="role-count">${count} (${percentage}%)</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Distribution par niveaux -->
                <div class="level-distribution">
                    <h3>Distribution par niveaux</h3>
                    <div class="level-chart">
                        ${Object.entries(stats.levelDistribution).map(([level, count]) => {
                            const percentage = (count / stats.totalMembers * 100).toFixed(1);
                            return `
                                <div class="level-bar">
                                    <div class="level-number">N${level}</div>
                                    <div class="level-progress">
                                        <div class="level-fill" style="width: ${percentage}%"></div>
                                    </div>
                                    <div class="level-count">${count}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 🎭 GESTION DES MODALS
    showAddMemberModal() {
        const roles = this.teamManager.getRoles();
        
        const content = `
            <form id="add-member-form" class="team-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nom complet *</label>
                        <input type="text" id="member-name" placeholder="Prénom Nom" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="member-email" placeholder="email@example.com" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Rôle *</label>
                        <select id="member-role" required>
                            <option value="">Sélectionner un rôle</option>
                            ${roles.map(role => `
                                <option value="${role.id}" data-level="${role.level}">
                                    ${role.name} (Niveau ${role.level})
                                </option>
                            `).join('')}
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
                </div>

                <div class="form-group">
                    <label>Photo de profil (optionnel)</label>
                    <input type="url" id="member-avatar" placeholder="https://example.com/photo.jpg">
                    <small>Ou laissez vide pour utiliser l'avatar par défaut du rôle</small>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="modalManager.closeTopModal()">
                        Annuler
                    </button>
                    <button type="submit" class="btn-primary" id="submit-member">
                        <i class="fas fa-user-plus"></i> Ajouter le membre
                    </button>
                </div>
            </form>
        `;

        const modalId = window.modalManager.createModal({
            title: 'Ajouter un membre d\'équipe',
            content: content,
            size: 'large'
        });

        // Event listeners
        setTimeout(() => {
            const form = document.getElementById('add-member-form');
            const roleSelect = document.getElementById('member-role');
            const levelSelect = document.getElementById('member-level');

            // Auto-remplir le niveau selon le rôle
            roleSelect.addEventListener('change', () => {
                const selectedOption = roleSelect.options[roleSelect.selectedIndex];
                if (selectedOption.dataset.level) {
                    levelSelect.value = selectedOption.dataset.level;
                }
            });

            form.addEventListener('submit', (e) => this.handleAddMember(e));
        }, 100);

        return modalId;
    }

    showEditMemberModal(member) {
        const roles = this.teamManager.getRoles();
        
        const content = `
            <form id="edit-member-form" class="team-form">
                <input type="hidden" id="edit-member-id" value="${member.id}">
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Nom complet *</label>
                        <input type="text" id="edit-member-name" value="${member.displayName}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="edit-member-email" value="${member.email}" disabled>
                        <small>L'email ne peut pas être modifié</small>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Rôle *</label>
                        <select id="edit-member-role" required>
                            ${roles.map(role => `
                                <option value="${role.id}" ${role.id === member.role ? 'selected' : ''}>
                                    ${role.name} (Niveau ${role.level})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Niveau</label>
                        <select id="edit-member-level">
                            ${[1,2,3,4,5].map(level => `
                                <option value="${level}" ${level === member.level ? 'selected' : ''}>
                                    Niveau ${level}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Statut</label>
                    <select id="edit-member-status">
                        <option value="active" ${member.status === 'active' ? 'selected' : ''}>Actif</option>
                        <option value="pending" ${member.status === 'pending' ? 'selected' : ''}>En attente</option>
                        <option value="inactive" ${member.status === 'inactive' ? 'selected' : ''}>Inactif</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Photo de profil</label>
                    <input type="url" id="edit-member-avatar" value="${member.avatar || ''}" placeholder="https://example.com/photo.jpg">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="modalManager.closeTopModal()">
                        Annuler
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Sauvegarder
                    </button>
                </div>
            </form>
        `;

        const modalId = window.modalManager.createModal({
            title: `Modifier ${member.displayName}`,
            content: content,
            size: 'large'
        });

        // Event listener
        setTimeout(() => {
            const form = document.getElementById('edit-member-form');
            form.addEventListener('submit', (e) => this.handleEditMember(e));
        }, 100);

        return modalId;
    }

    // 📝 GESTION DES FORMULAIRES
    async handleAddMember(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-member');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ajout en cours...';
            submitBtn.disabled = true;

            const memberData = {
                displayName: document.getElementById('member-name').value,
                email: document.getElementById('member-email').value,
                role: document.getElementById('member-role').value,
                level: document.getElementById('member-level').value,
                avatar: document.getElementById('member-avatar').value || null
            };

            await this.teamManager.addTeamMember(memberData);
            
            window.modalManager.closeTopModal();
            this.showSuccessMessage(`${memberData.displayName} a été ajouté à l'équipe !`);
            
        } catch (error) {
            console.error('Erreur ajout membre:', error);
            this.showErrorMessage(error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleEditMember(e) {
        e.preventDefault();
        
        const memberId = document.getElementById('edit-member-id').value;
        
        try {
            const updates = {
                displayName: document.getElementById('edit-member-name').value,
                role: document.getElementById('edit-member-role').value,
                level: parseInt(document.getElementById('edit-member-level').value),
                status: document.getElementById('edit-member-status').value,
                avatar: document.getElementById('edit-member-avatar').value || null
            };

            await this.teamManager.updateTeamMember(memberId, updates);
            
            window.modalManager.closeTopModal();
            this.showSuccessMessage('Membre mis à jour avec succès !');
            
        } catch (error) {
            console.error('Erreur modification membre:', error);
            this.showErrorMessage(error.message);
        }
    }

    // 🎯 ACTIONS
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.team-tabs .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick="teamUI.switchTab('${tabName}')"]`).classList.add('active');

        // Mettre à jour le contenu
        document.querySelectorAll('.team-page .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Recharger le contenu selon l'onglet
        this.refreshTabContent(tabName);
    }

    async refreshTabContent(tabName) {
        const tabElement = document.getElementById(`${tabName}-tab`);
        
        switch(tabName) {
            case 'members':
                const members = this.teamManager.getActiveMembers();
                tabElement.innerHTML = this.renderMembersTab(members);
                break;
            case 'roles':
                const roles = this.teamManager.getRoles();
                tabElement.innerHTML = this.renderRolesTab(roles);
                break;
            case 'stats':
                const stats = this.teamManager.getTeamStats();
                tabElement.innerHTML = this.renderStatsTab(stats);
                break;
        }
    }

    editMember(memberId) {
        const member = this.teamManager.getMemberById(memberId);
        if (member) {
            this.showEditMemberModal(member);
        }
    }

    async removeMember(memberId) {
        const member = this.teamManager.getMemberById(memberId);
        if (!member) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer ${member.displayName} de l'équipe ?`)) {
            try {
                await this.teamManager.removeTeamMember(memberId);
                this.showSuccessMessage(`${member.displayName} a été retiré de l'équipe`);
            } catch (error) {
                this.showErrorMessage(error.message);
            }
        }
    }

    showMemberDetails(memberId) {
        const member = this.teamManager.getMemberById(memberId);
        if (!member) return;

        const role = this.teamManager.getRole(member.role);
        
        const content = `
            <div class="member-details">
                <div class="member-profile">
                    <img src="${member.avatar}" alt="${member.displayName}" class="profile-avatar">
                    <h3>${member.displayName}</h3>
                    <p class="member-email">${member.email}</p>
                    <div class="member-role-badge" style="color: ${role?.color}">
                        <i class="fas ${role?.icon}"></i> ${role?.name}
                    </div>
                </div>

                <div class="member-info-grid">
                    <div class="info-item">
                        <label>Niveau</label>
                        <span>${member.level}</span>
                    </div>
                    <div class="info-item">
                        <label>XP</label>
                        <span>${member.xp || 0}</span>
                    </div>
                    <div class="info-item">
                        <label>Quêtes terminées</label>
                        <span>${member.stats?.questsCompleted || 0}</span>
                    </div>
                    <div class="info-item">
                        <label>Statut</label>
                        <span class="status-badge status-${member.status}">${member.status}</span>
                    </div>
                </div>

                ${member.skills && member.skills.length > 0 ? `
                    <div class="member-skills-section">
                        <h4>Compétences</h4>
                        <div class="skills-list">
                            ${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        window.modalManager.createModal({
            title: `Profil de ${member.displayName}`,
            content: content,
            size: 'medium'
        });
    }

    // 🔄 ÉVÉNEMENTS
    onMemberAdded(member) {
        console.log('✅ Membre ajouté à l\'UI:', member.displayName);
        this.refreshTeamDisplay();
    }

    onMemberUpdated(member) {
        console.log('✅ Membre mis à jour dans l\'UI:', member.displayName);
        this.refreshTeamDisplay();
    }

    onMemberRemoved(member) {
        console.log('✅ Membre supprimé de l\'UI:', member.displayName);
        this.refreshTeamDisplay();
    }

    refreshTeamDisplay() {
        // Recharger l'affichage si on est sur la page équipe
        if (window.mobileContentManager && window.mobileContentManager.currentPage === 'team') {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = this.renderTeamPage();
            }
        }
    }

    // 🔧 UTILITAIRES
    formatPermission(permission) {
        const permissionNames = {
            'all': 'Tout',
            'team_manage': 'Gestion équipe',
            'quest_assign': 'Assigner quêtes',
            'quest_complete': 'Terminer quêtes',
            'reports_view': 'Voir rapports',
            'equipment_manage': 'Gérer équipements',
            'client_manage': 'Gérer clients',
            'event_manage': 'Gérer événements',
            'security_manage': 'Gérer sécurité',
            'quest_view': 'Voir quêtes'
        };
        return permissionNames[permission] || permission;
    }

    showSuccessMessage(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    }

    showErrorMessage(message) {
        if (window.showNotification) {
            window.showNotification(message, 'error');
        }
    }
}

// Instance globale
window.SynergiaTeamUI = SynergiaTeamUI;