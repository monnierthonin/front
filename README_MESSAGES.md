# Documentation du Système de Messages - SupChat

Ce document détaille le fonctionnement complet du système de messages dans l'application SupChat, tant pour les messages de canal que pour les messages privés. Il couvre l'ensemble du processus, de l'interaction utilisateur jusqu'au stockage en base de données.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Messages de canal](#messages-de-canal)
   - [Interface utilisateur](#interface-utilisateur-messages-de-canal)
   - [Flux de données](#flux-de-données-messages-de-canal)
   - [Appels API](#appels-api-messages-de-canal)
   - [Base de données](#base-de-données-messages-de-canal)
3. [Messages privés](#messages-privés)
   - [Interface utilisateur](#interface-utilisateur-messages-privés)
   - [Flux de données](#flux-de-données-messages-privés)
   - [Appels API](#appels-api-messages-privés)
   - [Base de données](#base-de-données-messages-privés)
4. [Fonctionnalités avancées](#fonctionnalités-avancées)
   - [Réponses aux messages](#réponses-aux-messages)
   - [Pièces jointes](#pièces-jointes)
   - [Notifications en temps réel](#notifications-en-temps-réel)
5. [Diagramme de séquence](#diagramme-de-séquence)
6. [Résolution de problèmes courants](#résolution-de-problèmes-courants)

## Vue d'ensemble

L'application SupChat propose deux types de communication:
- **Messages de canal**: messages publics visibles par tous les membres d'un canal
- **Messages privés**: conversations directes entre deux utilisateurs

Ces deux types de messages utilisent des flux de données et modèles de base de données distincts, mais partagent des composants d'interface utilisateur similaires.

## Messages de canal

### Interface utilisateur (Messages de canal)

**Parcours utilisateur:**

1. L'utilisateur se connecte à l'application
2. Il sélectionne un workspace puis un canal dans la barre latérale
3. Le composant `Message.vue` affiche l'historique des messages du canal
4. L'utilisateur utilise `InputBase.vue` ou `textBox.vue` pour rédiger un message
5. L'utilisateur envoie le message en appuyant sur Ctrl+Entrée ou sur le bouton d'envoi

**Composants impliqués:**
- `Home.vue`: Conteneur principal qui orchestre les autres composants
- `Message.vue`: Affiche la liste des messages du canal sélectionné
- `textBox.vue` / `InputBase.vue`: Champ de saisie pour écrire et envoyer des messages
- `FriendsList.vue`: Liste des canaux et conversations

### Flux de données (Messages de canal)

1. **Chargement initial:**
   - `Home.vue` détecte le changement de canal via les propriétés ou la route
   - `Home.vue` appelle `loadWorkspaceData()` qui charge les informations du workspace
   - Si le canal a des messages, ils sont chargés via `messageService.getCanalMessages()`
   - Les messages sont stockés dans l'état local et passés au composant `Message.vue`

2. **Envoi d'un message:**
   - L'utilisateur tape un message dans `textBox.vue` ou `InputBase.vue`
   - Quand le message est envoyé, la méthode `sendMessage()` est appelée
   - Le message est envoyé au backend via `messageService.js`
   - Le composant émet un événement pour actualiser la liste des messages
   - `Message.vue` reçoit le nouveau message et met à jour l'affichage

### Appels API (Messages de canal)

1. **Récupération des messages d'un canal:**
   ```
   GET /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages
   ```
   - Paramètres: 
     - `workspaceId`: ID du workspace
     - `canalId`: ID du canal
   - Options de pagination possibles: `?page=1&limit=50`
   - Réponse: Liste des messages du canal avec les informations des auteurs

2. **Envoi d'un message dans un canal:**
   ```
   POST /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages
   ```
   - Paramètres dans l'URL:
     - `workspaceId`: ID du workspace
     - `canalId`: ID du canal
   - Corps de la requête:
     ```json
     {
       "contenu": "Texte du message",
       "reponseA": "ID_du_message_parent" // optionnel, pour les réponses
     }
     ```
   - Réponse: Le message créé avec son ID

3. **Modification d'un message:**
   ```
   PATCH /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{messageId}
   ```
   - Corps de la requête:
     ```json
     {
       "contenu": "Nouveau contenu du message"
     }
     ```

4. **Suppression d'un message:**
   ```
   DELETE /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{messageId}
   ```

### Base de données (Messages de canal)

Le modèle de données pour les messages de canal comprend:

- **Collection `messages`**:
  - `_id`: Identifiant unique du message
  - `contenu`: Texte du message
  - `auteur`: Référence à l'utilisateur (ObjectID)
  - `canal`: Référence au canal (ObjectID)
  - `workspace`: Référence au workspace (ObjectID)
  - `createdAt`: Date de création
  - `updatedAt`: Date de dernière modification
  - `modifie`: Booléen indiquant si le message a été modifié
  - `reponseA`: Référence à un autre message si c'est une réponse (ObjectID)
  - `fichiers`: Tableau d'objets fichiers joints (nom, type, URL, taille)
  - `reactions`: Tableau d'objets réactions (emoji, utilisateurs)

## Messages privés

### Interface utilisateur (Messages privés)

**Parcours utilisateur:**

1. L'utilisateur clique sur un contact dans la liste d'amis (`FriendsList.vue`)
2. Un événement `open-private-conversation` est émis avec les détails du contact
3. `Home.vue` capture cet événement et affiche le composant `PrivateMessage.vue`
4. `PrivateMessage.vue` charge les messages de la conversation
5. L'utilisateur utilise l'interface pour envoyer des messages privés

**Composants impliqués:**
- `Home.vue`: Gère l'affichage des messages privés vs. messages de canal
- `FriendsList.vue`: Liste des amis et conversations existantes
- `PrivateMessage.vue`: Composant spécifique pour les conversations privées
- `InputBase.vue`: Interface partagée pour l'envoi de messages

### Flux de données (Messages privés)

1. **Ouverture d'une conversation:**
   - L'utilisateur clique sur un contact dans `FriendsList.vue`
   - La méthode `openConversation(contactId)` est appelée
   - Cette méthode émet un événement `open-private-conversation` avec les détails du contact
   - `Home.vue` écoute cet événement et met à jour son état pour afficher `PrivateMessage.vue`
   - `PrivateMessage.vue` reçoit l'ID de l'utilisateur cible et charge les messages

2. **Récupération des messages:**
   - `PrivateMessage.vue` appelle `findOrCreateConversation()` pour trouver/créer une conversation
   - Cette méthode cherche une conversation existante via `messagePrivateService.getAllPrivateConversations()`
   - Si une conversation est trouvée, son ID est stocké
   - `loadPrivateMessages()` est appelée pour charger les messages via `getConversationMessages()` ou `getPrivateMessages()`

3. **Envoi d'un message privé:**
   - L'utilisateur saisit et envoie un message via l'interface
   - `sendPrivateMessage(messageText)` est appelée dans `PrivateMessage.vue`
   - Cette méthode utilise `messagePrivateService.sendPrivateMessage()` pour envoyer le message
   - Une fois le message envoyé, `loadPrivateMessages()` est appelée pour actualiser la conversation

### Appels API (Messages privés)

1. **Récupération de toutes les conversations privées:**
   ```
   GET /api/v1/messages/private/
   ```
   - Réponse: Liste des conversations de l'utilisateur connecté avec les informations des participants

2. **Récupération des messages d'une conversation spécifique:**
   ```
   GET /api/v1/conversations/{id}
   ```
   - Paramètres:
     - `id`: ID de la conversation
   - Options de pagination: `?page=1&limit=50`
   - Réponse: Messages de la conversation avec les informations des expéditeurs

3. **Récupération des messages avec un utilisateur spécifique:**
   ```
   GET /api/v1/messages/private/{userId}
   ```
   - Paramètres:
     - `userId`: ID de l'utilisateur avec qui on échange des messages
   - Réponse: Messages échangés avec cet utilisateur

4. **Envoi d'un message privé:**
   ```
   POST /api/v1/messages/private/{userId}
   ```
   - Paramètres:
     - `userId`: ID du destinataire ou ID de la conversation
   - Corps de la requête:
     ```json
     {
       "contenu": "Texte du message privé",
       "reponseA": "ID_du_message_parent" // optionnel
     }
     ```
   - Réponse: Le message créé avec son ID

### Base de données (Messages privés)

Le système de messages privés utilise deux collections principales:

- **Collection `conversationPrivee`**:
  - `_id`: Identifiant unique de la conversation
  - `nom`: Nom de la conversation (optionnel)
  - `participants`: Tableau d'objets participants (utilisateur, dateAjout)
  - `createur`: Référence à l'utilisateur qui a créé la conversation
  - `createdAt`: Date de création
  - `updatedAt`: Date de dernière mise à jour
  - `dernierMessage`: Référence au dernier message envoyé

- **Collection `messagePrivate`**:
  - `_id`: Identifiant unique du message
  - `contenu`: Texte du message
  - `expediteur`: Référence à l'utilisateur qui a envoyé le message
  - `conversation`: Référence à la conversation privée
  - `horodatage`: Date et heure d'envoi
  - `modifie`: Booléen indiquant si le message a été modifié
  - `lu`: Tableau d'objets indiquant quels utilisateurs ont lu le message
  - `reponseA`: Référence à un autre message si c'est une réponse
  - `fichiers`: Tableau d'objets fichiers joints

## Fonctionnalités avancées

### Réponses aux messages

1. **Interface utilisateur:**
   - L'utilisateur clique sur le bouton "Répondre" d'un message
   - La méthode `handleReply(message)` est appelée dans `Message.vue`
   - Un indicateur de réponse apparaît au-dessus de la zone de saisie
   - Le message est envoyé avec une référence au message parent

2. **Structure des données:**
   - Le champ `reponseA` contient l'ID du message auquel on répond
   - Lors de l'affichage, `Message.vue` affiche une référence au message parent
   - Un clic sur cette référence fait défiler jusqu'au message parent

### Pièces jointes

1. **Envoi de fichiers:**
   - L'utilisateur clique sur l'icône de pièce jointe
   - La méthode `handleFileUpload()` ouvre un sélecteur de fichiers
   - Le fichier est envoyé via `fichierService.uploadFichierCanal()` ou `uploadFichierConversation()`
   - L'API stocke le fichier et crée une référence dans le message

2. **Affichage des fichiers:**
   - Les images sont affichées directement dans le fil de discussion
   - Les autres types de fichiers sont affichés avec une icône correspondant au type
   - Les fichiers peuvent être téléchargés en cliquant dessus

### Notifications en temps réel

Le système utilise Socket.IO pour les notifications en temps réel:

1. **Connexion WebSocket:**
   - Au chargement de l'application, une connexion WebSocket est établie
   - L'utilisateur rejoint des "rooms" correspondant à ses canaux et conversations

2. **Événements écoutés:**
   - `message-nouveau`: Nouveau message dans un canal
   - `message-modifie`: Message modifié dans un canal
   - `message-supprime`: Message supprimé d'un canal
   - `message-prive`: Nouveau message privé
   - `message-prive-modifie`: Message privé modifié
   - `message-prive-lu`: Message privé marqué comme lu

## Diagramme de séquence

### Envoi d'un message de canal

```
Utilisateur -> InputBase.vue: Saisit un message
InputBase.vue -> messageService.js: sendMessage(workspaceId, canalId, contenu)
messageService.js -> API: POST /workspaces/{workspaceId}/canaux/{canalId}/messages
API -> Base de données: Crée un nouveau document message
Base de données -> API: Retourne le message créé
API -> WebSocket: Émet 'message-nouveau'
WebSocket -> Autres utilisateurs: Notification de nouveau message
API -> messageService.js: Retourne le message créé
messageService.js -> InputBase.vue: Message envoyé avec succès
InputBase.vue -> Message.vue: Émet 'refresh-messages'
Message.vue -> messageService.js: getCanalMessages()
messageService.js -> API: GET /workspaces/{workspaceId}/canaux/{canalId}/messages
API -> messageService.js: Liste des messages mise à jour
messageService.js -> Message.vue: Affiche le nouveau message
```

### Envoi d'un message privé

```
Utilisateur -> PrivateMessage.vue: Saisit un message privé
PrivateMessage.vue -> messagePrivateService.js: sendPrivateMessage(userId, contenu)
messagePrivateService.js -> API: POST /messages/private/{userId}
API -> Base de données: Vérifie/crée une conversation
API -> Base de données: Crée un nouveau messagePrivate
Base de données -> API: Retourne le message créé
API -> WebSocket: Émet 'message-prive'
WebSocket -> Destinataire: Notification de nouveau message privé
API -> messagePrivateService.js: Retourne le message créé
messagePrivateService.js -> PrivateMessage.vue: Message envoyé avec succès
PrivateMessage.vue -> messagePrivateService.js: loadPrivateMessages()
messagePrivateService.js -> API: GET /conversations/{id}
API -> messagePrivateService.js: Liste des messages mise à jour
messagePrivateService.js -> PrivateMessage.vue: Affiche le nouveau message
```

## Résolution de problèmes courants

### Messages privés qui ne s'affichent pas

**Problème**: Les messages privés n'apparaissent pas malgré leur présence en base de données.

**Causes possibles**:
1. Structure incorrecte des données en base (champs manquants)
2. Erreur 500 lors de l'appel à l'API de messages privés
3. La conversation n'est pas correctement identifiée

**Solutions**:
1. Vérifier que les messages privés ont bien un champ `conversation` renseigné
2. Utiliser la stratégie en cascade implémentée dans `PrivateMessage.vue`:
   - Essayer d'abord via l'ID de conversation s'il existe
   - Essayer ensuite via l'API de messages privés
   - Enfin, rechercher dans toutes les conversations existantes

### Erreurs lors de l'envoi de messages

**Problème**: L'envoi de messages échoue avec des erreurs 500 ou 400.

**Causes possibles**:
1. Token d'authentification expiré
2. Permissions insuffisantes pour le canal ou la conversation
3. Structure incorrecte de la requête

**Solutions**:
1. Vérifier l'état d'authentification et reconnecter l'utilisateur si nécessaire
2. Vérifier les droits d'accès au canal ou à la conversation
3. S'assurer que la structure du message est correcte (contenu, références)

### Mises à jour en temps réel qui ne fonctionnent pas

**Problème**: Les nouveaux messages n'apparaissent pas en temps réel.

**Causes possibles**:
1. Connexion WebSocket interrompue
2. Utilisateur non abonné au bon canal Socket
3. Événements mal configurés côté client ou serveur

**Solutions**:
1. Implémenter une reconnexion automatique des sockets
2. Vérifier que l'utilisateur rejoint les bonnes "rooms" WebSocket
3. Ajouter des logs pour tracer les événements socket côté client et serveur
