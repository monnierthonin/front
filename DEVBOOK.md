# DEVBOOK - SUPCHAT Project Checklist

## Phase 1: Configuration initiale
- [x] Mise en place du repository GitHub
- [x] Configuration de l'environnement de développement Node.js
- [x] Configuration de la base de données MongoDB
- [x] Création des fichiers Docker et docker-compose.yml
- [x] Configuration de la documentation Swagger pour l'API
- [ ] CI/CD Pipeline
  - [ ] Tests automatisés
  - [ ] Déploiement automatique
  - [ ] Monitoring
- [ ] Backups automatiques
- [ ] Configuration des environnements (dev, staging, prod)

## Phase 2: Développement API RESTful (Node.js)
### Configuration API
- [x] Structure du projet Node.js
- [x] Configuration des middlewares
- [x] Configuration de la connexion MongoDB
- [x] Configuration des routes de base
- [x] Validation des entrées
- [x] Sanitization des données
- [x] Protection XSS
- [x] Rate limiting

### Authentification API
- [x] Endpoints d'inscription avec validation des données
- [x] Endpoints de connexion avec JWT et cookies sécurisés
- [x] Gestion du statut utilisateur (online/offline)
- [x] Configuration du service d'envoi d'emails
- [x] Implémentation de la vérification par email
- [x] Endpoints de réinitialisation de mot de passe
- [x] Authentification OAuth avec Google
  - [x] Connexion avec Google
  - [x] Liaison/Déliaison de compte
  - [x] Documentation Swagger
- [x] Authentification OAuth avec Microsoft
  - [x] Configuration Azure AD
  - [x] Implémentation de la stratégie Microsoft
  - [x] Routes de connexion/callback
  - [x] Documentation Swagger
- [x] Authentification OAuth avec Facebook
  - [x] Configuration de l'application Facebook
  - [x] Implémentation de la stratégie Facebook
  - [x] Routes de connexion/callback
  - [x] Documentation Swagger
- [x] Gestion du profil utilisateur
  - [x] Mise à jour des informations
  - [x] Upload de photo de profil
  - [x] Préférences utilisateur

### Gestion des Profils Utilisateurs

#### Routes Disponibles

- `GET /api/v1/users/profile` : Récupérer les informations du profil de l'utilisateur connecté
- `PUT /api/v1/users/profile` : Mettre à jour les informations du profil (username, email)
- `PUT /api/v1/users/profile/picture` : Mettre à jour la photo de profil
- `PUT /api/v1/users/profile/password` : Définir ou modifier le mot de passe
- `DELETE /api/v1/users/profile` : Supprimer le compte utilisateur

#### Fonctionnalités

1. **Récupération du Profil**
   - Retourne toutes les informations du profil sauf le mot de passe
   - Nécessite d'être authentifié

2. **Mise à Jour du Profil**
   - Permet de modifier le nom d'utilisateur et l'email
   - Validation des données avant mise à jour
   - Nécessite d'être authentifié

3. **Gestion de la Photo de Profil**
   - Upload d'images via multer
   - Validation du type et de la taille des fichiers
   - Suppression automatique de l'ancienne photo
   - Conservation des photos de profil OAuth

4. **Gestion du Mot de Passe**
   - Pour les comptes OAuth sans mot de passe :
     - Permet de définir un mot de passe initial sans vérification
   - Pour les comptes avec mot de passe :
     - Nécessite l'ancien mot de passe pour la modification
     - Hashage sécurisé avec bcrypt

5. **Suppression de Compte**
   - Suppression complète du compte utilisateur
   - Suppression des fichiers associés (photos de profil)
   - Nécessite d'être authentifié

#### Sécurité

- Toutes les routes sont protégées par authentification JWT
- Validation des entrées utilisateur
- Gestion sécurisée des mots de passe avec bcrypt
- Protection contre les injections et les attaques XSS

### Workspaces API
- [x] Endpoints CRUD des workspaces
- [x] Gestion des membres
  - [x] Rôles et permissions
  - [x] Invitation de membres
  - [x] Gestion des accès
- [x] Paramètres du workspace
- [x] Tests unitaires

### Canaux API
- [x] Endpoints CRUD des canaux
  - [x] Création de canaux (texte/vocal)
  - [x] Modification des paramètres
  - [x] Suppression de canaux
- [x] Gestion des permissions par canal
  - [x] Canaux publics/privés
  - [x] Rôles des membres
  - [x] Contrôle d'accès
- [x] Paramètres des canaux
  - [x] Nom et description
  - [x] Type (texte/vocal)
  - [x] Visibilité (public/privé)
- [x] Tests unitaires

### Messages API
- [ ] Chat en temps réel
  - [ ] Configuration WebSocket
  - [ ] Messages privés
  - [ ] Messages de groupe
  - [ ] Indicateurs de présence
- [ ] Gestion des messages
  - [ ] CRUD des messages
  - [ ] Formatage markdown
  - [ ] Mentions (@user)
  - [ ] Réactions aux messages
- [ ] Gestion des fichiers
  - [ ] Upload de fichiers
  - [ ] Partage de fichiers
  - [ ] Prévisualisation des médias
  - [ ] Stockage sécurisé
- [ ] Tests unitaires

### Notifications API
- [ ] Système de notifications
  - [ ] Notifications en temps réel
  - [ ] Notifications par email
  - [ ] Notifications push (mobile)
- [ ] Préférences de notification
  - [ ] Par workspace
  - [ ] Par canal
  - [ ] Par type de notification
- [ ] Tests unitaires

### Recherche API
- [ ] Recherche globale
  - [ ] Messages
  - [ ] Fichiers
  - [ ] Utilisateurs
- [ ] Recherche par workspace
- [ ] Recherche par canal
- [ ] Filtres avancés
- [ ] Tests unitaires

## Documentation API

### Authentification

#### OAuth2

##### Microsoft OAuth2

L'authentification Microsoft a été implémentée en utilisant la stratégie `passport-microsoft`. Les fonctionnalités incluent :

- Connexion avec un compte Microsoft (personnel ou professionnel)
- Création automatique de compte lors de la première connexion
- Liaison de compte Microsoft à un compte existant
- Possibilité de délier le compte Microsoft
- Gestion des tokens d'accès et de rafraîchissement

Configuration requise dans le fichier `.env` :
```
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
```

Routes disponibles :
- `GET /api/v1/auth/microsoft` : Initier l'authentification Microsoft
- `GET /api/v1/auth/microsoft/callback` : Callback après authentification réussie
- `DELETE /api/v1/auth/oauth/microsoft` : Délier le compte Microsoft

Les scopes utilisés :
- `openid`
- `offline_access`
- `profile`
- `email`
- `user.read`

##### Facebook OAuth2

L'authentification Facebook a été implémentée en utilisant la stratégie `passport-facebook`. Les fonctionnalités incluent :

- Connexion avec un compte Facebook
- Création automatique de compte lors de la première connexion
- Liaison de compte Facebook à un compte existant
- Possibilité de délier le compte Facebook
- Récupération de la photo de profil Facebook

Configuration requise dans le fichier `.env` :
```
FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret
```

Routes disponibles :
- `GET /api/v1/auth/facebook` : Initier l'authentification Facebook
- `GET /api/v1/auth/facebook/callback` : Callback après authentification réussie
- `DELETE /api/v1/auth/oauth/facebook` : Délier le compte Facebook

Les scopes utilisés :
- `email`
- `public_profile`

### Canaux

#### Routes Disponibles

- `POST /api/v1/workspaces/:workspaceId/canaux` : Créer un nouveau canal
- `GET /api/v1/workspaces/:workspaceId/canaux` : Lister les canaux du workspace
- `GET /api/v1/workspaces/:workspaceId/canaux/:id` : Obtenir les détails d'un canal
- `PUT /api/v1/workspaces/:workspaceId/canaux/:id` : Mettre à jour un canal
- `DELETE /api/v1/workspaces/:workspaceId/canaux/:id` : Supprimer un canal

#### Modèle de Canal

```javascript
{
  nom: String,          // Nom du canal
  description: String,  // Description optionnelle
  type: String,        // 'texte' ou 'vocal'
  visibilite: String,  // 'public' ou 'prive'
  workspace: ObjectId,  // Référence au workspace parent
  createur: ObjectId,  // Utilisateur qui a créé le canal
  membres: [{          // Liste des membres du canal
    utilisateur: ObjectId,
    role: String       // 'admin' ou 'membre'
  }],
  fichiers: [{         // Fichiers partagés dans le canal
    nom: String,
    type: String,
    url: String,
    taille: Number
  }]
}
```

### Messages

#### Routes Disponibles

- `POST /api/v1/workspaces/:workspaceId/canaux/:canalId/messages` : Envoyer un message
- `GET /api/v1/workspaces/:workspaceId/canaux/:canalId/messages` : Lister les messages d'un canal
- `PUT /api/v1/workspaces/:workspaceId/canaux/:canalId/messages/:id` : Modifier un message
- `DELETE /api/v1/workspaces/:workspaceId/canaux/:canalId/messages/:id` : Supprimer un message
- `POST /api/v1/workspaces/:workspaceId/canaux/:canalId/messages/:id/reactions` : Réagir à un message

#### Modèle de Message

```javascript
{
  contenu: String,     // Contenu du message
  auteur: ObjectId,    // Référence à l'utilisateur
  canal: ObjectId,     // Référence au canal
  mentions: [{         // Utilisateurs mentionnés
    type: ObjectId,
    ref: 'User'
  }],
  fichiers: [{         // Fichiers attachés
    nom: String,
    type: String,
    url: String,
    taille: Number
  }],
  reactions: [{        // Réactions au message
    emoji: String,
    utilisateurs: [{
      type: ObjectId,
      ref: 'User'
    }]
  }],
  modifie: Boolean,    // Indique si le message a été modifié
  createdAt: Date,     // Date de création
  updatedAt: Date      // Date de dernière modification
}
```

## Phase 3: Développement Frontend Web (Vue.js)
- [ ] Configuration du projet Vue.js
- [ ] Authentification et Autorisation
  - [ ] Formulaires de connexion/inscription
  - [ ] Intégration OAuth
  - [ ] Gestion des sessions
- [ ] Interface utilisateur
  - [ ] Design responsive
  - [ ] Thème clair/sombre
  - [ ] Internationalisation (i18n)
  - [ ] Accessibilité (a11y)
- [ ] Composants principaux
  - [ ] Navigation
  - [ ] Liste des workspaces
  - [ ] Liste des canaux
  - [ ] Chat
  - [ ] Gestion des fichiers
- [ ] Tests d'interface

## Phase 4: Développement Mobile (Kotlin)
- [ ] Configuration du projet Kotlin
- [ ] Authentification mobile
- [ ] Fonctionnalités principales
  - [ ] Chat
  - [ ] Notifications push
  - [ ] Gestion hors ligne
- [ ] Tests mobiles

## Phase 5: Tests et Documentation
- [ ] Tests unitaires
  - [ ] API
  - [ ] Frontend
  - [ ] Mobile
- [ ] Tests d'intégration
- [ ] Tests end-to-end
- [ ] Tests de charge
- [x] Documentation API (Swagger)
- [ ] Guide de déploiement
- [ ] Guide de contribution
- [ ] Documentation utilisateur

## Phase 6: Optimisation et Finalisation
- [ ] Optimisation des performances
  - [ ] Cache
  - [ ] Requêtes
  - [ ] WebSocket
- [ ] Sécurité
  - [ ] Audit de sécurité
  - [ ] Correction des vulnérabilités
- [ ] Monitoring
  - [ ] Logs
  - [ ] Métriques
  - [ ] Alertes
- [ ] Déploiement final
