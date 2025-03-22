const express = require('express');
const router = express.Router({ mergeParams: true }); // Pour accéder aux paramètres du canal
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

/**
 * Routes pour la gestion des messages
 */

// Routes CRUD de base
router.post('/', authenticate, messageController.creerMessage);
router.get('/', authenticate, messageController.obtenirMessages);
router.patch('/:id', authenticate, messageController.modifierMessage);
router.delete('/:id', authenticate, messageController.supprimerMessage);

// Routes pour les interactions
router.post('/:id/reactions', authenticate, messageController.reagirMessage);
router.post('/:id/reponses', authenticate, messageController.repondreMessage);

module.exports = router;
