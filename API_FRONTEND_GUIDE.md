# Guide d'intégration API - Frontend SupChat

Ce document décrit les différentes routes API disponibles dans SupChat et comment elles sont (ou peuvent être) liées aux éléments du frontend.

## Table des matières

1. [Routes d'authentification](#routes-dauthentification)
2. [Routes utilisateur](#routes-utilisateur)
3. [Routes de workspace](#routes-de-workspace)
4. [Routes de canaux](#routes-de-canaux)
5. [Routes de messages](#routes-de-messages)

---

## Routes d'authentification

Base URL: `/api/v1/auth`

### Inscription

**Route**: `POST /api/v1/auth/inscription`

**Requête**:
```json
{
  "username": "utilisateur",
  "email": "utilisateur@example.com",
  "password": "MotDePasse123!",
  "confirmPassword": "MotDePasse123!",
  "firstName": "Prénom", // Optionnel
  "lastName": "Nom" // Optionnel
}
```

**Réponse réussie (201)**:
```json
{
  "success": true,
  "token": "jwt_token",
  "data": {
    "user": {
      "id": "user_id",
      "username": "utilisateur",
      "email": "utilisateur@example.com",
      "firstName": "Prénom",
      "lastName": "Nom",
      "isVerified": false,
      "profilePicture": "default.jpg"
    }
  }
}
```

**Élément Frontend**: Formulaire d'inscription dans la page `Auth.vue` lors du mode d'inscription.

### Connexion

**Route**: `POST /api/v1/auth/connexion`

**Requête**:
```json
{
  "email": "utilisateur@example.com",
  "password": "MotDePasse123!",
  "rememberMe": false // Optionnel
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "token": "jwt_token",
  "data": {
    "user": {
      "id": "user_id",
      "username": "utilisateur",
      "email": "utilisateur@example.com"
    }
  }
}
```

**Élément Frontend**: Formulaire de connexion dans la page `Auth.vue` lors du mode de connexion.

### Déconnexion

**Route**: `POST /api/v1/auth/deconnexion` ou `GET /api/v1/auth/deconnexion`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Élément Frontend**: Bouton de déconnexion dans la page de profil `Profile.vue`.

### Vérification d'email

**Route**: `GET /api/v1/auth/verifier-email/:token`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Email vérifié avec succès"
}
```

**Élément Frontend**: Lien envoyé par email, qui redirige vers une page de confirmation.

### Mot de passe oublié

**Route**: `POST /api/v1/auth/mot-de-passe-oublie`

**Requête**:
```json
{
  "email": "utilisateur@example.com"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Un email de réinitialisation a été envoyé"
}
```

**Élément Frontend**: Formulaire "Mot de passe oublié" accessible depuis la page de connexion.

### Réinitialisation du mot de passe

**Route**: `POST /api/v1/auth/reinitialiser-mot-de-passe/:token`

**Requête**:
```json
{
  "password": "NouveauMotDePasse123!",
  "confirmPassword": "NouveauMotDePasse123!"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

**Élément Frontend**: Formulaire de réinitialisation de mot de passe accessible via un lien envoyé par email.

### Vérifier l'authentification actuelle

**Route**: `GET /api/v1/auth/me`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "utilisateur",
      "email": "utilisateur@example.com"
    }
  }
}
```

**Élément Frontend**: Appelé au chargement de l'application pour vérifier si l'utilisateur est déjà connecté.

---

## Routes utilisateur

Base URL: `/api/v1/users`

### Obtenir son profil

**Route**: `GET /api/v1/users/profile`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "utilisateur",
    "email": "utilisateur@example.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "profilePicture": "chemin/vers/image.jpg",
    "isVerified": true
  }
}
```

**Élément Frontend**: Page de profil `Profile.vue` pour afficher les informations de l'utilisateur connecté.

### Obtenir le profil d'un utilisateur spécifique

**Route**: `GET /api/v1/users/profile/:identifier` (identifier peut être un ID ou un nom d'utilisateur)

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "utilisateur",
      "profilePicture": "chemin/vers/image.jpg"
    },
    "stats": {
      "messageCount": 125,
      "workspaceCount": 3
    },
    "workspaces": [
      {
        "id": "workspace_id",
        "nom": "Workspace 1",
        "description": "Description"
      }
    ]
  }
}
```

**Élément Frontend**: Affichage des informations d'un autre utilisateur lors du clic sur son nom dans un message ou dans la liste des membres d'un workspace.

### Mettre à jour le profil

**Route**: `PUT /api/v1/users/profile`

**Requête**:
```json
{
  "username": "nouveau_username",
  "email": "nouvel_email@example.com",
  "firstName": "Nouveau Prénom",
  "lastName": "Nouveau Nom"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "data": {
    "user": {
      "id": "user_id",
      "username": "nouveau_username",
      "email": "nouvel_email@example.com"
    }
  }
}
```

**Élément Frontend**: Formulaire de modification de profil dans `Profile.vue`.

### Changer le mot de passe

**Route**: `PUT /api/v1/users/profile/password`

**Requête**:
```json
{
  "currentPassword": "MotDePasseActuel",
  "newPassword": "NouveauMotDePasse123!",
  "confirmNewPassword": "NouveauMotDePasse123!"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Mot de passe mis à jour avec succès"
}
```

**Élément Frontend**: Formulaire de changement de mot de passe dans la page de profil.

### Changer la photo de profil

**Route**: `PUT /api/v1/users/profile/picture`

**Requête**: Formulaire multipart avec le champ `profilePicture` contenant l'image.

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Photo de profil mise à jour avec succès",
  "data": {
    "profilePicture": "nouveau_chemin/image.jpg"
  }
}
```

**Élément Frontend**: Formulaire d'upload de photo de profil dans la page de profil.

### Supprimer le compte

**Route**: `DELETE /api/v1/users/profile`

**Requête**:
```json
{
  "password": "MotDePasse123!"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Compte supprimé avec succès"
}
```

**Élément Frontend**: Bouton "Supprimer mon compte" dans la page de profil avec confirmation du mot de passe.

---

## Routes de workspace

Base URL: `/api/v1/workspaces`

### Obtenir tous les workspaces

**Route**: `GET /api/v1/workspaces`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "workspace_id",
      "nom": "Workspace 1",
      "description": "Description",
      "owner": "user_id",
      "membres": [
        {
          "utilisateur": "user_id",
          "role": "admin"
        }
      ],
      "canaux": [
        {
          "id": "canal_id",
          "nom": "canal-general"
        }
      ]
    }
  ]
}
```

**Élément Frontend**: Liste des workspaces affichée dans la barre latérale de `Header.vue`.

### Créer un nouveau workspace

**Route**: `POST /api/v1/workspaces`

**Requête**:
```json
{
  "nom": "Nouveau Workspace",
  "description": "Description du workspace"
}
```

**Réponse réussie (201)**:
```json
{
  "success": true,
  "data": {
    "id": "workspace_id",
    "nom": "Nouveau Workspace",
    "description": "Description du workspace",
    "owner": "user_id",
    "membres": [
      {
        "utilisateur": "user_id",
        "role": "admin"
      }
    ],
    "canaux": [
      {
        "id": "canal_id",
        "nom": "canal-general"
      }
    ]
  }
}
```

**Élément Frontend**: Formulaire de création de workspace accessible depuis la barre latérale.

### Obtenir un workspace spécifique

**Route**: `GET /api/v1/workspaces/:id`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "id": "workspace_id",
    "nom": "Workspace 1",
    "description": "Description",
    "owner": "user_id",
    "membres": [
      {
        "utilisateur": "user_id",
        "role": "admin"
      }
    ],
    "canaux": [
      {
        "id": "canal_id",
        "nom": "canal-general"
      }
    ]
  }
}
```

**Élément Frontend**: Affichage d'un workspace spécifique lorsqu'il est sélectionné dans la barre latérale.

### Mettre à jour un workspace

**Route**: `PATCH /api/v1/workspaces/:id`

**Requête**:
```json
{
  "nom": "Nom mis à jour",
  "description": "Description mise à jour"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "id": "workspace_id",
    "nom": "Nom mis à jour",
    "description": "Description mise à jour"
  }
}
```

**Élément Frontend**: Formulaire de modification des paramètres du workspace dans `ParamWorkspace.vue`.

### Supprimer un workspace

**Route**: `DELETE /api/v1/workspaces/:id`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Workspace supprimé avec succès"
}
```

**Élément Frontend**: Bouton de suppression du workspace dans les paramètres du workspace.

### Ajouter un membre

**Route**: `POST /api/v1/workspaces/:id/membres`

**Requête**:
```json
{
  "userId": "user_id",
  "role": "member" // Optionnel, par défaut "member"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Membre ajouté avec succès",
  "data": {
    "utilisateur": "user_id",
    "role": "member"
  }
}
```

**Élément Frontend**: Formulaire d'ajout de membre dans les paramètres du workspace.

### Supprimer un membre

**Route**: `DELETE /api/v1/workspaces/:id/membres/:membreId`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Membre supprimé avec succès"
}
```

**Élément Frontend**: Bouton de suppression à côté de chaque membre dans la liste des membres du workspace.

### Modifier le rôle d'un membre

**Route**: `PATCH /api/v1/workspaces/:id/membres/:membreId/role`

**Requête**:
```json
{
  "role": "admin"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Rôle modifié avec succès",
  "data": {
    "utilisateur": "user_id",
    "role": "admin"
  }
}
```

**Élément Frontend**: Menu déroulant pour changer le rôle d'un membre dans la liste des membres du workspace.

### Envoyer une invitation

**Route**: `POST /api/v1/workspaces/:id/inviter`

**Requête**:
```json
{
  "email": "utilisateur@example.com"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Invitation envoyée avec succès",
  "data": {
    "token": "invitation_token",
    "workspace": "workspace_id",
    "email": "utilisateur@example.com",
    "expiresAt": "2023-08-01T12:00:00Z"
  }
}
```

**Élément Frontend**: Formulaire d'invitation dans les paramètres du workspace.

---

## Routes de canaux

Base URL: `/api/v1/workspaces/:workspaceId/canaux`

### Obtenir tous les canaux d'un workspace

**Route**: `GET /api/v1/workspaces/:workspaceId/canaux`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "canal_id",
      "nom": "canal-general",
      "description": "Canal général",
      "type": "text",
      "workspace": "workspace_id",
      "createdAt": "2023-07-15T10:00:00Z"
    }
  ]
}
```

**Élément Frontend**: Liste des canaux dans la barre latérale lorsqu'un workspace est sélectionné.

### Créer un nouveau canal

**Route**: `POST /api/v1/workspaces/:workspaceId/canaux`

**Requête**:
```json
{
  "nom": "nouveau-canal",
  "description": "Description du canal",
  "type": "text" // ou "voice"
}
```

**Réponse réussie (201)**:
```json
{
  "success": true,
  "data": {
    "id": "canal_id",
    "nom": "nouveau-canal",
    "description": "Description du canal",
    "type": "text",
    "workspace": "workspace_id",
    "createdAt": "2023-07-16T10:00:00Z"
  }
}
```

**Élément Frontend**: Formulaire de création de canal accessible depuis la liste des canaux.

### Obtenir un canal spécifique

**Route**: `GET /api/v1/workspaces/:workspaceId/canaux/:canalId`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "id": "canal_id",
    "nom": "canal-general",
    "description": "Canal général",
    "type": "text",
    "workspace": "workspace_id",
    "createdAt": "2023-07-15T10:00:00Z"
  }
}
```

**Élément Frontend**: Affichage des détails d'un canal lorsqu'il est sélectionné.

### Mettre à jour un canal

**Route**: `PATCH /api/v1/workspaces/:workspaceId/canaux/:canalId`

**Requête**:
```json
{
  "nom": "nom-mis-a-jour",
  "description": "Description mise à jour"
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "id": "canal_id",
    "nom": "nom-mis-a-jour",
    "description": "Description mise à jour",
    "type": "text",
    "workspace": "workspace_id"
  }
}
```

**Élément Frontend**: Formulaire de modification des paramètres du canal.

### Supprimer un canal

**Route**: `DELETE /api/v1/workspaces/:workspaceId/canaux/:canalId`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Canal supprimé avec succès"
}
```

**Élément Frontend**: Bouton de suppression dans les paramètres du canal.

---

## Routes de messages

Base URL: `/api/v1/workspaces/:workspaceId/canaux/:canalId/messages`

### Obtenir les messages d'un canal

**Route**: `GET /api/v1/workspaces/:workspaceId/canaux/:canalId/messages`

**Paramètres de requête**:
- `limit`: nombre de messages à récupérer (défaut: 50)
- `before`: ID du message avant lequel récupérer les messages (pagination)

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "message_id",
      "contenu": "Contenu du message",
      "auteur": {
        "id": "user_id",
        "username": "utilisateur",
        "profilePicture": "chemin/vers/image.jpg"
      },
      "canal": "canal_id",
      "createdAt": "2023-07-16T12:00:00Z",
      "updatedAt": "2023-07-16T12:00:00Z",
      "isEdited": false,
      "mentions": [],
      "attachements": []
    }
  ],
  "hasMore": true,
  "nextCursor": "message_id_for_pagination"
}
```

**Élément Frontend**: Affichage des messages dans un canal sélectionné, avec chargement progressif au scroll.

### Envoyer un message

**Route**: `POST /api/v1/workspaces/:workspaceId/canaux/:canalId/messages`

**Requête**:
```json
{
  "contenu": "Contenu du message",
  "mentions": ["user_id1", "user_id2"] // Optionnel
}
```

**Réponse réussie (201)**:
```json
{
  "success": true,
  "data": {
    "id": "message_id",
    "contenu": "Contenu du message",
    "auteur": {
      "id": "user_id",
      "username": "utilisateur",
      "profilePicture": "chemin/vers/image.jpg"
    },
    "canal": "canal_id",
    "createdAt": "2023-07-16T14:00:00Z",
    "updatedAt": "2023-07-16T14:00:00Z",
    "isEdited": false,
    "mentions": ["user_id1", "user_id2"],
    "attachements": []
  }
}
```

**Élément Frontend**: Champ de saisie de message au bas de l'interface du canal.

### Mettre à jour un message

**Route**: `PATCH /api/v1/workspaces/:workspaceId/canaux/:canalId/messages/:messageId`

**Requête**:
```json
{
  "contenu": "Contenu mis à jour",
  "mentions": ["user_id1"] // Optionnel
}
```

**Réponse réussie (200)**:
```json
{
  "success": true,
  "data": {
    "id": "message_id",
    "contenu": "Contenu mis à jour",
    "auteur": {
      "id": "user_id",
      "username": "utilisateur",
      "profilePicture": "chemin/vers/image.jpg"
    },
    "canal": "canal_id",
    "createdAt": "2023-07-16T14:00:00Z",
    "updatedAt": "2023-07-16T14:05:00Z",
    "isEdited": true,
    "mentions": ["user_id1"],
    "attachements": []
  }
}
```

**Élément Frontend**: Option d'édition accessible en cliquant sur un message envoyé par l'utilisateur.

### Supprimer un message

**Route**: `DELETE /api/v1/workspaces/:workspaceId/canaux/:canalId/messages/:messageId`

**Réponse réussie (200)**:
```json
{
  "success": true,
  "message": "Message supprimé avec succès"
}
```

**Élément Frontend**: Option de suppression accessible en cliquant sur un message envoyé par l'utilisateur.

---

## Checklist d'intégration Frontend-API

Utilisez cette checklist pour suivre l'implémentation des fonctionnalités :

### Authentification
- [x] Page de connexion et d'inscription
- [ ] Système de déconnexion
- [ ] Vérification d'email
- [ ] Formulaire de mot de passe oublié
- [ ] Réinitialisation de mot de passe

### Profil utilisateur
- [ ] Affichage du profil
- [ ] Modification du profil
- [ ] Changement de mot de passe
- [ ] Modification de la photo de profil
- [ ] Suppression du compte

### Workspaces
- [x] Affichage des workspaces dans la barre latérale
- [ ] Création de workspace
- [ ] Paramètres de workspace
- [ ] Gestion des membres
- [ ] Système d'invitation

### Canaux
- [ ] Affichage des canaux d'un workspace
- [ ] Création de canal
- [ ] Paramètres de canal
- [ ] Suppression de canal

### Messages
- [ ] Affichage des messages dans un canal
- [ ] Envoi de message
- [ ] Édition de message
- [ ] Suppression de message
- [ ] Pagination des messages

### Fonctionnalités en temps réel
- [ ] Mise à jour en temps réel des messages (WebSocket)
- [ ] Notification de nouveaux messages
- [ ] Statut en ligne/hors ligne des utilisateurs

---

## Accès à la documentation Swagger

La documentation Swagger complète de l'API est accessible à l'adresse suivante lorsque le serveur est en cours d'exécution :

```
http://localhost:3000/api-docs
```

Cette documentation interactive permet de tester directement les endpoints de l'API et de voir les réponses en temps réel.
