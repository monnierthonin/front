/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la notification
 *         utilisateur:
 *           type: string
 *           description: ID de l'utilisateur destinataire de la notification
 *         type:
 *           type: string
 *           enum: [canal, conversation]
 *           description: Type de la notification (canal ou conversation privée)
 *         reference:
 *           type: string
 *           description: ID du canal ou de la conversation concerné
 *         onModel:
 *           type: string
 *           enum: [Canal, Conversation]
 *           description: Modèle de référence (Canal ou Conversation)
 *         message:
 *           type: string
 *           description: ID du message qui a généré la notification
 *         lu:
 *           type: boolean
 *           description: Indique si la notification a été lue
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création de la notification
 *     NotificationPreferences:
 *       type: object
 *       properties:
 *         mentionsOnly:
 *           type: boolean
 *           description: Si true, l'utilisateur ne reçoit des notifications que pour les mentions
 *         soundEnabled:
 *           type: boolean
 *           description: Si true, le son est activé pour les notifications
 *         desktopEnabled:
 *           type: boolean
 *           description: Si true, les notifications de bureau sont activées
 *
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 *
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Récupérer toutes les notifications non lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications non lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/nombre:
 *   get:
 *     summary: Compter toutes les notifications non lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre total de notifications non lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/canal/{canalId}/nombre:
 *   get:
 *     summary: Compter les notifications non lues pour un canal spécifique
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du canal
 *     responses:
 *       200:
 *         description: Nombre de notifications non lues pour le canal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       403:
 *         description: Interdit - l'utilisateur n'est pas membre du canal
 *       404:
 *         description: Canal non trouvé
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/conversation/{conversationId}/nombre:
 *   get:
 *     summary: Compter les notifications non lues pour une conversation spécifique
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la conversation ou ID de l'utilisateur pour les messages directs
 *     responses:
 *       200:
 *         description: Nombre de notifications non lues pour la conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/canaux/{workspaceId}:
 *   get:
 *     summary: Récupérer tous les canaux avec des messages non lus
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'espace de travail
 *     responses:
 *       200:
 *         description: Liste des canaux avec des messages non lus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     canaux:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           nom:
 *                             type: string
 *                           messagesNonLus:
 *                             type: integer
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/preferences:
 *   get:
 *     summary: Récupérer les préférences de notification de l'utilisateur
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Préférences de notification de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       $ref: '#/components/schemas/NotificationPreferences'
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 *   patch:
 *     summary: Mettre à jour les préférences de notification de l'utilisateur
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mentionsOnly:
 *                 type: boolean
 *               soundEnabled:
 *                 type: boolean
 *               desktopEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Préférences de notification mises à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Préférences de notification mises à jour avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       $ref: '#/components/schemas/NotificationPreferences'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/{id}/lue:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     notification:
 *                       $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       404:
 *         description: Notification non trouvée ou non autorisée
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/canal/{canalId}/lues:
 *   patch:
 *     summary: Marquer toutes les notifications d'un canal comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du canal
 *     responses:
 *       200:
 *         description: Notifications marquées comme lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 7
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       403:
 *         description: Interdit - l'utilisateur n'est pas membre du canal
 *       404:
 *         description: Canal non trouvé
 *       500:
 *         description: Erreur serveur
 *
 * @swagger
 * /api/v1/notifications/conversation/{conversationId}/lues:
 *   patch:
 *     summary: Marquer toutes les notifications d'une conversation comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la conversation ou ID de l'utilisateur pour les messages directs
 *     responses:
 *       200:
 *         description: Notifications marquées comme lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 4
 *       401:
 *         description: Non autorisé - JWT manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
