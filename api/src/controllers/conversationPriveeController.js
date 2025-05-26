const ConversationPrivee = require('../models/conversationPrivee');
const MessagePrivate = require('../models/messagePrivate');
const User = require('../models/user');
const AppError = require('../utils/appError');

// Éviter la dépendance circulaire en utilisant une référence dynamique à io
let io;
setTimeout(() => {
    io = require('../server').io;
}, 0);

// Obtenir toutes les conversations d'un utilisateur
exports.getConversations = async (req, res, next) => {
    try {
        // Trouver toutes les conversations où l'utilisateur est participant
        const conversations = await ConversationPrivee.find({
            'participants.utilisateur': req.user._id
        })
        .populate('participants.utilisateur', 'username firstName lastName profilePicture')
        .populate('createur', 'username firstName lastName profilePicture')
        .populate({
            path: 'dernierMessage',
            populate: {
                path: 'expediteur',
                select: 'username firstName lastName profilePicture'
            }
        })
        .sort({ updatedAt: -1 });

        res.status(200).json({
            status: 'success',
            resultats: conversations.length,
            data: {
                conversations
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        next(new AppError('Erreur lors de la récupération des conversations', 500));
    }
};

// Obtenir une conversation spécifique
exports.getConversation = async (req, res, next) => {
    try {
        const conversation = await ConversationPrivee.findById(req.params.id)
            .populate('participants.utilisateur', 'username firstName lastName profilePicture')
            .populate('createur', 'username firstName lastName profilePicture')
            .populate({
                path: 'dernierMessage',
                populate: {
                    path: 'expediteur',
                    select: 'username firstName lastName profilePicture'
                }
            });

        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }

        // Vérifier si l'utilisateur est participant à la conversation
        console.log('Utilisateur qui tente d\'accéder:', req.user._id);
        console.log('Participants de la conversation:', conversation.participants.map(p => ({ id: p.utilisateur.toString(), date: p.dateAjout })));
        
        const estParticipant = conversation.estParticipant(req.user._id);
        console.log('Résultat de la vérification estParticipant:', estParticipant);
        
        if (!estParticipant) {
            return next(new AppError('Vous n\'êtes pas autorisé à accéder à cette conversation', 403));
        }

        res.status(200).json({
            status: 'success',
            data: {
                conversation
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la conversation:', error);
        next(new AppError('Erreur lors de la récupération de la conversation', 500));
    }
};

// Créer une nouvelle conversation
exports.createConversation = async (req, res, next) => {
    try {
        const { participants, nom } = req.body;

        // Vérifier si les participants existent
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return next(new AppError('Veuillez spécifier au moins un participant', 400));
        }

        // Ajouter l'utilisateur courant aux participants s'il n'y est pas déjà
        if (!participants.includes(req.user._id.toString())) {
            participants.push(req.user._id.toString());
        }

        // Vérifier si les utilisateurs existent
        const users = await User.find({ _id: { $in: participants } });
        if (users.length !== participants.length) {
            return next(new AppError('Un ou plusieurs utilisateurs n\'existent pas', 400));
        }

        // Pour une conversation à deux, vérifier si elle existe déjà
        if (participants.length === 2) {
            const existingConversation = await ConversationPrivee.findOne({
                'participants.utilisateur': { $all: participants },
                estGroupe: false
            });

            if (existingConversation) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        conversation: existingConversation
                    }
                });
            }
        }

        // Créer la conversation
        const newConversation = await ConversationPrivee.create({
            nom: nom || '',
            participants: participants.map(p => ({ utilisateur: p })),
            createur: req.user._id,
            estGroupe: participants.length > 2
        });

        // Peupler les références pour la réponse
        const populatedConversation = await ConversationPrivee.findById(newConversation._id)
            .populate('participants.utilisateur', 'username firstName lastName profilePicture')
            .populate('createur', 'username firstName lastName profilePicture');

        res.status(201).json({
            status: 'success',
            data: {
                conversation: populatedConversation
            }
        });
    } catch (error) {
        console.error('Erreur lors de la création de la conversation:', error);
        next(new AppError('Erreur lors de la création de la conversation', 500));
    }
};

// Ajouter un participant à une conversation
exports.addParticipant = async (req, res, next) => {
    try {
        const { userId } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('Utilisateur non trouvé', 404));
        }

        // Récupérer la conversation
        const conversation = await ConversationPrivee.findById(req.params.id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }

        // Vérifier si l'utilisateur courant est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à modifier cette conversation', 403));
        }

        // Vérifier si l'utilisateur est déjà participant
        if (conversation.estParticipant(userId)) {
            return next(new AppError('L\'utilisateur est déjà participant à cette conversation', 400));
        }

        // Ajouter le participant
        conversation.ajouterParticipant(userId);
        await conversation.save();

        // Peupler les références pour la réponse
        const populatedConversation = await ConversationPrivee.findById(conversation._id)
            .populate('participants.utilisateur', 'username firstName lastName profilePicture')
            .populate('createur', 'username firstName lastName profilePicture');

        res.status(200).json({
            status: 'success',
            data: {
                conversation: populatedConversation
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du participant:', error);
        next(new AppError('Erreur lors de l\'ajout du participant', 500));
    }
};

// Supprimer un participant d'une conversation
exports.removeParticipant = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Récupérer la conversation
        const conversation = await ConversationPrivee.findById(req.params.id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }

        // Vérifier si l'utilisateur courant est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à modifier cette conversation', 403));
        }

        // Vérifier si l'utilisateur à supprimer est le créateur
        if (conversation.createur.toString() === userId && req.user._id.toString() !== userId) {
            return next(new AppError('Vous ne pouvez pas supprimer le créateur de la conversation', 403));
        }

        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(userId)) {
            return next(new AppError('L\'utilisateur n\'est pas participant à cette conversation', 400));
        }

        // Supprimer le participant
        conversation.supprimerParticipant(userId);
        
        // Si c'est une conversation à 2 et qu'un participant quitte, supprimer la conversation
        if (conversation.participants.length < 2) {
            // Utiliser deleteOne pour déclencher le middleware de suppression en cascade
            await ConversationPrivee.deleteOne({ _id: conversation._id });
            
            return res.status(204).json({
                status: 'success',
                data: null
            });
        }
        
        await conversation.save();

        // Peupler les références pour la réponse
        const populatedConversation = await ConversationPrivee.findById(conversation._id)
            .populate('participants.utilisateur', 'username firstName lastName profilePicture')
            .populate('createur', 'username firstName lastName profilePicture');

        res.status(200).json({
            status: 'success',
            data: {
                conversation: populatedConversation
            }
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du participant:', error);
        next(new AppError('Erreur lors de la suppression du participant', 500));
    }
};

// Quitter une conversation
exports.leaveConversation = async (req, res, next) => {
    try {
        // Récupérer la conversation
        const conversation = await ConversationPrivee.findById(req.params.id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }

        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas participant à cette conversation', 400));
        }

        // Supprimer l'utilisateur des participants
        conversation.supprimerParticipant(req.user._id);
        
        // Nouvelle logique: Ne jamais supprimer la conversation quand un utilisateur la quitte
        // Même si c'est une conversation à 2 personnes
        // L'autre utilisateur pourra toujours voir la conversation et les messages
        // Le premier utilisateur ne la verra plus tant qu'il n'y est pas rajouté
        
        // Si l'utilisateur qui quitte est le créateur, transférer le rôle au plus ancien participant
        if (conversation.createur.toString() === req.user._id.toString() && conversation.participants.length > 0) {
            // Trier les participants par date d'ajout
            const participants = conversation.participants.sort((a, b) => a.dateAjout - b.dateAjout);
            conversation.createur = participants[0].utilisateur;
            console.log(`Nouveau créateur de la conversation: ${conversation.createur}`);
        }
        
        await conversation.save();
        
        // Notifier les autres participants que l'utilisateur a quitté la conversation
        if (io) {
            conversation.participants.forEach(participant => {
                io.to(participant.utilisateur.toString()).emit('conversation-participant-left', {
                    conversation: conversation._id,
                    user: req.user._id
                });
            });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.error('Erreur lors de la sortie de la conversation:', error);
        next(new AppError('Erreur lors de la sortie de la conversation', 500));
    }
};

// Mettre à jour une conversation (nom)
exports.updateConversation = async (req, res, next) => {
    try {
        const { nom } = req.body;

        // Récupérer la conversation
        const conversation = await ConversationPrivee.findById(req.params.id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }

        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à modifier cette conversation', 403));
        }

        // Mettre à jour le nom
        conversation.nom = nom;
        await conversation.save();

        // Peupler les références pour la réponse
        const populatedConversation = await ConversationPrivee.findById(conversation._id)
            .populate('participants.utilisateur', 'username firstName lastName profilePicture')
            .populate('createur', 'username firstName lastName profilePicture');

        res.status(200).json({
            status: 'success',
            data: {
                conversation: populatedConversation
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la conversation:', error);
        next(new AppError('Erreur lors de la mise à jour de la conversation', 500));
    }
};

// Récupérer les messages d'une conversation
exports.getConversationMessages = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à accéder à cette conversation', 403));
        }
        
        // Débogage: Afficher tous les messages dans la base de données
        const allMessages = await MessagePrivate.find({});
        console.log(`==== DÉBOGAGE: TOUS LES MESSAGES (${allMessages.length}) ====`);
        allMessages.forEach((msg, index) => {
            if (index < 5) { // Limiter l'affichage pour éviter de surcharger les logs
                console.log(`\n[Message ${index + 1}]`);
                console.log(`ID: ${msg._id}`);
                console.log(`Contenu: "${msg.contenu}"`);
                console.log(`Expéditeur: ${msg.expediteur}`);
                console.log(`Conversation: ${msg.conversation || 'Non défini'}`);
            }
        });
        console.log('==== FIN DÉBOGAGE ====');
        
        // Récupérer les messages de la conversation
        const messages = await MessagePrivate.find({
            conversation: id
        })
        .sort({ horodatage: 1 }) // Tri par date croissante
        .populate('expediteur', 'username firstName lastName profilePicture')
        .populate({
            path: 'reponseA',
            populate: {
                path: 'expediteur',
                select: 'username firstName lastName profilePicture'
            }
        });
        
        console.log(`Messages trouvés pour la conversation ${id}: ${messages.length}`);
        
        // Marquer les messages non lus comme lus
        const unreadMessages = [];
        
        for (const msg of messages) {
            // Vérifier si l'utilisateur a déjà lu le message
            let dejaLu = false;
            
            if (Array.isArray(msg.lu)) {
                // Nouveau format: tableau d'objets {utilisateur, dateLecture}
                dejaLu = msg.lu.some(read => {
                    return read && read.utilisateur && 
                           read.utilisateur.toString && 
                           read.utilisateur.toString() === req.user._id.toString();
                });
            } else if (msg.lu === true) {
                // Ancien format: boolean
                dejaLu = true;
            }
            
            // Si l'expéditeur n'est pas l'utilisateur actuel et que le message n'est pas déjà lu
            if (!dejaLu && msg.expediteur && msg.expediteur._id && 
                msg.expediteur._id.toString() !== req.user._id.toString()) {
                unreadMessages.push(msg);
            }
        }
        
        if (unreadMessages.length > 0) {
            console.log(`Marquage de ${unreadMessages.length} messages comme lus`);
            
            // Mettre à jour les messages non lus
            for (const msg of unreadMessages) {
                // Vérifier le format du champ lu
                if (Array.isArray(msg.lu)) {
                    // Nouveau format
                    msg.lu.push({
                        utilisateur: req.user._id,
                        dateLecture: new Date()
                    });
                } else {
                    // Ancien format ou non défini
                    msg.lu = [{
                        utilisateur: req.user._id,
                        dateLecture: new Date()
                    }];
                }
                
                await msg.save();
                
                // Notifier l'expéditeur que ses messages ont été lus
                if (io && msg.expediteur && msg.expediteur._id) {
                    io.to(msg.expediteur._id.toString()).emit('message-prive-lu', {
                        messageId: msg._id,
                        lu: true,
                        lecteur: req.user._id
                    });
                }
            }
        }
        
        res.status(200).json({
            status: 'success',
            resultats: messages.length,
            data: {
                messages
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        next(new AppError('Erreur lors de la récupération des messages', 500));
    }
};

// Envoyer un message dans une conversation
exports.sendMessageToConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { contenu, reponseA } = req.body;
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation', 403));
        }
        
        // Vérifier si le message de réponse existe
        if (reponseA) {
            const messageExists = await MessagePrivate.exists({ _id: reponseA, conversation: id });
            if (!messageExists) {
                return next(new AppError('Le message de réponse n\'existe pas dans cette conversation', 400));
            }
        }
        
        // Créer le message avec la structure standardisée
        const newMessage = await MessagePrivate.create({
            contenu,
            expediteur: req.user._id,
            // Utiliser le champ conversation directement
            conversation: id,
            reponseA: reponseA || null,
            horodatage: Date.now(),
            envoye: true,
            lu: [{ utilisateur: req.user._id, date: new Date() }] // L'expéditeur a déjà lu son propre message
        });
        
        // Mettre à jour le dernier message de la conversation
        conversation.dernierMessage = newMessage._id;
        await conversation.save();
        
        // Peupler les références pour la réponse
        const populatedMessage = await MessagePrivate.findById(newMessage._id)
            .populate('expediteur', 'username firstName lastName profilePicture')
            .populate({
                path: 'reponseA',
                populate: {
                    path: 'expediteur',
                    select: 'username firstName lastName profilePicture'
                }
            })
            .populate('mentions', 'username firstName lastName profilePicture');
        
        // Notifier les autres participants
        if (io) {
            // Notifier tous les participants de la conversation
            conversation.participants.forEach(participant => {
                if (participant.utilisateur.toString() !== req.user._id.toString()) {
                    io.to(participant.utilisateur.toString()).emit('nouveau-message-prive', {
                        message: populatedMessage,
                        conversation: id
                    });
                }
            });
            
            // Notifier spécifiquement les utilisateurs mentionnés
            if (populatedMessage.mentions && populatedMessage.mentions.length > 0) {
                populatedMessage.mentions.forEach(mentionnedUser => {
                    io.to(mentionnedUser._id.toString()).emit('nouvelle-mention-privee', {
                        message: populatedMessage,
                        conversation: id,
                        expediteur: populatedMessage.expediteur,
                        estGroupe: conversation.estGroupe
                    });
                });
            }
        }
        
        res.status(201).json({
            status: 'success',
            data: {
                message: populatedMessage
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        next(new AppError('Erreur lors de l\'envoi du message', 500));
    }
};

// Mettre à jour un message dans une conversation
exports.updateMessage = async (req, res, next) => {
    try {
        const { id, messageId } = req.params;
        const { contenu } = req.body;
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à modifier des messages dans cette conversation', 403));
        }
        
        // Récupérer le message
        const message = await MessagePrivate.findOne({ _id: messageId, conversation: id });
        if (!message) {
            return next(new AppError('Message non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur est l'expéditeur du message
        if (message.expediteur.toString() !== req.user._id.toString()) {
            return next(new AppError('Vous ne pouvez pas modifier un message que vous n\'avez pas envoyé', 403));
        }
        
        // Mettre à jour le contenu du message
        message.contenu = contenu;
        message.modifie = true;
        await message.save();
        
        // Peupler les références pour la réponse
        const populatedMessage = await MessagePrivate.findById(message._id)
            .populate('expediteur', 'username firstName lastName profilePicture')
            .populate({
                path: 'reponseA',
                populate: {
                    path: 'expediteur',
                    select: 'username firstName lastName profilePicture'
                }
            });
        
        // Notifier les autres participants
        if (io) {
            conversation.participants.forEach(participant => {
                if (participant.utilisateur.toString() !== req.user._id.toString()) {
                    io.to(participant.utilisateur.toString()).emit('message-prive-modifie', {
                        message: populatedMessage,
                        conversation: id
                    });
                }
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                message: populatedMessage
            }
        });
    } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
        next(new AppError('Erreur lors de la modification du message', 500));
    }
};

// Supprimer un message dans une conversation
exports.deleteMessage = async (req, res, next) => {
    try {
        const { id, messageId } = req.params;
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à supprimer des messages dans cette conversation', 403));
        }
        
        // Récupérer le message
        const message = await MessagePrivate.findOne({ _id: messageId, conversation: id });
        if (!message) {
            return next(new AppError('Message non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur est l'expéditeur du message
        if (message.expediteur.toString() !== req.user._id.toString()) {
            return next(new AppError('Vous ne pouvez pas supprimer un message que vous n\'avez pas envoyé', 403));
        }
        
        // Si le message est le dernier message de la conversation, mettre à jour la référence
        if (conversation.dernierMessage && conversation.dernierMessage.toString() === messageId) {
            // Trouver le message précédent
            const previousMessage = await MessagePrivate.findOne({
                conversation: id,
                _id: { $ne: messageId }
            }).sort({ horodatage: -1 });
            
            conversation.dernierMessage = previousMessage ? previousMessage._id : null;
            await conversation.save();
        }
        
        // Supprimer les références à ce message dans d'autres messages (réponses)
        await MessagePrivate.updateMany(
            { reponseA: messageId },
            { $unset: { reponseA: 1 } }
        );
        
        // Supprimer le message
        await MessagePrivate.findByIdAndDelete(messageId);
        
        // Notifier les autres participants
        if (io) {
            conversation.participants.forEach(participant => {
                if (participant.utilisateur.toString() !== req.user._id.toString()) {
                    io.to(participant.utilisateur.toString()).emit('message-prive-supprime', {
                        messageId,
                        conversation: id
                    });
                }
            });
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        next(new AppError('Erreur lors de la suppression du message', 500));
    }
};

// Répondre à un message dans une conversation
exports.replyToMessage = async (req, res, next) => {
    try {
        const { id, messageId } = req.params;
        const { contenu, fichiers } = req.body;
        
        // Vérifier si le contenu ou les fichiers sont présents
        if ((!contenu || contenu.trim() === '') && (!fichiers || fichiers.length === 0)) {
            return next(new AppError('Le message doit contenir du texte ou des fichiers', 400));
        }
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation', 403));
        }
        
        // Vérifier si le message auquel on répond existe et appartient à cette conversation
        const originalMessage = await MessagePrivate.findOne({ _id: messageId, conversation: id });
        if (!originalMessage) {
            return next(new AppError('Message original non trouvé', 404));
        }
        
        // Créer le nouveau message avec référence au message original
        const newMessage = await MessagePrivate.create({
            contenu: contenu || '',
            expediteur: req.user._id,
            conversation: id,
            reponseA: messageId,
            fichiers: fichiers || []
        });
        
        // Mettre à jour la date de la dernière activité de la conversation
        conversation.dernierMessage = newMessage._id;
        await conversation.save();
        
        // Peupler les références pour la réponse
        const populatedMessage = await MessagePrivate.findById(newMessage._id)
            .populate('expediteur', 'username firstName lastName profilePicture')
            .populate({
                path: 'reponseA',
                populate: {
                    path: 'expediteur',
                    select: 'username firstName lastName profilePicture'
                }
            });
        
        // Notifier les autres participants
        if (io) {
            conversation.participants.forEach(participant => {
                if (participant.utilisateur.toString() !== req.user._id.toString()) {
                    io.to(participant.utilisateur.toString()).emit('nouveau-message-prive', {
                        message: populatedMessage,
                        conversation: id
                    });
                }
            });
        }
        
        res.status(201).json({
            status: 'success',
            data: {
                message: populatedMessage
            }
        });
    } catch (error) {
        console.error('Erreur lors de la réponse au message:', error);
        next(new AppError('Erreur lors de la réponse au message', 500));
    }
};

// Ajouter une réaction à un message
exports.addReaction = async (req, res, next) => {
    try {
        const { id, messageId } = req.params;
        const { emoji } = req.body;
        
        if (!emoji) {
            return next(new AppError('L\'emoji est requis', 400));
        }
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'\u00eates pas autorisé à réagir aux messages dans cette conversation', 403));
        }
        
        // Récupérer le message
        const message = await MessagePrivate.findOne({ _id: messageId, conversation: id });
        if (!message) {
            return next(new AppError('Message non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur a déjà réagi avec cet emoji
        const existingReaction = message.reactions.find(
            r => r.utilisateur.toString() === req.user._id.toString() && r.emoji === emoji
        );
        
        if (existingReaction) {
            return next(new AppError('Vous avez déjà réagi avec cet emoji', 400));
        }
        
        // Ajouter la réaction
        message.reactions.push({
            utilisateur: req.user._id,
            emoji,
            date: new Date()
        });
        
        await message.save();
        
        // Notifier les autres participants en temps réel
        if (io) {
            conversation.participants.forEach(participant => {
                if (participant.utilisateur.toString() !== req.user._id.toString()) {
                    io.to(participant.utilisateur.toString()).emit('message-reaction-added', {
                        conversationId: conversation._id,
                        messageId: message._id,
                        reaction: {
                            utilisateur: req.user._id,
                            emoji,
                            date: new Date()
                        }
                    });
                }
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                reaction: {
                    utilisateur: req.user._id,
                    emoji,
                    date: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout d\'une réaction:', error);
        next(new AppError('Erreur lors de l\'ajout d\'une réaction', 500));
    }
};

// Supprimer une réaction d'un message
exports.removeReaction = async (req, res, next) => {
    try {
        const { id, messageId } = req.params;
        const { emoji } = req.body;
        
        if (!emoji) {
            return next(new AppError('L\'emoji est requis', 400));
        }
        
        // Vérifier si la conversation existe
        const conversation = await ConversationPrivee.findById(id);
        if (!conversation) {
            return next(new AppError('Conversation non trouvée', 404));
        }
        
        // Vérifier si l'utilisateur est participant
        if (!conversation.estParticipant(req.user._id)) {
            return next(new AppError('Vous n\'\u00eates pas autorisé à supprimer des réactions dans cette conversation', 403));
        }
        
        // Récupérer le message
        const message = await MessagePrivate.findOne({ _id: messageId, conversation: id });
        if (!message) {
            return next(new AppError('Message non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur a réagi avec cet emoji
        const reactionIndex = message.reactions.findIndex(
            r => r.utilisateur.toString() === req.user._id.toString() && r.emoji === emoji
        );
        
        if (reactionIndex === -1) {
            return next(new AppError('Vous n\'avez pas réagi avec cet emoji', 400));
        }
        
        // Supprimer la réaction
        message.reactions.splice(reactionIndex, 1);
        await message.save();
        
        // Notifier les autres participants en temps réel
        if (io) {
            conversation.participants.forEach(participant => {
                if (participant.utilisateur.toString() !== req.user._id.toString()) {
                    io.to(participant.utilisateur.toString()).emit('message-reaction-removed', {
                        conversationId: conversation._id,
                        messageId: message._id,
                        reaction: {
                            utilisateur: req.user._id,
                            emoji
                        }
                    });
                }
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Réaction supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression d\'une réaction:', error);
        next(new AppError('Erreur lors de la suppression d\'une réaction', 500));
    }
};

module.exports = exports;
