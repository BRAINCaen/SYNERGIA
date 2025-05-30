/* ===== NOTIFICATIONS UTILITAIRES ===== */

// Fonction pour les notifications
window.showNotification = function(message, type = 'info') {
    // Supprimer les anciennes notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${iconMap[type] || iconMap.info}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-suppression
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);

    // Bouton fermeture
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
};

