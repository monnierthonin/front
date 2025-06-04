const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const configJWT = require('../config/jwt');
const MessagePrivate = require('../models/messagePrivate');
const Message = require('../models/message');
const Canal = require('../models/canal');
const User = require('../models/user');
const Notification = require('../models/notification');
const notificationService = require('./notificationService');

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
            
            // Rejoindre la room personnelle pour les messages privés
            socket.join(`user:${socket.idUtilisateur}`);
            console.log(`Utilisateur ${socket.idUtilisateur} a rejoint sa room personnelle`);
            
            // Rejoindre les rooms des conversations dont l'utilisateur est membre
            this.rejoindreConversations(socket);
            
            // Gérer les messages privés
            socket.on('envoyer-message-prive', async ({ destinataireId, contenu, reponseA }) => {
                try {
                    console.log(`Tentative d'envoi de message privé à ${destinataireId} par ${socket.idUtilisateur}`);
                    
                    if (!contenu || contenu.trim() === '') {
                        socket.emit('erreur-message-prive', {
                            message: 'Le contenu du message ne peut pas être vide'
                        });
                        return;
                    }
                    
                    // Créer le nouveau message
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
            
            // Gérer les messages de conversation de groupe
            socket.on('envoyer-message-conversation', async ({ conversationId, contenu, reponseA }) => {
                try {
                    console.log(`Tentative d'envoi de message dans la conversation ${conversationId} par ${socket.idUtilisateur}`);
                    
                    if (!contenu || contenu.trim() === '') {
                        socket.emit('erreur-message-conversation', {
                            message: 'Le contenu du message ne peut pas être vide'
                        });
                        return;
                    }
                    
                    const ConversationPrivee = require('../models/conversationPrivee');
                    const MessageConversation = require('../models/messageConversation');
                    
                    // Vérifier si la conversation existe et si l'utilisateur est participant
                    const conversation = await ConversationPrivee.findById(conversationId);
                    if (!conversation) {
                        socket.emit('erreur-message-conversation', {
                            message: 'Conversation non trouvée'
                        });
                        return;
                    }
                    
                    if (!conversation.estParticipant(socket.idUtilisateur)) {
                        socket.emit('erreur-message-conversation', {
                            message: 'Vous n\'êtes pas participant à cette conversation'
                        });
                        return;
                    }
                    
                    // Créer le nouveau message
                    const nouveauMessage = await MessageConversation.create({
                        contenu,
                        expediteur: socket.idUtilisateur,
                        conversation: conversationId,
                        reponseA: reponseA || null
                    });
                    
                    // Peupler les références pour la réponse
                    const messagePopule = await MessageConversation.findById(nouveauMessage._id)
                        .populate('expediteur', 'username firstName lastName profilePicture')
                        .populate({
                            path: 'reponseA',
                            populate: {
                                path: 'expediteur',
                                select: 'username firstName lastName profilePicture'
                            }
                        });
                    
                    // Émettre l'événement à tous les participants de la conversation
                    this.io.to(`conversation:${conversationId}`).emit('nouveau-message-conversation', messagePopule);
                    
                    console.log(`Message envoyé avec succès dans la conversation ${conversationId}`);
                } catch (error) {
                    console.error('Erreur lors de l\'envoi du message dans la conversation:', error);
                    socket.emit('erreur-message-conversation', {
                        message: 'Erreur lors de l\'envoi du message',
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
                            message: 'Vous n\'êtes pas autorisé à modifier ce message',
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
                            message: 'Vous n\'êtes pas autorisé à supprimer ce message',
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
            
            // Gérer les notifications
            socket.on('notification:marquer-lue', async ({ notificationId }) => {
                try {
                    console.log(`Marquage de la notification ${notificationId} comme lue par ${socket.idUtilisateur}`);
                    await notificationService.marquerCommeLue(notificationId, socket.idUtilisateur);
                    
                    // Confirmer la lecture de la notification
                    socket.emit('notification:lue', { notificationId });
                } catch (error) {
                    console.error('Erreur lors du marquage de la notification comme lue:', error);
                    socket.emit('erreur', {
                        message: 'Erreur lors du marquage de la notification comme lue',
                        error: error.message
                    });
                }
            });
            
            socket.on('notification:marquer-toutes-lues-canal', async ({ canalId }) => {
                try {
                    console.log(`Marquage de toutes les notifications du canal ${canalId} comme lues par ${socket.idUtilisateur}`);
                    const resultat = await notificationService.marquerToutesCommeLues(canalId, socket.idUtilisateur);
                    
                    // Confirmer la lecture des notifications
                    socket.emit('notification:toutes-lues', { canalId, count: resultat.count });
                } catch (error) {
                    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
                    socket.emit('erreur', {
                        message: 'Erreur lors du marquage de toutes les notifications comme lues',
                        error: error.message
                    });
                }
            });
            
            socket.on('notification:marquer-toutes-lues-conversation', async ({ conversationId }) => {
                try {
                    console.log(`Marquage de toutes les notifications de la conversation ${conversationId} comme lues par ${socket.idUtilisateur}`);
                    const resultat = await notificationService.marquerToutesConversationCommeLues(conversationId, socket.idUtilisateur);
                    
                    // Confirmer la lecture des notifications
                    socket.emit('notification:toutes-lues', { conversationId, count: resultat.count });
                } catch (error) {
                    console.error('Erreur lors du marquage de toutes les notifications de conversation comme lues:', error);
                    socket.emit('erreur', {
                        message: 'Erreur lors du marquage de toutes les notifications de conversation comme lues',
                        error: error.message
                    });
                }
            });
            
            socket.on('notification:get-preferences', async () => {
                try {
                    console.log(`Récupération des préférences de notification pour ${socket.idUtilisateur}`);
                    const user = await User.findById(socket.idUtilisateur).select('preferences.notifications');
                    
                    if (!user) {
                        throw new Error('Utilisateur non trouvé');
                    }
                    
                    // Valeurs par défaut si les préférences n'existent pas encore
                    const preferences = user.preferences?.notifications || {
                        mentionsOnly: false,
                        soundEnabled: true,
                        desktopEnabled: true
                    };
                    
                    // Envoyer les préférences à l'utilisateur
                    socket.emit('notification:preferences-updated', preferences);
                } catch (error) {
                    console.error('Erreur lors de la récupération des préférences de notification:', error);
                    socket.emit('erreur', {
                        message: 'Erreur lors de la récupération des préférences de notification',
                        error: error.message
                    });
                }
            });
            
            socket.on('notification:update-preferences', async (preferences) => {
                try {
                    console.log(`Mise à jour des préférences de notification pour ${socket.idUtilisateur}:`, preferences);
                    
                    // Vérifier que les valeurs sont bien des booléens
                    const { mentionsOnly, soundEnabled, desktopEnabled } = preferences;
                    const updateObj = {};
                    
                    if (mentionsOnly !== undefined && typeof mentionsOnly === 'boolean') {
                        updateObj['preferences.notifications.mentionsOnly'] = mentionsOnly;
                    }
                    
                    if (soundEnabled !== undefined && typeof soundEnabled === 'boolean') {
                        updateObj['preferences.notifications.soundEnabled'] = soundEnabled;
                    }
                    
                    if (desktopEnabled !== undefined && typeof desktopEnabled === 'boolean') {
                        updateObj['preferences.notifications.desktopEnabled'] = desktopEnabled;
                    }
                    
                    // Mettre à jour l'utilisateur
                    const user = await User.findByIdAndUpdate(
                        socket.idUtilisateur,
                        { $set: updateObj },
                        { new: true, runValidators: true }
                    ).select('preferences.notifications');
                    
                    if (!user) {
                        throw new Error('Utilisateur non trouvé');
                    }
                    
                    // Envoyer les préférences mises à jour à l'utilisateur
                    socket.emit('notification:preferences-updated', user.preferences?.notifications);
                } catch (error) {
                    console.error('Erreur lors de la mise à jour des préférences de notification:', error);
                    socket.emit('erreur', {
                        message: 'Erreur lors de la mise à jour des préférences de notification',
                        error: error.message
                    });
                }
            });
            
            socket.on('notification:charger', async () => {
                try {
                    console.log(`Chargement des notifications pour ${socket.idUtilisateur}`);
                    const notifications = await notificationService.getNonLues(socket.idUtilisateur);
                    
                    // Envoyer les notifications à l'utilisateur
                    socket.emit('notification:liste', { notifications });
                } catch (error) {
                    console.error('Erreur lors du chargement des notifications:', error);
                    socket.emit('erreur', {
                        message: 'Erreur lors du chargement des notifications',
                        error: error.message
                    });
                }
            });
            
            // Gérer la déconnexion
            socket.on('disconnect', () => {
                console.log(`Utilisateur déconnecté: ${socket.idUtilisateur}`);
                this.utilisateursConnectes.delete(socket.idUtilisateur);
            });
        });
    }

    // Fonction pour que l'utilisateur rejoigne les rooms de ses conversations
    async rejoindreConversations(socket) {
        try {
            const ConversationPrivee = require('../models/conversationPrivee');
            
            // Trouver toutes les conversations dont l'utilisateur est membre
            const conversations = await ConversationPrivee.find({
                'participants.utilisateur': socket.idUtilisateur
            });
            
            // Rejoindre chaque conversation
            conversations.forEach(conversation => {
                socket.join(`conversation:${conversation._id}`);
                console.log(`Utilisateur ${socket.idUtilisateur} a rejoint la conversation ${conversation._id}`);
            });
            
            console.log(`Utilisateur ${socket.idUtilisateur} a rejoint ${conversations.length} conversations`);
        } catch (error) {
            console.error('Erreur lors de la connexion aux conversations:', error);
        }
    }

    // Fonction pour émettre un message à un canal
    emitToCanal(canalId, evenement, donnees) {
        if (this.io) {
            this.io.to(`canal:${canalId}`).emit(evenement, donnees);
        } else {
            console.error('Socket.IO n\'est pas initialisé');
        }
    }

    // Fonction pour émettre un message à un utilisateur
    emitToUser(userId, evenement, donnees) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(evenement, donnees);
        } else {
            console.error('Socket.IO n\'est pas initialisé');
        }
    }
    
    // Fonction pour émettre un message à tous les participants d'une conversation
    emitToConversation(conversationId, evenement, donnees) {
        if (this.io) {
            this.io.to(`conversation:${conversationId}`).emit(evenement, donnees);
        } else {
            console.error('Socket.IO n\'est pas initialisé');
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
