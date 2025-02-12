const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors());

// Parser pour le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SUPCHAT',
      version: '1.0.0',
      description: 'Documentation de l\'API SUPCHAT',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Chemins vers les fichiers contenant les annotations Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API SUPCHAT' });
});

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

module.exports = app;
