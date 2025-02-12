const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware pour protéger les routes
exports.proteger = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token existe
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier si l'utilisateur existe toujours
    const utilisateurCourant = await User.findById(decoded.id);
    if (!utilisateurCourant) {
      return res.status(401).json({
        success: false,
        message: 'L\'utilisateur appartenant à ce token n\'existe plus.'
      });
    }

    // Donner accès à l'utilisateur dans la requête
    req.user = utilisateurCourant;
    next();
  } catch (erreur) {
    if (erreur.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    if (erreur.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
    }
    res.status(401).json({
      success: false,
      message: 'Non autorisé',
      error: process.env.NODE_ENV === 'development' ? erreur.message : undefined
    });
  }
};

// Middleware pour restreindre l'accès aux administrateurs
exports.restreindreA = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
      });
    }
    next();
  };
};
