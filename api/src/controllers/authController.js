const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { envoyerEmailVerification, envoyerEmailReinitialisationMotDePasse } = require('../services/emailService');

// Générer un token JWT
const genererToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Configuration des cookies
const cookieOptions = {
  expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 24) * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

// Envoyer le token dans un cookie et la réponse
const envoyerToken = (user, statusCode, res) => {
  const token = genererToken(user._id);

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // Ne pas envoyer le mot de passe

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// Inscription
exports.inscription = async (req, res) => {
  try {
    const nouvelUtilisateur = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    });

    // Générer le token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    nouvelUtilisateur.verificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    nouvelUtilisateur.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures

    await nouvelUtilisateur.save();

    // Envoyer l'email de vérification
    try {
      await envoyerEmailVerification(
        nouvelUtilisateur.email,
        nouvelUtilisateur.username,
        verificationToken
      );
    } catch (erreurEmail) {
      console.error('Erreur lors de l\'envoi de l\'email:', erreurEmail);
      // On continue malgré l'erreur d'envoi d'email
    }
    
    envoyerToken(nouvelUtilisateur, 201, res);
  } catch (erreur) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Connexion d'un utilisateur
exports.connexion = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe et récupérer explicitement le mot de passe
    const utilisateur = await User.findOne({ email }).select('+password');
    
    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si l'utilisateur est vérifié
    if (!utilisateur.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Veuillez vérifier votre email avant de vous connecter'
      });
    }

    // Vérifier si le mot de passe est correct
    const motDePasseValide = await utilisateur.comparePassword(password);
    
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour la dernière connexion
    utilisateur.lastLogin = new Date();
    utilisateur.status = 'online';
    await utilisateur.save({ validateBeforeSave: false });

    // Créer le token JWT
    const token = jwt.sign(
      { id: utilisateur._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Options du cookie
    const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Envoyer le cookie
    res.cookie('jwt', token, cookieOptions);

    // Supprimer le mot de passe de la sortie
    utilisateur.password = undefined;

    res.status(200).json({
      success: true,
      token,
      data: {
        user: utilisateur
      }
    });
  } catch (erreur) {
      // console.log('JWT_COOKIE_EXPIRES_IN:', process.env.JWT_COOKIE_EXPIRES_IN);
      // console.log('Expires Date:', new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000));
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Déconnexion
exports.deconnexion = async (req, res) => {
  try {
    // Mettre à jour le statut de l'utilisateur à "offline"
    await User.findByIdAndUpdate(req.user.id, { status: 'offline' });

    // Supprimer le cookie JWT
    res.cookie('jwt', 'deconnexion', {
      expires: new Date(Date.now() + 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (erreur) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Vérifier l'email
exports.verifierEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const utilisateur = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!utilisateur) {
      // Rediriger vers la page de connexion avec un message d'erreur
      return res.redirect(`${process.env.CLIENT_URL}/login?error=token_invalide`);
    }

    // Si l'utilisateur est déjà vérifié
    if (utilisateur.isVerified) {
      return res.redirect(`${process.env.CLIENT_URL}/login?message=deja_verifie`);
    }

    // Mettre à jour le statut de vérification
    utilisateur.isVerified = true;
    utilisateur.verificationToken = undefined;
    utilisateur.verificationTokenExpires = undefined;

    await utilisateur.save({ validateBeforeSave: false });

    // Rediriger vers la page de connexion avec un message de succès
    res.redirect(`${process.env.CLIENT_URL}/login?message=email_verifie`);
  } catch (erreur) {
    console.error('Erreur lors de la vérification de l\'email:', erreur);
    res.redirect(`${process.env.CLIENT_URL}/login?error=erreur_verification`);
  }
};

// Demander la réinitialisation du mot de passe
exports.demanderReinitialisationMotDePasse = async (req, res) => {
  try {
    const utilisateur = await User.findOne({ email: req.body.email });

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte associé à cet email'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    utilisateur.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Expiration dans 1 heure
    utilisateur.resetPasswordExpires = Date.now() + 3600000;
    await utilisateur.save({ validateBeforeSave: false });

    try {
      await envoyerEmailReinitialisationMotDePasse(
        utilisateur.email,
        utilisateur.firstName || utilisateur.username,
        resetToken
      );

      res.status(200).json({
        success: true,
        message: 'Email de réinitialisation envoyé'
      });
    } catch (erreurEmail) {
      utilisateur.resetPasswordToken = undefined;
      utilisateur.resetPasswordExpires = undefined;
      await utilisateur.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation'
      });
    }
  } catch (erreur) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Réinitialiser le mot de passe
exports.reinitialiserMotDePasse = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const utilisateur = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!utilisateur) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=token_invalide`);
    }

    if (!req.body.password || !req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un nouveau mot de passe et sa confirmation'
      });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    utilisateur.password = req.body.password;
    utilisateur.resetPasswordToken = undefined;
    utilisateur.resetPasswordExpires = undefined;

    await utilisateur.save();

    // Rediriger vers la page de connexion avec un message de succès
    res.redirect(`${process.env.CLIENT_URL}/login?message=mot_de_passe_reinitialise`);
  } catch (erreur) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', erreur);
    res.redirect(`${process.env.CLIENT_URL}/login?error=erreur_reinitialisation`);
  }
};

// Délier un compte OAuth
exports.delierCompteOAuth = async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id).select('+password');

    // Vérifier que le provider est valide
    if (!['google', 'microsoft', 'facebook'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Provider OAuth invalide'
      });
    }

    // Vérifier si l'utilisateur a un mot de passe configuré
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez configurer un mot de passe avant de délier votre compte ' + provider
      });
    }

    // Vérifier si l'utilisateur a le provider à délier
    const oauthProfile = user.oauthProfiles.find(p => p.provider === provider);
    if (!oauthProfile) {
      return res.status(404).json({
        success: false,
        message: `Aucun compte ${provider} n'est lié à votre compte`
      });
    }

    // Si c'est le seul moyen de connexion, empêcher la suppression
    if (user.oauthProfiles.length === 1 && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de délier le compte : c\'est votre seule méthode de connexion'
      });
    }

    try {
      // Révoquer le token d'accès Google
      if (provider === 'google' && oauthProfile.accessToken) {
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${oauthProfile.accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la révocation du token:', error);
      // On continue même si la révocation échoue
    }

    // Retirer le profil OAuth
    user.oauthProfiles = user.oauthProfiles.filter(p => p.provider !== provider);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Compte ${provider} délié avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la déliaison du compte OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déliaison du compte',
      error: error.message
    });
  }
};

// Route de développement pour vérifier directement un utilisateur
exports.verifierUtilisateurDev = async (req, res) => {
  // Ne permettre cette route qu'en développement
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Route non trouvée'
    });
  }

  try {
    const utilisateur = await User.findOne({ email: req.params.email });
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    utilisateur.isVerified = true;
    utilisateur.verificationToken = undefined;
    utilisateur.verificationTokenExpires = undefined;
    
    await utilisateur.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Utilisateur vérifié avec succès'
    });
  } catch (erreur) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Callback Google OAuth2
exports.googleCallback = async (req, res) => {
  try {
    const token = genererToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Erreur lors du callback Google:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// Callback Microsoft OAuth2
exports.microsoftCallback = async (req, res) => {
  try {
    const token = genererToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Erreur lors du callback Microsoft:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
};

// Callback Facebook OAuth2
exports.facebookCallback = async (req, res) => {
  try {
    const token = genererToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Erreur lors du callback Facebook:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
};

module.exports = {
  inscription: exports.inscription,
  connexion: exports.connexion,
  deconnexion: exports.deconnexion,
  verifierEmail: exports.verifierEmail,
  demanderReinitialisationMotDePasse: exports.demanderReinitialisationMotDePasse,
  reinitialiserMotDePasse: exports.reinitialiserMotDePasse,
  delierCompteOAuth: exports.delierCompteOAuth,
  verifierUtilisateurDev: exports.verifierUtilisateurDev,
  googleCallback: exports.googleCallback,
  microsoftCallback: exports.microsoftCallback,
  facebookCallback: exports.facebookCallback
};
