const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const configJWT = require('../config/jwt');
const Canal = require('../models/canal');
const Workspace = require('../models/workspace');
const MessagePrivate = require('../models/messagePrivate');

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

            // Rejoindre la room personnelle pour les messages privés
            socket.join(`user:${socket.idUtilisateur}`);
            console.log(`Utilisateur ${socket.idUtilisateur} a rejoint sa room personnelle`);
            
            // Gérer les messages privés
            socket.on('envoyer-message-prive', async ({ destinataireId, contenu, reponseA }) => {
                try {
                    console.log(`Tentative d'envoi de message privé à ${destinataireId} par ${socket.idUtilisateur}`);
                    
                    // Créer le message privé
                    const nouveauMessage = await MessagePrivate.create({
                        contenu,
                        expediteur: socket.idUtilisateur,
                        destinataire: destinataireId,
                        reponseA: reponseA || null,
                        envoye: true,
                        lu: false
                    });
                    
                    // Peupler les références pour la réponse
                    const messagePopule = await MessagePrivate.findById(nouveauMessage._id)
                        .populate('expediteur', 'username firstName lastName profilePicture')
                        .populate('destinataire', 'username firstName lastName profilePicture')
                        .populate({
                            path: 'reponseA',
                            populate: {
                                path: 'expediteur',
                                select: 'username firstName lastName profilePicture'
                            }
                        });
                    
                    // Émettre l'événement au destinataire
                    this.io.to(`user:${destinataireId}`).emit('nouveau-message-prive', messagePopule);
                    
                    // Confirmer l'envoi à l'expéditeur
                    socket.emit('message-prive-envoye', {
                        messageId: nouveauMessage._id,
                        envoye: true
                    });
                    
                    console.log(`Message privé envoyé avec succès à ${destinataireId}`);
                } catch (error) {
                    console.error('Erreur lors de l\'envoi du message privé:', error);
                    socket.emit('erreur-message-prive', {
                        message: 'Erreur lors de l\'envoi du message privé',
                        error: error.message
                    });
                }
            });
            
            // Marquer un message privé comme lu
            socket.on('marquer-message-lu', async ({ messageId }) => {
                try {
                    console.log(`Tentative de marquer le message ${messageId} comme lu par ${socket.idUtilisateur}`);
                    
                    // Vérifier si le message existe
                    const message = await MessagePrivate.findById(messageId);
                    if (!message) {
                        console.error(`Message ${messageId} non trouvé`);
                        return;
                    }
                    
                    // Vérifier que l'utilisateur est bien le destinataire du message
                    if (message.destinataire.toString() !== socket.idUtilisateur) {
                        console.error(`Utilisateur ${socket.idUtilisateur} non autorisé à marquer ce message comme lu`);
                        return;
                    }
                    
                    // Marquer le message comme lu
                    message.lu = true;
                    await message.save();
                    
                    // Notifier l'expéditeur
                    this.io.to(`user:${message.expediteur.toString()}`).emit('message-prive-lu', {
                        messageId: message._id,
                        lu: true
                    });
                    
                    console.log(`Message ${messageId} marqué comme lu avec succès`);
                } catch (error) {
                    console.error('Erreur lors du marquage du message comme lu:', error);
                }
            });
            
            // Modifier un message privé
            socket.on('modifier-message-prive', async ({ messageId, contenu }) => {
                try {
                    console.log(`Tentative de modification du message ${messageId} par ${socket.idUtilisateur}`);
                    
                    if (!contenu || contenu.trim() === '') {
                        socket.emit('erreur-message-prive', {
                            message: 'Le contenu du message ne peut pas être vide',
                            messageId
                        });
                        return;
                    }
                    
                    // Vérifier si le message existe
                    const message = await MessagePrivate.findById(messageId);
                    if (!message) {
                        console.error(`Message ${messageId} non trouvé`);
                        socket.emit('erreur-message-prive', {
                            message: 'Message non trouvé',
                            messageId
                        });
                        return;
                    }
                    
                    // Vérifier que l'utilisateur est bien l'expéditeur du message
                    if (message.expediteur.toString() !== socket.idUtilisateur) {
                        console.error(`Utilisateur ${socket.idUtilisateur} non autorisé à modifier ce message`);
                        socket.emit('erreur-message-prive', {
                            message: 'Vous n\'\u00eates pas autorisé à modifier ce message',
                            messageId
                        });
                        return;
                    }
                    
                    // Mettre à jour le message
                    message.contenu = contenu;
                    message.modifie = true;
                    message.dateModification = Date.now();
                    await message.save();
                    
                    // Peupler les références pour la réponse
                    const messagePopule = await MessagePrivate.findById(message._id)
                        .populate('expediteur', 'username firstName lastName profilePicture')
                        .populate('destinataire', 'username firstName lastName profilePicture')
                        .populate({
                            path: 'reponseA',
                            populate: {
                                path: 'expediteur',
                                select: 'username firstName lastName profilePicture'
                            }
                        });
                    
                    // Notifier le destinataire
                    this.io.to(`user:${message.destinataire.toString()}`).emit('message-prive-modifie', messagePopule);
                    
                    // Confirmer la modification à l'expéditeur
                    socket.emit('message-prive-modifie', messagePopule);
                    
                    console.log(`Message ${messageId} modifié avec succès`);
                } catch (error) {
                    console.error('Erreur lors de la modification du message:', error);
                    socket.emit('erreur-message-prive', {
                        message: 'Erreur lors de la modification du message',
                        error: error.message,
                        messageId
                    });
                }
            });
            
            // Supprimer un message privé
            socket.on('supprimer-message-prive', async ({ messageId }) => {
                try {
                    console.log(`Tentative de suppression du message ${messageId} par ${socket.idUtilisateur}`);
                    
                    // Vérifier si le message existe
                    const message = await MessagePrivate.findById(messageId);
                    if (!message) {
                        console.error(`Message ${messageId} non trouvé`);
                        socket.emit('erreur-message-prive', {
                            message: 'Message non trouvé',
                            messageId
                        });
                        return;
                    }
                    
                    // Vérifier que l'utilisateur est bien l'expéditeur du message
                    if (message.expediteur.toString() !== socket.idUtilisateur) {
                        console.error(`Utilisateur ${socket.idUtilisateur} non autorisé à supprimer ce message`);
                        socket.emit('erreur-message-prive', {
                            message: 'Vous n\'\u00eates pas autorisé à supprimer ce message',
                            messageId
                        });
                        return;
                    }
                    
                    // Sauvegarder l'ID du destinataire avant de supprimer le message
                    const destinataireId = message.destinataire.toString();
                    
                    // Supprimer le message
                    await MessagePrivate.findByIdAndDelete(messageId);
                    
                    // Notifier le destinataire
                    this.io.to(`user:${destinataireId}`).emit('message-prive-supprime', {
                        messageId
                    });
                    
                    // Confirmer la suppression à l'expéditeur
                    socket.emit('message-prive-supprime', {
                        messageId
                    });
                    
                    console.log(`Message ${messageId} supprimé avec succès`);
                } catch (error) {
                    console.error('Erreur lors de la suppression du message:', error);
                    socket.emit('erreur-message-prive', {
                        message: 'Erreur lors de la suppression du message',
                        error: error.message,
                        messageId
                    });
                }
            });
            
            // Marquer un message privé comme lu
            socket.on('marquer-message-lu', async ({ messageId }) => {
                try {
                    console.log(`Tentative de marquer le message ${messageId} comme lu par ${socket.idUtilisateur}`);
                    
                    // Vérifier si le message existe
                    const message = await MessagePrivate.findById(messageId);
                    if (!message) {
                        console.error(`Message ${messageId} non trouvé`);
                        return;
                    }
                    
                    // Vérifier que l'utilisateur est bien le destinataire du message
                    if (message.destinataire.toString() !== socket.idUtilisateur) {
                        console.error(`Utilisateur ${socket.idUtilisateur} non autorisé à marquer ce message comme lu`);
                        return;
                    }
                    
                    // Marquer le message comme lu
                    message.lu = true;
                    await message.save();
                    
                    // Notifier l'expéditeur
                    this.io.to(`user:${message.expediteur.toString()}`).emit('message-prive-lu', {
                        messageId: message._id,
                        lu: true
                    });
                    
                    console.log(`Message ${messageId} marqué comme lu avec succès`);
                } catch (error) {
                    console.error('Erreur lors du marquage du message comme lu:', error);
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
