const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

/**
 * Configure le middleware Swagger UI pour Express
 * @param {Express} app - L'application Express
 */
const configurerSwagger = (app) => {
  // Options de personnalisation de l'interface Swagger
  const options = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Documentation API SUPCHAT',
    customfavIcon: '/favicon.ico',
  };

  // Route pour la documentation Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, options));

  // Route pour télécharger la spécification OpenAPI en JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = configurerSwagger;
