# Configuration et déploiement

## 1. Préparer Firebase
1. Créez un projet Firebase depuis la console.
2. Activez l'authentification Email/Password et Firestore.
3. Copiez la configuration fournie par Firebase dans `js/core/firebase-config.js` :

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

## 2. Lancer en local
1. Servez les fichiers statiques à l'aide de `npx serve` :
   ```bash
   npx serve .
   ```
2. Ouvrez <http://localhost:3000> pour tester l'application.

## 3. Déployer
Vous pouvez déployer SYNERGIA sur **Firebase Hosting** ou **Netlify** :

### Via Firebase Hosting
```bash
firebase login
firebase init hosting
firebase deploy
```

### Via Netlify
1. Connectez-vous sur <https://netlify.com> et créez un nouveau site en pointant vers ce dépôt.
2. Utilisez les valeurs par défaut pour un déploiement instantané.
