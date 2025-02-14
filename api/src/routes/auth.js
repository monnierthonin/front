const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { nettoyerEntrees, validationInscription, validationConnexion, validationMiseAJourProfil, validerResultat } = require('../middleware/validateur');
const { proteger } = require('../middleware/auth');

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

router.get('/deconnexion',
  authController.deconnexion
);

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

// Routes protégées (nécessitent une authentification)
router.use(proteger); // Protège toutes les routes suivantes

router.patch('/mettre-a-jour-mot-de-passe',
  nettoyerEntrees,
  validationMiseAJourProfil,
  validerResultat,
  authController.mettreAJourMotDePasse
);

// Route pour délier un compte OAuth
router.delete('/oauth/:provider',
  nettoyerEntrees,
  validationMiseAJourProfil,
  validerResultat,
  authController.delierCompteOAuth
);

module.exports = router;
