const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { app, serveur } = require('./app');
const initialiserBaseDeDonnees = require('./config/database');

// Charger les variables d'environnement
dotenv.config();

// Configuration du port
const port = process.env.PORT || 3000;

// Initialisation de la base de données
initialiserBaseDeDonnees();

// Démarrage du serveur
serveur.listen(port, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${port}`);
  console.log(`Pour accéder depuis un émulateur Android, utilisez http://10.0.2.2:${port}`);
});
