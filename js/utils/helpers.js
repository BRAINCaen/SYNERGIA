/* ===== HELPERS UTILITAIRES ===== */

// Fonctions globales pour les quêtes
window.createQuest = function() {
    const modal = document.getElementById('quest-creation-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
};

window.completeQuest = function(questId) {
    const questUI = window.synergiaApp?.getModule('questUI');
    if (questUI) {
        questUI.handleQuestCompletion(questId);
    }
};

window.editQuest = function(questId) {
    const questUI = window.synergiaApp?.getModule('questUI');
    if (questUI) {
        questUI.openEditModal(questId);
    }
};

window.deleteQuest = function(questId) {
    const questManager = window.synergiaApp?.getModule('quests');
    if (questManager && confirm('Êtes-vous sûr de vouloir supprimer cette quête ?')) {
        questManager.deleteQuest(questId);
    }
};

// Formatage des dates
window.formatDate = function(date) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('fr-FR', options);
};

// Formatage du temps relatif
window.timeAgo = function(date) {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
};

// Validation des formulaires
window.validateQuestForm = function(form) {
    const title = form.querySelector('#quest-title').value.trim();
    const description = form.querySelector('#quest-description').value.trim();
    const xp = parseInt(form.querySelector('#quest-xp').value);

    if (!title || title.length < 3) {
        showNotification('Le titre doit contenir au moins 3 caractères', 'error');
        return false;
    }

    if (!description || description.length < 10) {
        showNotification('La description doit contenir au moins 10 caractères', 'error');
        return false;
    }

    if (!xp || xp < 1 || xp > 500) {
        showNotification('L\'XP doit être entre 1 et 500', 'error');
        return false;
    }

    return true;
};

// Gestion des tags
window.addQuestTag = function(tag) {
    const tagsContainer = document.getElementById('quest-tags-list');
    if (!tagsContainer) return;

    const tagElement = document.createElement('div');
    tagElement.className = 'quest-tag';
    tagElement.innerHTML = `
        ${tag}
        <span class="remove-tag" onclick="this.parentElement.remove()">×</span>
    `;

    tagsContainer.appendChild(tagElement);
};

// Gestion des récurrences
window.toggleRecurringOptions = function(checkbox) {
    const recurringOptions = document.getElementById('recurring-options');
    if (recurringOptions) {
        if (checkbox.checked) {
            recurringOptions.classList.remove('hidden');
        } else {
            recurringOptions.classList.add('hidden');
        }
    }
};

// Calculateur d'XP recommandé
window.calculateRecommendedXP = function(duration, priority) {
    let baseXP = Math.max(5, Math.floor(duration / 3)); // 1 XP par tranche de 3 minutes
    
    const multipliers = {
        low: 0.8,
        normal: 1.0,
        high: 1.3,
        urgent: 1.6
    };

    return Math.round(baseXP * (multipliers[priority] || 1.0));
};

// Mise à jour automatique de l'XP recommandé
window.updateRecommendedXP = function() {
    const durationInput = document.getElementById('quest-duration');
    const prioritySelect = document.getElementById('quest-priority');
    const xpInput = document.getElementById('quest-xp');

    if (durationInput && prioritySelect && xpInput) {
        const duration = parseInt(durationInput.value) || 15;
        const priority = prioritySelect.value || 'normal';
        const recommendedXP = calculateRecommendedXP(duration, priority);
        
        xpInput.value = recommendedXP;
        
        // Afficher une suggestion
        const suggestion = document.getElementById('xp-suggestion');
        if (suggestion) {
            suggestion.textContent = `Recommandé: ${recommendedXP} XP`;
        }
    }
};

// Export pour les autres modules
window.SynergiaHelpers = {
    formatDate,
    timeAgo,
    validateQuestForm,
    addQuestTag,
    calculateRecommendedXP,
    updateRecommendedXP
};

