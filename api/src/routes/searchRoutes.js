const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const canalController = require('../controllers/canalController');
const userController = require('../controllers/userController');

/**
 * Routes pour les fonctionnalités de recherche globale
 */

// Recherche d'utilisateurs (pour les mentions @)
router.get('/users', authenticate, userController.searchUsers);

// Recherche de canaux publics (pour les mentions #)
router.get('/canaux', authenticate, canalController.rechercherCanauxPublics);

module.exports = router;
