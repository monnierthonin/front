# SUPCHAT API - Documentation Technique

## Table des matières

1. [Introduction](#introduction)
2. [Prérequis et configuration](#prérequis-et-configuration)
3. [Architecture et choix technologiques](#architecture-et-choix-technologiques)
4. [Guide de déploiement](#guide-de-déploiement)
5. [Modèles de données](#modèles-de-données)
6. [API Endpoints](#api-endpoints)
7. [Fonctionnalités temps réel](#fonctionnalités-temps-réel)
8. [Sécurité](#sécurité)
9. [Bonnes pratiques et recommandations](#bonnes-pratiques-et-recommandations)

## Introduction

SUPCHAT est une application de messagerie instantanée permettant aux utilisateurs de communiquer en temps réel via des conversations privées (1:1 ou groupes) et des canaux thématiques. L'API SUPCHAT fournit toutes les fonctionnalités nécessaires pour gérer les utilisateurs, les conversations, les messages et les notifications.

Cette documentation technique est destinée aux développeurs et administrateurs système qui souhaitent comprendre, maintenir ou étendre l'API SUPCHAT.

## Prérequis et configuration

### Environnement requis

- Node.js (v20.x recommandé)
- MongoDB (v6.0+)
- npm ou yarn

### Variables d'environnement

L'application utilise un fichier `.env` pour la configuration. Voici les variables d'environnement requises :

```
# Environnement
NODE_ENV=development

# Serveur
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Base de données
MONGODB_URI=mongodb://localhost:27017/supchat

# JWT
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=24h

# OAuth
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
MICROSOFT_CLIENT_ID=votre_client_id_microsoft
MICROSOFT_CLIENT_SECRET=votre_client_secret_microsoft
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook

# Email
SMTP_USER=votre_email
SMTP_PASS=votre_mot_de_passe
```

### Installation des dépendances

```bash
cd api
npm install
```

## Architecture et choix technologiques

### Stack technique

- **Node.js** : Environnement d'exécution JavaScript côté serveur
- **Express.js** : Framework web pour Node.js
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM (Object Document Mapper) pour MongoDB
- **Socket.IO** : Bibliothèque pour la communication en temps réel
- **JWT** : JSON Web Tokens pour l'authentification
- **Passport.js** : Middleware d'authentification
- **Swagger** : Documentation de l'API
- **Multer** : Gestion des uploads de fichiers
- **Bcrypt** : Hachage des mots de passe

### Structure du projet

```
api/
├── src/
│   ├── config/         # Configuration (base de données, passport, etc.)
│   ├── controllers/    # Contrôleurs pour les routes
│   ├── docs/           # Documentation Swagger
│   ├── middleware/     # Middleware (auth, validation, etc.)
│   ├── models/         # Modèles Mongoose
│   ├── public/         # Fichiers statiques
│   ├── routes/         # Définition des routes
│   ├── scripts/        # Scripts utilitaires
│   ├── services/       # Services (socket.io, notifications, etc.)
│   ├── utils/          # Fonctions utilitaires
│   ├── app.js          # Configuration de l'application Express
│   └── server.js       # Point d'entrée de l'application
├── tests/              # Tests
├── uploads/            # Dossier pour les fichiers uploadés
├── Dockerfile          # Configuration Docker
└── package.json        # Dépendances et scripts
```

### Justification des choix technologiques

- **Node.js et Express** : Excellentes performances pour les applications en temps réel grâce à l'architecture non-bloquante.
- **MongoDB** : Flexibilité du schéma, scalabilité horizontale et performances élevées pour les opérations de lecture/écriture fréquentes.
- **Socket.IO** : Support complet des WebSockets avec fallback automatique, idéal pour la messagerie instantanée.
- **JWT** : Authentification stateless facilitant la mise à l'échelle horizontale.
- **Swagger** : Documentation interactive de l'API, facilitant l'intégration pour les développeurs frontend.
- **Docker** : Facilite le déploiement et garantit la cohérence entre les environnements.

## Guide de déploiement

### Déploiement avec Docker

Le projet inclut un `Dockerfile` et un fichier `docker-compose.yml` pour faciliter le déploiement.

1. **Construction et démarrage des conteneurs** :

```bash
docker-compose build
docker-compose up -d
```

2. **Vérification des logs** :

```bash
docker-compose logs -f api
```

3. **Arrêt des conteneurs** :

```bash
docker-compose down
```

### Déploiement manuel

1. **Installation des dépendances** :

```bash
npm install --production
```

2. **Configuration des variables d'environnement** :

Créez un fichier `.env` à la racine du projet avec les variables nécessaires.

3. **Démarrage du serveur** :

```bash
npm start
```

Pour un environnement de production, il est recommandé d'utiliser un gestionnaire de processus comme PM2 :

```bash
npm install -g pm2
pm2 start src/server.js --name supchat-api
```

## Modèles de données

### Diagramme UML des modèles

```
+----------------+       +--------------------+       +----------------+
|      User      |       | ConversationPrivee |       | MessagePrivate |
+----------------+       +--------------------+       +----------------+
| _id            |       | _id                |       | _id            |
| email          |       | participants       |<----->| conversation   |
| username       |       | createur           |       | contenu        |
| password       |       | dateCreation       |       | expediteur     |
| firstName      |       | dernierMessage     |       | lu             |
| lastName       |       | estGroupe          |       | reponseA       |
| profilePicture |       +--------------------+       | horodatage     |
| role           |                                    | modifie        |
| isVerified     |                                    | dateModification|
| lastLogin      |                                    | mentions       |
| estConnecte    |                                    | fichiers       |
| status         |                                    | reactions      |
| dernierActivite|                                    +----------------+
| theme          |
| preferences    |
+----------------+

+----------------+       +--------------------+       +----------------+
|    Workspace   |       |       Canal        |       |     Message    |
+----------------+       +--------------------+       +----------------+
| _id            |       | _id                |       | _id            |
| nom            |<----->| workspace          |<----->| canal          |
| description    |       | nom                |       | contenu        |
| proprietaire   |       | description        |       | auteur         |
| visibilite     |       | createur           |       | horodatage     |
| membres        |       | dateCreation       |       | modifie        |
| canaux         |       | type               |       | dateModification|
| invitations    |       | visibilite         |       | mentions       |
+----------------+       | membres            |       | fichiers       |
                         | parametresVocal    |       | reactions      |
                         | fichiers           |       +----------------+
                         | parametres         |
                         | messagesNonLus     |
                         +--------------------+

+----------------+
|  Notification  |
+----------------+
| _id            |
| type           |
| destinataire   |
| expediteur     |
| reference      |
| contenu        |
| lu             |
| dateLecture    |
| dateCreation   |
+----------------+
```

### Schéma de la base de données

#### User

```javascript
{
  email: String,
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  profilePicture: String,
  role: String, // 'user', 'admin', 'super_admin'
  isVerified: Boolean,
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  oauthProfiles: [{
    provider: String, // 'google', 'microsoft', 'facebook'
    id: String,
    email: String,
    name: String,
    picture: String,
    accessToken: String,
    refreshToken: String,
    lastUsed: Date
  }],
  lastLogin: Date,
  estConnecte: Boolean,
  status: String, // 'en ligne', 'absent', 'ne pas déranger'
  dernierActivite: Date,
  theme: String, // 'clair', 'sombre'
  preferences: {
    notifications: {
      mentionsOnly: Boolean,
      soundEnabled: Boolean,
      desktopEnabled: Boolean
    }
  }
}
```

#### ConversationPrivee

```javascript
{
  participants: [{
    utilisateur: ObjectId, // référence à User
    dateAjout: Date
  }],
  createur: ObjectId, // référence à User
  dateCreation: Date,
  dernierMessage: ObjectId, // référence à MessagePrivate
  estGroupe: Boolean
}
```

#### MessagePrivate

```javascript
{
  contenu: String,
  expediteur: ObjectId, // référence à User
  conversation: ObjectId, // référence à ConversationPrivee
  lu: [{
    utilisateur: ObjectId, // référence à User
    dateLecture: Date
  }],
  envoye: Boolean,
  reponseA: ObjectId, // référence à MessagePrivate
  horodatage: Date,
  modifie: Boolean,
  dateModification: Date,
  mentions: [ObjectId], // références à User
  fichiers: [{
    nom: String,
    type: String,
    url: String,
    urlPreview: String,
    taille: Number
  }],
  reactions: [{
    utilisateur: ObjectId, // référence à User
    emoji: String,
    date: Date
  }]
}
```

#### Workspace

```javascript
{
  nom: String,
  description: String,
  proprietaire: ObjectId, // référence à User
  visibilite: String, // 'public', 'prive'
  membres: [{
    utilisateur: ObjectId, // référence à User
    role: String, // 'admin', 'membre'
    dateAjout: Date
  }],
  canaux: [ObjectId], // références à Canal
  invitationsEnAttente: [{
    utilisateur: ObjectId, // référence à User
    token: String,
    dateExpiration: Date,
    email: String
  }]
}
```

#### Canal

```javascript
{
  nom: String,
  description: String,
  workspace: ObjectId, // référence à Workspace
  createur: ObjectId, // référence à User
  dateCreation: Date,
  type: String, // 'texte', 'vocal'
  visibilite: String, // 'public', 'prive'
  membres: [{
    utilisateur: ObjectId, // référence à User
    role: String, // 'admin', 'moderateur', 'membre'
    dateAjout: Date
  }],
  parametresVocal: {
    participantsActifs: [{
      utilisateur: ObjectId, // référence à User
      camera: Boolean,
      micro: Boolean,
      partageEcran: Boolean,
      dateJoint: Date
    }],
    limiteParticipants: Number
  },
  fichiers: [{
    nom: String,
    type: String,
    url: String,
    taille: Number,
    uploadePar: ObjectId // référence à User
  }],
  parametres: {
    extensionsAutorisees: [String],
    tailleMaxFichier: Number
  },
  messagesNonLus: [{
    utilisateur: ObjectId, // référence à User
    count: Number,
    dernierMessageLu: ObjectId, // référence à Message
    derniereLecture: Date
  }]
}
```

#### Message

```javascript
{
  contenu: String,
  auteur: ObjectId, // référence à User
  canal: ObjectId, // référence à Canal
  horodatage: Date,
  modifie: Boolean,
  dateModification: Date,
  mentions: [ObjectId], // références à User
  fichiers: [{
    nom: String,
    type: String,
    url: String,
    taille: Number
  }],
  reactions: [{
    utilisateur: ObjectId, // référence à User
    emoji: String,
    date: Date
  }]
}
```

#### Notification

```javascript
{
  utilisateur: ObjectId, // référence à User (destinataire)
  type: String, // 'canal', 'conversation', 'mention'
  reference: ObjectId, // référence à Canal ou Conversation
  onModel: String, // 'Canal', 'Conversation'
  message: ObjectId, // référence à Message
  lu: Boolean,
  createdAt: Date
}
```

## API Endpoints

### Authentification

- `POST /api/v1/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `POST /api/v1/auth/refresh-token` - Rafraîchissement du token
- `POST /api/v1/auth/forgot-password` - Demande de réinitialisation de mot de passe
- `POST /api/v1/auth/reset-password/:token` - Réinitialisation du mot de passe
- `GET /api/v1/auth/google` - Authentification avec Google
- `GET /api/v1/auth/microsoft` - Authentification avec Microsoft
- `GET /api/v1/auth/facebook` - Authentification avec Facebook

### Utilisateurs

- `GET /api/v1/users` - Liste des utilisateurs
- `GET /api/v1/users/:id` - Détails d'un utilisateur
- `PATCH /api/v1/users/:id` - Mise à jour d'un utilisateur
- `DELETE /api/v1/users/:id` - Suppression d'un utilisateur
- `PATCH /api/v1/users/:id/status` - Mise à jour du statut
- `PATCH /api/v1/users/:id/theme` - Mise à jour du thème

### Workspaces

- `GET /api/v1/workspaces` - Liste des workspaces de l'utilisateur
- `GET /api/v1/workspaces/recherche/public` - Recherche de workspaces publics
- `POST /api/v1/workspaces` - Création d'un workspace
- `GET /api/v1/workspaces/:id` - Détails d'un workspace
- `PATCH /api/v1/workspaces/:id` - Mise à jour d'un workspace
- `DELETE /api/v1/workspaces/:id` - Suppression d'un workspace
- `POST /api/v1/workspaces/:id/membres` - Ajout d'un membre au workspace
- `DELETE /api/v1/workspaces/:id/membres/:membreId` - Suppression d'un membre du workspace
- `PATCH /api/v1/workspaces/:id/membres/:membreId/role` - Modification du rôle d'un membre
- `DELETE /api/v1/workspaces/:id/quitter` - Quitter un workspace
- `POST /api/v1/workspaces/:id/inviter` - Envoi d'une invitation par email
- `DELETE /api/v1/workspaces/:id/invitations/:token` - Révocation d'une invitation
- `GET /api/v1/workspaces/invitation/:workspaceId/:token/verifier` - Vérification d'une invitation
- `GET /api/v1/workspaces/invitation/:workspaceId/:token/accepter` - Acceptation d'une invitation

### Conversations privées

- `GET /api/v1/conversations` - Liste des conversations
- `POST /api/v1/conversations` - Création d'une conversation
- `GET /api/v1/conversations/:id` - Détails d'une conversation
- `PATCH /api/v1/conversations/:id` - Mise à jour d'une conversation
- `POST /api/v1/conversations/:id/participants` - Ajout d'un participant
- `DELETE /api/v1/conversations/:id/participants/:userId` - Suppression d'un participant
- `DELETE /api/v1/conversations/:id/leave` - Quitter une conversation
- `GET /api/v1/conversations/:id/messages` - Messages d'une conversation
- `POST /api/v1/conversations/:id/messages` - Envoi d'un message
- `PUT /api/v1/conversations/:id/messages/:messageId` - Mise à jour d'un message
- `DELETE /api/v1/conversations/:id/messages/:messageId` - Suppression d'un message
- `POST /api/v1/conversations/:id/messages/:messageId/reply` - Réponse à un message
- `POST /api/v1/conversations/:id/messages/:messageId/reactions` - Ajout d'une réaction
- `DELETE /api/v1/conversations/:id/messages/:messageId/reactions` - Suppression d'une réaction

### Canaux

- `GET /api/v1/workspaces/:workspaceId/canaux` - Liste des canaux d'un workspace
- `POST /api/v1/workspaces/:workspaceId/canaux` - Création d'un canal
- `GET /api/v1/canaux/:id` - Détails d'un canal
- `PATCH /api/v1/canaux/:id` - Mise à jour d'un canal
- `DELETE /api/v1/canaux/:id` - Suppression d'un canal
- `POST /api/v1/canaux/:id/membres` - Ajout d'un membre au canal
- `PATCH /api/v1/canaux/:id/membres/:membreId/role` - Modification du rôle d'un membre
- `DELETE /api/v1/canaux/:id/membres/:membreId` - Suppression d'un membre du canal

### Messages de canal

- `GET /api/v1/canaux/:canalId/messages` - Liste des messages d'un canal
- `POST /api/v1/canaux/:canalId/messages` - Envoi d'un message dans un canal
- `PATCH /api/v1/canaux/:canalId/messages/:id` - Modification d'un message
- `DELETE /api/v1/canaux/:canalId/messages/:id` - Suppression d'un message
- `POST /api/v1/canaux/:canalId/messages/:id/reactions` - Ajout d'une réaction à un message
- `POST /api/v1/canaux/:canalId/messages/:id/reponses` - Réponse à un message

### Messages privés (API legacy)

- `POST /api/v1/messages/private/:userId` - Envoi d'un message privé direct
- `GET /api/v1/messages/private/:userId` - Messages avec un utilisateur

### Recherche

- `GET /api/v1/search/users` - Recherche d'utilisateurs
- `GET /api/v1/search/messages` - Recherche de messages
- `GET /api/v1/search/global` - Recherche globale

### Fichiers

- `POST /api/v1/fichiers/canal/:canalId` - Upload d'un fichier dans un canal
- `POST /api/v1/fichiers/conversation/:conversationId` - Upload d'un fichier dans une conversation
- `POST /api/v1/fichiers/profile` - Upload d'une photo de profil
- `DELETE /api/v1/fichiers/:messageType/:messageId/:fichierUrl` - Suppression d'un fichier
- `GET /api/v1/fichiers/canal/:canalId` - Liste des fichiers d'un canal
- `GET /api/v1/fichiers/conversation/:conversationId` - Liste des fichiers d'une conversation

### Notifications

- `GET /api/v1/notifications` - Liste des notifications non lues
- `GET /api/v1/notifications/nombre` - Nombre total de notifications non lues
- `GET /api/v1/notifications/canal/:canalId/nombre` - Nombre de notifications non lues pour un canal
- `GET /api/v1/notifications/conversation/:conversationId/nombre` - Nombre de notifications non lues pour une conversation
- `GET /api/v1/notifications/canaux/:workspaceId` - Canaux avec messages non lus dans un workspace
- `GET /api/v1/notifications/preferences` - Préférences de notification de l'utilisateur
- `PATCH /api/v1/notifications/preferences` - Mise à jour des préférences de notification
- `PATCH /api/v1/notifications/:id/lue` - Marquer une notification comme lue
- `PATCH /api/v1/notifications/canal/:canalId/lues` - Marquer toutes les notifications d'un canal comme lues
- `PATCH /api/v1/notifications/conversation/:conversationId/lues` - Marquer toutes les notifications d'une conversation comme lues

## Fonctionnalités temps réel

### Socket.IO

L'API utilise Socket.IO pour la communication en temps réel. Voici les principaux événements :

#### Événements émis par le serveur

- `message-prive` - Nouveau message privé reçu
- `message-update` - Message mis à jour
- `message-delete` - Message supprimé
- `message-reaction-added` - Réaction ajoutée à un message
- `message-reaction-removed` - Réaction supprimée d'un message
- `message-read` - Message lu par un utilisateur
- `conversation-update` - Conversation mise à jour
- `user-status-change` - Changement de statut d'un utilisateur
- `notification:nouvelle` - Nouvelle notification
- `notification:liste` - Liste des notifications

#### Événements écoutés par le serveur

- `envoyer-message-prive` - Envoi d'un message privé
- `marquer-message-lu` - Marquer un message comme lu
- `typing-start` - Début de saisie
- `typing-stop` - Fin de saisie
- `notification:charger` - Charger les notifications

### Authentification Socket.IO

Pour se connecter à Socket.IO, le client doit fournir un token JWT valide :

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'votre_jwt_token'
  },
  transports: ['websocket']
});
```

## Sécurité

### Authentification

- Utilisation de JWT (JSON Web Tokens) pour l'authentification
- Support de l'authentification OAuth (Google, Microsoft, Facebook)
- Stockage sécurisé des mots de passe avec bcrypt

### Protection des données

- Validation des entrées avec express-validator
- Protection contre les injections NoSQL avec mongo-sanitize
- Protection contre les attaques XSS avec xss et helmet
- Configuration CORS restrictive

### Bonnes pratiques

- Utilisation de HTTPS en production
- Rotation des tokens JWT
- Limitation du nombre de requêtes (rate limiting)
- Utilisateur non-root dans le conteneur Docker

## Bonnes pratiques et recommandations

### Intégration frontend

- Utiliser la route `/api/v1/conversations/:id/messages` pour envoyer des messages dans toutes les conversations privées
- Intégrer Socket.IO avec authentification pour recevoir les messages en temps réel
- Gérer la reconnexion automatique et les erreurs de connexion WebSocket
- Nettoyer la connexion Socket.IO côté client pour éviter les fuites de ressources

### Optimisations

- Utiliser la pagination pour les requêtes retournant de nombreux résultats
- Mettre en cache les données fréquemment accédées
- Utiliser des requêtes conditionnelles (If-Modified-Since, ETag)

### Maintenance

- Supprimer ou migrer les anciens messages privés qui n'ont pas de champ `conversation` pour assurer la cohérence des données
- Surveiller les performances de la base de données et indexer les champs fréquemment utilisés dans les requêtes
- Mettre à jour régulièrement les dépendances pour corriger les vulnérabilités

---

Cette documentation est destinée aux professionnels de l'IT et ne contient pas d'informations sensibles comme des clés d'API, des mots de passe ou des informations personnelles.
