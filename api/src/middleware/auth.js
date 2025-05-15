const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware d'authentification
 * Vérifie le token JWT et ajoute l'utilisateur à la requête
 */
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // Vérifier d'abord le header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Sinon, vérifier le cookie
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supchat_secret_dev');

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({
      success: false,
      message: 'Erreur de vérification',
      error: error.message
    });
  }
};

// Middleware pour restreindre l'accès aux rôles spécifiés
exports.restreindreA = (...roles) => {
  return (req, res, next) => {
    // Super admin a accès à tout
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
      });
    }
    next();
  };
};

// Middleware spécifique pour le super admin
exports.estSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Cette action n\'est autorisée que pour les super administrateurs'
    });
  }
  next();
};
