const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { nettoyerEntrees, validationInscription, validationConnexion, validationMiseAJourProfil, validerResultat } = require('../middleware/validateur');
const { authenticate } = require('../middleware/auth');
const jwt = require('jsonwebtoken'); // Ajout de la dépendance jwt

// Routes publiques
router.post('/inscription',
  nettoyerEntrees,
  validationInscription,
  validerResultat,
  authController.inscription
);

router.post('/connexion',
  nettoyerEntrees,
  validationConnexion,
  validerResultat,
  authController.connexion
);

// Permettre GET et POST pour la déconnexion
router.route('/deconnexion')
  .get(authController.deconnexion)
  .post(authController.deconnexion);

router.get('/verifier-email/:token',
  authController.verifierEmail
);

// Routes OAuth2 Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed` 
  }),
  authController.googleCallback
);

// Routes Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  authController.facebookCallback
);

// Routes Microsoft OAuth
router.get('/microsoft',
  passport.authenticate('microsoft', { 
    scope: ['openid', 'offline_access', 'profile', 'email', 'user.read']
  })
);

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false }),
  authController.microsoftCallback
);

// Route de développement pour vérifier directement un utilisateur
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/verifier/:email',
    authController.verifierUtilisateurDev
  );
}

router.post('/mot-de-passe-oublie',
  nettoyerEntrees,
  authController.demanderReinitialisationMotDePasse
);

router.post('/reinitialiser-mot-de-passe/:token',
  nettoyerEntrees,
  authController.reinitialiserMotDePasse
);

// Route de test pour générer un token JWT valide
router.get('/test-token', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Cette route n\'est pas disponible en production' });
  }
  
  const token = jwt.sign(
    { id: 'utilisateur-test' },
    process.env.JWT_SECRET || 'supchat_secret_dev',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  
  res.json({ token });
});

// Routes protégées (nécessitent une authentification)
router.use(authenticate); // Protège toutes les routes suivantes

// Route pour délier un compte OAuth
router.delete('/oauth/:provider',
  nettoyerEntrees,
  validationMiseAJourProfil,
  validerResultat,
  authController.delierCompteOAuth
);

module.exports = router;
