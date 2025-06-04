# Cahier des Charges - Projet SUPCHAT

## Introduction

Le projet SUPCHAT est une solution de communication en ligne destinée aux utilisateurs en milieu professionnel. Inspiré par des plateformes comme Discord, il permet aux utilisateurs de communiquer au sein de "workspaces" (équivalents à des serveurs) contenant des canaux de discussions et regroupant des membres. L'application favorise l'échange de messages et de fichiers en temps réel, offrant une expérience de communication instantanée et collaborative.

Ce document présente les spécifications techniques et fonctionnelles du projet SUPCHAT, définissant les exigences à respecter pour son développement et sa mise en œuvre.

## Identification du besoin

Le projet SUPCHAT répond à plusieurs besoins identifiés dans le contexte professionnel actuel :

### Besoins organisationnels
- **Centralisation des communications** : Les entreprises ont besoin d'un espace unique pour centraliser les échanges professionnels, évitant ainsi la dispersion des informations sur différentes plateformes.
- **Organisation thématique** : Nécessité de structurer les discussions par thèmes ou projets pour faciliter le suivi et la recherche d'informations.
- **Gestion des équipes** : Besoin de créer des espaces de travail distincts avec des niveaux d'accès différenciés selon les rôles des membres.

### Besoins fonctionnels
- **Communication instantanée** : Besoin d'échanges en temps réel pour accélérer la prise de décision et la résolution de problèmes.
- **Partage de fichiers intégré** : Nécessité de partager des documents directement dans le flux de conversation pour maintenir le contexte.
- **Notifications personnalisées** : Besoin d'être alerté des messages importants sans être submergé par les notifications.
- **Recherche efficace** : Capacité à retrouver rapidement des informations dans l'historique des conversations.

### Besoins techniques
- **Sécurité des données** : Protection des communications et informations sensibles de l'entreprise.
- **Accessibilité multi-plateforme** : Besoin d'accéder à l'application depuis différents appareils (ordinateurs, smartphones).
- **Performance et fiabilité** : Nécessité d'un système stable et rapide pour une utilisation professionnelle intensive.
- **Extensibilité** : Possibilité d'ajouter de nouvelles fonctionnalités selon l'évolution des besoins.

### Contexte et contraintes
- **Confidentialité** : Les entreprises souhaitent contrôler l'accès à leurs données et communications.
- **Conformité RGPD** : Nécessité de respecter les réglementations sur la protection des données personnelles.
- **Intégration avec l'existant** : Besoin de s'intégrer avec les systèmes d'authentification existants (OAuth2).
- **Facilité d'adoption** : Interface intuitive pour minimiser la courbe d'apprentissage des utilisateurs.

Le projet SUPCHAT vise à répondre à ces besoins en proposant une solution complète, sécurisée et adaptée au contexte professionnel moderne, où la communication efficace est un facteur clé de productivité et de collaboration.

## Objectif du projet

L'objectif principal du projet SUPCHAT est de fournir une plateforme de communication complète et sécurisée permettant aux utilisateurs en milieu professionnel de :

- Créer et gérer des espaces de travail collaboratifs (workspaces)
- Organiser les communications par canaux thématiques
- Échanger des messages et des fichiers en temps réel
- Recevoir des notifications personnalisées
- Rechercher efficacement des informations dans l'historique des conversations
- Gérer leur profil et leurs préférences utilisateur

Le système doit être robuste, sécurisé, performant et offrir une expérience utilisateur fluide sur différentes plateformes (web et mobile).

## Exigences techniques et technologiques

### Architecture

Le projet SUPCHAT repose sur une architecture client-serveur composée de quatre briques distinctes :
- Une API RESTful développée en Node.js (dernière version LTS)
- Une application web développée en Vue.js (dernière version LTS)
- Une application mobile développée en Kotlin (dernière version LTS)
- Une base de données NoSQL MongoDB (dernière version LTS)

Aucune logique métier ne doit être implémentée côté client. Les clients servent uniquement d'interfaces et redirigent les requêtes vers le serveur.

### Déploiement et conteneurisation

- Le projet doit inclure un fichier `docker-compose.yml` à la racine permettant de déployer au moins 3 services Docker distincts (serveur, client web et base de données)
- L'application doit pouvoir être lancée intégralement via Docker Compose et être fonctionnelle
- Les fichiers Dockerfile et docker-compose.yml doivent être optimisés pour les performances

### Sécurité

- Authentification par JWT et cookies sécurisés
- Hachage des mots de passe (bcrypt)
- Protection contre les injections et attaques XSS
- Validation et nettoyage des données entrantes
- Rate limiting pour prévenir les attaques par force brute
- Gestion sécurisée des fichiers uploadés

### Communication en temps réel

- Utilisation de WebSockets pour la messagerie instantanée
- Notifications en temps réel
- Indicateurs de présence et statut des utilisateurs

### Documentation

- Documentation complète de l'API avec Swagger
- Commentaires explicatifs dans le code (en français)
- Nommage explicite des variables et fonctions (en français)

### Méthodologie de développement

- Développement piloté par les tests (TDD)
- Versionnement avec Git (commits en français)
- Branches par fonctionnalité
- Refactorisation du code pour faciliter la maintenance

## Exigences fonctionnelles

### Gestion des utilisateurs

#### Authentification
- Inscription avec validation des données
- Connexion via compte créé sur la plateforme
- Connexion via OAuth2 (Google, Microsoft, Facebook)
- Déconnexion
- Réinitialisation de mot de passe

#### Profil utilisateur
- Modification des informations personnelles
- Changement d'avatar
- Modification du mot de passe et de l'email
- Suppression de compte
- Choix entre thème clair et sombre
- Gestion des connexions OAuth2

#### Statut utilisateur
- Connecté
- Déconnecté
- Absent (après 5 minutes d'inactivité)
- Ne pas déranger (notifications muettes)

### Gestion des workspaces

- Création et suppression de workspaces
- Modification du titre et de la description
- Gestion de la visibilité (public ou privé)
- Gestion des membres et de leurs rôles
- Ajout et suppression de canaux
- Invitation d'utilisateurs par email ou lien de partage
- Quitter un workspace

### Gestion des canaux

- Création et suppression de canaux
- Modification du titre et de la visibilité
- Gestion des messages
- Gestion des pièces jointes
- Attribution de rôles aux utilisateurs

### Messagerie

- Envoi et réception de messages en temps réel
- Réactions aux messages avec des émojis
- Réponses à des messages spécifiques
- Mentions d'utilisateurs avec @username
- Références à des canaux avec #canalname
- Modification et suppression de messages
- Indicateur "en cours d'écriture"
- Envoi de fichiers (images, vidéos, documents)
- Messages privés entre utilisateurs

### Notifications

- Notifications en temps réel
- Notifications push et par email
- Paramètres de notification personnalisables
- Notifications muettes selon le statut utilisateur
- Notifications pour les mentions, nouveaux messages et nouveaux membres

### Recherche

- Recherche globale dans l'application
- Recherche dans les workspaces
- Recherche dans les canaux
- Recherche dynamique avec résultats en temps réel
- Filtres pour messages, fichiers et utilisateurs

### Gestion des fichiers

- Upload de fichiers dans les messages
- Types de fichiers autorisés : .png, .jpg, .jpeg, .gif, .mp4, .webm, .ogg, .wav, .mp3, .pdf, etc.
- Prévisualisation des médias
- Limite de taille pour les fichiers

## Charte graphique

[À compléter par l'utilisateur]

## Critères d'acceptation

### Fonctionnels

- Toutes les fonctionnalités décrites dans les exigences fonctionnelles doivent être implémentées et opérationnelles
- L'application doit être responsive et fonctionner sur différents navigateurs et appareils
- Les performances doivent être optimales, avec des temps de réponse rapides
- L'interface utilisateur doit être intuitive et facile à utiliser

### Techniques

- Tous les tests unitaires doivent passer
- Le code doit respecter les conventions de nommage et de style définies
- La documentation de l'API doit être complète et à jour
- L'application doit pouvoir être déployée via Docker Compose sans erreur
- Les données sensibles doivent être correctement protégées
- L'application doit être robuste face aux erreurs et aux tentatives d'attaque

### Priorités de développement

Les phases de développement doivent respecter l'ordre de priorité suivant :
1. Inscription et connexion
2. Gestion des workspaces
3. Gestion des canaux
4. Messagerie
5. Notifications
6. Recherche

Chaque phase doit être validée par des tests avant de passer à la suivante, et les tests des phases précédentes doivent continuer à passer pour garantir la non-régression.
