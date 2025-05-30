/* ===== SYNERGIA QUEST UI MANAGER ===== */

class SynergiaQuestUI {
    constructor() {
        this.questManager = null;
        this.currentQuestId = null;
        this.init();
    }

    init() {
        this.questManager = window.synergiaApp?.getModule('quests');
        this.setupEventListeners();
        console.log('🎨 Quest UI Manager initialisé');
    }

    // Event listeners
    setupEventListeners() {
        // Formulaire de création
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'quest-creation-form') {
                e.preventDefault();
                this.handleQuestCreation(e.target);
            }
        });

        // Boutons d'action
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-complete')) {
                const questId = e.target.closest('.quest-item')?.dataset.questId;
                if (questId) this.handleQuestCompletion(questId);
            }

            if (e.target.closest('[data-action="edit-quest"]')) {
                const questId = e.target.closest('[data-quest-id]')?.dataset.questId;
                if (questId) this.openEditModal(questId);
            }

            if (e.target.closest('[data-action="delete-quest"]')) {
                const questId = e.target.closest('[data-quest-id]')?.dataset.questId;
                if (questId) this.handleQuestDeletion(questId);
            }
        });

        // Écouter les mises à jour des quêtes
        document.addEventListener('synergia:quests:updated', () => {
            this.refreshQuestsList();
        });
    }

    // Gérer la création de quête
    handleQuestCreation(form) {
        const formData = new FormData(form);
        const questData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('type'),
            priority: formData.get('priority'),
            xp: parseInt(formData.get('xp')),
            duration: parseInt(formData.get('duration')),
            requiresPhoto: formData.get('photo-required') === 'on',
            recurring: formData.get('recurring') === 'on',
            frequency: formData.get('frequency') || 'daily',
            tags: formData.get('tags')?.split(',').map(tag => tag.trim()) || []
        };

        try {
            const quest = this.questManager.createQuest(questData);
            this.closeModal('quest-creation-modal');
            this.refreshQuestsList();
            form.reset();
            
            showNotification(`✅ Quête "${quest.title}" créée avec succès !`, 'success');
        } catch (error) {
            console.error('Erreur création quête:', error);
            showNotification('❌ Erreur lors de la création de la quête', 'error');
        }
    }

    // Gérer la complétion de quête
    handleQuestCompletion(questId) {
        const quest = this.questManager.getQuest(questId);
        if (!quest) return;

        if (quest.requiresPhoto) {
            this.showPhotoUploadModal(questId);
        } else {
            this.completeQuestDirectly(questId);
        }
    }

    // Compléter directement une quête
    completeQuestDirectly(questId) {
        try {
            this.questManager.completeQuest(questId);
            this.refreshQuestsList();
            this.showCompletionCelebration(questId);
        } catch (error) {
            console.error('Erreur complétion quête:', error);
            showNotification('❌ Erreur lors de la complétion', 'error');
        }
    }

    // Modal de photo de preuve
    showPhotoUploadModal(questId) {
        const quest = this.questManager.getQuest(questId);
        if (!quest) return;

        const modal = this.createPhotoUploadModal(quest);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    // Créer modal de photo
    createPhotoUploadModal(quest) {
        const modal = document.createElement('div');
        modal.className = 'modal photo-upload-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📸 Validation de quête</h3>
                    <button class="close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>${quest.title}</h4>
                    <p>Prenez une photo pour valider cette quête :</p>
                    
                    <div class="photo-upload-zone">
                        <input type="file" id="proof-photo" accept="image/*" capture="environment">
                        <label for="proof-photo" class="upload-label">
                            <i class="fas fa-camera fa-3x"></i>
                            <p>Cliquer pour prendre une photo</p>
                        </label>
                        <div id="photo-preview" class="photo-preview hidden"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Commentaire (optionnel)</label>
                        <textarea id="completion-notes" placeholder="Ajoutez des détails sur la tâche..."></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
                        <button class="btn-primary" id="submit-completion" disabled>
                            <i class="fas fa-check"></i> Valider (+${quest.xp} XP)
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners pour le modal
        const photoInput = modal.querySelector('#proof-photo');
        const submitBtn = modal.querySelector('#submit-completion');
        const preview = modal.querySelector('#photo-preview');

        photoInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handlePhotoUpload(e.target.files[0], preview, submitBtn);
            }
        });

        submitBtn.addEventListener('click', () => {
            const notes = modal.querySelector('#completion-notes').value;
            const photoData = modal.photoData || null;
            
            this.questManager.completeQuest(quest.id, {
                proof: photoData,
                notes: notes
            });
            
            modal.remove();
            this.refreshQuestsList();
            this.showCompletionCelebration(quest.id);
        });

        return modal;
    }

    // Gérer l'upload de photo
    handlePhotoUpload(file, preview, submitBtn) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoData = e.target.result;
            preview.innerHTML = `<img src="${photoData}" alt="Photo de preuve">`;
            preview.classList.remove('hidden');
            submitBtn.disabled = false;
            preview.parentElement.photoData = photoData;
        };
        reader.readAsDataURL(file);
    }

    // Animation de célébration
    showCompletionCelebration(questId) {
        const quest = this.questManager.getQuest(questId);
        if (!quest) return;

        const celebration = document.createElement('div');
        celebration.className = 'quest-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h3>Quête terminée !</h3>
                <h4>${quest.title}</h4>
                <div class="xp-reward">+${quest.xp} XP</div>
                <button class="btn-primary" onclick="this.closest('.quest-celebration').remove()">
                    Continuer
                </button>
            </div>
        `;

        document.body.appendChild(celebration);

        // Auto-suppression
        setTimeout(() => {
            if (celebration.parentElement) {
                celebration.remove();
            }
        }, 5000);
    }

    // Rafraîchir la liste des quêtes
    refreshQuestsList() {
        const questsLists = document.querySelectorAll('.quests-list');
        questsLists.forEach(list => {
            const category = list.dataset.category || 'daily';
            this.renderQuestsList(list, category);
        });

        // Mettre à jour les compteurs
        this.updateQuestCounters();
    }

    // Render liste de quêtes
    renderQuestsList(container, category) {
        const quests = this.questManager.getQuests({ category, status: 'pending' });
        
        if (quests.length === 0) {
            container.innerHTML = `
                <div class="no-quests">
                    <i class="fas fa-check-circle fa-2x"></i>
                    <p>Aucune quête ${category} en attente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = quests.map(quest => this.renderQuestItem(quest)).join('');
    }

    // Render item de quête
    renderQuestItem(quest) {
        const deadline = new Date(quest.deadline);
        const isOverdue = deadline < new Date() && quest.status !== 'completed';
        
        return `
            <div class="quest-item ${isOverdue ? 'overdue' : ''}" data-quest-id="${quest.id}">
                <div class="quest-icon-default">
                    <i class="${quest.icon}"></i>
                </div>
                <div class="quest-info">
                    <h4 class="quest-title">${quest.title}</h4>
                    <p class="quest-description">${quest.description}</p>
                    <div class="quest-meta">
                        <span class="quest-xp"><i class="fas fa-star"></i> ${quest.xp} XP</span>
                        <span class="quest-duration"><i class="fas fa-clock"></i> ${quest.duration}min</span>
                        ${quest.requiresPhoto ? '<span class="quest-photo"><i class="fas fa-camera"></i> Photo</span>' : ''}
                        <span class="quest-priority priority-${quest.priority}">${quest.priority}</span>
                    </div>
                </div>
                <div class="quest-actions">
                    <button class="btn-complete" title="Compléter">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon" data-action="edit-quest" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Mettre à jour les compteurs
    updateQuestCounters() {
        const stats = this.questManager.getQuestStats();
        
        // Mettre à jour les badges de comptage
        const badges = {
            'daily-count': this.questManager.getQuests({ category: 'daily', status: 'pending' }).length,
            'weekly-count': this.questManager.getQuests({ category: 'weekly', status: 'pending' }).length,
            'overdue-count': stats.overdue
        };

        Object.entries(badges).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
                element.style.display = count > 0 ? 'block' : 'none';
            }
        });
    }

    // Utilitaires
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}

// Export global
window.SynergiaQuestUI = SynergiaQuestUI;
