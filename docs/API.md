# API Firebase

Ce document présente les principaux modules de SYNERGIA et quelques exemples d'appels vers Firebase.

## Modules principaux

- `FirebaseManager` – initialisation de Firebase, authentification et accès à Firestore/Storage.
- `DataManager` – logique métier et cache local.
- `UIManager` – gestion de l'interface et des notifications.
- `PlanningManager` – manipulation du calendrier et des shifts.
- `BadgingManager` – suivi du pointage.
- `QuestManager` – gestion des quêtes et missions.
- `ChatManager` – messagerie temps réel.
- `NotificationManager` – notifications locales et push.
- `TeamManager` – organisation des équipes et des membres.

## Exemples d'appels Firebase

### Se connecter
```javascript
await firebaseManager.signIn('utilisateur@example.com', 'motdepasse');
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

Appelez `unsubscribe()` pour arrêter l'écoute temps réel.
