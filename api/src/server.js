const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const initialiserBaseDeDonnees = require('./config/database');

// Configuration du port
const PORT = process.env.PORT || 3000;

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration de Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Initialisation de la base de données
initialiserBaseDeDonnees();

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Un client s\'est connecté');

  socket.on('disconnect', () => {
    console.log('Un client s\'est déconnecté');
  });
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
