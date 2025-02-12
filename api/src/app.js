const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const configurerSwagger = require('./middleware/swagger');
const indexRouter = require('./routes/index');
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
configurerSwagger(app);

// Routes
app.use('/', indexRouter);

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
