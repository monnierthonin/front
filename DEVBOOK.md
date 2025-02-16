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
- [ ] Gestion du profil utilisateur
  - [ ] Mise à jour des informations
  - [ ] Upload de photo de profil
  - [ ] Préférences utilisateur

### Workspaces API
- [ ] Endpoints CRUD des workspaces
- [ ] Gestion des membres
  - [ ] Rôles et permissions
  - [ ] Invitation de membres
  - [ ] Gestion des accès
- [ ] Paramètres du workspace
- [ ] Tests unitaires

### Canaux API
- [ ] Endpoints CRUD des canaux
- [ ] Gestion des permissions par canal
- [ ] Catégorisation des canaux
- [ ] Paramètres des canaux
- [ ] Tests unitaires

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
