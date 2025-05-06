const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { validationMessageGroupe, validerResultat } = require('../middleware/validateur');

const router = express.Router({ mergeParams: true }); // Important pour accéder aux paramètres des routes parentes

// Protection de toutes les routes
router.use(authenticate);

// Routes pour les messages de groupe
router.get(
    '/',
    messageController.obtenirMessages
);

router.post(
    '/',
    validationMessageGroupe,
    validerResultat,
    messageController.envoyerMessageGroupe
);

router.patch(
    '/:id',
    validationMessageGroupe,
    validerResultat,
    messageController.modifierMessage
);

router.delete(
    '/:id',
    messageController.supprimerMessage
);

router.post(
    '/:id/reactions',
    messageController.reagirMessage
);

router.post(
    '/:id/reponses',
    validationMessageGroupe,
    validerResultat,
    messageController.repondreMessage
);

module.exports = router;
