const Notification = require('../models/notification');
const Message = require('../models/message');
const Canal = require('../models/canal');
const MessagePrivate = require('../models/messagePrivate');
const serviceSocket = require('./serviceSocket');

/**
 * Service pour gérer les notifications
 */
class NotificationService {
    /**
     * Crée une notification pour un nouveau message dans un canal
     * @param {Object} message - Le message envoyé
     * @param {Object} canal - Le canal dans lequel le message a été envoyé
     */
    async creerNotificationMessageCanal(message, canal) {
        try {
            // Récupérer tous les membres du canal sauf l'auteur du message
            const membresANotifier = canal.membres
                .filter(membre => membre.utilisateur.toString() !== message.auteur.toString())
                .map(membre => membre.utilisateur);

            // Créer une notification pour chaque membre
            const notifications = await Promise.all(
                membresANotifier.map(async (userId) => {
                    // Vérifier si l'utilisateur a déjà lu le message
                    const dejaLu = message.lecteurs.some(
                        lecteur => lecteur.utilisateur.toString() === userId.toString() && lecteur.lu
                    );

                    if (dejaLu) return null;

                    // Créer la notification
                    const notification = await Notification.create({
                        utilisateur: userId,
                        type: 'canal',
                        reference: canal._id,
                        onModel: 'Canal',
                        message: message._id,
                        lu: false
                    });

                    // Incrémenter le compteur de messages non lus pour cet utilisateur dans ce canal
                    await canal.incrementerMessagesNonLus(userId, message);

                    return notification;
                })
            );

            // Filtrer les notifications null (messages déjà lus)
            const notificationsValides = notifications.filter(n => n !== null);

            // Émettre les notifications en temps réel
            for (const notification of notificationsValides) {
                // Envoyer la notification à l'utilisateur
                serviceSocket.emitToUser(
                    notification.utilisateur.toString(),
                    'notification:nouvelle',
                    {
                        type: 'canal',
                        canalId: canal._id,
                        canalNom: canal.nom,
                        messageId: message._id,
                        contenu: message.contenu.substring(0, 50) + (message.contenu.length > 50 ? '...' : ''),
                        auteur: message.auteur,
                        estMention: message.mentions && message.mentions.includes(notification.utilisateur)
                    }
                );

                // Si l'utilisateur est mentionné, envoyer une notification spéciale
                if (message.mentions && message.mentions.includes(notification.utilisateur)) {
                    serviceSocket.emitToUser(
                        notification.utilisateur.toString(),
                        'notification:mention',
                        {
                            type: 'canal',
                            canalId: canal._id,
                            canalNom: canal.nom,
                            messageId: message._id,
                            contenu: message.contenu.substring(0, 50) + (message.contenu.length > 50 ? '...' : ''),
                            auteur: message.auteur
                        }
                    );
                }
            }

            return notificationsValides;
        } catch (error) {
            console.error('Erreur lors de la création des notifications de canal:', error);
            throw error;
        }
    }

    /**
     * Crée une notification pour un nouveau message privé
     * @param {Object} message - Le message privé envoyé
     */
    async creerNotificationMessagePrive(message) {
        try {
            let destinataireId;
            let conversationId;
            let type = 'conversation';
            let onModel = 'Conversation';

            // Déterminer le destinataire en fonction du contexte
            if (message.contexte && message.contexte.type === 'user') {
                // Message direct à un utilisateur
                destinataireId = message.contexte.id;
                type = 'conversation';
                onModel = 'Conversation';
            } else if (message.contexte && message.contexte.type === 'conversation') {
                // Message dans une conversation de groupe
                conversationId = message.contexte.id;
                type = 'conversation';
                onModel = 'Conversation';

                // Récupérer tous les participants de la conversation sauf l'expéditeur
                const ConversationPrivee = require('../models/conversationPrivee');
                const conversation = await ConversationPrivee.findById(conversationId);
                
                if (!conversation) {
                    console.error('Conversation non trouvée:', conversationId);
                    return [];
                }

                const participantsANotifier = conversation.participants
                    .filter(p => p.utilisateur.toString() !== message.expediteur.toString())
                    .map(p => p.utilisateur);

                // Créer une notification pour chaque participant
                const notifications = await Promise.all(
                    participantsANotifier.map(async (userId) => {
                        // Vérifier si l'utilisateur a déjà lu le message
                        const dejaLu = message.lu.some(
                            lecteur => lecteur.utilisateur.toString() === userId.toString()
                        );

                        if (dejaLu) return null;

                        // Créer la notification
                        const notification = await Notification.create({
                            utilisateur: userId,
                            type,
                            reference: conversationId,
                            onModel,
                            message: message._id,
                            lu: false
                        });

                        return notification;
                    })
                );

                // Filtrer les notifications null (messages déjà lus)
                const notificationsValides = notifications.filter(n => n !== null);

                // Émettre les notifications en temps réel
                for (const notification of notificationsValides) {
                    // Envoyer la notification à l'utilisateur
                    serviceSocket.emitToUser(
                        notification.utilisateur.toString(),
                        'notification:nouvelle',
                        {
                            type: 'conversation',
                            conversationId,
                            messageId: message._id,
                            contenu: message.contenu.substring(0, 50) + (message.contenu.length > 50 ? '...' : ''),
                            expediteur: message.expediteur,
                            estMention: message.mentions && message.mentions.includes(notification.utilisateur)
                        }
                    );

                    // Si l'utilisateur est mentionné, envoyer une notification spéciale
                    if (message.mentions && message.mentions.includes(notification.utilisateur)) {
                        serviceSocket.emitToUser(
                            notification.utilisateur.toString(),
                            'notification:mention',
                            {
                                type: 'conversation',
                                conversationId,
                                messageId: message._id,
                                contenu: message.contenu.substring(0, 50) + (message.contenu.length > 50 ? '...' : ''),
                                expediteur: message.expediteur
                            }
                        );
                    }
                }

                return notificationsValides;
            } else if (message.destinataire) {
                // Ancien système - message direct à un utilisateur
                destinataireId = message.destinataire;
                type = 'conversation';
                onModel = 'Conversation';
            } else {
                console.error('Message privé sans destinataire valide:', message);
                return null;
            }

            // Pour les messages directs à un utilisateur
            if (destinataireId) {
                // Vérifier si l'utilisateur a déjà lu le message
                const dejaLu = message.lu && message.lu.some(
                    lecteur => lecteur.utilisateur.toString() === destinataireId.toString()
                );

                if (dejaLu) return null;

                // Créer la notification
                const notification = await Notification.create({
                    utilisateur: destinataireId,
                    type,
                    reference: message.conversation || `${message.expediteur}_${destinataireId}`,
                    onModel,
                    message: message._id,
                    lu: false
                });

                // Émettre la notification en temps réel
                serviceSocket.emitToUser(
                    destinataireId.toString(),
                    'notification:nouvelle',
                    {
                        type: 'message-prive',
                        messageId: message._id,
                        contenu: message.contenu.substring(0, 50) + (message.contenu.length > 50 ? '...' : ''),
                        expediteur: message.expediteur,
                        estMention: message.mentions && message.mentions.includes(destinataireId)
                    }
                );

                // Si l'utilisateur est mentionné, envoyer une notification spéciale
                if (message.mentions && message.mentions.includes(destinataireId)) {
                    serviceSocket.emitToUser(
                        destinataireId.toString(),
                        'notification:mention',
                        {
                            type: 'message-prive',
                            messageId: message._id,
                            contenu: message.contenu.substring(0, 50) + (message.contenu.length > 50 ? '...' : ''),
                            expediteur: message.expediteur
                        }
                    );
                }

                return [notification];
            }

            return [];
        } catch (error) {
            console.error('Erreur lors de la création des notifications de message privé:', error);
            throw error;
        }
    }

    /**
     * Marque une notification comme lue
     * @param {string} notificationId - L'ID de la notification
     * @param {string} userId - L'ID de l'utilisateur
     */
    async marquerCommeLue(notificationId, userId) {
        try {
            const notification = await Notification.findOne({
                _id: notificationId,
                utilisateur: userId
            });

            if (!notification) {
                throw new Error('Notification non trouvée ou non autorisée');
            }

            notification.lu = true;
            await notification.save();

            // Si c'est une notification de canal, mettre à jour le compteur de messages non lus
            if (notification.type === 'canal') {
                const canal = await Canal.findById(notification.reference);
                if (canal) {
                    await canal.resetMessagesNonLus(userId, notification.message);
                }
            }

            // Marquer le message comme lu
            if (notification.type === 'canal') {
                const message = await Message.findById(notification.message);
                if (message) {
                    await message.marquerCommeLu(userId);
                }
            } else if (notification.type === 'conversation') {
                const message = await MessagePrivate.findById(notification.message);
                if (message) {
                    // Ajouter l'utilisateur à la liste des lecteurs s'il n'y est pas déjà
                    const dejaLu = message.lu.some(
                        lecteur => lecteur.utilisateur.toString() === userId.toString()
                    );

                    if (!dejaLu) {
                        message.lu.push({
                            utilisateur: userId,
                            dateLecture: Date.now()
                        });
                        await message.save();
                    }
                }
            }

            return notification;
        } catch (error) {
            console.error('Erreur lors du marquage de la notification comme lue:', error);
            throw error;
        }
    }

    /**
     * Marque toutes les notifications d'un canal comme lues
     * @param {string} canalId - L'ID du canal
     * @param {string} userId - L'ID de l'utilisateur
     */
    async marquerToutesCommeLues(canalId, userId) {
        try {
            // Mettre à jour toutes les notifications non lues pour ce canal et cet utilisateur
            await Notification.updateMany(
                {
                    utilisateur: userId,
                    reference: canalId,
                    type: 'canal',
                    lu: false
                },
                {
                    $set: { lu: true }
                }
            );

            // Récupérer les IDs des messages pour les marquer comme lus
            const notifications = await Notification.find({
                utilisateur: userId,
                reference: canalId,
                type: 'canal'
            });

            const messageIds = notifications.map(n => n.message);

            // Marquer tous ces messages comme lus
            if (messageIds.length > 0) {
                await Message.marquerPlusieursCommeLus(messageIds, userId);
            }

            // Réinitialiser le compteur de messages non lus dans le canal
            const canal = await Canal.findById(canalId);
            if (canal) {
                await canal.resetMessagesNonLus(userId);
            }

            return { success: true, count: notifications.length };
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
            throw error;
        }
    }

    /**
     * Marque toutes les notifications d'une conversation comme lues
     * @param {string} conversationId - L'ID de la conversation
     * @param {string} userId - L'ID de l'utilisateur
     */
    async marquerToutesConversationCommeLues(conversationId, userId) {
        try {
            // Mettre à jour toutes les notifications non lues pour cette conversation et cet utilisateur
            await Notification.updateMany(
                {
                    utilisateur: userId,
                    reference: conversationId,
                    type: { $in: ['conversation', 'message-prive'] },
                    lu: false
                },
                {
                    $set: { lu: true }
                }
            );

            // Récupérer les IDs des messages pour les marquer comme lus
            const notifications = await Notification.find({
                utilisateur: userId,
                reference: conversationId,
                type: { $in: ['conversation', 'message-prive'] }
            });

            const messageIds = notifications.map(n => n.message);

            // Marquer tous ces messages comme lus
            if (messageIds.length > 0) {
                for (const messageId of messageIds) {
                    const message = await MessagePrivate.findById(messageId);
                    if (message) {
                        // Vérifier si l'utilisateur est déjà dans la liste des lecteurs
                        const dejaLu = message.lu.some(
                            lecteur => lecteur.utilisateur.toString() === userId.toString()
                        );

                        if (!dejaLu) {
                            message.lu.push({
                                utilisateur: userId,
                                dateLecture: Date.now()
                            });
                            await message.save();
                        }
                    }
                }
            }

            // Émettre un événement pour informer que les notifications ont été lues
            serviceSocket.emitToUser(
                userId.toString(),
                'notification:toutes-lues',
                {
                    conversationId,
                    count: notifications.length
                }
            );

            return { success: true, count: notifications.length };
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications de conversation comme lues:', error);
            throw error;
        }
    }

    /**
     * Récupère les notifications non lues d'un utilisateur
     * @param {string} userId - L'ID de l'utilisateur
     */
    async getNonLues(userId) {
        try {
            return await Notification.getNonLuesPourUtilisateur(userId);
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications non lues:', error);
            throw error;
        }
    }

    /**
     * Compte les notifications non lues d'un utilisateur
     * @param {string} userId - L'ID de l'utilisateur
     */
    async compterNonLues(userId) {
        try {
            return await Notification.compterToutesNonLues(userId);
        } catch (error) {
            console.error('Erreur lors du comptage des notifications non lues:', error);
            throw error;
        }
    }

    /**
     * Compte les notifications non lues d'un utilisateur pour un canal spécifique
     * @param {string} userId - L'ID de l'utilisateur
     * @param {string} canalId - L'ID du canal
     */
    async compterNonLuesPourCanal(userId, canalId) {
        try {
            return await Notification.compterNonLues(userId, 'canal', canalId);
        } catch (error) {
            console.error('Erreur lors du comptage des notifications non lues pour un canal:', error);
            throw error;
        }
    }

    /**
     * Compte les notifications non lues d'un utilisateur pour une conversation spécifique
     * @param {string} userId - L'ID de l'utilisateur
     * @param {string} conversationId - L'ID de la conversation
     */
    async compterNonLuesPourConversation(userId, conversationId) {
        try {
            return await Notification.compterNonLues(userId, 'conversation', conversationId);
        } catch (error) {
            console.error('Erreur lors du comptage des notifications non lues pour une conversation:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
