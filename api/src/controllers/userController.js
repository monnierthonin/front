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
   * Rechercher des utilisateurs par nom d'utilisateur, prénom ou nom
   * ou récupérer tous les utilisateurs
   */
  searchUsers: async (req, res) => {
    try {
      // Option pour récupérer tous les utilisateurs, prioritaire sur les autres paramètres
      const all = req.query.all === 'true';
      
      // Récupérer le paramètre de recherche, défaut à chaîne vide si non fourni
      const q = req.query.q || '';
      let query = {};
      
      // Si le paramètre all est fourni, on retourne tous les utilisateurs
      if (!all) {
        // Sinon, on filtre par le terme de recherche si fourni
        if (q && q.trim() !== '') {
          query = {
            $or: [
              { username: { $regex: q, $options: 'i' } },
              { firstName: { $regex: q, $options: 'i' } },
              { lastName: { $regex: q, $options: 'i' } }
            ]
          };
        }
      }
      
      // Exclure l'utilisateur connecté des résultats
      query._id = { $ne: req.user._id };
      
      // Récupérer les utilisateurs
      const users = await User.find(query)
        .select('username firstName lastName profilePicture status')
        .limit(20);
      
      res.json({
        status: 'success',
        data: {
          users
        }
      });
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la recherche d\'utilisateurs',
        error: error.message
      });
    }
  },
  
  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      // La transformation des URLs est maintenant gérée par le schéma User
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
      
      // La transformation des URLs est maintenant gérée par le schéma User
      res.json({
        success: true,
        data: {
          user: user,
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
      
      // Vérifier que le type de fichier est autorisé
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'image non autorisé. Utilisez JPG, JPEG, PNG, WEBP ou SVG.'
        });
      }

      const user = await User.findById(req.user.id);

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const uniqueSuffix = require('crypto').randomBytes(8).toString('hex');
      const fileExtension = path.extname(req.file.originalname);
      const filename = `${timestamp}-${uniqueSuffix}${fileExtension}`;
      
      // Chemin de sauvegarde
      const uploadDir = path.join(__dirname, '../../uploads/profiles');
      const filePath = path.join(uploadDir, filename);
      
      // S'assurer que le répertoire existe
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }
      
      // Supprimer l'ancienne photo si elle existe et n'est pas la photo par défaut
      if (user.profilePicture !== 'default.jpg' && !user.profilePicture.startsWith('http')) {
        try {
          const oldPicturePath = path.join(__dirname, '../../uploads/profiles', user.profilePicture);
          await fs.unlink(oldPicturePath);
          console.log('Ancienne photo supprimée:', oldPicturePath);
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'ancienne photo:', error);
          // Continuer même si la suppression échoue
        }
      }

      // Écrire le fichier sur le disque
      await fs.writeFile(filePath, req.file.buffer);
      console.log('Nouvelle photo enregistrée:', filePath);
      
      // Mettre à jour avec la nouvelle photo
      user.profilePicture = filename;
      await user.save();

      res.json({
        success: true,
        message: 'Photo de profil mise à jour avec succès',
        data: {
          profilePicture: filename,
          profilePictureUrl: `/uploads/profiles/${filename}`
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
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
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
        { sender: user._id },
        { 
          $set: { 
            senderDeleted: true,
            senderUsername: 'Utilisateur supprimé'
          }
        }
      );

      // 3. Supprimer les workspaces dont l'utilisateur est le seul propriétaire
      const userWorkspaces = await Workspace.find({ owner: user._id });
      for (const workspace of userWorkspaces) {
        // Vérifier si l'utilisateur est le seul membre
        if (workspace.members.length === 1 && workspace.members[0].toString() === user._id.toString()) {
          await Workspace.findByIdAndDelete(workspace._id);
        } else {
          // Si d'autres membres existent, transférer la propriété au plus ancien membre
          const newOwner = workspace.members.find(memberId => memberId.toString() !== user._id.toString());
          if (newOwner) {
            workspace.owner = newOwner;
            workspace.members = workspace.members.filter(memberId => memberId.toString() !== user._id.toString());
            await workspace.save();
          }
        }
      }

      // 4. Retirer l'utilisateur des workspaces dont il est membre
      await Workspace.updateMany(
        { members: user._id },
        { $pull: { members: user._id } }
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
  },

  /**
   * Rechercher des utilisateurs par nom d'utilisateur, prénom ou nom
   * ou récupérer tous les utilisateurs
   */
  searchUsers: async (req, res) => {
    try {
      // Support pour les paramètres 'q' et 'query' pour la rétro-compatibilité
      const searchTerm = req.query.q || req.query.query;
      const all = req.query.all === 'true';
      
      let query = {};
      
      // Si le paramètre all est fourni, on ne vérifie pas la présence d'un terme de recherche
      if (!all && !searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Un terme de recherche est requis ou le paramètre all=true'
        });
      }

      // Exclure l'utilisateur actuel des résultats
      query._id = { $ne: req.user._id };
      
      // Ajouter les critères de recherche si all n'est pas spécifié
      if (!all && searchTerm) {
        query.$or = [
          { username: { $regex: searchTerm, $options: 'i' } },
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } }
        ];
      }
      
      // Récupérer les utilisateurs
      const users = await User.find(query)
        .select('_id username firstName lastName profilePicture status') // Sélectionner uniquement les champs nécessaires
        .limit(all ? 50 : 10); // Limiter à 50 résultats si all=true, sinon 10

      // La transformation des URLs est maintenant gérée par le schéma User
      res.json({
        success: true,
        data: {
          users: users
        }
      });
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: error.message
      });
    }
  },

  /**
   * Mettre à jour le statut de l'utilisateur
   */
  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      
      // Vérifier que le statut est valide
      if (!['en ligne', 'absent', 'ne pas déranger'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Le statut doit être 'en ligne', 'absent' ou 'ne pas déranger'"
        });
      }
      
      // Mettre à jour le statut de l'utilisateur
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      user.status = status;
      user.dernierActivite = Date.now();
      await user.save();
      
      res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        data: {
          status: user.status
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      });
    }
  },

  /**
   * Mettre à jour le thème de l'utilisateur
   */
  updateTheme: async (req, res) => {
    try {
      const { theme } = req.body;
      
      // Vérifier que le thème est valide
      if (!['clair', 'sombre'].includes(theme)) {
        return res.status(400).json({
          success: false,
          message: "Le thème doit être 'clair' ou 'sombre'"
        });
      }
      
      // Mettre à jour le thème de l'utilisateur
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      user.theme = theme;
      await user.save();
      
      res.json({
        success: true,
        message: 'Thème mis à jour avec succès',
        data: {
          theme: user.theme
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du thème',
        error: error.message
      });
    }
  }
};

module.exports = userController;
