const User = require('../models/user');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const emailService = require('../services/emailService');

const userController = {
  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  },

  /**
   * Mettre à jour le profil de l'utilisateur
   */
  updateProfile: async (req, res) => {
    try {
      const { username, email } = req.body;
      const updates = {};

      if (username) updates.username = username;
      
      // Vérifier si l'email est modifié
      const currentUser = await User.findById(req.user.id);
      if (email && email !== currentUser.email) {
        // Vérifier si l'email n'est pas déjà utilisé
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Cette adresse email est déjà utilisée'
          });
        }
        updates.email = email;
        
        // Envoyer un email de confirmation au nouvel email
        try {
          await emailService.envoyerEmailModificationEmail(email, username || currentUser.username);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
          // On continue malgré l'erreur d'envoi d'email
        }
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: email !== currentUser.email 
          ? 'Profil mis à jour avec succès. Un email de confirmation a été envoyé à votre nouvelle adresse.'
          : 'Profil mis à jour avec succès',
        data: user
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil',
        error: error.message
      });
    }
  },

  /**
   * Mettre à jour la photo de profil
   */
  updateProfilePicture: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucune image fournie'
        });
      }

      const user = await User.findById(req.user.id);

      // Supprimer l'ancienne photo si elle existe et n'est pas la photo par défaut
      if (user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('http')) {
        const oldPicturePath = path.join(__dirname, '../../uploads/profiles', user.profilePicture);
        try {
          await fs.unlink(oldPicturePath);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ancienne photo:', error);
        }
      }

      // Mettre à jour avec la nouvelle photo
      user.profilePicture = req.file.filename;
      await user.save();

      res.json({
        success: true,
        message: 'Photo de profil mise à jour avec succès',
        data: {
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo de profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la photo de profil',
        error: error.message
      });
    }
  },

  /**
   * Mettre à jour le mot de passe
   */
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);

      // Cas des comptes OAuth sans mot de passe
      if (!user.password) {
        // Pour un compte OAuth, on permet de définir un mot de passe initial sans vérification
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.json({
          success: true,
          message: 'Mot de passe défini avec succès'
        });
      }

      // Pour les comptes avec mot de passe, vérifier l'ancien mot de passe
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }

      // Hasher et mettre à jour le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du mot de passe',
        error: error.message
      });
    }
  },

  /**
   * Supprimer le compte
   */
  deleteAccount: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      // Supprimer la photo de profil si elle n'est pas la photo par défaut ou une URL
      if (user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('http')) {
        const picturePath = path.join(__dirname, '../../uploads/profiles', user.profilePicture);
        try {
          await fs.unlink(picturePath);
        } catch (error) {
          console.error('Erreur lors de la suppression de la photo de profil:', error);
        }
      }

      await User.findByIdAndDelete(req.user.id);

      res.json({
        success: true,
        message: 'Compte supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du compte',
        error: error.message
      });
    }
  }
};

module.exports = userController;
