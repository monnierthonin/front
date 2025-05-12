const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const AppError = require('../utils/appError');
const { verifierFichier } = require('../services/mimeService');

// Configuration de base du stockage
const createStorage = (subFolder = '') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      // Déterminer le dossier de destination en fonction du type de fichier
      let uploadPath = path.join(__dirname, '../../public/uploads', subFolder);
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Générer un nom de fichier unique avec l'extension d'origine
      const timestamp = Date.now();
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      cb(null, `${timestamp}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
};

// Filtre pour les fichiers généraux (messages, canaux, etc.)
const generalFileFilter = (req, file, cb) => {
  console.log(`Fichier reçu: ${file.originalname}, type déclaré: ${file.mimetype}`);
  
  // Accepter tous les fichiers, la vérification MIME sera faite dans le contrôleur
  return cb(null, true);
};

// Filtre spécifique pour les photos de profil (JPG, JPEG, PNG, WEBP et SVG)
const profileImageFilter = (req, file, cb) => {
  console.log(`Photo de profil reçue: ${file.originalname}, type déclaré: ${file.mimetype}`);
  
  // Vérification basique du type MIME déclaré (la vérification complète sera faite dans le contrôleur)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  
  return cb(new AppError('Seules les images JPG, JPEG, PNG, WEBP et SVG sont acceptées pour les photos de profil.', 400), false);
};

// Configuration pour les fichiers généraux (messages, canaux, etc.)
const uploadGeneral = multer({
  storage: multer.memoryStorage(), // Utiliser le stockage en mémoire pour la vérification MIME
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // Limite de 20MB
  }
});

// Configuration spécifique pour les photos de profil
const uploadProfile = multer({
  storage: multer.memoryStorage(), // Utiliser le stockage en mémoire pour la vérification MIME
  fileFilter: profileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite plus petite pour les photos de profil (5MB)
  }
});

module.exports = {
  general: uploadGeneral,
  profile: uploadProfile
};
