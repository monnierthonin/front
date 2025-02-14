const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { envoyerEmailVerification } = require('../services/emailService');

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

    const resetToken = utilisateur.createPasswordResetToken();
    await utilisateur.save({ validateBeforeSave: false });

    // TODO: Envoyer l'email de réinitialisation

    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });
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
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    utilisateur.password = req.body.password;
    utilisateur.resetPasswordToken = undefined;
    utilisateur.resetPasswordExpires = undefined;

    await utilisateur.save();

    envoyerToken(utilisateur, 200, res);
  } catch (erreur) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Mettre à jour le mot de passe
exports.mettreAJourMotDePasse = async (req, res) => {
  try {
    const utilisateur = await User.findById(req.user.id).select('+password');

    if (!await utilisateur.comparePassword(req.body.currentPassword)) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    utilisateur.password = req.body.newPassword;
    await utilisateur.save();

    envoyerToken(utilisateur, 200, res);
  } catch (erreur) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du mot de passe',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
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

module.exports = {
  inscription: exports.inscription,
  connexion: exports.connexion,
  deconnexion: exports.deconnexion,
  verifierEmail: exports.verifierEmail,
  demanderReinitialisationMotDePasse: exports.demanderReinitialisationMotDePasse,
  reinitialiserMotDePasse: exports.reinitialiserMotDePasse,
  mettreAJourMotDePasse: exports.mettreAJourMotDePasse,
  verifierUtilisateurDev: exports.verifierUtilisateurDev
};
