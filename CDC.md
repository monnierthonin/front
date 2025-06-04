# Cahier des charges du projet SUPCHAT

## Objectif

Le projet SUPCHAT a pour objectif de fournir une solution en ligne de communication entre utilisateurs. Il sera basé sur une architecture client-serveur. Il sera composé :
- d'une API RESTful en Node.js (dernière version LTS)
- d'une application web en Vue.js (dernière version LTS)
- d'une application mobile en Kotlin (dernière version LTS)
- d'une base de données noSQL MongoDB (dernière version LTS)

L'application, une fois en ligne, proposera aux utilisateurs en milieu professionnel de communiquer sur des 'workspaces' (équivalent à des serveurs sur l'application Discord), contenant des canaux de discussions (équivalent à des salons de Discord) et des membres (équivalent à des utilisateurs Discord). Celle-ci favorisera l'échange de messages et de fichiers entre les utilisateurs, permettant une communication instantanée.

## Description des composants

Les utilisateurs devront s'inscrire ou se connecter avec un compte externe pour avoir accès à l'application. Ils pourront modifier leur profil, leurs messages, leurs canaux et leurs workspaces. Ils pourront aussi modifier leur avatar et leur mot de passe. Ils pourront aussi supprimer leur compte. Un tableau de bord permettra de visualiser les workspaces auxquels ils appartiennent. Dans ce tableau de bord, les utilisateurs pourront quitter les workspaces. Quitter un workspace supprimera automatiquement le lien entre l'utilisateur et le workspace, mais ne supprimera pas les messages postés par le passé. Si un workspace est supprimé par son créateur, le workspace disparaitra du tableau de bord ainsi que le lien entre l'utilisateur et le workspace. Si un utilisateur supprime son compte, le titre 'Utilisateur inconnu' remplacera le nom de l'utilisateur sur les messages existants.

Les workspaces seront organisés en canaux, et ils seront visibles selon leur statut (public ou privé). Les membres seront invités par email ou par lien de partage. Ils sont gérés par leur créateur. C'est le créateur qui pourra modifier le titre, la description et la visibilité du workspace, ainsi que modérer les membres présents dans le workspace. Il pourra aussi ajouter et supprimer des canaux. Une barre de recherche sera disponible pour rechercher tout message, fichier, utilisateur ou canal appartenant au workspace en question. Une suppression en cascade supprimera automatiquement tous les canaux appartenant au workspace et tous les messages et fichiers appartenant aux canaux.

Les canaux dans les workspaces seront organisés dans un menu avec une barre de recherche afin de les retrouver rapidement. Ils sont gérés par le rôle 'admin' qui sera donné à un membre par le créateur du workspace. L'admin pourra modifier le titre du canal et supprimer le canal. Une suppression en cascade supprimera automatiquement tous les messages et fichiers appartenant au canal. Selon leur visibilité, ils apparaitront aux utilisateurs qui peuvent les lire. Un canal public sera accessible à tout utilisateur invité dans le workspace, tandis qu'un canal privé ne sera visible qu'aux utilisateurs qui ont le rôle 'membre'. Le rôle 'membre' sera donné par le créateur du workspace. Le rôle 'invité' sera obtenu lorsque l'utilisateur rejoindra le workspace. Tous les utilisateurs intégrant le workspace pourront écrire des messages dans les canaux auxquels ils auront accès.

Les messages sont écrits dans les canaux des workspaces. Les utilisateurs auront aussi la possibilité d'écrire des messages privés aux autres utilisateurs. La règle sera la même pour tous les messages : les utilisateurs pourront réagir aux messages (avec des émojis), répondre à un message (ce qui a pour effet de rappeler le message répondu avant d'afficher la réponse), et ne seront modifiables que par leur propriétaire, mais suppressible par le propriétaire et le rôle 'admin' du canal. Des fichiers peuvent être envoyés dans les canaux en tant que pièces jointes. Une limite de poids maximale sera à définir. Dans les messages, il sera possible de mentionner un utilisateur avec l'écriture '@username'. Il sera également possible de créer un lien renvoyant vers un autre canal du même workspace avec l'écriture '#canalname'. Une barre de recherche permettra de retrouver un message à partir de mots-clé contenus dans les messages. Les messages s'afficheront en temps réel avec mise à jour automatique en cas de modification ou suppression. La date et l'heure seront affichées en bas de chaque message. Les messages seront affichés dans l'ordre chronologique. La fenêtre de discussion est fixe en hauteur, et une barre de scroll permettra de parcourir les messages.

Les notifications seront en temps réel, et seront basées sur plusieurs facteurs : mention dans les messages, nouveau message dans un workspace, nouveau message dans un canal, nouveau membre dans un workspace. Une gestion des notifications se fera par l'utilisateur selon ses paramètres ou son statut. Si l'utilisateur est en statut 'Ne pas déranger', la notification sera muette. Il sera possible de choisir d'activer ou de désactiver les notifications dans le menu des canaux de chaque workspace pour les canaux, et dans le tableau de bord des workspaces de l'utilisateur pour les workspaces. Dans le profil, l'utilisateur aura le choix d'activer ou de désactiver les notifications push et par email.

## Fonctionnalités

### Utilisateur

- Inscription
- Connexion :
    - via compte créé
    - via compte existant
    - via OAuth2 (Google, Microsoft,Facebook)
- Deconnexion
- Profil :
    - Modifier son profil
    - Modifier son avatar
    - Modifier son mot de passe
    - Modifier son email
    - Supprimer son compte
    - Thème clair
    - Thème sombre
    - Ajout / suppression d'Oauth2
- Statut :
    - Connecté
    - Deconnecté
    - Absent (après 5 minutes d'inactivité)
    - Ne pas déranger (notifications muettes)

### Workspace

- Créer un workspace
- Supprimer son workspace
- Modifier le titre du workspace
- Ajouter une description au workspace
- Modifier la description du workspace
- Gérer les membres du workspace
- Gérer la visibilité du workspace : 
    - Public (ouvert à tous)
    - Privé (invite-only)
- Ajouter des canaux
- Supprimer des canaux
- Gérer les messages des canaux
- Inviter des utilisateurs à rejoindre un workspace :
    - Inviter par email
    - Inviter par lien de partage

### Canal

- Créer un canal
- Ajouter des messages
- Modifier des messages
- Supprimer des messages
- Ajouter des pièces jointes (type images, videos, documents)
    - Liste d'extensions autorisées : .png, .jpg, .jpeg, .gif, .mp4, .webm, .ogg, .wav, .mp3, .wav, .pdf
- Supprimer des pièces jointes
- Modifier le titre du canal
- Modifier la visibilité du canal
- Supprimer le canal
- Gestion des rôles des utilisateurs présents dans le canal

### Message

- Créer un message
- Réagir à un message avec un émoji (1 réaction par utilisateur par émoji)
- Répondre à un message
- Supprimer un message (propriétaire du message et rôle 'admin')
- Modifier un message (propriétaire du message)
- Messagerie en temps réel
- Possibilité de mentionner un autre utilisateur avec l'écriture '@username'
- Possibilité de créer un lien vers un autre canal avec l'écriture '#canalname'
- Animation 'en cours d'écriture' en temps réel
- Poids maximum des fichiers à définir
- Taille maximum des messages à définir

### Notifications

- En temps réel
- Push, par email
- Gérer les notifications dans le profil
- Notifications muettes selon le statut (Ne pas déranger)
- Possibilité de rendre muettes les notifications dans les canaux et les workspaces
- Notification en cas de mention dans un message, nouveau message dans un canal, nouveau message dans un workspace, nouvel utilisateur qui rejoint un workspace

### Recherche

- Barre de recherche dans les workspaces
- Barre de recherche dans le menu des canaux
- Barre de recherche générale dans l'application
- La recherche est dynamique : les résultats sont affichés en fonction des mots-clé contenus dans les messages, fichiers ou utilisateurs.
- Le résultat s'affiche en temps réel.

## Développement

L'application doit comprendre 4 briques distinctes :
    - le serveur, devant être une API RESTful
    - le client, devant être une application web
    - le client mobile, devant être une application mobile
    - la base de données, devant être une base de données en choix libre
Aucune logique ne doit avoir lieu sur les clients qui ne servent que d'interfaces et redirigent les différentes requêtes vers le serveur.
L'API sera documentée au moyen d'une documentation Swagger, afin de répertorier les endpoints, les paramètres et les reponses.

Le développement sera piloté en TDD (Test Driven Development). Les tests doivent être valides avant de développer une fonctionnalité. Cela permettra de garantir la qualité du développement et éviter des régressions de code. S'il est possible, le code sera refactorisé afin de faciliter la lecture et la maintenance.

Toutes les données arrivant par les champs des formulaires devront être nettoyés afin de garantir la qualité des données et la sécurité des utilisateurs. Les mots de passe seront haché et n'apparaitront pas dans le code. Les tentatives d'injection SQL ou les failles XSS seront interceptées et traitées grâce au nettoyage des données.

Les noms des variables et des fonctions seront en francais, décrivant explicitement ce qu'elles contiennent. Des commentaires seraient souhaitables pour expliquer le fonctionnement des fonctions et des variables, si le contexte le permet. Eviter de trop commenter le code pour ne pas encombrer la lecture et la maintenance.

Le projet est versionné sur GitHub. Cela permettra de garder un historique des versions et de suivre l'évolution du projet. Un rollback sera possible en cas de dysfonctionnement. Les commits se feront dans la langue "francaise" afin de faciliter la compréhension de l'équipe. Des branches seront créées pour chaque fonctionnalité afin de ne pas pertuber l'existant. Lorsque les fonctionnalités seront valables, les branches seront supprimées.

Le projet doit comporter un fichier docker-compose.yml à la racine du projet permettant de déployer au moins 3 services Docker distincts, respectivement pour le serveur, le client web et la base de données.
L'application doit pouvoir être lancée intégralement via docker compose et être fonctionnelle. Les fichiers Dockerfile et docker-compose.yml doivent être optimisés pour une meilleure performance, et complets en terme de script.

Les phases de développement devront respecter l'ordre de priorité des fonctionnalités :
- Inscription
- Connexion
- Workspace
- Canal
- Message
- Notifications
- Recherche

Chaque phase devra être implementée en fonction des fonctionnalités prises en compte. Les tests doivent être valides à la fin de chaque phase, ainsi que les tests des phases précédentes afin de garantir la non-régression.