const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

/**
 * Routes pour la gestion du profil utilisateur
 */

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticate, userController.getProfile);

// Mettre à jour le profil de l'utilisateur
router.put('/profile', authenticate, userController.updateProfile);

// Changer la photo de profil
router.put('/profile/picture', authenticate, upload.single('profilePicture'), userController.updateProfilePicture);

// Changer le mot de passe
router.put('/profile/password', authenticate, userController.updatePassword);

// Supprimer le compte
router.delete('/profile', authenticate, userController.deleteAccount);

module.exports = router;
