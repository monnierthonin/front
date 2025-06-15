# Architecture du Frontend SupChat

Le frontend de l'application SupChat est construit suivant une architecture moderne basée sur Vue.js. Voici comment il est structuré :

**Organisation des dossiers :**
- `src/` : Dossier principal contenant tout le code source
   - `assets/` : Ressources statiques (images, styles)
   - `components/` : Composants réutilisables
   - `pages/` : Pages principales de l'application
   - `router/` : Configuration des routes
   - `services/` : Services pour communication avec l'API
   - `utils/` : Fonctions utilitaires

**Structure des composants :**
- Le système utilise des composants Vue.js qui séparent clairement le markup (template), la logique (script) et les styles (style scoped)
- L'application gère un thème clair/sombre avec des variables CSS pour une expérience utilisateur cohérente

# Fonctionnalités d'Authentification

## Page de connexion et d'inscription

**Page de connexion :**
- Interface simple avec un formulaire contenant :
  - Champ pour saisir l'adresse email
  - Champ pour saisir le mot de passe
  - Bouton "Se connecter"
- Validation des champs avant soumission
- Affichage des messages d'erreur en cas de problème
- Affichage d'un message de succès après connexion réussie
- Après connexion, l'application charge le thème préféré de l'utilisateur (clair/sombre) depuis son profil
- Redirection vers la page d'accueil après connexion réussie

**Page d'inscription :**
- Accessible via un lien "S'inscrire" depuis la page de connexion
- Le formulaire contient :
  - Champ pour saisir le nom d'utilisateur
  - Champ pour saisir l'adresse email
  - Champ pour saisir le mot de passe
  - Champ pour confirmer le mot de passe
  - Bouton "S'inscrire"
- Validation des champs avant soumission
- Vérification que les deux mots de passe correspondent
- Message de confirmation après inscription réussie
- Information que l'utilisateur doit vérifier son email
- Retour automatique à la page de connexion après inscription

## Système de déconnexion

- Bouton de déconnexion accessible depuis n'importe quelle page de l'application
- Au clic sur ce bouton :
  - La session utilisateur est supprimée
  - Les tokens d'authentification sont effacés
  - L'utilisateur est redirigé vers la page de connexion
  - Les données sensibles sont effacées de la mémoire du navigateur

## Connexion via Google, Facebook, Microsoft

**Pour chaque service :**
- Boutons dédiés avec icônes reconnaissables de chaque plateforme sur la page de connexion
- Processus utilisateur :
  1. L'utilisateur clique sur un bouton (Google, Facebook ou Microsoft)
  2. Une fenêtre pop-up s'ouvre avec l'interface de connexion du service choisi
  3. L'utilisateur s'authentifie sur cette plateforme
  4. La plateforme demande autorisation d'accès aux informations de base (email, nom)
  5. Après autorisation, la fenêtre se ferme automatiquement
  6. L'utilisateur est connecté à SupChat et redirigé vers la page d'accueil
- Le système récupère automatiquement l'email, le nom et la photo de profil du service utilisé
- Si c'est la première connexion via ce service, un nouveau compte est créé

## Mot de passe oublié

- Accessible via un lien "Mot de passe oublié" sur la page de connexion
- Présente un formulaire simple :
  - Champ pour saisir l'adresse email associée au compte
  - Bouton "Envoyer le lien"
- Après soumission :
  - Confirmation visuelle que l'email a été envoyé
  - Instructions pour vérifier la boîte mail
  - Lien pour revenir à la page de connexion
- Interface claire avec le logo de l'application et design cohérent

## Réinitialisation du mot de passe

- Accessible uniquement via un lien envoyé par email
- L'interface présente :
  - Formulaire avec champ pour le nouveau mot de passe
  - Champ pour confirmer le nouveau mot de passe
  - Bouton "Réinitialiser le mot de passe"
- Validation en temps réel de la correspondance des deux mots de passe
- Gestion des cas d'erreur :
  - Token invalide ou expiré
  - Mots de passe ne correspondant pas
- Après réinitialisation réussie :
  - Message de confirmation
  - Redirection automatique vers la page de connexion après quelques secondes
  - Indication que l'utilisateur peut désormais se connecter avec son nouveau mot de passe

# Profil utilisateur

## Affichage du profil

- Page dédiée accessible via un bouton dans la barre de navigation/menu utilisateur
- Présentation des informations utilisateur :
  - Photo de profil (avec option pour l'agrandir)
  - Nom d'utilisateur
  - Adresse email
  - Date d'inscription
  - Statut de connexion (en ligne/hors ligne)
- Interface visuelle claire et cohérente avec le thème de l'application

## Modification du profil

- Bouton "Modifier" pour accéder au formulaire d'édition
- Modification possible des informations :
  - Nom d'utilisateur
  - Description personnelle
  - Paramètres de notification
- Validation des champs avant soumission
- Message de confirmation après modification réussie

## Changement de mot de passe

- Section dédiée dans les paramètres du profil
- Formulaire avec trois champs :
  - Mot de passe actuel (pour vérification)
  - Nouveau mot de passe
  - Confirmation du nouveau mot de passe
- Validation en temps réel de la correspondance des mots de passe
- Message d'erreur en cas de mot de passe actuel incorrect
- Notification de succès après changement

## Modification de la photo de profil

- Zone dédiée avec la photo actuelle et option pour la modifier
- Au clic sur le bouton de modification :
  - Ouverture d'un sélecteur de fichier
  - Possibilité de téléverser une image depuis l'appareil
  - Prévisualisation de l'image avant validation
- Restrictions sur la taille et le format du fichier
- Option pour recadrer l'image avant validation
- Chargement visuel pendant le téléversement
- Message de confirmation après modification réussie

## Suppression du compte

- Section distincte dans les paramètres avancés du profil
- Avertissement sur le caractère irréversible de l'action
- Demande de confirmation via dialogue modal
- Exigence de saisir le mot de passe pour confirmer
- Information sur les conséquences (perte des données, workspaces, etc.)
- Redirection vers la page de connexion après suppression réussie

## Mode noir et blanc

- Option dans les paramètres utilisateur pour choisir le thème :
  - Mode clair (fond blanc, texte foncé)
  - Mode sombre (fond foncé, texte clair)
- Changement instantané sans rechargement de page
- Enregistrement de la préférence dans le profil utilisateur
- Conservation du choix entre les sessions
- Adaptation des couleurs de tous les éléments de l'interface au thème sélectionné

# Workspaces

## Affichage des workspaces dans la barre latérale

- Liste des workspaces auxquels l'utilisateur appartient dans la barre latérale gauche
- Affichage sous forme d'icônes ou de noms selon la configuration
- Indicateurs visuels pour les notifications non lues dans chaque workspace
- Sélection facile par clic pour basculer entre les workspaces
- Workspaces organisés par ordre alphabétique ou par fréquence d'utilisation
- Barre de recherche pour trouver rapidement un workspace spécifique

## Création de workspace

- Bouton "Créer un workspace" clairement visible dans la barre latérale
- Processus de création en étapes :
  1. Saisie du nom du workspace
  2. Description optionnelle du workspace
  3. Sélection d'une icône ou téléversement d'une image personnalisée
  4. Configuration des paramètres de base (public/privé)
  5. Création automatique d'un canal général par défaut
- Confirmation visuelle de la création réussie
- Redirection automatique vers le nouveau workspace

## Paramètres de workspace

- Accessible via un bouton de paramètres dans l'en-tête du workspace
- Options de configuration :
  - Modification du nom et de la description
  - Changement de l'icône ou de l'image
  - Paramètres de confidentialité (public/privé)
  - Paramètres de notification pour tous les membres
- Options avancées pour les administrateurs uniquement
- Sauvegarde automatique des modifications
- Notification aux membres en cas de changements importants

## Gestion des membres

- Section spécifique dans les paramètres du workspace
- Liste des membres actuels avec leurs rôles
- Options pour :
  - Ajouter de nouveaux membres
  - Modifier les rôles (administrateur, membre, invité)
  - Retirer des membres du workspace
- Recherche de membres par nom d'utilisateur ou email
- Filtrage par rôle ou statut
- Actions en lot pour gérer plusieurs membres à la fois
- Confirmation requise pour les actions critiques

## Système d'invitation

- Génération de liens d'invitation avec options :
  - Durée de validité (24h, 7 jours, 30 jours, sans limite)
  - Nombre maximum d'utilisations
  - Rôle attribué automatiquement aux nouveaux membres
- Envoi d'invitations par email directement depuis l'interface
- Copie facile du lien d'invitation pour partage externe
- Suivi des invitations en attente
- Possibilité de révoquer les invitations actives
- Page d'accueil spéciale pour les utilisateurs rejoignant via invitation

# Canaux

## Affichage des canaux d'un workspace

- Liste des canaux disponibles dans la barre latérale une fois un workspace sélectionné
- Organisation des canaux par catégories (possibilité de les réduire/déplier)
- Indicateurs visuels pour les messages non lus dans chaque canal
- Distinction visuelle entre les canaux publics et privés
- Option pour épingler les canaux favoris en haut de la liste
- Affichage du nombre de membres actifs dans chaque canal
- Navigation intuitive et rapide entre les canaux via clics ou raccourcis clavier

## Création de canal

- Bouton "+" pour ajouter un nouveau canal dans un workspace
- Formulaire de création avec champs :
  - Nom du canal (avec vérification d'unicité)
  - Description du canal
  - Type de canal (public/privé)
  - Catégorie (existante ou nouvelle)
- Option pour inviter directement des membres lors de la création
- Sélection des permissions de base (lecture, écriture, gestion)
- Création instantanée et redirection vers le nouveau canal
- Message de bienvenue automatique dans le canal nouvellement créé

## Paramètres de canal

- Accessible via un bouton ou menu dans l'en-tête du canal
- Gestion des paramètres de base :
  - Modification du nom et de la description
  - Changement de catégorie
  - Gestion de la confidentialité (passage de public à privé et inversement)
- Pour les canaux privés :
  - Liste des membres ayant accès
  - Gestion des invitations spécifiques
  - Configuration des rôles autorisés à voir le canal
- Options de notification spécifiques au canal
- Gestion des webhooks et intégrations
- Pour les modérateurs et administrateurs uniquement :
  - Options de modération des messages
  - Gestion des permissions par rôle ou utilisateur

## Suppression de canal

- Option de suppression disponible dans les paramètres du canal
- Restrictions d'accès (réservé aux administrateurs ou créateurs)
- Dialogue de confirmation avec avertissement sur le caractère irréversible
- Option de sauvegarde des messages avant suppression
- Notification aux membres actifs du canal avant suppression
- Animation de fermeture du canal et redirection vers un canal par défaut
- Historique des suppressions pour les administrateurs

# Messages

## Affichage des messages dans un canal

- Interface principale affichant les messages dans le canal sélectionné
- Messages organisés chronologiquement du plus ancien au plus récent
- Regroupement des messages par date (aujourd'hui, hier, date spécifique)
- Affichage pour chaque message :
  - Avatar de l'auteur
  - Nom de l'utilisateur avec distinction visuelle pour les administrateurs
  - Horodatage précis (avec format relatif pour messages récents)
  - Contenu textuel avec mise en forme
  - Pièces jointes (éventuelles)
  - Réactions/emojis
- Mise en évidence des messages non lus
- Chargement progressif des messages antérieurs lors du défilement
- Bouton de défilement rapide vers le bas pour revenir aux messages récents
- Indicateur visuel lorsque quelqu'un est en train d'écrire

## Envoi de message

- Zone de texte en bas de l'interface pour la saisie
- Bouton d'envoi et support de la touche Entrée pour soumettre
- Options de mise en forme :
  - Texte en gras, italique, souligné
  - Insertion de liens
  - Listes à puces et numérotées
  - Blocs de code avec coloration syntaxique
  - Insertion d'emojis via sélecteur
- Glisser-déposer pour pièces jointes
- Prévisualisation instantanée des liens partagés
- Auto-complétion pour les mentions (@utilisateur)
- Raccourcis clavier pour la mise en forme
- Sauvegarde automatique des brouillons non envoyés

## Édition de message

- Option d'édition via menu contextuel sur ses propres messages
- Mode édition avec conservation de la mise en forme existante
- Indicateur visuel qu'un message a été modifié (avec horodatage)
- Possibilité de voir l'historique des modifications (pour administrateurs)
- Limitation de durée pour l'édition selon les paramètres du workspace
- Annulation facile des modifications en cours
- Notification aux utilisateurs mentionnés lors d'ajouts de mentions dans l'édition

## Suppression de message

- Option de suppression via menu contextuel sur ses propres messages
- Dialogue de confirmation pour éviter les suppressions accidentelles
- Animation de disparition du message
- Pour les administrateurs : possibilité de supprimer les messages d'autres utilisateurs
- Selon les paramètres : indicateur qu'un message a été supprimé ou suppression complète
- Option de suppression en masse pour les administrateurs
- Protection contre la suppression abusive via rôles et permissions

## Répondre aux messages

- Bouton ou option de menu pour répondre directement à un message
- Affichage du message original en citation au-dessus de la réponse
- Mention automatique de l'auteur du message original
- Fil de discussion visuel pour les réponses multiples
- Navigation facile entre les messages liés
- Option pour voir toutes les réponses à un message spécifique
- Notification à l'auteur original lorsque quelqu'un répond à son message

## Affichage et envoi de messages privés

- Interface dédiée pour les conversations privées
- Liste des conversations récentes facilement accessible
- Indicateur de statut en ligne/hors ligne des correspondants
- Mêmes fonctionnalités que les canaux pour l'envoi de messages
- Notifications spécifiques pour les messages privés
- Option de recherche dans l'historique des conversations
- Paramètres de confidentialité (blocage, notifications, etc.)
- Conservation de l'historique des messages entre les sessions

## Envoi de fichiers

- Bouton d'ajout de fichiers dans l'interface de messagerie
- Méthodes multiples d'ajout :
  - Sélection via explorateur de fichiers
  - Glisser-déposer directement dans la zone de message
  - Copier-coller pour les images
- Prévisualisation des fichiers avant envoi
- Barre de progression pour les téléversements volumineux
- Limitations de taille selon les paramètres du workspace
- Formats supportés :
  - Images (JPG, PNG, GIF, etc.) avec aperçu intégré
  - Documents (PDF, DOCX, etc.) avec icône distinctive
  - Fichiers audio et vidéo avec lecteur intégré
  - Archives avec liste des fichiers contenus
- Options de téléchargement pour les destinataires

## Création d'amis (utiliser barre de recherche)

- Barre de recherche principale pour trouver des utilisateurs
- Suggestions d'utilisateurs basées sur les workspaces communs
- Profils résumés avec option "Ajouter en ami"
- Système de demandes d'amitié avec notifications
- Liste d'amis avec statuts et activité récente
- Catégorisation des amis (favoris, récents, etc.)
- Actions rapides : message privé, appel, voir le profil
- Gestion des relations : bloquer, supprimer, mettre en sourdine

## Réagir avec des emojis

- Bouton de réaction rapide sur chaque message
- Sélecteur d'emojis avec catégories et recherche
- Affichage du nombre de réactions par emoji
- Liste des utilisateurs ayant réagi disponible au survol
- Emojis personnalisés spécifiques au workspace
- Réactions fréquemment utilisées mises en avant
- Possibilité de retirer sa réaction
- Nombre maximal de réactions différentes par message

# Fonctionnalités en temps réel

## Mise à jour en temps réel des messages (WebSocket)

- Connexion WebSocket maintenue entre le client et le serveur
- Affichage instantané des nouveaux messages sans rechargement de page
- Apparition en douceur des nouveaux messages avec animation
- Indicateurs visuels pour les messages en cours de rédaction par d'autres utilisateurs
- Synchronisation automatique de l'état de lecture des messages
- Mise à jour en temps réel des modifications de messages (éditions/suppressions)
- Gestion efficace de la reconnexion en cas de coupure réseau
- Réduction de la consommation de bande passante grâce à des mises à jour partielles

## Notification de nouveaux messages

- Notification visuelle dans l'interface utilisateur
- Badge numérique sur l'icône du canal ou du workspace
- Sons de notification personnalisables (avec option de désactivation)
- Notifications push sur navigateur pour les messages importants
- Paramètres de notification personnalisables par workspace et par canal
- Filtrage intelligent des notifications selon la priorité
- Option "Ne pas déranger" avec plages horaires programmables
- Aperçu du contenu des messages dans les notifications

## Statut en ligne/hors ligne des utilisateurs

- Indicateur de statut pour chaque utilisateur (en ligne, absent, ne pas déranger, invisible, hors ligne)
- Mise à jour en temps réel du statut
- Personnalisation du statut avec message court et emoji
- Détection automatique d'inactivité pour passage en mode "absent"
- Affichage du statut dans les listes d'utilisateurs, conversations et en-têtes de profil
- Option pour masquer son statut à certains utilisateurs ou groupes
- Intégration de statuts personnalisés avec durée limitée
- Historique des statuts récents pour sélection rapide
