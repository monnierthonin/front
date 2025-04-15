const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const env = dotenv.config();
dotenvExpand.expand(env);
const path = require('path'); // Importer le module path

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('./config/passport'); // Importer la configuration Passport
const configurerSwagger = require('./middleware/swagger');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/userRoutes');
const workspaceRouter = require('./routes/workspaceRoutes');
const http = require('http');
const serviceSocket = require('./services/serviceSocket');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const AppError = require('./utils/appError');

// Initialisation de l'application Express
const app = express();
const serveur = http.createServer(app);

// Configuration CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Middleware de base
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware de sécurité avec configuration adaptée pour les images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:3000"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.socket.io"],
      connectSrc: ["'self'", "ws://localhost:3000", "wss://localhost:3000", "http://localhost:3000", "http://localhost:3001"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"]
    }
  }
}));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Servir les fichiers statiques du dossier uploads avec CORS
app.use('/uploads', cors(corsOptions), express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Initialisation de Passport
app.use(passport.initialize());

// Configuration Swagger
configurerSwagger(app);
require('./docs/auth.swagger');
require('./docs/user.swagger');
require('./docs/workspace.swagger');

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialiser Socket.IO
serviceSocket.initialiser(serveur);
app.set('socketService', serviceSocket);

// Routes
app.use('/', indexRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/workspaces', workspaceRouter);

// Gestion des erreurs 404
app.use((req, res, next) => {
    const err = new AppError(`Route non trouvée: ${req.originalUrl}`, 404);
    next(err);
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Si c'est une requête API
    if (req.path.startsWith('/api/')) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Pour les autres requêtes (pages HTML, etc.)
    res.status(err.statusCode).send(err.message);
});

// Exporter l'application et le serveur
module.exports = { app, serveur };
