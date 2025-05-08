const User = require('../models/user');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const emailService = require('../services/emailService');
const validatePassword = require('../utils/passwordValidator');
const Message = require('../models/message');
const Workspace = require('../models/workspace');

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
   * Obtenir le profil d'un utilisateur spécifique par son ID ou son nom d'utilisateur
   */
  getUserProfile: async (req, res) => {
    try {
      let user;
      const { identifier } = req.params; // Peut être un ID ou un nom d'utilisateur
      
      // Vérifier si l'identifiant est un ID MongoDB valide
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(identifier).select('-password -email -resetPasswordToken -resetPasswordExpires');
      } else {
        // Sinon, chercher par nom d'utilisateur
        user = await User.findOne({ username: identifier }).select('-password -email -resetPasswordToken -resetPasswordExpires');
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      // Ajouter des informations supplémentaires sur l'utilisateur
      // Nombre de messages
      const messageCount = await Message.countDocuments({ auteur: user._id });
      
      // Workspaces dont l'utilisateur est membre
      const workspaces = await Workspace.find({ 'membres.utilisateur': user._id })
        .select('nom description')
        .limit(5); // Limiter à 5 workspaces pour éviter une réponse trop lourde
      
      res.json({
        success: true,
        data: {
          user,
          stats: {
            messageCount,
            workspaceCount: workspaces.length
          },
          workspaces: workspaces.map(w => ({
            id: w._id,
            nom: w.nom,
            description: w.description
          }))
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
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
        const oldPicturePath = path.join('/uploads/profiles', user.profilePicture);
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

      // Valider la complexité du nouveau mot de passe
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      // Important : sélectionner explicitement le champ password
      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      console.log('Mise à jour du mot de passe pour:', user.email);
      console.log('Mot de passe actuel existe:', !!user.password);

      // Cas des comptes OAuth sans mot de passe
      if (!user.password) {
        console.log('Compte OAuth - définition du mot de passe initial');
        // Pour un compte OAuth, on permet de définir un mot de passe initial sans vérification
        user.password = newPassword; // Le middleware pre-save s'occupera du hachage
        await user.save();

        // Envoyer un email de confirmation
        try {
          await emailService.envoyerEmailModificationMotDePasse(user.email, user.username);
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }

        return res.json({
          success: true,
          message: 'Mot de passe défini avec succès. Un email de confirmation a été envoyé.'
        });
      }

      // Pour les comptes avec mot de passe, vérifier l'ancien mot de passe
      console.log('Vérification de l\'ancien mot de passe...');
      const isMatch = await user.comparePassword(currentPassword);
      console.log('Ancien mot de passe valide:', isMatch);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }

      // Mettre à jour le mot de passe - le middleware pre-save s'occupera du hachage
      user.password = newPassword;
      await user.save();
      console.log('Nouveau mot de passe enregistré avec succès');

      // Envoyer un email de confirmation
      try {
        await emailService.envoyerEmailModificationMotDePasse(user.email, user.username);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
      }

      res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès. Un email de confirmation a été envoyé.'
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
      const { password } = req.body;

      // Récupérer l'utilisateur avec son mot de passe
      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier le mot de passe
      // Vérification du mot de passe si fourni
      if (password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Mot de passe incorrect'
          });
        }
      } else {
        // Si le mot de passe n'est pas fourni
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe est requis pour supprimer votre compte'
        });
      }

      // 1. Supprimer la photo de profil
      if (user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('http')) {
        const picturePath = path.join('/uploads/profiles', user.profilePicture);
        try {
          await fs.unlink(picturePath);
        } catch (error) {
          console.error('Erreur lors de la suppression de la photo de profil:', error);
        }
      }

      // 2. Anonymiser les messages de l'utilisateur
      await Message.updateMany(
        { auteur: user._id },
        { 
          $set: { 
            modifie: true,
            contenu: '[Message supprimé]'
          }
        }
      );

      // 3. Supprimer les workspaces dont l'utilisateur est le seul propriétaire
      const userWorkspaces = await Workspace.find({ proprietaire: user._id });
      for (const workspace of userWorkspaces) {
        // Vérifier si l'utilisateur est le seul membre
        if (workspace.membres.length === 1 && 
            workspace.membres[0].utilisateur && 
            workspace.membres[0].utilisateur.toString() === user._id.toString()) {
          await Workspace.findByIdAndDelete(workspace._id);
        } else {
          // Si d'autres membres existent, transférer la propriété au plus ancien membre
          const autreMembre = workspace.membres.find(membre => 
            membre.utilisateur && membre.utilisateur.toString() !== user._id.toString()
          );
          
          if (autreMembre) {
            workspace.proprietaire = autreMembre.utilisateur;
            workspace.membres = workspace.membres.filter(membre => 
              !membre.utilisateur || membre.utilisateur.toString() !== user._id.toString()
            );
            await workspace.save();
          }
        }
      }

      // 4. Retirer l'utilisateur des workspaces dont il est membre
      await Workspace.updateMany(
        { 'membres.utilisateur': user._id },
        { $pull: { membres: { utilisateur: user._id } } }
      );

      // 5. Supprimer le compte utilisateur
      await User.findByIdAndDelete(req.user.id);

      // 6. Envoyer un email de confirmation
      try {
        await emailService.envoyerEmailSuppressionCompte(user.email);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
      }

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
