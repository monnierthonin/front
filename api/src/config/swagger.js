const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SUPCHAT',
      version: '1.0.0',
      description: 'API de messagerie professionnelle SUPCHAT',
      contact: {
        name: 'Support SUPCHAT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints d\'authentification',
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs',
      },
      {
        name: 'Workspaces',
        description: 'Gestion des espaces de travail',
      },
      {
        name: 'Channels',
        description: 'Gestion des canaux',
      },
      {
        name: 'Messages',
        description: 'Gestion des messages',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Chemins des fichiers contenant les annotations Swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
