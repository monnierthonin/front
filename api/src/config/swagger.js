const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SupChat API',
      version: '1.0.0',
      description: 'API de messagerie instantanée SupChat',
      contact: {
        name: 'Support SUPCHAT',
        email: 'support@supchat.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/docs/auth.swagger.js',
    './src/docs/user.swagger.js',
    './src/docs/workspace.swagger.js',
    './src/docs/canal.swagger.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
