// Définition des rôles disponibles dans l'application
const roles = {
    "entretien": {
        id: "entretien",
        name: "Entretien, Réparations & Maintenance",
        icon: "fa-wrench",
        color: "#4caf50",
        description: "Surveille et entretient l'état des espaces, réalise des réparations techniques et maintient les énigmes en bon état de fonctionnement.",
        responsibilities: [
            "Surveiller et entretenir l'état général des espaces",
            "Réaliser des réparations techniques sur le bâtiment",
            "Vérifier et maintenir les énigmes et mécanismes",
            "Remplacer les éléments abîmés ou défectueux",
            "Réaliser des aménagements pour optimiser les espaces"
        ],
        exampleTasks: [
            "Changer une ampoule ou réparer une serrure",
            "Réimprimer et plastifier des indices endommagés",
            "Réparer un coffre-fort ou un mécanisme cassé",
            "Repeindre une zone abîmée pour l'immersion"
        ]
    },
    "avis": {
        id: "avis",
        name: "Gestion des Avis et Réputation",
        icon: "fa-star",
        color: "#ff9800",
        description: "Surveille et répond aux avis des clients sur toutes les plateformes, incite à laisser des avis positifs et analyse les tendances pour amélioration.",
        responsibilities: [
            "Surveiller et analyser les avis sur toutes les plateformes",
            "Répondre aux avis de manière personnalisée",
            "Inciter les joueurs à laisser des avis",
            "Identifier les tendances dans les retours",
            "Remonter les informations utiles à l'équipe"
        ],
        exampleTasks: [
            "Répondre à un avis 5 étoiles avec un message personnalisé",
            "Apaiser une critique négative en proposant une solution",
            "Créer un support interactif pour encourager les avis"
        ]
    },
    "stocks": {
        id: "stocks",
        name: "Gestion des Stocks et Matériel",
        icon: "fa-boxes",
        color: "#9c27b0",
        description: "Réalise le suivi des consommables et matériel, organise les commandes et optimise les espaces de stockage pour l'efficacité de l'équipe.",
        responsibilities: [
            "Réaliser le suivi régulier des consommables et matériel",
            "Commander et anticiper les besoins en fournitures",
            "Élaborer et optimiser les espaces de stockage",
            "Maintenir les espaces propres et fonctionnels",
            "Organiser la gestion des déchets et le tri sélectif"
        ],
        exampleTasks: [
            "Vérifier et commander les piles pour éviter les pannes",
            "Organiser les indices par salle dans des bacs identifiés",
            "Faire un état des lieux bimensuel des consommables"
        ]
    },
    "organisation": {
        id: "organisation",
        name: "Organisation Interne du Travail",
        icon: "fa-calendar-check",
        color: "#2196f3",
        description: "Coordonne la répartition des sessions, organise les congés et garantit la conformité du temps de travail pour l'équipe.",
        responsibilities: [
            "Coordonner la répartition des sessions",
            "Organiser et suivre les demandes de congés",
            "Garantir la conformité du temps déclaré",
            "Préparer la validation des bulletins",
            "Suivre l'exercice des rôles complémentaires"
        ],
        exampleTasks: [
            "Élaborer un planning mensuel personnalisé",
            "Vérifier la conformité des horaires pointés",
            "Organiser les remplacements pour absences"
        ]
    },
    "contenu": {
        id: "contenu",
        name: "Création de Contenu & Affichages",
        icon: "fa-palette",
        color: "#e91e63",
        description: "Crée des supports de communication, conçoit des contenus utiles pour l'équipe et assure la cohérence graphique des affichages.",
        responsibilities: [
            "Créer des supports de communication (affiches, visuels)",
            "Concevoir des contenus utiles pour l'équipe",
            "Mettre en forme les documents des autres rôles",
            "Assurer la cohérence graphique des affichages",
            "Veiller à la lisibilité et l'attractivité des supports"
        ],
        exampleTasks: [
            "Réaliser une fiche d'information pour la salle staff",
            "Créer un visuel pour inciter à laisser des avis",
            "Mettre à jour l'écran d'accueil avec des visuels"
        ]
    },
    "formation": {
        id: "formation",
        name: "Mentorat & Formation Interne",
        icon: "fa-graduation-cap",
        color: "#795548",
        description: "Accueille et accompagne les nouveaux arrivants, organise des formations internes et crée des supports pédagogiques.",
        responsibilities: [
            "Accueillir et accompagner les nouveaux arrivants",
            "Organiser et animer des formations internes",
            "Être référent pour les questions de procédure",
            "Créer des supports pédagogiques (checklists, fiches)",
            "Mettre en place un suivi régulier des membres"
        ],
        exampleTasks: [
            "Former une nouvelle personne sur le déroulement d'une session",
            "Réaliser une mini-formation sur la gestion des groupes difficiles",
            "Créer une fiche mémo 'checklist avant ouverture'"
        ]
    },
    "partenariats": {
        id: "partenariats",
        name: "Partenariats & Référencement",
        icon: "fa-handshake",
        color: "#00bcd4",
        description: "Identifie et entretient des relations avec des partenaires locaux, gère les demandes de partenariats et le référencement.",
        responsibilities: [
            "Identifier et entretenir des relations avec les partenaires locaux",
            "Gérer les demandes de partenariats (bons cadeaux, jeux concours)",
            "Représenter l'entreprise lors d'événements externes",
            "Gérer les dons, invitations ou échanges de visibilité",
            "Suivre et améliorer le référencement naturel (SEO)"
        ],
        exampleTasks: [
            "Créer un contact avec un bar local pour un partenariat",
            "Répondre à une demande de bon cadeau pour une tombola",
            "Mettre à jour la fiche Google My Business"
        ]
    },
    "communication": {
        id: "communication",
        name: "Communication & Réseaux Sociaux",
        icon: "fa-hashtag",
        color: "#3f51b5",
        description: "Gère les comptes sur les réseaux sociaux, crée et publie des contenus variés et engage la communauté en ligne.",
        responsibilities: [
            "Gérer les comptes sur les différents réseaux sociaux",
            "Créer et publier des contenus variés (photos, vidéos)",
            "Trouver des idées originales adaptées à l'univers",
            "Valoriser les rôles internes et sessions",
            "Planifier les publications et maintenir une régularité"
        ],
        exampleTasks: [
            "Tourner une vidéo fun avec les Game Masters en costume",
            "Créer une série de stories avant/après une session",
            "Lancer un jeu concours en ligne avec un partenaire local"
        ]
    },
    "b2b": {
        id: "b2b",
        name: "Relations B2B & Devis",
        icon: "fa-briefcase",
        color: "#ffc107",
        description: "Gère les devis et les relations avec les clients professionnels, organise les événements B2B et les prestations spéciales.",
        responsibilities: [
            "Réception et traitement des demandes de devis",
            "Élaboration de propositions commerciales adaptées",
            "Organisation des événements B2B (team building)",
            "Gestion de la logistique des prestations traiteur",
            "Maintenir un contact régulier et professionnel avec les clients B2B"
        ],
        exampleTasks: [
            "Préparer un devis pour un séminaire d'entreprise",
            "Coordonner un événement team building avec 30 personnes",
            "Faire un suivi post-événement pour fidéliser un client"
        ]
    }
};

// Niveaux de maîtrise des rôles
const masteryLevels = [
    { name: "Novice", xpRequired: 0, color: "#bdbdbd" },
    { name: "Débutant", xpRequired: 100, color: "#8bc34a" },
    { name: "Intermédiaire", xpRequired: 250, color: "#03a9f4" },
    { name: "Avancé", xpRequired: 500, color: "#ff9800" },
    { name: "Expert", xpRequired: 1000, color: "#f44336" },
    { name: "Maître", xpRequired: 2000, color: "#9c27b0" }
];

// Charger les informations de rôle dans l'interface
function loadUserRole() {
    if (!userProfile || !userProfile.role) return;
    
    // Trouver le rôle correspondant
    let roleId = "";
    for (const id in roles) {
        if (roles[id].name === userProfile.role) {
            roleId = id;
            break;
        }
    }
    
    if (!roleId) return;
    
    const roleData = roles[roleId];
    
    // Mettre à jour l'icône du rôle
    document.getElementById('role-icon').innerHTML = ``;
    document.getElementById('role-icon').style.backgroundColor = roleData.color;
    
    // Mettre à jour le nom du rôle
    document.getElementById('role-name').textContent = roleData.name;
    
    // Calculer le niveau de maîtrise
    const roleXP = userProfile.roleXP ? (userProfile.roleXP[roleId] || 0) : 0;
    let masteryLevel = masteryLevels[0];
    
    for (let i = masteryLevels.length - 1; i >= 0; i--) {
        if (roleXP >= masteryLevels[i].xpRequired) {
            masteryLevel = masteryLevels[i];
            break;
        }
    }
    
    // Calculer la progression jusqu'au prochain niveau
    let nextLevel = null;
    for (let i = 0; i < masteryLevels.length; i++) {
        if (masteryLevels[i].xpRequired > roleXP) {
            nextLevel = masteryLevels[i];
            break;
        }
    }
    
    let progressPercent = 100;
    if (nextLevel) {
        const currentLevelXP = masteryLevel.xpRequired;
        const xpForNextLevel = nextLevel.xpRequired - currentLevelXP;
        const xpProgress = roleXP - currentLevelXP;
        progressPercent = (xpProgress / xpForNextLevel) * 100;
    }
    
    // Mettre à jour la barre de progression
    document.getElementById('mastery-bar').style.width = `${progressPercent}%`;
    document.getElementById('mastery-bar').style.backgroundColor = masteryLevel.color;
    document.getElementById('mastery-text').textContent = masteryLevel.name;
}

// Charger les rôles de l'équipe
async function loadTeamRoles() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const teamRoles = document.getElementById('roles-list');
        teamRoles.innerHTML = '';
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            
            // Trouver le rôle correspondant
            let roleInfo = { icon: "fa-user", color: "#757575" };
            for (const id in roles) {
                if (roles[id].name === userData.role) {
                    roleInfo.icon = roles[id].icon;
                    roleInfo.color = roles[id].color;
                    break;
                }
            }
            
            const roleItem = document.createElement('div');
            roleItem.className = 'role-assignment';
            roleItem.innerHTML = `
                

                    ${userData.displayName}
                    ${userData.displayName}
                

                

                    
                    ${userData.role}
                

            `;
            
            teamRoles.appendChild(roleItem);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des rôles de l\'équipe:', error);
    }
}
