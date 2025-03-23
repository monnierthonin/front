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
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
                allowedHeaders: ["Authorization", "Content-Type"]
            }
        });

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

            // Test d'écho
            socket.on('tester-echo', (message) => {
                console.log('Message écho reçu:', message);
                // Diffuser l'écho à tous les clients
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

            // Gérer les nouveaux messages
            socket.on('envoyer-message', async (donnees) => {
                try {
                    const { idCanal, contenu, type = 'texte' } = donnees;
                    
                    const message = {
                        expediteur: socket.idUtilisateur,
                        contenu,
                        type,
                        horodatage: new Date()
                    };

                    console.log('Message reçu:', message);

                    // Pour le test, on diffuse à tous les clients
                    this.io.emit('nouveau-message', {
                        ...message,
                        idCanal
                    });
                } catch (erreur) {
                    console.error('Erreur lors de l\'envoi du message:', erreur);
                }
            });

            // Gérer les indicateurs de frappe
            socket.on('debut-frappe', ({ idCanal }) => {
                socket.to(`canal:${idCanal}`).emit('utilisateur-frappe', {
                    idUtilisateur: socket.idUtilisateur,
                    idCanal
                });
            });

            socket.on('fin-frappe', ({ idCanal }) => {
                socket.to(`canal:${idCanal}`).emit('utilisateur-arrete-frappe', {
                    idUtilisateur: socket.idUtilisateur,
                    idCanal
                });
            });

            // Gérer la déconnexion
            socket.on('disconnect', () => {
                console.log(`Utilisateur déconnecté: ${socket.idUtilisateur}`);
                this.utilisateursConnectes.delete(socket.idUtilisateur);
            });
        });
    }

    // Méthodes utilitaires
    obtenirIdSocketUtilisateur(idUtilisateur) {
        return this.utilisateursConnectes.get(idUtilisateur);
    }

    emettreVersUtilisateur(idUtilisateur, evenement, donnees) {
        const idSocket = this.obtenirIdSocketUtilisateur(idUtilisateur);
        if (idSocket) {
            this.io.to(idSocket).emit(evenement, donnees);
        }
    }

    emettreVersCanal(idCanal, evenement, donnees) {
        this.io.to(`canal:${idCanal}`).emit(evenement, donnees);
    }
}

module.exports = new ServiceSocket();
