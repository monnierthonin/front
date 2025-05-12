const express = require('express');
const router = express.Router({ mergeParams: true }); // Pour accéder aux paramètres du parent (workspaceId)
const canalController = require('../controllers/canalController');
const messageRoutes = require('./messageRoutes');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../services/fichierService');

/**
 * Routes pour la gestion des canaux
 */

// Utiliser les routes de messages
router.use('/:canalId/messages', messageRoutes);

// Créer un nouveau canal dans un workspace
router.post('/', authenticate, canalController.creerCanal);

// Obtenir tous les canaux d'un workspace
router.get('/', authenticate, canalController.obtenirCanaux);

// Obtenir un canal spécifique
router.get('/:id', authenticate, canalController.obtenirCanal);

// Mettre à jour un canal
router.patch('/:id', authenticate, canalController.mettreAJourCanal);

// Supprimer un canal
router.delete('/:id', authenticate, canalController.supprimerCanal);

// Gestion des membres
router.post('/:id/membres', authenticate, canalController.ajouterMembre);
router.patch('/:id/membres/:membreId/role', authenticate, canalController.modifierRoleMembre);
router.delete('/:id/membres/:membreId', authenticate, canalController.supprimerMembre);

// Note: Les routes de gestion des fichiers ont été déplacées vers fichierRoutes.js

module.exports = router;
