const express = require('express');
const router = express.Router({ mergeParams: true }); // Pour accéder aux paramètres du parent (workspaceId)
const canalController = require('../controllers/canalController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../services/fichierService');

/**
 * Routes pour la gestion des canaux
 */

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

// Routes de gestion des fichiers
router.post('/:id/fichiers', 
    authenticate, 
    upload.array('fichiers', 10), // Maximum 10 fichiers à la fois
    canalController.uploadFichier
);
router.get('/:id/fichiers', authenticate, canalController.obtenirFichiers);
router.delete('/:id/fichiers/:fichierId', authenticate, canalController.supprimerFichier);

module.exports = router;
