// Données des quêtes par défaut
const defaultQuests = {
    daily: [
        {
            id: "daily-1",
            title: "Vérification de l'état des salles",
            description: "Passer en revue l'ensemble des salles et signaler tout problème nécessitant une intervention.",
            xp: 10,
            roleId: "entretien",
            type: "daily",
            deadline: "Aujourd'hui"
        },
        {
            id: "daily-2",
            title: "Répondre aux avis récents",
            description: "Vérifier et répondre à tous les avis clients publiés depuis hier sur Google, TripAdvisor et Facebook.",
            xp: 10,
            roleId: "avis",
            type: "daily",
            deadline: "Aujourd'hui"
        },
        {
            id: "daily-3",
            title: "Publication sur les réseaux sociaux",
            description: "Publier du contenu engageant sur Instagram et Facebook selon le planning éditorial.",
            xp: 10,
            roleId: "communication",
            type: "daily",
            deadline: "Aujourd'hui"
        },
        {
            id: "daily-4",
            title: "Vérification du stock de consommables",
            description: "S'assurer que les consommables essentiels sont en quantité suffisante (piles, papier, etc).",
            xp: 5,
            roleId: "stocks",
            type: "daily",
            deadline: "Aujourd'hui"
        },
        {
            id: "daily-5",
            title: "Briefing d'équipe",
            description: "Organiser ou participer à un point quotidien pour coordonner les activités du jour.",
            xp: 5,
            roleId: "organisation",
            type: "daily",
            deadline: "Ce matin"
        }
    ],
    weekly: [
        {
            id: "weekly-1",
            title: "Maintenance des mécanismes complexes",
            description: "Effectuer une maintenance approfondie des mécanismes complexes dans toutes les salles.",
            xp: 15,
            roleId: "entretien",
            type: "weekly",
            deadline: "Vendredi"
        },
        {
            id: "weekly-2",
            title: "Analyse des avis hebdomadaires",
            description: "Analyser les tendances dans les avis de la semaine et créer un rapport pour l'équipe.",
            xp: 15,
            roleId: "avis",
            type: "weekly",
            deadline: "Vendredi"
        },
        {
            id: "weekly-3",
            title: "Planning de la semaine prochaine",
            description: "Établir et diffuser le planning des sessions et des rôles pour la semaine prochaine.",
            xp: 15,
            roleId: "organisation",
            type: "weekly",
            deadline: "Jeudi"
        },
        {
            id: "weekly-4",
            title: "Inventaire complet des stocks",
            description: "Réaliser un inventaire complet des stocks et préparer les commandes nécessaires.",
            xp: 10,
            roleId: "stocks",
            type: "weekly",
            deadline: "Mercredi"
        },
        {
            id: "weekly-5",
            title: "Contenu vidéo hebdomadaire",
            description: "Créer et publier une vidéo pour les réseaux sociaux selon le thème de la semaine.",
            xp: 15,
            roleId: "communication",
            type: "weekly",
            deadline: "Mercredi"
        },
        {
            id: "weekly-6",
            title: "Session de formation",
            description: "Organiser ou participer à une mini-session de formation sur un aspect des rôles.",
            xp: 15,
            roleId: "formation",
            type: "weekly",
            deadline: "Lundi prochain"
        }
    ],
    special: [
        {
            id: "special-1",
            title: "Amélioration d'énigme",
            description: "Concevoir et implémenter une amélioration pour une énigme existante afin d'enrichir l'expérience des joueurs.",
            xp: 25,
            roleId: "entretien",
            type: "special",
            deadline: "Dans 2 semaines"
        },
        {
            id: "special-2",
            title: "Campagne d'avis positive",
            description: "Lancer une campagne spéciale pour encourager les joueurs à laisser des avis positifs et atteindre 10 nouveaux avis 5 étoiles.",
            xp: 25,
            roleId: "avis",
            type: "special",
            deadline: "Ce mois-ci"
        },
        {
            id: "special-3",
            title: "Nouveau support de formation",
            description: "Créer un nouveau support de formation complet pour faciliter l'intégration des futurs membres de l'équipe.",
            xp: 25,
            roleId: "formation",
            type: "special",
            deadline: "Dans 3 semaines"
        },
        {
            id: "special-4",
            title: "Partenariat local",
            description: "Établir un nouveau partenariat avec une entreprise locale pour des avantages mutuels.",
            xp: 25,
            roleId: "partenariats",
            type: "special",
            deadline: "Ce trimestre"
        },
        {
            id: "special-5",
            title: "Optimisation du flux de travail",
            description: "Analyser et optimiser un processus interne pour améliorer l'efficacité de l'équipe.",
            xp: 20,
            roleId: "organisation",
            type: "special",
            deadline: "Dans 1 mois"
        },
        {
            id: "special-6",
            title: "Campagne sur les réseaux sociaux",
            description: "Planifier et exécuter une campagne thématique complète sur les réseaux sociaux pendant au moins 2 semaines.",
            xp: 25,
            roleId: "communication",
            type: "special",
            deadline: "Prochain mois"
        },
        {
            id: "special-7",
            title: "Refonte du système de stockage",
            description: "Réorganiser complètement le système de stockage pour optimiser l'espace et l'efficacité.",
            xp: 20,
            roleId: "stocks",
            type: "special",
            deadline: "Dans 1 mois"
        }
    ]
};

// État des quêtes de l'utilisateur
let userQuests = {
    daily: [],
    weekly: [],
    special: []
};

// Initialiser les quêtes
async function initUserQuests() {
    if (!currentUser) return;
    
    try {
        // Vérifier si l'utilisateur a déjà des quêtes
        const userQuestsDoc = await db.collection('user_quests').doc(currentUser.email).get();
        
        if (userQuestsDoc.exists) {
            userQuests = userQuestsDoc.data();
        } else {
            // Attribuer des quêtes par défaut à l'utilisateur
            await assignDefaultQuests();
        }
        
        // Charger les quêtes dans l'interface
        loadQuestsToUI();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des quêtes:', error);
    }
}

// Assigner des quêtes par défaut à l'utilisateur
async function assignDefaultQuests() {
    if (!currentUser || !userProfile) return;
    
    // Trouver le rôle de l'utilisateur
    let userRoleId = null;
    for (const id in roles) {
        if (roles[id].name === userProfile.role) {
            userRoleId = id;
            break;
        }
    }
    
    // Si on ne trouve pas le rôle, on utilise entretien par défaut
    if (!userRoleId) {
        userRoleId = "entretien";
    }
    
    // Filtrer les quêtes par rôle et en ajouter quelques générales
    userQuests = {
        daily: defaultQuests.daily.filter(quest => 
            quest.roleId === userRoleId || Math.random() > 0.7
        ),
        weekly: defaultQuests.weekly.filter(quest => 
            quest.roleId === userRoleId || Math.random() > 0.7
        ),
        special: defaultQuests.special.filter(quest => 
            quest.roleId === userRoleId || Math.random() > 0.7
        )
    };
    
    // Enregistrer dans Firestore
    await db.collection('user_quests').doc(currentUser.email).set(userQuests);
}

// Charger les quêtes dans l'interface
function loadQuestsToUI() {
    // Charger les quêtes du jour sur le dashboard
    const dailyQuestsContainer = document.getElementById('daily-quests');
    if (dailyQuestsContainer) {
        dailyQuestsContainer.innerHTML = '';
        
        if (userQuests.daily.length === 0) {
            dailyQuestsContainer.innerHTML = '
Aucune quête aujourd\'hui. Profitez-en pour vous reposer !

';
        } else {
            // Limiter à 3 quêtes sur le dashboard
            const limitedQuests = userQuests.daily.slice(0, 3);
            limitedQuests.forEach(quest => {
                const questElement = createQuestElement(quest);
                dailyQuestsContainer.appendChild(questElement);
            });
        }
        
        // Mettre à jour le compteur
        document.getElementById('quests-today').textContent = userQuests.daily.length;
    }
    
    // Remplir les listes de quêtes complètes
    fillQuestsList('daily-quests-list', userQuests.daily);
    fillQuestsList('weekly-quests-list', userQuests.weekly);
    fillQuestsList('special-quests-list', userQuests.special);
}

// Remplir une liste de quêtes
function fillQuestsList(containerId, quests) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (quests.length === 0) {
        container.innerHTML = '
Aucune quête disponible pour le moment.

';
        return;
    }
    
    quests.forEach(quest => {
        const questElement = createQuestElement(quest);
        container.appendChild(questElement);
    });
}

// Créer un élément de quête
function createQuestElement(quest) {
    const template = document.getElementById('quest-item-template');
    const questElement = document.importNode(template.content, true).querySelector('.quest-item');
    
    // Remplir les informations de la quête
    questElement.querySelector('.quest-title').textContent = quest.title;
    questElement.querySelector('.quest-description').textContent = quest.description;
    questElement.querySelector('.xp-amount').textContent = quest.xp;
    questElement.querySelector('.deadline-text').textContent = quest.deadline;
    
    // Ajouter l'identifiant de la quête
    questElement.dataset.questId = quest.id;
    questElement.dataset.questType = quest.type;
    
    // Si la quête est complétée
    if (quest.completed) {
        questElement.classList.add('completed');
    }
    
    // Gérer le clic sur le bouton de complétion
    const completeButton = questElement.querySelector('.btn-complete');
    completeButton.addEventListener('click', () => {
        if (quest.completed) return;
        openQuestModal(quest);
    });
    
    return questElement;
}

// Ouvrir la modal de validation de quête
function openQuestModal(quest) {
    const modal = document.getElementById('quest-modal');
    
    // Remplir les informations
    document.getElementById('quest-modal-title').textContent = quest.title;
    document.getElementById('quest-modal-description').textContent = quest.description;
    document.getElementById('quest-modal-xp').textContent = quest.xp;
    
    // Référence à la quête actuelle
    modal.dataset.questId = quest.id;
    modal.dataset.questType = quest.type;
    
    // Afficher la modal
    modal.classList.remove('hidden');
}

// Gérer la soumission du formulaire de validation
document.getElementById('quest-validation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modal = document.getElementById('quest-modal');
    const questId = modal.dataset.questId;
    const questType = modal.dataset.questType;
    
    // Trouver la quête dans la liste
    const quest = userQuests[questType].find(q => q.id === questId);
    if (!quest) return;
    
    // Marquer comme complétée
    quest.completed = true;
    quest.completedAt = new Date().toISOString();
    quest.comment = document.getElementById('quest-comment').value;
    
    try {
        // Mettre à jour dans Firestore
        await db.collection('user_quests').doc(currentUser.email).update({
            [questType]: userQuests[questType]
        });
        
        // Ajouter l'XP à l'utilisateur
        const newXP = (userProfile.xp || 0) + quest.xp;
        await db.collection('users').doc(currentUser.email).update({
            xp: newXP
        });
        
        // Mettre à jour le profil utilisateur en local
        userProfile.xp = newXP;
        
        // Mettre à jour l'interface
        updateUserInterface();
        loadQuestsToUI();
        
        // Fermer la modal de quête
        modal.classList.add('hidden');
        
        // Afficher la modal de succès
        showSuccessModal(quest);
        
        // Réinitialiser le formulaire
        document.getElementById('quest-validation-form').reset();
        
        // Ajouter l'activité au flux
        addActivityToFeed({
            type: 'quest_completed',
            questTitle: quest.title,
            xp: quest.xp,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erreur lors de la validation de la quête:', error);
        alert('Une erreur est survenue lors de la validation de la quête.');
    }
});

// Fermer la modal de quête
document.getElementById('close-quest-modal').addEventListener('click', () => {
    document.getElementById('quest-modal').classList.add('hidden');
});

// Afficher la modal de succès
function showSuccessModal(quest) {
    const modal = document.getElementById('success-modal');
    
    document.getElementById('success-message').textContent = `Bravo ! Vous avez complété la quête "${quest.title}".`;
    document.getElementById('gained-xp').textContent = quest.xp;
    
    // Vérifier si un badge est débloqué (dans badges.js)
    const unlockedBadge = checkForUnlockedBadges(quest);
    if (unlockedBadge) {
        document.getElementById('badge-unlocked').classList.remove('hidden');
        document.getElementById('badge-icon').innerHTML = ``;
        document.getElementById('badge-icon').style.backgroundColor = unlockedBadge.color;
        document.getElementById('badge-name').textContent = unlockedBadge.name;
    } else {
        document.getElementById('badge-unlocked').classList.add('hidden');
    }
    
    // Afficher la modal
    modal.classList.remove('hidden');
}

// Fermer la modal de succès
document.getElementById('close-success').addEventListener('click', () => {
    document.getElementById('success-modal').classList.add('hidden');
});
