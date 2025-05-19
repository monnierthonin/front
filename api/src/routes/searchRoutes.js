const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const canalController = require('../controllers/canalController');
const userController = require('../controllers/userController');
const searchController = require('../controllers/searchController');

/**
 * Routes pour les fonctionnalités de recherche globale
 */

// Recherche d'utilisateurs (pour les mentions @ et la recherche globale)
router.get('/users', authenticate, searchController.searchUsers);

// Recherche de canaux publics (pour les mentions #)
router.get('/canaux', authenticate, canalController.rechercherCanauxPublics);

// Recherche de workspaces dont l'utilisateur est membre
router.get('/workspaces', authenticate, searchController.searchMyWorkspaces);

// Recherche de canaux dans un workspace spécifique
router.get('/workspaces/:workspaceId/canaux', authenticate, searchController.searchChannelsInWorkspace);

// Recherche de messages dans un workspace spécifique
router.get('/workspaces/:workspaceId/messages', authenticate, searchController.searchMessagesInWorkspace);

module.exports = router;
