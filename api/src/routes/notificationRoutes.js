const express = require('express');
const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protéger toutes les routes après ce middleware
router.use(authController.protect);

// Routes pour les notifications
router.get('/', notificationController.getNonLues);
router.get('/nombre', notificationController.compterToutesNonLues);
router.get('/canal/:canalId/nombre', notificationController.compterNonLuesPourCanal);
router.get('/conversation/:conversationId/nombre', notificationController.compterNonLuesPourConversation);
router.get('/canaux/:workspaceId', notificationController.getCanauxAvecMessagesNonLus);
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreferences);

router.patch('/:id/lue', notificationController.marquerCommeLue);
router.patch('/canal/:canalId/lues', notificationController.marquerToutesCommeLues);
router.patch('/conversation/:conversationId/lues', notificationController.marquerToutesConversationCommeLues);

module.exports = router;
