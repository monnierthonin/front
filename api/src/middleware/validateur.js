const { validationResult, body } = require('express-validator');
const sanitize = require('mongo-sanitize');

// Middleware pour vérifier les erreurs de validation
const validerResultat = (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({
      success: false,
      erreurs: erreurs.array().map(err => ({
        champ: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Nettoyer toutes les entrées de la requête
const nettoyerEntrees = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// Règles de validation pour l'inscription
const validationInscription = [
  // Email
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),

  // Mot de passe
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),

  // Confirmation du mot de passe
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    }),

  // Nom d'utilisateur
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores')
    .custom(async (value) => {
      const User = require('../models/user');
      const utilisateurExistant = await User.findOne({ username: value });
      if (utilisateurExistant) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      return true;
    }),

  // Prénom (optionnel)
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le prénom ne peut pas dépasser 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces et tirets'),

  // Nom (optionnel)
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces et tirets')
];

// Règles de validation pour la connexion
const validationConnexion = [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Règles de validation pour la mise à jour du profil
const validationMiseAJourProfil = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le prénom ne peut pas dépasser 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces et tirets'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le nom ne peut pas dépasser 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces et tirets'),

  body('currentPassword')
    .optional()
    .custom(async (value, { req }) => {
      if (req.body.newPassword && !value) {
        throw new Error('Le mot de passe actuel est requis pour changer de mot de passe');
      }
      if (value) {
        const User = require('../models/user');
        const utilisateur = await User.findById(req.user.id).select('+password');
        const motDePasseValide = await utilisateur.comparePassword(value);
        if (!motDePasseValide) {
          throw new Error('Mot de passe actuel incorrect');
        }
      }
      return true;
    }),

  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

module.exports = {
  validerResultat,
  nettoyerEntrees,
  validationInscription,
  validationConnexion,
  validationMiseAJourProfil
};
