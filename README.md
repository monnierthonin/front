# SUPCHAT

Application de messagerie professionnelle basée sur une architecture client-serveur, utilisant Node.js (API), Vue.js (Web), Kotlin (Mobile) et MongoDB.

## 🚧 État du Projet

Ce projet est actuellement en phase de développement initial. Les fonctionnalités sont implémentées progressivement selon le plan défini dans le fichier `DEVBOOK.md`.

## 📋 Prérequis

*Cette section sera mise à jour au fur et à mesure que de nouvelles dépendances seront ajoutées.*

- Git
- Node.js (dernière version LTS)
- MongoDB
- Docker et Docker Compose
- Vue.js CLI
- Android Studio (pour le développement mobile)

## 🛠️ Installation

1. Cloner le repository
```bash
git clone https://github.com/alexandre-juillard/3proj_SUPCHAT.git
cd supchat
```

## 📁 Structure du Projet

```
supchat/
├── api/                # API Node.js
├── web/               # Application Vue.js
├── mobile/            # Application Kotlin
├── CDC.md            # Cahier des charges
├── DEVBOOK.md        # Suivi du développement
└── README.md         # Documentation
```

## 🚀 Démarrage

*Les commandes de démarrage seront ajoutées au fur et à mesure du développement de chaque composant.*

### Développement

#### Démarrer l'API (Node.js)
```powershell
cd api
npm run dev
```

L'API sera accessible sur :
- API : http://localhost:3000
- Documentation Swagger : http://localhost:3000/api-docs
- Spécification OpenAPI : http://localhost:3000/api-docs.json

### Production avec Docker

Pour démarrer tous les services avec Docker :
```powershell
docker-compose up -d
```

Pour arrêter les services :
```powershell
docker-compose down
```

## Tests

*À venir - Les commandes pour exécuter les tests*

## 📝 Documentation API

La documentation de l'API est disponible via Swagger UI à l'adresse : http://localhost:3000/api-docs

## 🤝 Contribution

1. Créer une branche pour votre fonctionnalité
```powershell
git checkout -b feature/nom-de-la-fonctionnalite
```

2. Commiter vos changements
```powershell
git add .
git commit -m "description: Description des changements"
```

3. Pousser vers la branche
```powershell
git push origin feature/nom-de-la-fonctionnalite
```

4. Ouvrir une Pull Request

## 📜 Licence

*À définir*

---
*Ce README sera mis à jour régulièrement avec les nouvelles informations au fur et à mesure de l'avancement du projet.*
