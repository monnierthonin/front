# SUPCHAT - Liste des Tests

## Tests d'Authentification

### Inscription
- [x] Inscription avec email et mot de passe
  - Scénario : Un nouvel utilisateur "test@example.com" s'inscrit avec le mot de passe "Test123!"
  - Vérifier : Email de confirmation reçu ✓
  - Vérifier : Compte créé dans la base de données ✓
  - Vérifier : Validation du format d'email ✓
  - Vérifier : Validation de la complexité du mot de passe ✓
  - Vérifier : Impossibilité de créer un compte avec un email déjà utilisé ✓
  - Vérifier : Vérification de l'unicité de l'email ✓

### Connexion
- [x] Connexion avec email et mot de passe
  - Scénario : L'utilisateur "test@example.com" se connecte
  - Vérifier : Connexion réussie avec les bons identifiants ✓
  - Vérifier : Redirection vers le tableau de bord ✓
  - Vérifier : Token JWT stocké dans les cookies ✓
  - Vérifier : État authentifié dans le store ✓

### Déconnexion
- [x] Déconnexion de l'utilisateur
  - Scénario : L'utilisateur clique sur le bouton de déconnexion
  - Vérifier : Suppression du token JWT ✓
  - Vérifier : Redirection vers la page de connexion ✓
  - Vérifier : État déconnecté dans le store ✓
  - Vérifier : Impossibilité d'accéder aux routes protégées ✓

### Erreurs de Connexion
- [x] Tentative de connexion avec mauvais mot de passe
  - Scénario : Utilisateur "test@example.com" tente de se connecter avec le mot de passe "MauvaisMotDePasse123!"
  - Vérifier : Message d'erreur affiché ✓
  - Vérifier : Pas de token généré ✓
  - Vérifier : État non authentifié ✓

- [x] Tentative de connexion avec email inexistant
  - Scénario : Tentative de connexion avec "inexistant@example.com"
  - Vérifier : Message d'erreur "Email ou mot de passe incorrect"
  - Vérifier : Pas de token généré
  - Vérifier : État non authentifié

- [x] Tentative de connexion avec compte non vérifié
  - Scénario : Créer un nouveau compte sans vérifier l'email
  - Vérifier : Message d'erreur "Veuillez vérifier votre email"
  - Vérifier : Pas de token généré
  - Vérifier : État non authentifié

### OAuth
- [x] Connexion avec Google
  - Scénario : Utilisateur clique sur "Se connecter avec Google"
  - Vérifier : Redirection vers Google ✓
  - Vérifier : Création/Liaison du compte après autorisation ✓
  - Vérifier : Récupération correcte du profil Google ✓
  - Vérifier : Token JWT stocké dans un cookie httpOnly ✓
  - Vérifier : Redirection vers la page d'accueil ✓

- [x] Connexion avec Microsoft
  - Scénario : Utilisateur clique sur "Se connecter avec Microsoft"
  - Vérifier : Redirection vers Microsoft ✓
  - Vérifier : Création/Liaison du compte après autorisation ✓
  - Vérifier : Récupération correcte du profil Microsoft ✓
  - Vérifier : Token JWT stocké dans un cookie httpOnly ✓
  - Vérifier : Redirection vers la page d'accueil ✓

- [x] Connexion avec Facebook
  - Scénario : Utilisateur clique sur "Se connecter avec Facebook"
  - Vérifier : Redirection vers Facebook ✓
  - Vérifier : Création/Liaison du compte après autorisation ✓
  - Vérifier : Récupération correcte du profil Facebook ✓
  - Vérifier : Token JWT stocké dans un cookie httpOnly ✓
  - Vérifier : Redirection vers la page d'accueil ✓

### Gestion des Sessions
- [x] Persistance de la session
  - Scénario : Utilisateur ferme et rouvre le navigateur
  - Vérifier : Session maintenue si "Se souvenir de moi" activé ✓
    - JWT valide pendant 30 jours ✓
    - Cookie persistant pendant 30 jours ✓
  - Vérifier : Session courte si "Se souvenir de moi" désactivé ✓
    - JWT valide pendant 24 heures ✓
    - Cookie expirant après 24 heures ✓
- [x] Déconnexion
  - Scénario : Utilisateur clique sur "Déconnexion"
  - Vérifier : Suppression du token ✓
  - Vérifier : Redirection vers la page de connexion ✓
  - Vérifier : Impossibilité d'accéder aux routes protégées ✓

## Tests de Gestion du Profil

### Informations de Base
- [x] Modification du nom d'utilisateur
  - Scénario : Utilisateur change son nom en "NewUsername"
  - Vérifier : Mise à jour dans la base de données ✓
  - Vérifier : Mise à jour dans l'interface ✓

- [x] Modification de l'email
  - Scénario : Utilisateur change son email 
  - Vérifier : Email de confirmation envoyé ✓
  - Vérifier : Validation de l'unicité de l'email ✓
  - Vérifier : Mise à jour dans l'interface et la base de données ✓

### Photo de Profil
- [x] Upload d'avatar
  - Scénario : Utilisateur upload une nouvelle photo
  - Vérifier : Validation du format (jpg, png) ✓
  - Vérifier : Validation de la taille (<2MB) ✓
  - Vérifier : Redimensionnement automatique (à implémenter dans le frontend)
  - Vérifier : Suppression de l'ancienne photo ✓

### Sécurité
- [x] Modification du mot de passe
  - Scénario : Utilisateur change son mot de passe
  - Vérifier : Ancien mot de passe requis ✓
  - Vérifier : Validation de la complexité ✓
  - Vérifier : Email de confirmation envoyé ✓

- [x] Suppression de compte
  - Scénario : Utilisateur supprime son compte
  - Vérifier : Confirmation requise ✓
  - Vérifier : Messages conservés avec "Utilisateur inconnu" ✓
  - Vérifier : Suppression des données personnelles ✓

## Tests des Workspaces

### Création et Configuration
- [x] Création d'un workspace
  - Scénario : Utilisateur crée un workspace "Test Team" ✓
  - Vérifier : Création dans la base de données ✓
  - Vérifier : Utilisateur défini comme créateur ✓
  - Vérifier : Canal "général" créé automatiquement ✓

- [x] Modification des paramètres
  - Scénario : Créateur modifie le titre et la description ✓
  - Vérifier : Mise à jour en temps réel ✓
  - Vérifier : Seul le créateur peut modifier ✓

### Gestion des Membres
- [x] Invitation par email
    - [x] Envoi d'une invitation à une adresse email ✓
    - [x] Réception de l'email d'invitation ✓
    - [x] Lien d'invitation fonctionnel ✓
    - [x] Ajout au workspace après acceptation ✓

- [x] Gestion des rôles
  - Scénario : Attribution du rôle "admin" à un membre ✓
  - Vérifier : Permissions mises à jour ✓
  - Vérifier : Accès aux fonctionnalités d'admin ✓

### Visibilité
- [x] Configuration public/privé
  - Scénario : Passage d'un workspace en privé ✓
  - Vérifier : Visibilité limitée aux membres ✓
  - Vérifier : Invitations requises pour rejoindre ✓

## Tests des Canaux

### Gestion des Canaux
- [x] Création de canal
  - Scénario : Admin crée un canal "projets" ✓
  - Vérifier : Canal visible dans la liste ✓
  - Vérifier : Permissions correctement configurées ✓

- [x] Modification de canal
  - Scénario : Admin modifie le nom du canal ✓
  - Vérifier : Mise à jour en temps réel ✓
  - Vérifier : Historique des messages conservé ✓

- [x] Suppression de canal
  - Scénario : Admin supprime un canal ✓
  - Vérifier : Suppression en cascade des messages ✓
  - Note : Notifications aux membres non implémentées (choix UX)

### Permissions
- [x] Canaux privés
  - Scénario : Canal configuré comme privé ✓
  - Vérifier : Visibilité limitée aux membres autorisés ✓
  - Vérifier : Invitations nécessaires ✓
  - Note : Seuls les admins et modérateurs peuvent inviter des membres

## Tests des Messages

### Envoi et Réception
- [x] Envoi de message
  - Scénario : Utilisateur envoie "Hello World" ✓
  - Vérifier : Message visible en temps réel ✓
  - Vérifier : Horodatage correct ✓
  - Vérifier : Auteur correctement affiché ✓

- [x] Mentions
  - Scénario : Message avec "@username"
  - Vérifier : Mention mise en évidence ✓
  - Vérifier : Notification envoyée ✓
  - Vérifier : Lien vers le profil ✓

### Modifications
- [x] Édition de message
  - Scénario : Auteur modifie son message via Swagger ✓
  - Vérifier : Mise à jour en temps réel ✓
  - Vérifier : Indication "modifié" ✓

## Tests des Messages Privés

### Messages Privés 1:1
- [ ] Envoi de message privé
  - Scénario : Utilisateur A envoie "Bonjour" à l'utilisateur B
  - Vérifier : Message visible dans la conversation pour les deux utilisateurs
  - Vérifier : Notification reçue par l'utilisateur B
  - Vérifier : Indication de lecture lorsque l'utilisateur B ouvre la conversation

- [ ] Réponse à un message
  - Scénario : Utilisateur B répond à un message spécifique de l'utilisateur A
  - Vérifier : Le message original est affiché au-dessus de la réponse
  - Vérifier : La réponse est correctement liée au message original

- [ ] Modification de message privé
  - Scénario : Utilisateur A modifie son message "Bonjour" en "Salut"
  - Vérifier : Message mis à jour visible pour les deux utilisateurs
  - Vérifier : Indication "modifié" affichée

- [ ] Suppression de message privé
  - Scénario : Utilisateur A supprime un de ses messages
  - Vérifier : Message supprimé pour les deux utilisateurs
  - Vérifier : Aucune trace du message dans la base de données

### Conversations de Groupe
- [ ] Création d'une conversation de groupe
  - Scénario : Utilisateur A transforme une conversation 1:1 en ajoutant l'utilisateur C
  - Vérifier : Conversation mise à jour avec trois participants
  - Vérifier : Historique des messages préservé
  - Vérifier : Notification envoyée à l'utilisateur C

- [ ] Envoi de message dans un groupe
  - Scénario : Utilisateur A envoie un message dans la conversation de groupe
  - Vérifier : Message visible pour tous les participants
  - Vérifier : Notifications envoyées aux utilisateurs B et C

- [ ] Ajout d'un participant
  - Scénario : Utilisateur A ajoute l'utilisateur D à la conversation
  - Vérifier : Utilisateur D peut voir l'historique des messages
  - Vérifier : Notification envoyée à tous les participants

- [ ] Suppression d'un participant
  - Scénario : Utilisateur A supprime l'utilisateur C de la conversation
  - Vérifier : Utilisateur C n'a plus accès à la conversation
  - Vérifier : Les autres participants peuvent toujours voir les messages de l'utilisateur C

- [ ] Quitter une conversation
  - Scénario : Utilisateur B quitte la conversation
  - Vérifier : Utilisateur B n'a plus accès à la conversation
  - Vérifier : Les autres participants sont notifiés du départ

- [ ] Suppression d'une conversation
  - Scénario : Tous les participants sauf un quittent la conversation
  - Vérifier : La conversation est automatiquement supprimée
  - Vérifier : Tous les messages associés sont supprimés (suppression en cascade)

### Fonctionnalités avancées
- [ ] Statut de lecture
  - Scénario : Utilisateur A envoie un message, utilisateur B l'ouvre
  - Vérifier : Indicateur "lu" affiché pour l'utilisateur A
  - Vérifier : Horodatage de lecture correct

- [ ] Statut de lecture dans les groupes
  - Scénario : Utilisateur A envoie un message dans un groupe
  - Vérifier : Indicateurs "lu" mis à jour au fur et à mesure que chaque participant lit le message
  - Vérifier : Possibilité de voir qui a lu le message et quand
  - Note : Testé via Swagger en raison de problèmes d'implémentation dans le composant Vue de Canal

### Suppression
- [x] Suppression de message
  - Scénario : Auteur supprime son message via Swagger ✓
  - Vérifier : Suppression en temps réel ✓
  - Vérifier : Seul l'auteur peut supprimer ✓
  - Vérifier : Historique mis à jour ✓
  - Note : Testé via Swagger en raison de problèmes d'implémentation dans le composant Vue de Canal

### Réactions
- [x] Ajout de réaction
  - Scénario : Utilisateur ajoute une réaction ✓
  - Vérifier : Réaction visible en temps réel ✓
  - Vérifier : Utilisateur ne peut pas réagir plusieurs fois ✓

- [x] Suppression de réaction
  - Scénario : Utilisateur supprime une réaction ✓
  - Vérifier : Réaction supprimée en temps réel ✓
  - Vérifier : Utilisateur ne peut pas supprimer une réaction qu'il n'a pas ajoutée ✓

### Mentions de canaux
- [ ] Ajout de mention de canal
  - Scénario : Utilisateur ajoute une mention de canal 
  - Vérifier : Mention visible en temps réel
  - Vérifier : Utilisateur ne peut pas mentionner un canal qu'il n'a pas accès

### Formatage markdown
- [ ] Formatage markdown
  - Scénario : Utilisateur ajoute un message formaté en markdown
  - Vérifier : Message formaté en markdown

### Réponses aux messages
- [x] Réponses aux messages
  - Scénario : Utilisateur ajoute une réponse à un message ✓
  - Vérifier : Réponse visible en temps réel ✓

## Tests de statut utilisateur
- [ ] Statut utilisateur
  - Scénario : Utilisateur change son statut
  - Vérifier : Statut visible en temps réel
  - Vérifier : Indicateur de présence visible en temps réel

## Tests de Performance

### Temps de Réponse
- [ ] Chargement initial
  - Scénario : Ouverture de l'application
  - Vérifier : Temps de chargement <3s
  - Vérifier : Chargement progressif des messages

- [ ] Temps réel
  - Scénario : Envoi de plusieurs messages simultanés
  - Vérifier : Pas de latence perceptible
  - Vérifier : Ordre correct des messages

## Tests de Sécurité

### Protection des Données
- [ ] Validation des entrées
  - Scénario : Tentative d'injection SQL
  - Vérifier : Échec de l'injection
  - Vérifier : Données nettoyées

- [ ] Protection XSS
  - Scénario : Message avec code HTML
  - Vérifier : Rendu en texte brut
  - Vérifier : Pas d'exécution de script

### Authentification
- [ ] Tokens JWT
  - Scénario : Token expiré
  - Vérifier : Déconnexion automatique
  - Vérifier : Rafraîchissement du token

## Tests Docker

### Déploiement
- [ ] Docker Compose
  - Scénario : `docker-compose up`
  - Vérifier : Tous les services démarrent
  - Vérifier : Communication entre services
  - Vérifier : Persistance des données

## Tests d'Authentification

### Erreurs de Connexion
- [ ] Tentative de connexion avec identifiants invalides
  - Scénario : Utilisateur tente de se connecter avec un mauvais mot de passe
  - Vérifier : Message d'erreur approprié
  - Vérifier : Pas de token généré
  - Vérifier : État non authentifié
