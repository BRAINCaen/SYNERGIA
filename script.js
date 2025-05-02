document.addEventListener('DOMContentLoaded', function() {
  console.log("SYNERGIA - Initialisation...");

  // Données de l'application
  const appData = {
    currentUser: null,
    users: [
      {
        id: 1,
        name: 'Utilisateur Test',
        email: 'user@synergia.fr',
        password: 'user123',
        isAdmin: false,
        alterEgo: {
          name: 'Aventurier Numérique',
          description: 'Explorateur des technologies modernes, toujours à la recherche de nouvelles solutions.',
          role: 'Responsable Communication',
          avatarImg: 'https://i.pravatar.cc/150?img=1',
          xp: 50,
          level: 1,
          completedQuests: 3,
          earnedBadges: 2,
          skillPoints: 15
        }
      },
      {
        id: 2,
        name: 'Administrateur',
        email: 'admin@synergia.fr',
        password: 'admin123',
        isAdmin: true,
        alterEgo: {
          name: 'Gardien du Savoir',
          description: 'Protecteur des connaissances et guide pour l\'équipe.',
          role: 'Administrateur Système',
          avatarImg: 'https://i.pravatar.cc/150?img=7',
          xp: 280,
          level: 3,
          completedQuests: 12,
          earnedBadges: 8,
          skillPoints: 3
        }
      }
    ]
  };

  // Sélections DOM
  const loginPage = document.getElementById('login-page');
  const appPage = document.getElementById('app');
  const contentPages = document.querySelectorAll('.content-page');

  // Gestion des onglets de connexion
  const loginTabs = document.querySelectorAll('.tab-button');
  const formContainers = document.querySelectorAll('.form-container');

  loginTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      console.log("Changement d'onglet de connexion");
      loginTabs.forEach(t => t.classList.remove('active'));
      formContainers.forEach(form => form.classList.remove('active'));
      
      this.classList.add('active');
      const targetFormId = this.getAttribute('data-tab');
      document.getElementById(targetFormId).classList.add('active');
    });
  });

  // Fonction simplifiée de connexion
  function loginUser() {
    console.log("Tentative de connexion...");
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Vérification simple des identifiants
    const user = appData.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      console.log("Connexion réussie pour:", user.name);
      appData.currentUser = user;
      
      // Afficher l'application, masquer la connexion
      loginPage.classList.remove('active');
      appPage.classList.add('active');
      
      // Mettre à jour l'interface
      updateUIWithUserData(user);
      
      // Gérer les éléments admin
      if (user.isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'flex');
      } else {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      }
    } else {
      console.log("Échec de connexion");
      alert('Email ou mot de passe incorrect. Utilisez user@synergia.fr/user123 ou admin@synergia.fr/admin123');
    }
  }

  // Mise à jour de l'interface avec les données utilisateur
  function updateUIWithUserData(user) {
    console.log("Mise à jour de l'UI avec les données utilisateur");
    // Infos navigation
    document.getElementById('nav-avatar').src = user.alterEgo.avatarImg;
    document.getElementById('nav-user-name').textContent = user.name;
    document.getElementById('nav-user-level').textContent = `Niveau ${user.alterEgo.level}`;
    
    // Infos tableau de bord
    document.getElementById('current-level').textContent = `Niveau ${user.alterEgo.level}`;
    document.getElementById('xp-counter').textContent = `${user.alterEgo.xp}/100 XP`;
    document.querySelectorAll('.xp-progress').forEach(el => {
      el.style.width = `${user.alterEgo.xp % 100}%`;
    });
    
    document.getElementById('completed-quests').textContent = user.alterEgo.completedQuests;
    document.getElementById('earned-badges').textContent = user.alterEgo.earnedBadges;
    document.getElementById('skill-points').textContent = user.alterEgo.skillPoints;
    document.getElementById('dashboard-avatar').src = user.alterEgo.avatarImg;
    document.getElementById('alter-ego-name').textContent = user.alterEgo.name;
    
    // Infos profil
    document.getElementById('profile-avatar-img').src = user.alterEgo.avatarImg;
    document.getElementById('profile-alter-ego-name').textContent = user.alterEgo.name;
    document.getElementById('profile-level').textContent = `Niveau ${user.alterEgo.level}`;
    document.getElementById('profile-role').textContent = user.alterEgo.role;
    document.getElementById('profile-description-text').textContent = user.alterEgo.description;
  }

  // Gestion du menu utilisateur
  const userProfileToggle = document.getElementById('user-profile-toggle');
  const userDropdown = document.getElementById('user-dropdown');
  
  if (userProfileToggle) {
    userProfileToggle.addEventListener('click', function() {
      userDropdown.classList.toggle('active');
    });
    
    // Fermer dropdown si clic ailleurs
    document.addEventListener('click', function(event) {
      if (!userProfileToggle.contains(event.target) && !userDropdown.contains(event.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }

  // Gestion du menu hamburger
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', function() {
      if (mobileMenu.style.display === 'flex') {
        mobileMenu.style.display = 'none';
      } else {
        mobileMenu.style.display = 'flex';
      }
    });
  }

  // CORRECTION IMPORTANTE : Navigation entre pages
  function setupNavigation() {
    console.log("Configuration de la navigation");
    
    // Navigation principale et mobile
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        console.log("Navigation vers:", this.getAttribute('data-page'));
        
        // Désactiver tous les liens et pages
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(l => {
          l.classList.remove('active');
        });
        contentPages.forEach(page => {
          page.classList.remove('active');
        });
        
        // Activer le lien et la page cible
        this.classList.add('active');
        const targetPageId = this.getAttribute('data-page');
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
          targetPage.classList.add('active');
        } else {
          console.error("Page non trouvée:", targetPageId);
        }
        
        // Cacher le menu mobile
        mobileMenu.style.display = 'none';
      });
    });
    
    // Autres éléments avec data-page (boutons, liens)
    document.querySelectorAll('[data-page]:not(.nav-link):not(.mobile-nav-link)').forEach(element => {
      element.addEventListener('click', function(event) {
        event.preventDefault();
        console.log("Navigation secondaire vers:", this.getAttribute('data-page'));
        
        const targetPageId = this.getAttribute('data-page');
        contentPages.forEach(page => {
          page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(targetPageId);
        if (targetPage) {
          targetPage.classList.add('active');
          
          // Mise à jour des liens de navigation
          document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            if (link.getAttribute('data-page') === targetPageId) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        } else {
          console.error("Page cible non trouvée:", targetPageId);
        }
      });
    });
  }

  // Gestion des onglets génériques
  function setupTabs() {
    console.log("Configuration des onglets");
    
    // Onglets génériques
    document.querySelectorAll('.tabs').forEach(tabGroup => {
      const tabs = tabGroup.querySelectorAll('.tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          const parentContainer = this.closest('.tabs-container');
          const tabId = this.getAttribute('data-tab');
          
          // Désactiver tous les onglets et contenus du groupe
          parentContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          parentContainer.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
          
          // Activer l'onglet cliqué et son contenu
          this.classList.add('active');
          const targetContent = document.getElementById(tabId);
          if (targetContent) {
            targetContent.classList.add('active');
          }
        });
      });
    });
    
    // Onglets du profil
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.profile-tab-content').forEach(content => content.classList.remove('active'));
        
        this.classList.add('active');
        const targetContent = document.getElementById(tabId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  // Déconnexion
  function setupLogout() {
    document.getElementById('logout-button').addEventListener('click', function() {
      console.log("Déconnexion");
      appData.currentUser = null;
      loginPage.classList.add('active');
      appPage.classList.remove('active');
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
    });
    
    document.getElementById('mobile-logout').addEventListener('click', function() {
      console.log("Déconnexion (mobile)");
      appData.currentUser = null;
      loginPage.classList.add('active');
      appPage.classList.remove('active');
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
    });
  }

  // Bouton de connexion
  document.getElementById('login-button').addEventListener('click', function(e) {
    e.preventDefault();
    loginUser();
  });
  
  // Bouton d'inscription (simulation)
  document.getElementById('register-button').addEventListener('click', function(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (name && email && password) {
      alert('Inscription simulée réussie! Dans une version complète, cela créerait un nouveau compte. Pour le moment, utilisez les comptes de démonstration.');
      document.querySelectorAll('.tab-button')[0].click();
    } else {
      alert('Veuillez remplir tous les champs.');
    }
  });
  
  // Initialisation de toutes les fonctionnalités
  setupNavigation();
  setupTabs();
  setupLogout();
  
  // Quêtes - Accepter (simulation)
  document.querySelectorAll('.quest-card .btn-primary').forEach(button => {
    button.addEventListener('click', function() {
      alert('Quête acceptée! Cette action serait enregistrée dans une version complète.');
    });
  });
  
  console.log("SYNERGIA - Initialisation terminée");
});
