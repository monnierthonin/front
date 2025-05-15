const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SUPCHAT API',
            version: '1.0.0',
            description: 'Documentation de l\'API SUPCHAT'
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
                    bearerFormat: 'JWT',
                    description: 'Entrez votre token JWT ici'
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    apis: [
        './src/docs/*.swagger.js',
        './src/routes/*.js'
    ]
};

module.exports = swaggerJsdoc(options);
