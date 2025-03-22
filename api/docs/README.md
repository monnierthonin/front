# Documentation API SUPCHAT

Cette documentation est destinée aux développeurs frontend travaillant sur le projet SUPCHAT. Elle détaille toutes les fonctionnalités de l'API et fournit des exemples d'intégration avec Vue.js.

## Table des matières

1. [Authentification](./AUTH.md)
   - Login/Logout
   - Gestion des tokens
   - Protection des routes

2. [Canaux](./CHANNELS.md)
   - Création et gestion des canaux
   - Gestion des membres
   - Permissions et rôles

3. [Messages](./MESSAGES.md)
   - Envoi de messages
   - Réponses et fils de discussion
   - Mentions et notifications
   - Réactions aux messages

4. [Fichiers](./FILES.md)
   - Upload de fichiers
   - Gestion des fichiers
   - Types de fichiers supportés
   - Limites et restrictions

5. [Prévisualisations](./PREVIEWS.md)
   - Prévisualisations des fichiers
   - Types supportés
   - Intégration dans Vue.js

6. [Utilisateurs](./USERS.md)
   - Gestion du profil
   - Statuts et présence
   - Recherche d'utilisateurs

7. [WebSocket](./WEBSOCKET.md)
   - Connexion temps réel
   - Events disponibles
   - Gestion des erreurs

## Configuration

```javascript
// Dans votre fichier .env
VUE_APP_API_URL=http://localhost:3000
VUE_APP_WS_URL=ws://localhost:3000
```

## Structure commune des réponses

Toutes les réponses de l'API suivent cette structure :

```json
{
  "status": "success" | "error",
  "data": {
    // Données spécifiques à la route
  },
  "message": "Message optionnel"
}
```

## Gestion des erreurs

```javascript
// Exemple d'intercepteur Axios
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      // Redirection vers la page de login
    }
    return Promise.reject(error)
  }
)
```

## Bonnes pratiques

1. Toujours utiliser le token d'authentification
2. Gérer les erreurs de manière appropriée
3. Implémenter des retries pour les requêtes importantes
4. Utiliser les WebSockets pour les mises à jour en temps réel
