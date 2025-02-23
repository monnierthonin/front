const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const canalRouter = require('./canalRoutes');
const { authenticate } = require('../middleware/auth');

/**
 * Routes pour la gestion des workspaces
 */

// Utiliser les routes de canaux pour les routes imbriquées
router.use('/:workspaceId/canaux', canalRouter);

// Obtenir tous les workspaces
router.get('/', authenticate, workspaceController.obtenirWorkspaces);

// Créer un nouveau workspace
router.post('/', authenticate, workspaceController.creerWorkspace);

// Obtenir un workspace spécifique
router.get('/:id', authenticate, workspaceController.obtenirWorkspace);

// Mettre à jour un workspace
router.patch('/:id', authenticate, workspaceController.mettreAJourWorkspace);

// Supprimer un workspace
router.delete('/:id', authenticate, workspaceController.supprimerWorkspace);

// Envoyer une invitation à un utilisateur
router.post('/:id/inviter/:userId', authenticate, workspaceController.envoyerInvitation);

// Accepter une invitation
router.get('/invitation/:workspaceId/:token', authenticate, workspaceController.accepterInvitation);

module.exports = router;
