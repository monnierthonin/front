const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const configJWT = require('../config/jwt');
const Canal = require('../models/canal');
const Workspace = require('../models/workspace');

class ServiceSocket {
    constructor() {
        this.io = null;
        this.utilisateursConnectes = new Map();
    }

    initialiser(serveur) {
        console.log('Initialisation du service Socket.IO');
        this.io = socketIO(serveur, {
            cors: {
                origin: process.env.NODE_ENV === 'production' 
                    ? process.env.FRONTEND_URL 
                    : ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000'],
                methods: ["GET", "POST"],
                credentials: true,
                allowedHeaders: ["Authorization", "Content-Type"]
            },
            transports: ['websocket']
        });
        console.log('Socket.IO initialisé avec la configuration CORS:', this.io.opts.cors);

        this.io.use(async (socket, next) => {
            try {
                console.log('Tentative de connexion WebSocket');
                const token = socket.handshake.auth.token;
                if (!token) {
                    console.log('Pas de token fourni');
                    return next(new Error('Erreur d\'authentification: pas de token'));
                }
                
                console.log('Token reçu:', token);
                const decodage = jwt.verify(token, configJWT.secret);
                socket.idUtilisateur = decodage.id;
                console.log('Authentification réussie pour l\'utilisateur:', decodage.id);
                next();
            } catch (error) {
                console.error('Erreur d\'authentification:', error.message);
                next(new Error('Erreur d\'authentification: ' + error.message));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`Utilisateur connecté: ${socket.idUtilisateur}`);
            this.utilisateursConnectes.set(socket.idUtilisateur, socket.id);

            // Gérer la connexion à un canal
            socket.on('rejoindre-canal', async ({ canalId }) => {
                try {
                    console.log(`Tentative de rejoindre le canal ${canalId} par l'utilisateur ${socket.idUtilisateur}`);
                    
                    // Vérifier l'accès au canal
                    const canal = await Canal.findById(canalId);
                    if (!canal) {
                        console.error(`Canal ${canalId} non trouvé`);
                        return;
                    }

                    const estMembre = canal.membres.some(membre => 
                        membre.utilisateur.toString() === socket.idUtilisateur
                    );

                    if (!estMembre) {
                        console.error(`Utilisateur ${socket.idUtilisateur} non autorisé pour le canal ${canalId}`);
                        return;
                    }

                    // Rejoindre la room du canal
                    socket.join(`canal:${canalId}`);
                    console.log(`Utilisateur ${socket.idUtilisateur} a rejoint le canal ${canalId}`);
                } catch (error) {
                    console.error('Erreur lors de la connexion au canal:', error);
                }
            });

            // Test d'écho
            socket.on('tester-echo', (message) => {
                console.log('Message écho reçu:', message);
                this.io.emit('echo-reponse', {
                    message: message,
                    timestamp: new Date(),
                    from: socket.idUtilisateur
                });
            });

            // Rejoindre les canaux d'un workspace
            socket.on('rejoindre-workspace', async (idWorkspace) => {
                try {
                    const workspace = await Workspace.findById(idWorkspace);
                    if (!workspace) return;

                    const canaux = await Canal.find({ workspace: idWorkspace });
                    canaux.forEach(canal => {
                        socket.join(`canal:${canal._id}`);
                    });
                } catch (erreur) {
                    console.error('Erreur lors de la connexion au workspace:', erreur);
                }
            });

            // Gérer la déconnexion
            socket.on('disconnect', () => {
                console.log(`Utilisateur déconnecté: ${socket.idUtilisateur}`);
                this.utilisateursConnectes.delete(socket.idUtilisateur);
            });
        });
    }

    // Méthode pour émettre un message à un canal spécifique
    emitToCanal(idCanal, evenement, donnees) {
        if (!this.io) {
            console.error('Socket.IO n\'est pas initialisé');
            return;
        }
        const room = `canal:${idCanal}`;
        console.log(`Émission de l'événement ${evenement} au canal ${idCanal}:`, donnees);
        
        // Vérifier si la room existe et a des clients
        const sockets = this.io.sockets.adapter.rooms.get(room);
        console.log(`Nombre de clients dans le canal ${idCanal}:`, sockets ? sockets.size : 0);
        
        this.io.to(room).emit(evenement, donnees);
        console.log(`Événement ${evenement} émis au canal ${idCanal}`);
    }

    // Méthode pour émettre un message à un utilisateur spécifique
    emitToUser(idUtilisateur, evenement, donnees) {
        if (!this.io) {
            console.error('Socket.IO n\'est pas initialisé');
            return;
        }
        const socketId = this.utilisateursConnectes.get(idUtilisateur);
        if (socketId) {
            console.log(`Émission de l'événement ${evenement} à l'utilisateur ${idUtilisateur}:`, donnees);
            this.io.to(socketId).emit(evenement, donnees);
        }
    }

    // Méthode pour faire rejoindre un canal à un utilisateur
    joinCanal(idUtilisateur, idCanal) {
        const socketId = this.utilisateursConnectes.get(idUtilisateur);
        if (socketId) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(`canal:${idCanal}`);
                console.log(`Utilisateur ${idUtilisateur} a rejoint le canal ${idCanal}`);
            }
        }
    }

    // Méthode pour faire quitter un canal à un utilisateur
    leaveCanal(idUtilisateur, idCanal) {
        const socketId = this.utilisateursConnectes.get(idUtilisateur);
        if (socketId) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(`canal:${idCanal}`);
                console.log(`Utilisateur ${idUtilisateur} a quitté le canal ${idCanal}`);
            }
        }
    }
}

module.exports = new ServiceSocket();
