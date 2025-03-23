const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { validationMessageGroupe, validationMessagePrive, validerResultat } = require('../middleware/validateur');

const router = express.Router();

// Protection de toutes les routes
router.use(authenticate);

// Routes pour les messages de groupe
router.post(
    '/groupe',
    validationMessageGroupe,
    validerResultat,
    messageController.envoyerMessageGroupe
);

router.get(
    '/groupe/:canalId',
    messageController.obtenirMessages
);

router.patch(
    '/groupe/:id',
    validationMessageGroupe,
    validerResultat,
    messageController.modifierMessage
);

router.delete(
    '/groupe/:id',
    messageController.supprimerMessage
);

router.post(
    '/groupe/:id/reactions',
    messageController.reagirMessage
);

router.post(
    '/groupe/:id/reponses',
    validationMessageGroupe,
    validerResultat,
    messageController.repondreMessage
);

// Routes pour les messages privés
router.post(
    '/prive',
    validationMessagePrive,
    validerResultat,
    messageController.envoyerMessagePrive
);

router.get(
    '/prive/:utilisateur',
    messageController.getMessagesPrives
);

router.patch(
    '/prive/:messageId/lu',
    messageController.marquerCommeLu
);

router.patch(
    '/prive/:id',
    validationMessagePrive,
    validerResultat,
    messageController.modifierMessagePrive
);

router.delete(
    '/prive/:id',
    messageController.supprimerMessagePrive
);

module.exports = router;
