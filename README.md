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

### 2. Configuration de l'environnement

#### API (Backend)
```bash
cd api

# Installer les dépendances
npm install

# Copier le fichier d'environnement exemple
cp .env.example .env

# Éditer le fichier .env avec vos configurations
# Notamment :
# - MONGODB_URI
# - JWT_SECRET
# - SMTP_USER et SMTP_PASS (depuis Mailtrap)
```

#### Web (Frontend)
```bash
cd web

# Installer les dépendances
npm install

# Copier le fichier d'environnement exemple
cp .env.example .env
```

## Démarrage

### Mode Développement

#### Démarrer l'API (Node.js)
```bash
cd api
npm run dev
```

L'API sera accessible sur `http://localhost:3000`

#### Démarrer le Frontend (Vue.js)
```bash
cd web
npm run serve
```

Le frontend sera accessible sur `http://localhost:8080`

### Mode Production avec Docker

#### 1. Builder et démarrer les conteneurs
```bash
# À la racine du projet
docker-compose build
docker-compose up -d
```

Les services seront accessibles sur :
- API : `http://localhost:3000`
- Frontend : `http://localhost:8080`

#### 2. Vérifier les logs
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f api
docker-compose logs -f web
```

#### 3. Arrêter les conteneurs
```bash
docker-compose down
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
├── mobile/            # Application Kotlin
├── docker-compose.yml # Configuration Docker Compose
├── CDC.md            # Cahier des charges
├── DEVBOOK.md        # Suivi du développement
└── README.md         # Documentation
```

## Scripts Disponibles

### API (dans le dossier `/api`)
- `npm install` : Installe les dépendances
- `npm run dev` : Démarre le serveur en mode développement
- `npm start` : Démarre le serveur en mode production
- `npm test` : Lance les tests
- `npm run lint` : Vérifie le style du code

### Web (dans le dossier `/web`)
- `npm install` : Installe les dépendances
- `npm run serve` : Démarre le serveur de développement
- `npm run build` : Compile pour la production
- `npm run test:unit` : Lance les tests unitaires
- `npm run lint` : Vérifie le style du code

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
