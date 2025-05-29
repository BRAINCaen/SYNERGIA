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

/* ===== SYSTÈME AVATARS PERSONNALISÉS ===== */

// Ajouter au SynergiaDataManager
class AvatarManager {
    constructor() {
        this.defaultAvatars = [
            './images/avatars/avatar-1.jpg',
            './images/avatars/avatar-2.jpg',
            './images/avatars/avatar-3.jpg',
            './images/avatars/avatar-4.jpg',
            './images/avatars/avatar-5.jpg',
            './images/avatars/avatar-boss.jpg'
        ];
    }

    // Upload d'avatar personnalisé
    uploadAvatar(file, userId) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject('Fichier image requis');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarData = e.target.result;
                
                // Sauvegarder en localStorage
                localStorage.setItem(`avatar_${userId}`, avatarData);
                
                // Mettre à jour l'utilisateur
                if (userId === synergiaData.userData.id || userId === 'current') {
                    synergiaData.updateUser({ avatar: avatarData });
                } else {
                    // Mettre à jour un membre de l'équipe
                    const teamMember = synergiaData.teamData.find(m => m.id === userId);
                    if (teamMember) {
                        teamMember.avatar = avatarData;
                        synergiaData.saveData();
                        synergiaData.updateUI();
                    }
                }

                showNotification('✅ Avatar mis à jour !', 'success');
                resolve(avatarData);
            };
            
            reader.onerror = () => reject('Erreur lecture fichier');
            reader.readAsDataURL(file);
        });
    }

    // Choisir un avatar par défaut
    selectDefaultAvatar(avatarPath, userId) {
        if (userId === 'current') {
            synergiaData.updateUser({ avatar: avatarPath });
        } else {
            const teamMember = synergiaData.teamData.find(m => m.id === userId);
            if (teamMember) {
                teamMember.avatar = avatarPath;
                synergiaData.saveData();
                synergiaData.updateUI();
            }
        }
        
        showNotification('✅ Avatar sélectionné !', 'success');
    }

    // Interface de sélection d'avatar
    showAvatarSelector(userId = 'current') {
        const modal = this.createAvatarModal(userId);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createAvatarModal(userId) {
        const modal = document.createElement('div');
        modal.className = 'modal avatar-modal';
        modal.innerHTML = `
            <div class="modal-content avatar-selector-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-circle"></i> Choisir un Avatar</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="avatar-upload-section">
                        <h4><i class="fas fa-upload"></i> Upload Personnalisé</h4>
                        <div class="upload-zone" onclick="document.getElementById('avatar-file-${userId}').click()">
                            <i class="fas fa-cloud-upload-alt fa-2x"></i>
                            <p>Cliquer pour uploader</p>
                            <span>JPG, PNG, GIF - Max 5MB</span>
                        </div>
                        <input type="file" id="avatar-file-${userId}" accept="image/*" style="display: none;">
                    </div>
                    
                    <div class="avatar-defaults-section">
                        <h4><i class="fas fa-images"></i> Avatars par Défaut</h4>
                        <div class="avatars-grid">
                            ${this.defaultAvatars.map((avatar, index) => `
                                <div class="avatar-option" data-avatar="${avatar}">
                                    <img src="${avatar}" alt="Avatar ${index + 1}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        const fileInput = modal.querySelector(`#avatar-file-${userId}`);
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.uploadAvatar(e.target.files[0], userId).then(() => {
                    modal.remove();
                });
            }
        });

        modal.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                const avatarPath = option.dataset.avatar;
                this.selectDefaultAvatar(avatarPath, userId);
                modal.remove();
            });
        });

        return modal;
    }
}

// Instance globale
const avatarManager = new AvatarManager();

/* ===== SYSTÈME STATUTS TEMPS RÉEL ===== */

class StatusManager {
    constructor() {
        this.statuses = {
            online: { color: '#10b981', label: 'En ligne', icon: 'fas fa-circle' },
            busy: { color: '#f59e0b', label: 'Occupé', icon: 'fas fa-minus-circle' },
            away: { color: '#6b7280', label: 'Absent', icon: 'fas fa-moon' },
            break: { color: '#3b82f6', label: 'Pause', icon: 'fas fa-coffee' },
            offline: { color: '#ef4444', label: 'Hors ligne', icon: 'fas fa-times-circle' }
        };
        
        this.initStatusSystem();
    }

    initStatusSystem() {
        // Auto-détection du statut
        this.detectUserActivity();
        
        // Mise à jour périodique
        setInterval(() => {
            this.updateTeamStatuses();
        }, 30000); // Toutes les 30 secondes
    }

    // Changer le statut manuellement
    setStatus(userId, statusKey, message = '') {
        const status = this.statuses[statusKey];
        if (!status) return;

        if (userId === 'current') {
            synergiaData.updateUser({ 
                status: statusKey,
                statusMessage: message,
                lastActivity: new Date().toISOString()
            });
        } else {
            const teamMember = synergiaData.teamData.find(m => m.id === userId);
            if (teamMember) {
                teamMember.status = statusKey;
                teamMember.statusMessage = message;
                teamMember.lastActivity = new Date().toISOString();
                synergiaData.saveData();
            }
        }

        this.updateStatusUI();
        showNotification(`✅ Statut changé: ${status.label}`, 'success');
    }

    // Interface de changement de statut
    showStatusSelector() {
        const modal = this.createStatusModal();
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createStatusModal() {
        const currentStatus = synergiaData.userData.status || 'online';
        
        const modal = document.createElement('div');
        modal.className = 'modal status-modal';
        modal.innerHTML = `
            <div class="modal-content status-selector-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-cog"></i> Changer le Statut</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="status-options">
                        ${Object.entries(this.statuses).map(([key, status]) => `
                            <div class="status-option ${key === currentStatus ? 'active' : ''}" data-status="${key}">
                                <div class="status-indicator">
                                    <i class="${status.icon}" style="color: ${status.color}"></i>
                                </div>
                                <div class="status-info">
                                    <h4>${status.label}</h4>
                                    <p>Visible par toute l'équipe</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="status-message-section">
                        <label>Message personnalisé (optionnel)</label>
                        <input type="text" id="status-message" placeholder="Ex: En pause déjeuner..." maxlength="50">
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                        <button class="btn-primary" id="save-status">Sauvegarder</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        let selectedStatus = currentStatus;
        
        modal.querySelectorAll('.status-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.status-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                selectedStatus = option.dataset.status;
            });
        });

        modal.querySelector('#save-status').addEventListener('click', () => {
            const message = modal.querySelector('#status-message').value;
            this.setStatus('current', selectedStatus, message);
            modal.remove();
        });

        return modal;
    }

    // Détecter l'activité utilisateur
    detectUserActivity() {
        let lastActivity = Date.now();
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                lastActivity = Date.now();
                
                // Si était away/offline, remettre online
                if (['away', 'offline'].includes(synergiaData.userData.status)) {
                    this.setStatus('current', 'online');
                }
            }, true);
        });

        // Vérifier inactivité toutes les minutes
        setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            const currentStatus = synergiaData.userData.status;
            
            if (inactiveTime > 300000 && currentStatus === 'online') { // 5 min
                this.setStatus('current', 'away');
            } else if (inactiveTime > 900000 && currentStatus === 'away') { // 15 min
                this.setStatus('current', 'offline');
            }
        }, 60000);
    }

    // Mettre à jour l'UI des statuts
    updateStatusUI() {
        // Statut utilisateur principal
        const userStatus = synergiaData.userData.status || 'online';
        const statusConfig = this.statuses[userStatus];
        
        // Indicateur de statut dans le header
        let statusIndicator = document.querySelector('.user-status-indicator');
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.className = 'user-status-indicator';
            const userInfo = document.querySelector('.user-info');
            if (userInfo) userInfo.appendChild(statusIndicator);
        }
        
        statusIndicator.innerHTML = `
            <i class="${statusConfig.icon}" style="color: ${statusConfig.color}"></i>
            <span>${statusConfig.label}</span>
        `;
        statusIndicator.onclick = () => this.showStatusSelector();

        // Statuts des membres d'équipe
        this.updateTeamStatusIndicators();
    }

    updateTeamStatusIndicators() {
        document.querySelectorAll('.team-member-card').forEach((card, index) => {
            const member = synergiaData.teamData[index];
            if (!member) return;

            const status = member.status || 'online';
            const statusConfig = this.statuses[status];
            
            let statusBadge = card.querySelector('.member-status-badge');
            if (!statusBadge) {
                statusBadge = document.createElement('div');
                statusBadge.className = 'member-status-badge';
                card.querySelector('.member-avatar').parentElement.appendChild(statusBadge);
            }
            
            statusBadge.innerHTML = `<i class="${statusConfig.icon}" style="color: ${statusConfig.color}"></i>`;
            statusBadge.title = `${statusConfig.label}${member.statusMessage ? ': ' + member.statusMessage : ''}`;
        });
    }

    updateTeamStatuses() {
        // Simuler des changements de statut pour l'équipe
        synergiaData.teamData.forEach(member => {
            if (!member.lastActivity) {
                member.lastActivity = new Date().toISOString();
                member.status = 'online';
            }
            
            const lastActivity = new Date(member.lastActivity);
            const timeSince = Date.now() - lastActivity.getTime();
            
            // Logique simple de statut automatique
            if (timeSince > 1800000 && member.status !== 'offline') { // 30 min
                member.status = 'away';
            }
        });
        
        synergiaData.saveData();
        this.updateStatusUI();
    }
}

// Instance globale
const statusManager = new StatusManager();

/* ===== SYSTÈME CHAT/MESSAGING ===== */

class ChatManager {
    constructor() {
        this.messages = JSON.parse(localStorage.getItem('synergia_messages')) || [];
        this.initChat();
    }

    initChat() {
        this.createChatInterface();
        this.loadMessages();
        
        // Auto-scroll nouveau message
        setInterval(() => {
            this.checkNewMessages();
        }, 5000);
    }

    // Envoyer un message
    sendMessage(content, type = 'text', attachments = []) {
        const message = {
            id: Date.now(),
            senderId: synergiaData.userData.id || 'current',
            senderName: synergiaData.userData.name,
            senderAvatar: synergiaData.userData.avatar,
            content: content.trim(),
            type: type, // 'text', 'image', 'system'
            attachments: attachments,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.messages.push(message);
        this.saveMessages();
        this.displayMessage(message);
        this.scrollToBottom();

        // Notification pour les autres utilisateurs
        if (type !== 'system') {
            showNotification(`💬 ${message.senderName}: ${content.substring(0, 50)}...`, 'info');
        }

        return message;
    }

    // Créer l'interface de chat
    createChatInterface() {
        // Vérifier si le chat existe déjà
        if (document.querySelector('.chat-container')) return;

        const chatHTML = `
            <div class="chat-container" id="chat-container">
                <div class="chat-header">
                    <div class="chat-title">
                        <i class="fas fa-comments"></i>
                        <span>Chat Équipe</span>
                        <span class="online-count" id="online-count">1 en ligne</span>
                    </div>
                    <div class="chat-actions">
                        <button class="btn-icon" id="toggle-chat" title="Réduire/Agrandir">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    <!-- Messages apparaîtront ici -->
                </div>
                
                <div class="chat-input-section">
                    <div class="chat-input-container">
                        <input type="text" 
                               id="chat-input" 
                               placeholder="Tapez votre message..." 
                               maxlength="500"
                               autocomplete="off">
                        <button class="btn-icon" id="attach-file" title="Joindre fichier">
                            <i class="fas fa-paperclip"></i>
                        </button>
                        <button class="btn-primary" id="send-message" title="Envoyer">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <input type="file" id="file-attachment" accept="image/*" style="display: none;">
                </div>
            </div>
        `;

        // Ajouter le chat à la page
        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Event listeners
        this.attachChatEvents();
    }

    attachChatEvents() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-message');
        const toggleBtn = document.getElementById('toggle-chat');
        const attachBtn = document.getElementById('attach-file');
        const fileInput = document.getElementById('file-attachment');

        // Envoyer message
        const sendMessage = () => {
            const content = chatInput.value.trim();
            if (content) {
                this.sendMessage(content);
                chatInput.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Toggle chat
        toggleBtn.addEventListener('click', () => {
            const chatContainer = document.getElementById('chat-container');
            chatContainer.classList.toggle('minimized');
            const icon = toggleBtn.querySelector('i');
            icon.className = chatContainer.classList.contains('minimized') ? 'fas fa-plus' : 'fas fa-minus';
        });

        // Joindre fichier
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleFileAttachment(e.target.files[0]);
            }
        });
    }

    // Gérer les pièces jointes
    handleFileAttachment(file) {
        if (!file.type.startsWith('image/')) {
            showNotification('❌ Seules les images sont supportées', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.sendMessage('📷 Image partagée', 'image', [imageData]);
        };
        reader.readAsDataURL(file);
    }

    // Afficher un message
    displayMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const isCurrentUser = message.senderId === 'current' || message.senderId === synergiaData.userData.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isCurrentUser ? 'own-message' : 'other-message'} ${message.type}`;
        
        const timeString = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let attachmentsHTML = '';
        if (message.attachments && message.attachments.length > 0) {
            attachmentsHTML = message.attachments.map(attachment => 
                `<img src="${attachment}" class="message-image" onclick="this.classList.toggle('enlarged')">`
            ).join('');
        }

        messageElement.innerHTML = `
            <div class="message-bubble">
                ${!isCurrentUser ? `
                    <div class="message-sender">
                        <img src="${message.senderAvatar}" class="sender-avatar">
                        <span class="sender-name">${message.senderName}</span>
                    </div>
                ` : ''}
                <div class="message-content">
                    ${message.content}
                    ${attachmentsHTML}
                </div>
                <div class="message-time">${timeString}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        message.read = true;
    }

    // Charger les messages
    loadMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        // Message de bienvenue si pas de messages
        if (this.messages.length === 0) {
            this.sendMessage('👋 Bienvenue dans le chat équipe de Synergia !', 'system');
        }
        
        this.messages.forEach(message => {
            this.displayMessage(message);
        });
        
        this.scrollToBottom();
        this.updateOnlineCount();
    }

    // Auto-scroll vers le bas
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Vérifier nouveaux messages (simulation)
    checkNewMessages() {
        // Simuler des messages d'autres utilisateurs
        if (Math.random() < 0.1) { // 10% de chance
            const randomMessages = [
                "Salut l'équipe ! 👋",
                "Pause café ? ☕",
                "La salle 2 est prête ! ✅",
                "Besoin d'aide en accueil 🆘",
                "Bonne journée à tous ! 😊"
            ];
            
            const randomMember = synergiaData.teamData[Math.floor(Math.random() * synergiaData.teamData.length)];
            if (randomMember && randomMember.id !== 'current') {
                const fakeMessage = {
                    id: Date.now(),
                    senderId: randomMember.id,
                    senderName: randomMember.name,
                    senderAvatar: randomMember.avatar,
                    content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
                    type: 'text',
                    attachments: [],
                    timestamp: new Date().toISOString(),
                    read: false
                };
                
                this.messages.push(fakeMessage);
                this.saveMessages();
                this.displayMessage(fakeMessage);
                this.scrollToBottom();
            }
        }
    }

    // Mettre à jour le compteur en ligne
    updateOnlineCount() {
        const onlineCount = synergiaData.teamData.filter(m => ['online', 'busy'].includes(m.status)).length;
        const countElement = document.getElementById('online-count');
        if (countElement) {
            countElement.textContent = `${onlineCount} en ligne`;
        }
    }

    // Sauvegarder messages
    saveMessages() {
        localStorage.setItem('synergia_messages', JSON.stringify(this.messages));
    }
}

// Instance globale
const chatManager = new ChatManager();

/* ===== INTÉGRATION COMPLÈTE DES FEATURES ===== */

// Étendre le SynergiaDataManager avec les nouvelles features
synergiaData.initAdvancedFeatures = function() {
    // Initialiser les statuts par défaut
    if (!this.userData.status) {
        this.userData.status = 'online';
        this.userData.statusMessage = '';
        this.userData.lastActivity = new Date().toISOString();
    }

    // Initialiser les avatars par défaut pour l'équipe
    this.teamData.forEach((member, index) => {
        if (!member.avatar) {
            member.avatar = `./images/avatars/avatar-${index + 1}.jpg`;
        }
        if (!member.status) {
            member.status = Math.random() > 0.5 ? 'online' : 'away';
            member.lastActivity = new Date().toISOString();
        }
    });

    this.saveData();
    this.updateUI();
};

// Ajouter des boutons d'action aux cartes membres
synergiaData.addMemberActionButtons = function() {
    document.querySelectorAll('.team-member-card').forEach((card, index) => {
        const member = this.teamData[index];
        if (!member) return;

        // Vérifier si les boutons existent déjà
        if (card.querySelector('.member-actions-extended')) return;

        const actionsHTML = `
            <div class="member-actions-extended">
                <button class="btn-avatar" onclick="avatarManager.showAvatarSelector('${member.id}')">
                    <i class="fas fa-user-circle"></i> Avatar
                </button>
                <button class="btn-avatar" onclick="statusManager.setStatus('${member.id}', 'busy')">
                    <i class="fas fa-circle"></i> Statut
                </button>
                <button class="btn-avatar" onclick="chatManager.sendMessage('📞 ${member.name} a été contacté', 'system')">
                    <i class="fas fa-comment"></i> Chat
                </button>
            </div>
        `;

        card.insertAdjacentHTML('beforeend', actionsHTML);
    });
};

// Ajouter bouton de changement d'avatar et statut pour l'utilisateur principal
synergiaData.addUserProfileActions = function() {
    const userInfo = document.querySelector('.user-info');
    if (!userInfo || userInfo.querySelector('.user-profile-actions')) return;

    const actionsHTML = `
        <div class="user-profile-actions" style="margin-top: 8px;">
            <button class="btn-avatar" onclick="avatarManager.showAvatarSelector('current')" title="Changer avatar">
                <i class="fas fa-user-circle"></i>
            </button>
            <button class="btn-avatar" onclick="statusManager.showStatusSelector()" title="Changer statut">
                <i class="fas fa-circle"></i>
            </button>
        </div>
    `;

    userInfo.insertAdjacentHTML('beforeend', actionsHTML);
};

// Fonction utilitaire pour les notifications
window.showNotification = function(message, type = 'info') {
    // Supprimer les anciennes notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-supprimer après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);

    // Bouton fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
};

// Initialisation complète au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que tout soit chargé
    setTimeout(() => {
        // Initialiser les features avancées
        synergiaData.initAdvancedFeatures();
        
        // Ajouter les boutons d'action
        synergiaData.addMemberActionButtons();
        synergiaData.addUserProfileActions();
        
        // Initialiser les managers
        statusManager.updateStatusUI();
        chatManager.updateOnlineCount();
        
        console.log('🚀 Features avancées initialisées:');
        console.log('📸 Avatars personnalisés');
        console.log('🟢 Statuts temps réel'); 
        console.log('💬 Chat équipe');
        
        // Message de bienvenue
        showNotification('✨ Nouvelles fonctionnalités disponibles ! Avatars, statuts et chat activés.', 'success');
        
    }, 1000);
});

// API globales pour les nouvelles features
window.SynergiaAdvanced = {
    // Avatars
    changeAvatar: (userId = 'current') => avatarManager.showAvatarSelector(userId),
    
    // Statuts
    setStatus: (userId, status, message = '') => statusManager.setStatus(userId, status, message),
    showStatusSelector: () => statusManager.showStatusSelector(),
    
    // Chat
    sendMessage: (content, type = 'text') => chatManager.sendMessage(content, type),
    toggleChat: () => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.classList.toggle('minimized');
        }
    },
    
    // Données
    getOnlineMembers: () => synergiaData.teamData.filter(m => ['online', 'busy'].includes(m.status)),
    getTotalMessages: () => chatManager.messages.length,
    
    // Debug
    simulateActivity: () => {
        // Simuler de l'activité pour tester
        setTimeout(() => chatManager.sendMessage('🤖 Message automatique de test'), 2000);
        setTimeout(() => statusManager.setStatus('current', 'busy', 'En test'), 4000);
        setTimeout(() => showNotification('🧪 Simulation terminée', 'info'), 6000);
    }
};
