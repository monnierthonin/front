const { validationResult, body } = require('express-validator');
const sanitize = require('mongo-sanitize');
const xss = require('xss');
const mongoose = require('mongoose');

// Middleware pour vérifier les erreurs de validation
exports.validerResultat = (req, res, next) => {
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

// Fonction pour nettoyer les données
exports.nettoyerDonnees = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const cleaned = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      let value = data[key];
      // Nettoyer les chaînes de caractères
      if (typeof value === 'string') {
        value = xss(value);
      }
      // Nettoyer récursivement les objets
      else if (typeof value === 'object' && value !== null) {
        value = exports.nettoyerDonnees(value);
      }
      cleaned[key] = value;
    }
  }
  return sanitize(cleaned);
};

// Middleware pour nettoyer les entrées de la requête
exports.nettoyerEntrees = (req, res, next) => {
  req.body = exports.nettoyerDonnees(req.body);
  req.query = exports.nettoyerDonnees(req.query);
  req.params = exports.nettoyerDonnees(req.params);
  next();
};

// Règles de validation pour l'inscription
exports.validationInscription = [
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
exports.validationConnexion = [
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
exports.validationMiseAJourProfil = [
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

// Validation des messages (groupe et privé)
exports.validationMessage = [
  body('contenu')
    .trim()
    .notEmpty().withMessage('Le message ne peut pas être vide')
    .isLength({ max: 2000 }).withMessage('Le message ne peut pas dépasser 2000 caractères')
    .customSanitizer(value => {
      // Échapper les caractères HTML
      return xss(value);
    })
    .custom(value => {
      // Vérifier les scripts malveillants
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value)) {
        throw new Error('Les scripts ne sont pas autorisés dans les messages');
      }
      // Vérifier les iframes
      if (/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi.test(value)) {
        throw new Error('Les iframes ne sont pas autorisés dans les messages');
      }
      return true;
    }),
];

// Validation spécifique aux messages privés
exports.validationMessagePrive = [
  ...exports.validationMessage,
  body('destinataire')
    .notEmpty().withMessage('Le destinataire est requis')
    .isMongoId().withMessage('ID de destinataire invalide')
];

// Validation spécifique aux messages de groupe
exports.validationMessageGroupe = [
  ...exports.validationMessage,
  body('mentions')
    .optional()
    .isArray().withMessage('Les mentions doivent être un tableau')
    .custom(value => {
      if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('Les IDs des mentions doivent être valides');
      }
      return true;
    })
];
