const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, estAdmin } = require('../middleware/auth');

/**
 * Routes pour les fonctionnalités réservées aux administrateurs
 * Toutes ces routes nécessitent d'être authentifié et d'avoir le rôle d'admin
 */

// Middleware pour vérifier l'authentification et le rôle d'admin pour toutes les routes
router.use(authenticate, estAdmin);

// Routes pour la gestion des workspaces
router.get('/workspaces', adminController.obtenirTousLesWorkspaces);
router.get('/workspaces/:id', adminController.obtenirWorkspace);
router.patch('/workspaces/:id', adminController.modifierWorkspace);
router.delete('/workspaces/:id', adminController.supprimerWorkspace);

// Routes pour la gestion des canaux
router.get('/workspaces/:workspaceId/canaux', adminController.obtenirTousLesCanaux);
router.patch('/canaux/:canalId', adminController.modifierCanal);
router.delete('/canaux/:canalId', adminController.supprimerCanal);

// Routes pour la gestion des utilisateurs
router.get('/utilisateurs', adminController.obtenirTousLesUtilisateurs);
router.delete('/utilisateurs/:id', adminController.supprimerUtilisateur);
router.patch('/utilisateurs/:id/promouvoir', adminController.promouvoirAdmin);

// Routes pour la gestion des messages
router.delete('/messages/:messageId', adminController.supprimerMessage);
router.delete('/messages-prives/:messageId', adminController.supprimerMessagePrive);

module.exports = router;
