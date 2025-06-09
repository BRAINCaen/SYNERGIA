# API Firebase

Ce document présente l'organisation des modules de **SYNERGIA** ainsi que plusieurs exemples d'appels vers Firebase. Les modules sont regroupés dans le dossier `js` et assurent la communication avec Firestore, le stockage, l'authentification et l'interface.

## Modules principaux

Chaque module se trouve dans `js/core` ou `js/modules` et est chargé dynamiquement par `app-loader.js` :

- **FirebaseManager** – initialisation de Firebase, authentification et accès à Firestore/Storage.
- **DataManager** – logique métier et mise en cache locale.
- **UIManager** – gestion de l'interface utilisateur et des notifications.
- **PlanningManager** – manipulation du calendrier et des shifts.
- **BadgingManager** – suivi du pointage et des pauses.
- **QuestManager** – gestion des quêtes et missions gamifiées.
- **ChatManager** – messagerie temps réel.
- **NotificationManager** – notifications locales et push.
- **TeamManager** – organisation des équipes et des membres.

await firebaseManager.signIn('utilisateur@example.com', 'motdepasse');
```
### Se connecter
```javascript
await firebaseManager.signIn('utilisateur@example.com', 'motdepasse');
```

### Se déconnecter
```javascript
await firebaseManager.signOut();
```
### Ajouter un document
```javascript
const questId = await firebaseManager.addDocument('quests', {
  title: 'Nouvelle mission',
  status: 'todo',
  assigneeId: firebaseManager.currentUser.uid
});
```

### Récupérer une collection ordonnée
```javascript
const quests = await firebaseManager.getCollection('quests', {
  orderBy: { field: 'createdAt', direction: 'desc' }
});
```

### Écouter les changements en temps réel
```javascript
const unsubscribe = firebaseManager.onSnapshot(
  'notifications',
  (data) => {
    console.log('Nouvelles notifications', data);
  },
  {
    where: [{ field: 'userId', operator: '==', value: firebaseManager.currentUser.uid }]
  }
);
```

### Mettre à jour un document
```javascript
await firebaseManager.updateDocument('quests', questId, {
  status: 'completed'
});
```

### Supprimer un document
```javascript
await firebaseManager.deleteDocument('quests', questId);
```

### Mettre en ligne un fichier
```javascript
const url = await firebaseManager.uploadFile('avatars', file);
console.log('Fichier disponible à', url);
```

Appelez `unsubscribe()` pour arrêter l'écoute temps réel.

