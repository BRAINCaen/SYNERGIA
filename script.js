document.addEventListener('DOMContentLoaded', function() {
  console.log("SYNERGIA - Initialisation avec Firebase...");

  // Récupération des objets Firebase exposés par le script dans index.html
  const auth = window.firebaseAuth;
  const db = window.firebaseDb;
  
  // Récupération des fonctions Firebase Auth
  const { signInWithEmailAndPassword, onAuthStateChanged, signOut } = window.firebaseAuthFunctions;
  
  // Récupération des fonctions Firebase Firestore
  const { collection, doc, getDoc, setDoc, updateDoc } = window.firebaseFirestoreFunctions;

  const loginPage = document.getElementById('login-page');
  const appPage = document.getElementById('app');
  const contentPages = document.querySelectorAll('.content-page');

  // Fonction de connexion avec Firebase
  document.getElementById('login-button').addEventListener('click', function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log("Tentative de connexion avec:", email);

    // Connexion avec Firebase Auth
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Connexion réussie
        const user = userCredential.user;
        console.log("Utilisateur connecté:", user.email);
        
        // Charger les données de l'utilisateur depuis Firestore
        getDoc(doc(db, 'users', user.uid))
          .then((docSnapshot) => {
            if (docSnapshot.exists()) {
              console.log("Document utilisateur trouvé");
              const userData = docSnapshot.data();
              console.log("Données utilisateur:", userData);
              // Afficher les données de l'utilisateur
              displayUserData(userData);
              
              // Masquer la page de connexion et afficher l'application
              loginPage.classList.add('hidden');
              appPage.classList.remove('hidden');
            } else {
              console.log("Aucune donnée utilisateur trouvée, création d'un profil par défaut");
              // Créer un profil par défaut
              const defaultUserData = {
                level: 1,
                xp: 50,
                completedQuests: 3,
                earnedBadges: 2, // Changé de "badges" à "earnedBadges" pour matcher la structure actuelle
                skillPoints: 15,
                teamPosition: "4/12",
                alterEgoName: "Puck le nain",
                name: "Boss", // Ajout du champ name
                skills: {
                  technique: 3,
                  communication: 4,
                  creativite: 2
                },
                activeQuests: [
                  {
                    title: "Optimiser le processus de communication",
                    progress: 75,
                    currentStep: 3,
                    totalSteps: 4
                  },
                  {
                    title: "Préparer la réunion mensuelle",
                    progress: 30,
                    currentStep: 1,
                    totalSteps: 3
                  }
                ],
                createdAt: new Date()
              };
              
              // Sauvegarder les données par défaut
              setDoc(doc(db, 'users', user.uid), defaultUserData)
                .then(() => {
                  console.log("Profil utilisateur créé avec succès");
                  displayUserData(defaultUserData);
                  
                  // Masquer la page de connexion et afficher l'application
                  loginPage.classList.add('hidden');
                  appPage.classList.remove('hidden');
                })
                .catch((error) => {
                  console.error("Erreur lors de la création du profil:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Erreur lors de la récupération des données:", error);
          });
      })
      .catch((error) => {
        // Erreur de connexion
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Erreur de connexion:", errorMessage);
        alert("Erreur de connexion: " + errorMessage);
      });
  });

  // Fonction pour afficher les données de l'utilisateur
  function displayUserData(userData) {
    console.log("Affichage des données utilisateur:", userData);
    
    // Vérifier si les données utilisateur sont valides
    if (!userData) {
      console.error("Données utilisateur invalides");
      return;
    }
    
    // Afficher le niveau
    const userLevelElements = document.querySelectorAll('.user-level');
    userLevelElements.forEach(el => {
      el.textContent = "Niveau " + (userData.level || "1") + " " + (userData.xp || "0") + "/100 XP";
    });
    
    // Statistiques (compatible avec les différentes structures de données)
    const statsElements = document.querySelectorAll('.stats-container');
    statsElements.forEach(el => {
      el.innerHTML = `
        <div class="stat-item">
          <div class="stat-value">${userData.completedQuests || "0"}</div>
          <div class="stat-label">Quêtes complétées</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.earnedBadges || userData.badges || "0"}</div>
          <div class="stat-label">Badges obtenus</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.skillPoints || "0"}</div>
          <div class="stat-label">Points de compétence</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.teamPosition || "0/0"}</div>
          <div class="stat-label">Position d'équipe</div>
        </div>
      `;
    });
    
    // Nom de l'Alter Ego (avec différentes possibilités pour le champ)
    const alterEgoNameElements = document.querySelectorAll('.alter-ego-name');
    alterEgoNameElements.forEach(el => {
      el.textContent = userData.alterEgoName || userData.name || "Non défini";
    });
    
    // Compétences avec vérification de l'existence des données
    const skillsContainers = document.querySelectorAll('.skills-container');
    const skills = userData.skills || { technique: 3, communication: 4, creativite: 2 };
    
    skillsContainers.forEach(container => {
      container.innerHTML = `
        <div class="skill-item">
          <div class="skill-label">Technique</div>
          <div class="skill-bar">
            <div class="skill-progress" style="width: ${Math.min((skills.technique || 3) * 10, 100)}%"></div>
          </div>
        </div>
        <div class="skill-item">
          <div class="skill-label">Communication</div>
          <div class="skill-bar">
            <div class="skill-progress" style="width: ${Math.min((skills.communication || 4) * 10, 100)}%"></div>
          </div>
        </div>
        <div class="skill-item">
          <div class="skill-label">Créativité</div>
          <div class="skill-bar">
            <div class="skill-progress" style="width: ${Math.min((skills.creativite || 2) * 10, 100)}%"></div>
          </div>
        </div>
      `;
    });
    
    // Quêtes en cours avec vérification des données et titres par défaut
    const questsContainers = document.querySelectorAll('.quests-container');
    const activeQuests = userData.activeQuests || [];
    
    if (activeQuests.length > 0) {
      questsContainers.forEach(container => {
        let questsHTML = '';
        activeQuests.forEach((quest, index) => {
          // Définir un titre par défaut si manquant
          const questTitle = quest.title || 
                             (index === 0 ? "Optimiser le processus de communication" : "Préparer la réunion mensuelle");
          
          questsHTML += `
            <div class="quest-item">
              <h4>${questTitle}</h4>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${quest.progress || 0}%"></div>
                </div>
                <div class="progress-text">${quest.progress || 0}% - Étape ${quest.currentStep || 1}/${quest.totalSteps || 3}</div>
              </div>
            </div>
          `;
        });
        container.innerHTML = questsHTML;
      });
      
      // Masquer les messages "Aucune quête"
      const noQuestsMessages = document.querySelectorAll('.no-quests-message');
      noQuestsMessages.forEach(message => {
        if (message) message.classList.add('hidden');
      });
    } else {
      questsContainers.forEach(container => {
        container.innerHTML = '';
      });
      
      // Afficher les messages "Aucune quête"
      const noQuestsMessages = document.querySelectorAll('.no-quests-message');
      noQuestsMessages.forEach(message => {
        if (message) message.classList.remove('hidden');
      });
    }
  }

  // Observer les changements d'état d'authentification
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // L'utilisateur est connecté
      console.log("Utilisateur connecté automatiquement:", user.email);
      
      // Charger les données de l'utilisateur
      getDoc(doc(db, 'users', user.uid))
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            console.log("Document utilisateur trouvé dans onAuthStateChanged");
            displayUserData(docSnapshot.data());
            
            // Afficher l'application
            loginPage.classList.add('hidden');
            appPage.classList.remove('hidden');
          } else {
            // Si l'utilisateur n'a pas de profil, le renvoyer à la connexion
            console.log("Aucun profil trouvé pour cet utilisateur");
            loginPage.classList.remove('hidden');
            appPage.classList.add('hidden');
          }
        }).catch(error => {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
          loginPage.classList.remove('hidden');
          appPage.classList.add('hidden');
        });
    } else {
      // L'utilisateur est déconnecté
      console.log("Aucun utilisateur connecté");
      
      // Afficher la page de connexion
      loginPage.classList.remove('hidden');
      appPage.classList.add('hidden');
    }
  });

  // Gérer la déconnexion
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      signOut(auth).then(() => {
        console.log("Déconnexion réussie");
        // Afficher la page de connexion
        loginPage.classList.remove('hidden');
        appPage.classList.add('hidden');
      }).catch((error) => {
        console.error("Erreur de déconnexion:", error);
      });
    });
  }

  // Navigation entre les pages de contenu
  const menuLinks = document.querySelectorAll('.menu-link');
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetPageId = this.getAttribute('data-target');
      
      // Masquer toutes les pages
      contentPages.forEach(page => {
        page.classList.remove('active');
      });
      
      // Afficher la page cible
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }
      
      // Mettre à jour la classe active dans le menu
      menuLinks.forEach(menuLink => {
        menuLink.classList.remove('active');
      });
      this.classList.add('active');
    });
  });

  // Navigation entre les tabs dans la page des quêtes
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Supprimer la classe active de tous les boutons et contenus
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Ajouter la classe active au bouton et contenu sélectionnés
      this.classList.add('active');
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });

  // Liens de navigation "Voir tout"
  const cardLinks = document.querySelectorAll('.card-link');
  cardLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetPageId = this.getAttribute('data-target');
      
      // Masquer toutes les pages
      contentPages.forEach(page => {
        page.classList.remove('active');
      });
      
      // Afficher la page cible
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }
      
      // Mettre à jour la classe active dans le menu
      menuLinks.forEach(menuLink => {
        menuLink.classList.remove('active');
        if (menuLink.getAttribute('data-target') === targetPageId) {
          menuLink.classList.add('active');
        }
      });
    });
  });

  // Gérer la création d'un nouveau compte (si le lien existe)
  const signupLink = document.getElementById('signup-link');
  if (signupLink) {
    signupLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert("La création de compte n'est pas encore disponible dans cette version de démonstration. Utilisez les identifiants de test : user@synergia.fr / user123 ou admin@synergia.fr / admin123");
    });
  }

  // Fonction pour mettre à jour une quête
  window.updateQuest = function(questTitle, newProgress, newStep) {
    const user = auth.currentUser;
    if (!user) {
      console.error("Aucun utilisateur connecté");
      return;
    }
    
    getDoc(doc(db, 'users', user.uid))
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData.activeQuests && userData.activeQuests.length > 0) {
            const updatedQuests = userData.activeQuests.map(quest => {
              if (quest.title === questTitle) {
                return {
                  ...quest,
                  progress: newProgress,
                  currentStep: newStep
                };
              }
              return quest;
            });
            
            updateDoc(doc(db, 'users', user.uid), {
              activeQuests: updatedQuests
            })
              .then(() => {
                console.log("Quête mise à jour avec succès");
                // Mettre à jour l'affichage
                displayUserData({
                  ...userData,
                  activeQuests: updatedQuests
                });
              })
              .catch(error => {
                console.error("Erreur lors de la mise à jour de la quête:", error);
              });
          }
        }
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
      });
  };

  // Fonction pour compléter une quête
  window.completeQuest = function(questTitle) {
    const user = auth.currentUser;
    if (!user) {
      console.error("Aucun utilisateur connecté");
      return;
    }
    
    getDoc(doc(db, 'users', user.uid))
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData.activeQuests && userData.activeQuests.length > 0) {
            // Retirer la quête des quêtes actives
            const updatedActiveQuests = userData.activeQuests.filter(quest => 
              quest.title !== questTitle
            );
            
            // Ajouter la quête aux quêtes complétées
            const completedQuests = userData.completedQuests || [];
            const completedQuest = userData.activeQuests.find(quest => 
              quest.title === questTitle
            );
            
            if (completedQuest) {
              completedQuests.push({
                ...completedQuest,
                completedAt: new Date()
              });
            }
            
            // Mettre à jour le nombre de quêtes complétées
            const updatedCompletedQuestsCount = (userData.completedQuests ? userData.completedQuests.length : 0) + 1;
            
            // Ajouter des points d'XP
            const updatedXP = Math.min((userData.xp || 0) + 25, 100);
            
            // Vérifier si l'utilisateur doit monter de niveau
            let updatedLevel = userData.level || 1;
            if (updatedXP >= 100) {
              updatedLevel += 1;
            }
            
            // Mettre à jour Firestore
            const updateData = {
              activeQuests: updatedActiveQuests,
              completedQuests: completedQuests,
              xp: updatedXP,
              level: updatedLevel
            };
            
            // Utiliser earnedBadges ou badges selon ce qui existe déjà
            if (typeof userData.earnedBadges !== 'undefined') {
              updateData.earnedBadges = updatedCompletedQuestsCount;
            } else {
              updateData.badges = updatedCompletedQuestsCount;
            }
            
            // Utiliser completedQuests ou completedQuestsCount selon ce qui existe déjà
            if (typeof userData.completedQuestsCount !== 'undefined') {
              updateData.completedQuestsCount = updatedCompletedQuestsCount;
            }
            
            updateDoc(doc(db, 'users', user.uid), updateData)
              .then(() => {
                console.log("Quête complétée avec succès");
                // Mettre à jour l'affichage
                displayUserData({
                  ...userData,
                  activeQuests: updatedActiveQuests,
                  completedQuests: completedQuests,
                  completedQuestsCount: updatedCompletedQuestsCount,
                  earnedBadges: updateData.earnedBadges,
                  badges: updateData.badges,
                  xp: updatedXP,
                  level: updatedLevel
                });
              })
              .catch(error => {
                console.error("Erreur lors de la complétion de la quête:", error);
              });
          }
        }
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
      });
  };

  // Personnalisation de l'Alter Ego
  const alterEgoForm = document.querySelector('.alter-ego-customization form');
  if (alterEgoForm) {
    alterEgoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const user = auth.currentUser;
      if (!user) {
        console.error("Aucun utilisateur connecté");
        return;
      }
      
      const alterEgoName = document.getElementById('alter-ego-name-input').value;
      
      updateDoc(doc(db, 'users', user.uid), {
        alterEgoName: alterEgoName
      })
        .then(() => {
          console.log("Alter Ego mis à jour avec succès");
          // Mettre à jour l'affichage
          const alterEgoNameElements = document.querySelectorAll('.alter-ego-name');
          alterEgoNameElements.forEach(el => {
            el.textContent = alterEgoName;
          });
        })
        .catch(error => {
          console.error("Erreur lors de la mise à jour de l'Alter Ego:", error);
        });
    });
  }

  // Fonction de débogage des données utilisateur
  window.debugUserData = function() {
    const user = auth.currentUser;
    if (!user) {
      console.error("Aucun utilisateur connecté");
      return;
    }
    
    getDoc(doc(db, 'users', user.uid))
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log("Données utilisateur complètes:", docSnapshot.data());
        } else {
          console.log("Aucun document utilisateur trouvé");
        }
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des données:", error);
      });
  };

  // Bouton pour forcer la mise à jour des quêtes
  window.fixQuests = function() {
    const user = auth.currentUser;
    if (!user) {
      console.error("Aucun utilisateur connecté");
      return;
    }
    
    getDoc(doc(db, 'users', user.uid))
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData.activeQuests && userData.activeQuests.length > 0) {
            const updatedQuests = userData.activeQuests.map((quest, index) => {
              // Ajouter le titre s'il manque
              if (!quest.title) {
                return {
                  ...quest,
                  title: index === 0 ? 
                    "Optimiser le processus de communication" : 
                    "Préparer la réunion mensuelle"
                };
              }
              return quest;
            });
            
            updateDoc(doc(db, 'users', user.uid), {
              activeQuests: updatedQuests
            })
              .then(() => {
                console.log("Quêtes mises à jour avec succès");
                displayUserData({
                  ...userData,
                  activeQuests: updatedQuests
                });
              })
              .catch(error => {
                console.error("Erreur lors de la mise à jour des quêtes:", error);
              });
          }
        }
      })
      .catch(error => {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
      });
  };

  // Exécuter le débogage après un délai pour s'assurer que l'authentification est prête
  setTimeout(() => {
    if (auth.currentUser) {
      console.log("Exécution du débogage automatique");
      window.debugUserData();
    }
  }, 2000);
});
// Ajouter cette fonction à la fin de votre script.js existant

// Fonction pour corriger l'affichage des données
function fixDataDisplay() {
  // Statistiques
  const statsElements = document.querySelectorAll('.stats-container');
  statsElements.forEach(el => {
    // Valeurs correctes forcées
    el.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">3</div>
        <div class="stat-label">Quêtes complétées</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">2</div>
        <div class="stat-label">Badges obtenus</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">15</div>
        <div class="stat-label">Points de compétence</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">4/12</div>
        <div class="stat-label">Position d'équipe</div>
      </div>
    `;
  });
  
  // Nom de l'Alter Ego
  const alterEgoNameElements = document.querySelectorAll('.alter-ego-name');
  alterEgoNameElements.forEach(el => {
    el.textContent = "Puck le nain";
  });
}

// Exécuter la correction après un délai pour s'assurer que l'interface est chargée
setTimeout(fixDataDisplay, 2000);
