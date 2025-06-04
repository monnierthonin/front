# Plan d'implémentation des notifications en temps réel - SupChat

## Résumé des fonctionnalités

L'objectif est de mettre en place un système de notifications en temps réel dans l'application SupChat avec les fonctionnalités suivantes :

1. **Notifications push en temps réel** pour :
   - Nouveaux messages dans les canaux des workspaces dont l'utilisateur est membre
   - Nouveaux messages privés (discussions 1:1 ou conversations de groupe)

2. **Comptage et affichage des messages non lus** :
   - Une notification par message, s'incrémentant à chaque nouveau message non lu
   - Affichage du nombre de messages non lus dans des bulles à côté :
     - Des noms de canaux
     - Des noms de workspaces (total des messages non lus dans tous les canaux)
     - De l'onglet des messages privés
     - De chaque discussion privée ou conversation de groupe

3. **Gestion des notifications** :
   - Disparition/décrémentation des notifications lorsque l'utilisateur visualise les messages
   - Notification spéciale lorsque l'utilisateur est mentionné dans un message
   - Son de notification pour alerter l'utilisateur des nouveaux messages
   - Option pour désactiver le son des notifications si le statut de l'utilisateur est "ne pas déranger"

## Plan d'action détaillé

### Phase 1 : Mise en place de l'infrastructure de base

- [ ] **1.1 Mise à jour du modèle de données**
  - [ ] Ajouter un champ `lu` (boolean) au modèle `Message` ou créer une collection `MessageLu` pour suivre les messages lus par utilisateur
  - [ ] Créer un modèle `Notification` avec les champs :
    - `utilisateur` (référence à l'utilisateur destinataire)
    - `type` (canal, message privé, mention)
    - `reference` (ID du canal ou de la conversation)
    - `message` (ID du message)
    - `lu` (boolean)
    - `createdAt` (date de création)
  - [ ] Ajouter un champ `messagesNonLus` dans les modèles `Canal` et `Conversation` pour chaque utilisateur

- [ ] **1.2 Configuration du système de notifications en temps réel**
  - [ ] Configurer Socket.IO pour la communication en temps réel
  - [ ] Mettre en place des "rooms" Socket.IO pour chaque utilisateur, canal et conversation
  - [ ] Configurer les événements de connexion/déconnexion pour suivre le statut des utilisateurs

### Phase 2 : Implémentation du backend

- [ ] **2.1 Création des événements Socket.IO**
  - [ ] `message:nouveau` : déclenché lorsqu'un nouveau message est envoyé
  - [ ] `message:lu` : déclenché lorsqu'un utilisateur lit un message
  - [ ] `notification:nouvelle` : pour envoyer une notification à un utilisateur
  - [ ] `notification:lue` : pour marquer une notification comme lue

- [ ] **2.2 Développement des middlewares et contrôleurs**
  - [ ] Middleware pour marquer les messages comme lus lorsqu'ils sont affichés
  - [ ] Contrôleur pour gérer les notifications et leur statut
  - [ ] Service pour calculer le nombre de messages non lus par canal et par workspace
  - [ ] API endpoints pour récupérer les notifications et les marquer comme lues

- [ ] **2.3 Gestion des mentions spéciales**
  - [ ] Améliorer la logique existante pour détecter les mentions d'utilisateurs dans les messages
  - [ ] Créer des notifications spécifiques pour les mentions
  - [ ] Implémenter une priorité plus élevée pour les notifications de mention

### Phase 3 : Implémentation du frontend

- [ ] **3.1 Mise à jour des composants Vue.js**
  - [ ] Ajouter des badges (bulles) aux composants suivants :
    - [ ] Liste des canaux
    - [ ] Liste des workspaces
    - [ ] Liste des conversations privées
  - [ ] Implémenter l'affichage du nombre de messages non lus
  - [ ] Créer un composant de notification pour afficher les alertes en temps réel

- [ ] **3.2 Gestion des sons de notification**
  - [ ] Ajouter des fichiers audio pour différents types de notifications
  - [ ] Implémenter la logique pour jouer les sons en fonction du type de notification
  - [ ] Respecter le statut "ne pas déranger" de l'utilisateur pour les sons

- [ ] **3.3 Intégration avec le statut utilisateur**
  - [ ] Modifier le composant de profil utilisateur pour permettre de changer le statut
  - [ ] Implémenter la logique pour désactiver le son des notifications si le statut est "ne pas déranger"
  - [ ] Synchroniser le statut utilisateur entre les différents clients

- [ ] **3.4 Gestion de l'état des notifications côté client**
  - [ ] Créer un store Vuex pour gérer l'état des notifications
  - [ ] Implémenter la logique pour mettre à jour le store lorsque de nouvelles notifications arrivent
  - [ ] Synchroniser l'état des notifications entre les différents composants

### Phase 4 : Tests et optimisation

- [ ] **4.1 Tests unitaires et d'intégration**
  - [ ] Tester la création et la réception des notifications
  - [ ] Vérifier le comptage correct des messages non lus
  - [ ] Tester la synchronisation entre différents clients
  - [ ] Tester les différents scénarios de notification (canal, message privé, mention)

- [ ] **4.2 Optimisation des performances**
  - [ ] Minimiser le nombre de requêtes au serveur
  - [ ] Optimiser les requêtes de base de données pour le comptage des messages non lus
  - [ ] Mettre en cache les informations de notification côté client
  - [ ] Implémenter un système de pagination pour les notifications

### Phase 5 : Déploiement et surveillance

- [ ] **5.1 Déploiement progressif**
  - [ ] Déployer d'abord sur un environnement de test
  - [ ] Recueillir les retours des utilisateurs tests
  - [ ] Corriger les bugs et améliorer l'expérience utilisateur

- [ ] **5.2 Mise en place d'une surveillance**
  - [ ] Surveiller les performances du système de notification
  - [ ] Collecter des métriques sur l'utilisation des notifications
  - [ ] Mettre en place des alertes en cas de problème

## Détails techniques

### Modèles de données

#### Mise à jour du modèle Message

```javascript
const messageSchema = new Schema({
  // Champs existants
  contenu: { type: String, required: true },
  auteur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  canal: { type: Schema.Types.ObjectId, ref: 'Canal' },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  
  // Nouveaux champs pour les notifications
  lecteurs: [{ 
    utilisateur: { type: Schema.Types.ObjectId, ref: 'User' },
    lu: { type: Boolean, default: false },
    luAt: { type: Date }
  }]
});
```

#### Nouveau modèle Notification

```javascript
const notificationSchema = new Schema({
  utilisateur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['canal', 'conversation', 'mention'], required: true },
  reference: { type: Schema.Types.ObjectId, refPath: 'onModel', required: true },
  onModel: { type: String, enum: ['Canal', 'Conversation'], required: true },
  message: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
  lu: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
```

### Événements Socket.IO

```javascript
// Côté serveur
io.on('connection', (socket) => {
  // Authentification de l'utilisateur
  const userId = socket.handshake.auth.userId;
  
  // Rejoindre les rooms de l'utilisateur
  socket.join(`user:${userId}`);
  
  // Événement pour un nouveau message
  socket.on('message:nouveau', async (data) => {
    // Créer le message
    const message = await Message.create(data);
    
    // Notifier les utilisateurs concernés
    notifierUtilisateurs(message);
  });
  
  // Événement pour marquer un message comme lu
  socket.on('message:lu', async (data) => {
    // Marquer le message comme lu
    await marquerMessageLu(data.messageId, userId);
    
    // Mettre à jour les compteurs de messages non lus
    mettreAJourCompteurs(data.referenceId, data.type);
  });
});

// Fonction pour notifier les utilisateurs
async function notifierUtilisateurs(message) {
  // Récupérer les utilisateurs à notifier
  const utilisateurs = await getUtilisateursANotifier(message);
  
  // Créer les notifications
  const notifications = await creerNotifications(message, utilisateurs);
  
  // Envoyer les notifications en temps réel
  notifications.forEach(notification => {
    io.to(`user:${notification.utilisateur}`).emit('notification:nouvelle', notification);
  });
}
```

### Composants frontend

#### Badge de notification pour les canaux

```vue
<template>
  <div class="canal-item">
    <span class="canal-nom">{{ canal.nom }}</span>
    <v-badge
      v-if="messagesNonLus > 0"
      :content="messagesNonLus"
      color="error"
      overlap
    ></v-badge>
  </div>
</template>

<script>
export default {
  props: ['canal'],
  computed: {
    messagesNonLus() {
      return this.$store.getters['notification/messagesNonLusPourCanal'](this.canal._id);
    }
  }
}
</script>
```

#### Store Vuex pour les notifications

```javascript
// notification.js (module Vuex)
export default {
  state: {
    notifications: [],
    messagesNonLusParCanal: {},
    messagesNonLusParConversation: {},
    messagesNonLusParWorkspace: {}
  },
  
  mutations: {
    SET_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },
    
    AJOUTER_NOTIFICATION(state, notification) {
      state.notifications.unshift(notification);
      
      // Mettre à jour les compteurs
      if (notification.type === 'canal') {
        if (!state.messagesNonLusParCanal[notification.reference]) {
          state.messagesNonLusParCanal[notification.reference] = 0;
        }
        state.messagesNonLusParCanal[notification.reference]++;
        
        // Mettre à jour le compteur du workspace
        const canal = this.$store.getters['canal/getCanalById'](notification.reference);
        if (canal && canal.workspace) {
          if (!state.messagesNonLusParWorkspace[canal.workspace]) {
            state.messagesNonLusParWorkspace[canal.workspace] = 0;
          }
          state.messagesNonLusParWorkspace[canal.workspace]++;
        }
      } else if (notification.type === 'conversation') {
        if (!state.messagesNonLusParConversation[notification.reference]) {
          state.messagesNonLusParConversation[notification.reference] = 0;
        }
        state.messagesNonLusParConversation[notification.reference]++;
      }
    },
    
    MARQUER_NOTIFICATION_LUE(state, notificationId) {
      const index = state.notifications.findIndex(n => n._id === notificationId);
      if (index !== -1) {
        state.notifications[index].lu = true;
        
        // Mettre à jour les compteurs
        const notification = state.notifications[index];
        if (notification.type === 'canal' && state.messagesNonLusParCanal[notification.reference] > 0) {
          state.messagesNonLusParCanal[notification.reference]--;
          
          // Mettre à jour le compteur du workspace
          const canal = this.$store.getters['canal/getCanalById'](notification.reference);
          if (canal && canal.workspace && state.messagesNonLusParWorkspace[canal.workspace] > 0) {
            state.messagesNonLusParWorkspace[canal.workspace]--;
          }
        } else if (notification.type === 'conversation' && state.messagesNonLusParConversation[notification.reference] > 0) {
          state.messagesNonLusParConversation[notification.reference]--;
        }
      }
    }
  },
  
  actions: {
    async chargerNotifications({ commit }) {
      try {
        const response = await axios.get('/api/notifications');
        commit('SET_NOTIFICATIONS', response.data);
        
        // Initialiser les compteurs
        response.data.forEach(notification => {
          if (!notification.lu) {
            if (notification.type === 'canal') {
              if (!state.messagesNonLusParCanal[notification.reference]) {
                state.messagesNonLusParCanal[notification.reference] = 0;
              }
              state.messagesNonLusParCanal[notification.reference]++;
              
              // Mettre à jour le compteur du workspace
              const canal = this.$store.getters['canal/getCanalById'](notification.reference);
              if (canal && canal.workspace) {
                if (!state.messagesNonLusParWorkspace[canal.workspace]) {
                  state.messagesNonLusParWorkspace[canal.workspace] = 0;
                }
                state.messagesNonLusParWorkspace[canal.workspace]++;
              }
            } else if (notification.type === 'conversation') {
              if (!state.messagesNonLusParConversation[notification.reference]) {
                state.messagesNonLusParConversation[notification.reference] = 0;
              }
              state.messagesNonLusParConversation[notification.reference]++;
            }
          }
        });
      } catch (error) {
        console.error('Erreur lors du chargement des notifications', error);
      }
    },
    
    async marquerNotificationLue({ commit }, notificationId) {
      try {
        await axios.put(`/api/notifications/${notificationId}/lue`);
        commit('MARQUER_NOTIFICATION_LUE', notificationId);
      } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue', error);
      }
    }
  },
  
  getters: {
    messagesNonLusPourCanal: (state) => (canalId) => {
      return state.messagesNonLusParCanal[canalId] || 0;
    },
    
    messagesNonLusPourConversation: (state) => (conversationId) => {
      return state.messagesNonLusParConversation[conversationId] || 0;
    },
    
    messagesNonLusPourWorkspace: (state) => (workspaceId) => {
      return state.messagesNonLusParWorkspace[workspaceId] || 0;
    },
    
    totalMessagesNonLus: (state) => {
      return Object.values(state.messagesNonLusParCanal).reduce((a, b) => a + b, 0) +
             Object.values(state.messagesNonLusParConversation).reduce((a, b) => a + b, 0);
    }
  }
};
```

## Ressources et dépendances

- Socket.IO pour les communications en temps réel
- Vuex pour la gestion de l'état côté client
- Howler.js pour la gestion des sons de notification
- MongoDB pour le stockage des données de notification

## Suivi de l'implémentation

| Fonctionnalité | Statut | Date de début | Date de fin | Notes |
|----------------|--------|--------------|------------|-------|
| Infrastructure de base | Non commencé | | | |
| Backend des notifications | Non commencé | | | |
| Frontend des notifications | Non commencé | | | |
| Tests et optimisation | Non commencé | | | |
| Déploiement | Non commencé | | | |
