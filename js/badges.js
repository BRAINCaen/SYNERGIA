// Liste des badges disponibles
const badges = {
    // Badges de progression
    "first_steps": {
        id: "first_steps",
        name: "Premiers pas",
        description: "Complétez votre première quête",
        icon: "fa-shoe-prints",
        color: "#8bc34a",
        category: "progression",
        condition: (user) => user.completedQuests >= 1
    },
    "quest_master": {
        id: "quest_master",
        name: "Maître des quêtes",
        description: "Complétez 50 quêtes",
        icon: "fa-scroll",
        color: "#ff9800",
        category: "progression",
        condition: (user) => user.completedQuests >= 50
    },
    "xp_collector": {
        id: "xp_collector",
        name: "Collectionneur d'XP",
        description: "Atteignez 500 XP",
        icon: "fa-star",
        color: "#ffc107",
        category: "progression",
        condition: (user) => user.xp >= 500
    },
    "level_up": {
        id: "level_up",
        name: "Niveau supérieur",
        description: "Atteignez le niveau 5",
        icon: "fa-level-up-alt",
        color: "#9c27b0",
        category: "progression",
        condition: (user) => user.level >= 5
    },
    
    // Badges de rôles
    "maintenance_expert": {
        id: "maintenance_expert",
        name: "Expert en maintenance",
        description: "Complétez 15 quêtes liées à l'entretien et la maintenance",
        icon: "fa-tools",
        color: "#4caf50",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.entretien >= 15)
    },
    "reputation_guardian": {
        id: "reputation_guardian",
        name: "Gardien de la réputation",
        description: "Complétez 15 quêtes liées à la gestion des avis",
        icon: "fa-star-half-alt",
        color: "#ff9800",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.avis >= 15)
    },
    "stock_master": {
        id: "stock_master",
        name: "Maître des stocks",
        description: "Complétez 15 quêtes liées à la gestion des stocks",
        icon: "fa-boxes",
        color: "#9c27b0",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.stocks >= 15)
    },
    "organizer": {
        id: "organizer",
        name: "Organisateur hors pair",
        description: "Complétez 15 quêtes liées à l'organisation interne",
        icon: "fa-calendar-check",
        color: "#2196f3",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.organisation >= 15)
    },
    "content_creator": {
        id: "content_creator",
        name: "Créateur de contenu",
        description: "Complétez 15 quêtes liées à la création de contenu",
        icon: "fa-palette",
        color: "#e91e63",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.contenu >= 15)
    },
    "mentor": {
        id: "mentor",
        name: "Mentor",
        description: "Complétez 15 quêtes liées à la formation interne",
        icon: "fa-graduation-cap",
        color: "#795548",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.formation >= 15)
    },
    "partnership_guru": {
        id: "partnership_guru",
        name: "Gourou des partenariats",
        description: "Complétez 15 quêtes liées aux partenariats",
        icon: "fa-handshake",
        color: "#00bcd4",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.partenariats >= 15)
    },
    "social_media_star": {
        id: "social_media_star",
        name: "Star des réseaux sociaux",
        description: "Complétez 15 quêtes liées à la communication",
        icon: "fa-hashtag",
        color: "#3f51b5",
        category: "roles",
        condition: (user) => (user.roleQuests && user.roleQuests.communication >= 15)
    },
    
    // Badges spéciaux
    "team_player": {
        id: "team_player",
        name: "Esprit d'équipe",
        description: "Participez à 10 événements d'équipe",
        icon: "fa-users",
        color: "#2196f3",
        category: "special",
        condition: (user) => (user.teamEvents >= 10)
    },
    "quick_learner": {
        id: "quick_learner",
        name: "Apprenti rapide",
        description: "Atteignez le niveau Intermédiaire dans un rôle en moins d'un mois",
        icon: "fa-bolt",
        color: "#ffeb3b",
        category: "special",
        condition: (user) => (user.quickMastery === true)
    },
    "versatile": {
        id: "versatile",
        name: "Polyvalent",
        description: "Atteignez le niveau Débutant dans 3 rôles différents",
        icon: "fa-cubes",
        color: "#673ab7",
        category: "special",
        condition: (user) => (user.diverseRoles >= 3)
    },
    "perfect_month": {
        id: "perfect_month",
        name: "Mois parfait",
        description: "Complétez toutes vos quêtes quotidiennes pendant un mois entier",
        icon: "fa-calendar-alt",
        color: "#f44336",
        category: "special",
        condition: (user) => (user.perfectMonth === true)
    },
    "innovator": {
        id: "innovator",
        name: "Innovateur",
        description: "Proposez une idée qui est implémentée dans l'entreprise",
        icon: "fa-lightbulb",
        color: "#ff5722",
        category: "special",
        condition: (user) => (user.innovations >= 1)
    },
    "brain_escape_ambassador": {
        id: "brain_escape_ambassador",
        name: "Ambassadeur Brain Escape",
        description: "Représentez l'entreprise lors d'un événement externe",
        icon: "fa-building",
        color: "#607d8b",
        category: "special",
        condition: (user) => (user.externalEvents >= 1)
    }
};

// Vérifier si des badges sont débloqués
function checkForUnlockedBadges(quest = null) {
    if (!userProfile || !userProfile.badges) return null;
    
    // Mise à jour des statistiques pour les conditions de badges
    const userStats = {
        xp: userProfile.xp || 0,
        level: userProfile.level || 1,
        completedQuests: userProfile.completedQuests || 0,
        roleQuests: userProfile.roleQuests || {},
        teamEvents: userProfile.teamEvents || 0,
        quickMastery: userProfile.quickMastery || false,
        diverseRoles: userProfile.diverseRoles || 0,
        perfectMonth: userProfile.perfectMonth || false,
        innovations: userProfile.innovations || 0,
        externalEvents: userProfile.externalEvents || 0
    };
    
    // Incrémenter compteur de quêtes si une quête a été validée
    if (quest) {
        userStats.completedQuests++;
        
        // Incrémenter compteur spécifique au rôle
        if (quest.roleId) {
            userStats.roleQuests[quest.roleId] = (userStats.roleQuests[quest.roleId] || 0) + 1;
        }
    }
    
    // Vérifier chaque badge
    let unlockedBadge = null;
    for (const badgeId in badges) {
        const badge = badges[badgeId];
        
        // Si la condition est remplie et que le badge n'est pas déjà obtenu
        if (badge.condition(userStats) && 
            (!userProfile.badges || !userProfile.badges.includes(badgeId))) {
            
            // Ajouter le badge à l'utilisateur
            if (!userProfile.badges) {
                userProfile.badges = [];
            }
            userProfile.badges.push(badgeId);
            
            // Mettre à jour dans Firestore
            db.collection('users').doc(currentUser.email).update({
                badges: userProfile.badges,
                completedQuests: userStats.completedQuests
            });
            
            // Ajouter une notification
            addNotification({
                type: 'badge_unlocked',
                badgeName: badge.name,
                badgeId: badgeId,
                timestamp: new Date()
            });
            
            unlockedBadge = badge;
            break; // Un badge à la fois pour l'interface
        }
    }
    
    return unlockedBadge;
}

// Charger les badges de l'utilisateur
function loadUserBadges() {
    if (!userProfile || !userProfile.badges) return;
    
    // Cette fonction pourrait être utilisée pour afficher les badges sur une page de profil
    const badgesList = document.getElementById('user-badges');
    if (!badgesList) return;
    
    badgesList.innerHTML = '';
    
    if (userProfile.badges.length === 0) {
        badgesList.innerHTML = '
Aucun badge débloqué pour le moment. Continuez à accomplir des quêtes !

';
        return;
    }
    
    userProfile.badges.forEach(badgeId => {
        const badge = badges[badgeId];
        if (!badge) return;
        
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-item';
        badgeElement.innerHTML = `
            

                
            

            

                
${badge.name}

                
${badge.description}


            

        `;
        
        badgesList.appendChild(badgeElement);
    });
}
