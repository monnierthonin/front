const express = require('express');
const router = express.Router();
const messagePrivateController = require('../controllers/messagePrivateController');
const { authenticate } = require('../middleware/auth');

/**
 * Routes pour la gestion des messages privés
 */

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Récupérer toutes les conversations privées de l'utilisateur connecté
router.get('/', messagePrivateController.getAllPrivateConversations);

// Récupérer les messages privés entre l'utilisateur connecté et un autre utilisateur
router.get('/:userId', messagePrivateController.getPrivateMessages);

// Envoyer un message privé à un autre utilisateur
router.post('/:userId', messagePrivateController.sendPrivateMessage);

// Marquer un message privé comme lu
router.patch('/:messageId/read', messagePrivateController.markMessageAsRead);

// Modifier un message privé
router.put('/:messageId', messagePrivateController.updatePrivateMessage);

// Supprimer un message privé
router.delete('/:messageId', messagePrivateController.deletePrivateMessage);

module.exports = router;
