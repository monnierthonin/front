const express = require('express');
const fichierController = require('../controllers/fichierController');
const { authenticate } = require('../middleware/auth');
const { general: upload } = require('../config/multer');

const router = express.Router();

// Protection de toutes les routes
router.use(authenticate);

// Upload de fichiers
router.post(
    '/canal/:canalId',
    upload.single('fichier'),
    fichierController.uploadFichierCanal
);

router.post(
    '/conversation/:conversationId',
    upload.single('fichier'),
    fichierController.uploadFichierConversation
);

router.post(
    '/profile',
    upload.single('fichier'),
    fichierController.uploadPhotoProfil
);

// Gestion des fichiers
router.delete(
    '/:messageType/:messageId/:fichierUrl',
    fichierController.supprimerFichier
);

// Liste des fichiers
router.get(
    '/canal/:canalId',
    fichierController.listerFichiersCanal
);

router.get(
    '/conversation/:conversationId',
    fichierController.listerFichiersConversation
);

module.exports = router;
