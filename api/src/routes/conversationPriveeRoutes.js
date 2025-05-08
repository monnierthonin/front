const express = require('express');
const router = express.Router();
const conversationPriveeController = require('../controllers/conversationPriveeController');
const messagePrivateController = require('../controllers/messagePrivateController');
const { authenticate } = require('../middleware/auth');

/**
 * Routes pour la gestion des conversations privées
 */

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Récupérer toutes les conversations de l'utilisateur connecté
router.get('/', conversationPriveeController.getConversations);

// Créer une nouvelle conversation
router.post('/', conversationPriveeController.createConversation);

// Récupérer une conversation spécifique
router.get('/:id', conversationPriveeController.getConversation);

// Mettre à jour une conversation (nom)
router.patch('/:id', conversationPriveeController.updateConversation);

// Ajouter un participant à une conversation
router.post('/:id/participants', conversationPriveeController.addParticipant);

// Supprimer un participant d'une conversation
router.delete('/:id/participants/:userId', conversationPriveeController.removeParticipant);

// Quitter une conversation
router.delete('/:id/leave', conversationPriveeController.leaveConversation);

// Récupérer les messages d'une conversation
router.get('/:id/messages', conversationPriveeController.getConversationMessages);

// Envoyer un message dans une conversation
router.post('/:id/messages', conversationPriveeController.sendMessageToConversation);

// Mettre à jour un message dans une conversation
router.put('/:id/messages/:messageId', conversationPriveeController.updateMessage);

// Supprimer un message dans une conversation
router.delete('/:id/messages/:messageId', conversationPriveeController.deleteMessage);

module.exports = router;
