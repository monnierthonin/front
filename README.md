# SUPCHAT

Application de messagerie professionnelle basée sur une architecture client-serveur, utilisant Node.js (API), Vue.js (Web), Kotlin (Mobile) et MongoDB.

## État du Projet

Ce projet est actuellement en phase de développement initial. Les fonctionnalités sont implémentées progressivement selon le plan défini dans le fichier `DEVBOOK.md`.

## Prérequis

- Git
- Node.js (v18 LTS ou supérieur)
- MongoDB
- Docker (v20.10 ou supérieur)
- Docker Compose (v2.0 ou supérieur)
- Vue.js CLI (pour le développement frontend)
- Android Studio (pour le développement mobile)
- Un compte Mailtrap (pour les tests d'envoi d'emails)

## Installation

### 1. Cloner le repository
```bash
git clone https://github.com/alexandre-juillard/3proj_SUPCHAT.git
cd 3proj_SUPCHAT
```

2. Configurez les variables d'environnement :
```bash
cp .env.example .env
```

## Démarrage Rapide avec Docker

La méthode la plus simple pour lancer l'application est d'utiliser Docker :

1. Assurez-vous d'avoir [Docker](https://www.docker.com/products/docker-desktop) et [Docker Compose](https://docs.docker.com/compose/install/) installés
2. Clonez le repository
3. Lancez l'application :
```bash
docker-compose up --build
```

L'application sera accessible sur :
- Frontend : http://localhost:3001
- API : http://localhost:3000
- MongoDB : localhost:27017

Pour arrêter l'application :
```bash
docker-compose down
```

Pour supprimer les volumes (réinitialiser la base de données) :
```bash
docker-compose down -v
```

## Développement Local

Si vous préférez développer sans Docker, voici les commandes disponibles :

### API (dans le dossier `/api`)
- `npm install` : Installe les dépendances
- `npm run dev` : Démarre le serveur en mode développement
- `npm start` : Démarre le serveur en mode production
- `npm test` : Lance les tests
- `npm run lint` : Vérifie le style du code

### Web (dans le dossier `/web/supchat-web`)
- `npm install` : Installe les dépendances
- `npm run serve` : Démarre le serveur de développement
- `npm run build` : Compile pour la production
- `npm run test:unit` : Lance les tests unitaires
- `npm run lint` : Vérifie le style du code

## Commandes Docker Utiles

### Gestion des Conteneurs
```bash
# Voir les conteneurs en cours d'exécution
docker ps

# Voir les logs d'un conteneur spécifique
docker logs supchat-api
docker logs supchat-web

# Redémarrer un conteneur
docker-compose restart api
docker-compose restart web

# Reconstruire un service spécifique
docker-compose up --build api
docker-compose up --build web
```

### Maintenance
```bash
# Nettoyer les images non utilisées
docker image prune -a

# Nettoyer les volumes non utilisés
docker volume prune

# Voir l'utilisation des ressources
docker stats
```

### Base de Données
```bash
# Accéder au shell MongoDB
docker-compose exec mongodb mongosh

# Sauvegarder la base de données
docker-compose exec mongodb mongodump --out /backup

# Restaurer la base de données
docker-compose exec mongodb mongorestore /backup
```

## Structure du Projet

```
supchat/
├── api/                # API Node.js
│   ├── src/           # Code source
│   ├── tests/         # Tests
│   ├── Dockerfile     # Configuration Docker
│   └── package.json   # Dépendances
├── web/               # Application Vue.js
│   └── supchat-web/   # Frontend Vue.js
│       ├── src/       # Code source
│       ├── Dockerfile # Configuration Docker
│       └── nginx.conf # Configuration Nginx
├── mobile/            # Application Kotlin
├── docker-compose.yml # Configuration Docker Compose
├── CDC.md            # Cahier des charges
├── DEVBOOK.md        # Suivi du développement
└── README.md         # Documentation
```

## Résolution des problèmes courants

### Erreur de connexion à MongoDB
1. Vérifiez que MongoDB est en cours d'exécution
2. Vérifiez que l'URI MongoDB dans `.env` est correct
3. Assurez-vous que l'utilisateur MongoDB a les bonnes permissions

### Erreur d'envoi d'email
1. Vérifiez vos identifiants Mailtrap dans `.env`
2. Assurez-vous que les variables SMTP_USER et SMTP_PASS sont correctement définies

### Problèmes avec Docker
1. Vérifiez que Docker et Docker Compose sont installés et en cours d'exécution
2. Nettoyez les conteneurs et images existants :
```bash
docker-compose down
```

## Tests

*À venir - Les commandes pour exécuter les tests*

## 📝 Documentation API

La documentation de l'API est disponible via Swagger UI à l'adresse : http://localhost:3000/api-docs

## 🤝 Contribution

1. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
2. Committez vos changements (`git commit -am 'Ajout de ma fonctionnalité'`)
3. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
4. Créez une Pull Request

## Licence

*À définir*

---
*Ce README sera mis à jour régulièrement avec les nouvelles informations au fur et à mesure de l'avancement du projet.*
