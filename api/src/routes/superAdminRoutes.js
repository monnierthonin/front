const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticate, estSuperAdmin } = require('../middleware/auth');

/**
 * Routes pour les fonctionnalités réservées aux super administrateurs
 * Toutes ces routes nécessitent d'être authentifié et d'avoir le rôle de super_admin
 */

// Middleware pour vérifier l'authentification et le rôle de super admin pour toutes les routes
router.use(authenticate, estSuperAdmin);

// Routes pour la gestion des workspaces
router.get('/workspaces', superAdminController.obtenirTousLesWorkspaces);
router.get('/workspaces/:id', superAdminController.obtenirWorkspace);
router.patch('/workspaces/:id', superAdminController.modifierWorkspace);
router.delete('/workspaces/:id', superAdminController.supprimerWorkspace);

// Routes pour la gestion des canaux
router.get('/workspaces/:workspaceId/canaux', superAdminController.obtenirTousLesCanaux);
router.patch('/canaux/:canalId', superAdminController.modifierCanal);
router.delete('/canaux/:canalId', superAdminController.supprimerCanal);

// Routes pour la gestion des utilisateurs
router.get('/utilisateurs', superAdminController.obtenirTousLesUtilisateurs);
router.delete('/utilisateurs/:id', superAdminController.supprimerUtilisateur);
router.patch('/utilisateurs/:id/promouvoir', superAdminController.promouvoirSuperAdmin);
router.patch('/utilisateurs/:id/retrograder', superAdminController.retrograderSuperAdmin);

// Routes pour la gestion des messages
router.delete('/messages/:messageId', superAdminController.supprimerMessage);
router.delete('/messages-prives/:messageId', superAdminController.supprimerMessagePrive);

module.exports = router;
