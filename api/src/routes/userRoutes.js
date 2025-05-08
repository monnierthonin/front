const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

/**
 * Routes pour la gestion du profil utilisateur
 */

// Routes protégées
router.use(authenticate);

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', userController.getProfile);

// Rechercher des utilisateurs par nom d'utilisateur, prénom ou nom
router.get('/search', userController.searchUsers);

// Obtenir le profil d'un utilisateur spécifique par ID ou nom d'utilisateur
router.get('/profile/:identifier', userController.getUserProfile);

// Mise à jour du profil
router.put('/profile', userController.updateProfile);

// Mise à jour du mot de passe
router.put('/profile/password', userController.updatePassword);

// Mise à jour de la photo de profil
router.put('/profile/picture', upload.single('profilePicture'), userController.updateProfilePicture);

// Suppression du compte
router.delete('/profile', userController.deleteAccount);

module.exports = router;
