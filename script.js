document.addEventListener('DOMContentLoaded', function() {
  console.log("SYNERGIA - Initialisation en mode démo...");
  
  // Définition des variables globales
  const loginPage = document.getElementById('login-page');
  const appPage = document.getElementById('app');
  const contentPages = document.querySelectorAll('.content-page');
  
  // CONNEXION MODE DÉMO DIRECT
  document.getElementById('login-button').addEventListener('click', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log("Tentative de connexion avec:", email);
    
    // Vérification simplifiée des identifiants
    if ((email === "user@synergia.fr" && password === "user123") || 
        (email === "admin@synergia.fr" && password === "admin123") ||
        email.includes("admin") || email.includes("alan")) {
      
      // Données utilisateur selon le type de compte
      const isAdmin = (email === "admin@synergia.fr" || email.includes("admin"));
      const userData = {
        name: isAdmin ? "Administrateur" : "Utilisateur Test",
        email: email,
        isAdmin: isAdmin,
        alterEgo: {
          name: isAdmin ? "Gardien du Savoir" : "Aventurier Numérique",
          description: isAdmin ? "Protecteur des connaissances" : "Explorateur des technologies modernes",
          role: isAdmin ? "Administrateur Système" : "Responsable Communication",
          avatarImg: isAdmin ? "https://placehold.co/150/blue/white?text=Admin" : "https://placehold.co/150/green/white?text=User",
          xp: isAdmin ? 280 : 50,
          level: isAdmin ? 3 : 1,
          completedQuests: isAdmin ? 12 : 3,
          earnedBadges: isAdmin ? 8 : 2,
          skillPoints: isAdmin ? 3 : 15
        }
      };
      
      // Afficher l'application principale
      showMainApp(userData);
    } else {
      alert("Identifiants incorrects. Utilisez admin@synergia.fr/admin123 ou user@synergia.fr/user123");
    }
  });
  
  // INSCRIPTION MODE DÉMO
  document.getElementById('register-button').addEventListener('click', function(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!name || !email || !password) {
      return alert("Veuillez remplir tous les champs.");
    }
    
    // Simuler une inscription réussie
    alert("Inscription simulée réussie! Vous pouvez maintenant vous connecter avec ces identifiants.\n\nPour l'instant, utilisez les comptes de démonstration pour tester l'application.");
    
    // Redirection vers l'onglet connexion
    document.querySelectorAll('.tab-button')[0].click();
  });
  
  // Afficher l'application principale
  function showMainApp(userData) {
    // Cacher l'écran de login et montrer l'app
    loginPage.classList.remove('active');
    appPage.classList.add('active');
    
    // Mettre à jour l'interface avec les données utilisateur
    updateUI(userData);
  }
  
  // Mettre à jour l'interface utilisateur
  function updateUI(userData) {
    // Navigation
    document.getElementById('nav-avatar').src = userData.alterEgo.avatarImg;
    document.getElementById('nav-user-name').textContent = userData.name;
    document.getElementById('nav-user-level').textContent = `Niveau ${userData.alterEgo.level}`;
    
    // Dashboard
    document.getElementById('current-level').textContent = `Niveau ${userData.alterEgo.level}`;
    document.getElementById('xp-counter').textContent = `${userData.alterEgo.xp}/100 XP`;
    document.querySelector('.xp-progress').style.width = `${userData.alterEgo.xp % 100}%`;
    
    document.getElementById('completed-quests').textContent = userData.alterEgo.completedQuests;
    document.getElementById('earned-badges').textContent = userData.alterEgo.earnedBadges;
    document.getElementById('skill-points').textContent = userData.alterEgo.skillPoints;
    
    document.getElementById('dashboard-avatar').src = userData.alterEgo.avatarImg;
    document.getElementById('alter-ego-name').textContent = userData.alterEgo.name;
    
    // Éléments admin
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = userData.isAdmin ? 'flex' : 'none';
    });
  }
  
  // Événement de déconnexion
  document.getElementById('logout-button').addEventListener('click', function() {
    loginPage.classList.add('active');
    appPage.classList.remove('active');
  });
  
  document.getElementById('mobile-logout').addEventListener('click', function() {
    loginPage.classList.add('active');
    appPage.classList.remove('active');
  });
  
  // Navigation
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
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
      }
      
      // Fermer le menu mobile
      document.querySelector('.mobile-menu').style.display = 'none';
    });
  });
  
  // Navigation depuis d'autres éléments
  document.querySelectorAll('[data-page]:not(.nav-link):not(.mobile-nav-link)').forEach(element => {
    element.addEventListener('click', function(e) {
      e.preventDefault();
      
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
      }
    });
  });
  
  // Menu utilisateur
  document.getElementById('user-profile-toggle').addEventListener('click', function() {
    document.getElementById('user-dropdown').classList.toggle('active');
  });
  
  // Menu hamburger
  document.querySelector('.hamburger-menu').addEventListener('click', function() {
    const mobileMenu = document.querySelector('.mobile-menu');
    mobileMenu.style.display = mobileMenu.style.display === 'flex' ? 'none' : 'flex';
  });
  
  // Onglets
  document.querySelectorAll('.tab-button').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
      
      this.classList.add('active');
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });
  
  console.log("SYNERGIA - Initialisation terminée");
});
