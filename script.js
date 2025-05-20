document.addEventListener('DOMContentLoaded', function() {
  console.log("SYNERGIA - Initialisation avec Firebase...");

  // Récupération des objets Firebase exposés par le script dans index.html
  const auth = window.firebaseAuth;
  const db = window.firebaseDb;

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
              const userData = docSnapshot.data();
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
                badges: 2,
                skillPoints: 15,
                teamPosition: "4/12",
                alterEgoName: "Non défini",
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
    // Afficher le niveau
    const userLevelElements = document.querySelectorAll('.user-level');
    userLevelElements.forEach(el => {
      el.textContent = "Niveau " + userData.level + " " + userData.xp + "/100 XP";
    });
    
    // Statistiques
    const statsElements = document.querySelectorAll('.stats-container');
    statsElements.forEach(el => {
      el.innerHTML = `
        <div class="stat-item">
          <div class="stat-value">${userData.completedQuests}</div>
          <div class="stat-label">Quêtes complétées</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.badges}</div>
          <div class="stat-label">Badges obtenus</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.skillPoints}</div>
          <div class="stat-label">Points de compétence</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${userData.teamPosition}</div>
          <div class="stat-label">Position d'équipe</div>
        </div>
      `;
    });
    
    // Nom de l'Alter Ego
    const alterEgoNameElements = document.querySelectorAll('.alter-ego-name');
    alterEgoNameElements.forEach(el => {
      el.textContent = userData.alterEgoName || "Non défini";
    });
    
    // Compétences
    const skillsContainers = document.querySelectorAll('.skills-container');
    if (userData.skills) {
      skillsContainers.forEach(container => {
        container.innerHTML = `
          <div class="skill-item">
            <div class="skill-label">Technique</div>
            <div class="skill-bar">
              <div class="skill-progress" style="width: ${userData.skills.technique * 20}%"></div>
            </div>
          </div>
          <div class="skill-item">
            <div class="skill-label">Communication</div>
            <div class="skill-bar">
              <div class="skill-progress" style="width: ${userData.skills.communication * 20}%"></div>
            </div>
          </div>
          <div class="skill-item">
            <div class="skill-label">Créativité</div>
            <div class="skill-bar">
              <div class="skill-progress" style="width: ${userData.skills.creativite * 20}%"></div>
            </div>
          </div>
        `;
      });
    }
    
    // Quêtes en cours
    const questsContainers = document.querySelectorAll('.quests-container');
    if (userData.activeQuests && userData.activeQuests.length > 0) {
      questsContainers.forEach(container => {
        let questsHTML = '';
        userData.activeQuests.forEach(quest => {
          questsHTML += `
            <div class="quest-item">
              <h4>${quest.title}</h4>
              <div class="quest-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${quest.progress}%"></div>
                </div>
                <div class="progress-text">${quest.progress}% - Étape ${quest.currentStep}/${quest.totalSteps}</div>
              </div>
            </div>
          `;
        });
        container.innerHTML = questsHTML;
      });
      
      // Masquer les messages "Aucune quête"
      const noQuestsMessages = document.querySelectorAll('.no-quests-message');
      noQuestsMessages.forEach(message => {
        message.classList.add('hidden');
      });
    } else {
      questsContainers.forEach(container => {
        container.innerHTML = '';
      });
      
      // Afficher les messages "Aucune quête"
      const noQuestsMessages = document.querySelectorAll('.no-quests-message');
      noQuestsMessages.forEach(message => {
        message.classList.remove('hidden');
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
      document.getElementById(tabId).classList.add('active');
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
            const updatedCompletedQuestsCount = (userData.completedQuests || 0) + 1;
            
            // Ajouter des points d'XP
            const updatedXP = Math.min(userData.xp + 25, 100);
            
            // Vérifier si l'utilisateur doit monter de niveau
            let updatedLevel = userData.level;
            if (updatedXP >= 100) {
              updatedLevel += 1;
            }
            
            // Mettre à jour Firestore
            updateDoc(doc(db, 'users', user.uid), {
              activeQuests: updatedActiveQuests,
              completedQuests: completedQuests,
              completedQuestsCount: updatedCompletedQuestsCount,
              xp: updatedXP,
              level: updatedLevel
            })
              .then(() => {
                console.log("Quête complétée avec succès");
                // Mettre à jour l'affichage
                displayUserData({
                  ...userData,
                  activeQuests: updatedActiveQuests,
                  completedQuests: completedQuests,
                  completedQuestsCount: updatedCompletedQuestsCount,
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
});
