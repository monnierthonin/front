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

// Obtenir tous les workspaces dont l'utilisateur est membre (page d'accueil)
router.get('/', authenticate, workspaceController.obtenirWorkspaces);

// Rechercher des workspaces publics (pour la barre de recherche)
router.get('/recherche/public', authenticate, workspaceController.rechercherWorkspacesPublics);

// Créer un nouveau workspace
router.post('/', authenticate, workspaceController.creerWorkspace);

// Obtenir un workspace spécifique
router.get('/:id', authenticate, workspaceController.obtenirWorkspace);

// Mettre à jour un workspace
router.patch('/:id', authenticate, workspaceController.mettreAJourWorkspace);

// Supprimer un workspace
router.delete('/:id', authenticate, workspaceController.supprimerWorkspace);

// Gestion des membres
router.post('/:id/membres', authenticate, workspaceController.ajouterMembre);
router.delete('/:id/membres/:membreId', authenticate, workspaceController.supprimerMembre);
router.patch('/:id/membres/:membreId/role', authenticate, workspaceController.modifierRoleMembre);

// Gestion des invitations
router.post('/:id/inviter', authenticate, workspaceController.envoyerInvitation);
router.delete('/:id/invitations/:token', authenticate, workspaceController.revoquerInvitation);
router.get('/invitation/:workspaceId/:token/verifier', workspaceController.verifierInvitation);
router.get('/invitation/:workspaceId/:token/accepter', authenticate, workspaceController.accepterInvitation);

module.exports = router;
