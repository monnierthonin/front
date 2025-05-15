const MessagePrivate = require('../models/messagePrivate');
const User = require('../models/user');
const AppError = require('../utils/appError');
// Éviter la dépendance circulaire en utilisant une référence dynamique à io
let io;
setTimeout(() => {
  io = require('../server').io;
}, 0);

/**
 * Contrôleur pour la gestion des messages privés
 */
const messagePrivateController = {
  /**
   * Récupérer les messages privés entre l'utilisateur connecté et un autre utilisateur
   */
  getPrivateMessages: async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Débogage: Afficher tous les messages dans la base de données
      const allMessages = await MessagePrivate.find({});
      console.log('==== TOUS LES MESSAGES DANS LA BASE ====');
      console.log(`Total messages: ${allMessages.length}`);
      allMessages.forEach((msg, index) => {
        console.log(`\n[Message ${index + 1}]`);
        console.log(`ID: ${msg._id}`);
        console.log(`Contenu: "${msg.contenu}"`);
        console.log(`Expéditeur: ${msg.expediteur}`);
        console.log(`Destinataire: ${msg.destinataire || 'Non défini'}`);
        console.log(`Conversation: ${msg.conversation || 'Non défini'}`);
        console.log(`Fichiers: ${msg.fichiers ? msg.fichiers.length : 0}`);
        if (msg.fichiers && msg.fichiers.length > 0) {
          console.log('Premier fichier:');
          console.log(JSON.stringify(msg.fichiers[0], null, 2));
        }
      });
      console.log('==== FIN DES MESSAGES ====');
      
      // Vérifier si l'utilisateur existe
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return next(new AppError('Utilisateur non trouvé', 404));
      }
      
      // Récupérer les messages privés entre les deux utilisateurs
      // Utiliser uniquement la structure standardisée avec le champ contexte
      const messages = await MessagePrivate.find({
        $or: [
          // Messages envoyés par l'utilisateur connecté à l'autre utilisateur
          { 'contexte.type': 'user', 'contexte.id': userId, expediteur: req.user._id },
          
          // Messages envoyés par l'autre utilisateur à l'utilisateur connecté
          { 'contexte.type': 'user', 'contexte.id': req.user._id, expediteur: userId },
          
          // Messages dans une conversation de groupe (si userId est un ID de conversation)
          { 'contexte.type': 'conversation', 'contexte.id': userId }
        ]
      })
      .sort({ horodatage: 1 }) // Tri par date croissante
      .populate('expediteur', 'username firstName lastName profilePicture')
      .populate('destinataire', 'username firstName lastName profilePicture')
      .populate({
        path: 'reponseA',
        populate: {
          path: 'expediteur',
          select: 'username firstName lastName profilePicture'
        }
      });
      
      // Marquer les messages non lus comme lus si l'utilisateur est le destinataire
      const unreadMessages = messages.filter(
        msg => msg.destinataire._id.toString() === req.user._id.toString() && !msg.lu
      );
      
      if (unreadMessages.length > 0) {
        await MessagePrivate.updateMany(
          { 
            _id: { $in: unreadMessages.map(msg => msg._id) }
          },
          { lu: true }
        );
        
        // Notifier l'expéditeur que ses messages ont été lus
        unreadMessages.forEach(msg => {
          io.to(msg.expediteur._id.toString()).emit('message-prive-lu', {
            messageId: msg._id,
            lu: true
          });
        });
      }
      
      res.json({
        success: true,
        count: messages.length,
        data: messages
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des messages privés:', error);
      next(new AppError('Erreur lors de la récupération des messages privés', 500));
    }
  },
  
  /**
   * Récupérer toutes les conversations privées de l'utilisateur connecté
   */
  getAllPrivateConversations: async (req, res, next) => {
    try {
      // Récupérer tous les messages privés où l'utilisateur est expéditeur ou destinataire
      const messages = await MessagePrivate.find({
        $or: [
          { expediteur: req.user._id },
          { destinataire: req.user._id }
        ]
      })
      .sort({ horodatage: -1 }) // Tri par date décroissante
      .populate('expediteur', 'username prenom nom profilePicture')
      .populate('destinataire', 'username prenom nom profilePicture');
      
      // Regrouper les messages par conversation (par utilisateur)
      const conversations = {};
      
      messages.forEach(message => {
        let otherUserId;
        let otherUser;
        
        if (message.expediteur._id.toString() === req.user._id.toString()) {
          otherUserId = message.destinataire._id.toString();
          otherUser = message.destinataire;
        } else {
          otherUserId = message.expediteur._id.toString();
          otherUser = message.expediteur;
        }
        
        if (!conversations[otherUserId]) {
          conversations[otherUserId] = {
            user: {
              _id: otherUser._id,
              username: otherUser.username,
              prenom: otherUser.firstName,
              nom: otherUser.lastName,
              profilePicture: otherUser.profilePicture
            },
            lastMessage: {
              _id: message._id,
              contenu: message.contenu,
              horodatage: message.horodatage,
              lu: message.lu,
              envoye: message.envoye,
              isFromMe: message.expediteur._id.toString() === req.user._id.toString()
            },
            unreadCount: 0
          };
        }
        
        // Compter les messages non lus
        if (!message.lu && message.destinataire._id.toString() === req.user._id.toString()) {
          conversations[otherUserId].unreadCount += 1;
        }
      });
      
      res.json({
        success: true,
        count: Object.keys(conversations).length,
        data: Object.values(conversations)
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations privées:', error);
      next(new AppError('Erreur lors de la récupération des conversations privées', 500));
    }
  },
  
  /**
   * Envoyer un message privé à un autre utilisateur
   */
  sendPrivateMessage: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { contenu, reponseA } = req.body;
      
      // Vérifier si l'utilisateur existe
      const destinataire = await User.findById(userId);
      if (!destinataire) {
        return next(new AppError('Destinataire non trouvé', 404));
      }
      
      // Vérifier si le message est une réponse à un autre message
      if (reponseA) {
        const messageOriginal = await MessagePrivate.findById(reponseA);
        if (!messageOriginal) {
          return next(new AppError('Message original non trouvé', 404));
        }
        
        // Vérifier que l'utilisateur est bien impliqué dans la conversation du message original
        const isInvolved = 
          messageOriginal.expediteur.toString() === req.user._id.toString() || 
          messageOriginal.destinataire.toString() === req.user._id.toString();
          
        if (!isInvolved) {
          return next(new AppError('Vous n\'êtes pas autorisé à répondre à ce message', 403));
        }
      }
      
      // Créer le nouveau message privé avec la structure standardisée
      const newMessage = await MessagePrivate.create({
        contenu,
        expediteur: req.user._id,
        // Structure standardisée avec le champ contexte
        contexte: {
          type: 'user',  // Message direct à un utilisateur
          id: userId
        },
        reponseA: reponseA || null,
        envoye: true,
        lu: false
      });
      
      // Peupler les références pour la réponse
      const populatedMessage = await MessagePrivate.findById(newMessage._id)
        .populate('expediteur', 'username firstName lastName profilePicture')
        .populate('destinataire', 'username firstName lastName profilePicture')
        .populate({
          path: 'reponseA',
          populate: {
            path: 'expediteur',
            select: 'username firstName lastName profilePicture'
          }
        });
      
      // Notifier le destinataire en temps réel via le service Socket
      // Note: La notification en temps réel est gérée par le service Socket
      // lors de l'événement 'envoyer-message-prive', pas besoin de le faire ici
      
      res.status(201).json({
        success: true,
        data: populatedMessage
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message privé:', error);
      next(new AppError('Erreur lors de l\'envoi du message privé', 500));
    }
  },
  
  /**
   * Marquer un message privé comme lu
   */
  markMessageAsRead: async (req, res, next) => {
    try {
      const { messageId } = req.params;
      
      // Vérifier si le message existe
      const message = await MessagePrivate.findById(messageId);
      if (!message) {
        return next(new AppError('Message non trouvé', 404));
      }
      
      // Vérifier que l'utilisateur est bien le destinataire du message
      if (message.destinataire.toString() !== req.user._id.toString()) {
        return next(new AppError('Vous n\'êtes pas autorisé à marquer ce message comme lu', 403));
      }
      
      // Marquer le message comme lu
      message.lu = true;
      await message.save();
      
      // Notifier l'expéditeur en temps réel
      io.to(message.expediteur.toString()).emit('message-prive-lu', {
        messageId: message._id,
        lu: true
      });
      
      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      next(new AppError('Erreur lors du marquage du message comme lu', 500));
    }
  },
  
  /**
   * Modifier un message privé
   */
  updatePrivateMessage: async (req, res, next) => {
    try {
      const { messageId } = req.params;
      const { contenu } = req.body;
      
      if (!contenu || contenu.trim() === '') {
        return next(new AppError('Le contenu du message ne peut pas être vide', 400));
      }
      
      // Vérifier si le message existe
      const message = await MessagePrivate.findById(messageId);
      if (!message) {
        return next(new AppError('Message non trouvé', 404));
      }
      
      // Vérifier que l'utilisateur est bien l'expéditeur du message
      if (message.expediteur.toString() !== req.user._id.toString()) {
        return next(new AppError('Vous n\'êtes pas autorisé à modifier ce message', 403));
      }
      
      // Mettre à jour le message
      message.contenu = contenu;
      message.modifie = true;
      message.dateModification = Date.now();
      await message.save();
      
      // Peupler les références pour la réponse
      const populatedMessage = await MessagePrivate.findById(message._id)
        .populate('expediteur', 'username firstName lastName profilePicture')
        .populate('destinataire', 'username firstName lastName profilePicture')
        .populate({
          path: 'reponseA',
          populate: {
            path: 'expediteur',
            select: 'username firstName lastName profilePicture'
          }
        });
      
      // Notifier le destinataire en temps réel
      // Note: La notification est gérée par le service Socket
      
      res.json({
        success: true,
        data: populatedMessage,
        message: 'Message modifié avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la modification du message:', error);
      next(new AppError('Erreur lors de la modification du message', 500));
    }
  },
  
  /**
   * Récupérer les messages avec fichiers d'une conversation
   */
  getMessagesWithFiles: async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      
      // Vérifier si l'utilisateur est participant à la conversation
      console.log(`Récupération des messages avec fichiers pour la conversation: ${conversationId}`);
      console.log(`Utilisateur connecté: ${req.user._id}`);
      
      // Utiliser une requête optimisée qui récupère tous les messages avec fichiers
      // pour cette conversation en utilisant uniquement le nouveau modèle standardisé
      console.log('Utilisation d\'une requête optimisée pour récupérer les messages avec fichiers');
      
      const messages = await MessagePrivate.find({
        $and: [
          // Au moins un fichier
          { 'fichiers.0': { $exists: true } },
          // Recherche par contexte uniquement
          { $or: [
            // Messages dans une conversation privée 1:1
            { 'contexte.type': 'user', 'contexte.id': conversationId, expediteur: req.user._id },
            { 'contexte.type': 'user', 'contexte.id': req.user._id, expediteur: conversationId },
            
            // Messages dans une conversation de groupe
            { 'contexte.type': 'conversation', 'contexte.id': conversationId }
          ]}
        ]
      })
      .sort({ horodatage: 1 })
      .populate('expediteur', 'username firstName lastName profilePicture')
      .populate('destinataire', 'username firstName lastName profilePicture')
      .populate({
        path: 'reponseA',
        populate: {
          path: 'expediteur',
          select: 'username firstName lastName profilePicture'
        }
      });
      
      console.log(`${messages.length} messages avec fichiers trouvés pour la conversation ${conversationId}`);
      
      // Afficher des détails sur les messages trouvés pour le débogage
      if (messages.length > 0) {
        console.log('Détails des messages avec fichiers trouvés:');
        messages.forEach((msg) => {
          console.log(`- Message ID: ${msg._id}`);
          console.log(`  Expéditeur: ${msg.expediteur?._id || msg.expediteur}`);
          console.log(`  Fichiers: ${msg.fichiers ? msg.fichiers.length : 0}`);
          if (msg.fichiers && msg.fichiers.length > 0) {
            console.log(`  Premier fichier: ${JSON.stringify(msg.fichiers[0])}`);
          }
        });
      }
      
      res.json({
        success: true,
        count: messages.length,
        data: {
          messages
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des messages avec fichiers:', error);
      next(new AppError('Erreur lors de la récupération des messages avec fichiers', 500));
    }
  },
  
  /**
   * Supprimer un message privé
   */
  deletePrivateMessage: async (req, res, next) => {
    try {
      const { messageId } = req.params;
      
      // Vérifier si le message existe
      const message = await MessagePrivate.findById(messageId);
      if (!message) {
        return next(new AppError('Message non trouvé', 404));
      }
      
      // Vérifier que l'utilisateur est bien l'expéditeur du message
      if (message.expediteur.toString() !== req.user._id.toString()) {
        console.log(`Utilisateur non autorisé: ${req.user._id} pour le message: ${messageId}`);
        return next(new AppError('Vous n\'êtes pas autorisé à supprimer ce message', 403));
      }
      
      // Rechercher les messages qui font référence à ce message comme réponse
      console.log(`Recherche des messages qui font référence à: ${messageId}`);
      const referencingMessages = await MessagePrivate.find({ reponseA: messageId });
      
      // Mettre à jour les messages qui font référence à ce message
      if (referencingMessages.length > 0) {
        console.log(`${referencingMessages.length} messages font référence à ce message, mise à jour...`);
        await MessagePrivate.updateMany(
          { reponseA: messageId },
          { $unset: { reponseA: 1 } }
        );
      }
      
      // Supprimer le message
      console.log(`Suppression du message: ${messageId}`);
      await MessagePrivate.findByIdAndDelete(messageId);
      
      // Notifier le destinataire en temps réel (si io est disponible)
      console.log(`Notification au destinataire: ${message.destinataire}`);
      if (io) {
        try {
          io.to(message.destinataire.toString()).emit('message-prive-supprime', {
            messageId: message._id
          });
          console.log('Notification envoyée avec succès');
        } catch (socketError) {
          console.error('Erreur lors de l\'envoi de la notification socket:', socketError);
          // Ne pas faire échouer la requête si la notification échoue
        }
      } else {
        console.log('Socket.IO n\'est pas disponible, notification non envoyée');
      }
      
      res.json({
        success: true,
        message: 'Message supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      next(new AppError('Erreur lors de la suppression du message', 500));
    }
  }
};

module.exports = messagePrivateController;
