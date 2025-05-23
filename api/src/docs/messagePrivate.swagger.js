/**
 * @swagger
 * tags:
 *   - name: Messages Privés
 *     description: Gestion des messages privés entre utilisateurs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MessagePrivate:
 *       type: object
 *       required:
 *         - contenu
 *         - expediteur
 *         - conversation
 *       properties:
 *         contenu:
 *           type: string
 *           maxLength: 2000
 *           description: Contenu du message privé
 *         expediteur:
 *           type: string
 *           description: ID de l'utilisateur qui a envoyé le message
 *         conversation:
 *           type: string
 *           description: ID de la conversation à laquelle le message appartient
 *         lu:
 *           type: array
 *           description: Liste des utilisateurs qui ont lu le message et quand
 *           items:
 *             type: object
 *             properties:
 *               utilisateur:
 *                 type: string
 *                 description: ID de l'utilisateur qui a lu le message
 *               dateLecture:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure à laquelle le message a été lu
 *         envoye:
 *           type: boolean
 *           description: Indique si le message a été correctement envoyé
 *         reponseA:
 *           type: string
 *           description: ID du message auquel celui-ci répond
 *         horodatage:
 *           type: string
 *           format: date-time
 *           description: Date et heure d'envoi du message
 *         modifie:
 *           type: boolean
 *           description: Indique si le message a été modifié
 *         dateModification:
 *           type: string
 *           format: date-time
 *           description: Date et heure de la dernière modification du message
 *         fichiers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               type:
 *                 type: string
 *               url:
 *                 type: string
 *               urlPreview:
 *                 type: string
 *                 description: URL de l'aperçu du fichier (pour les images)
 *               taille:
 *                 type: number
 *         reactions:
 *           type: array
 *           description: Réactions au message
 *           items:
 *             type: object
 *             properties:
 *               utilisateur:
 *                 type: string
 *                 description: ID de l'utilisateur qui a réagi
 *               emoji:
 *                 type: string
 *                 description: Emoji utilisé pour la réaction
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure de la réaction
 */

/**
 * @swagger
 * /api/v1/messages/private:
 *   get:
 *     tags: [Messages Privés]
 *     summary: Récupérer toutes les conversations privées de l'utilisateur connecté
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations privées récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Nombre de conversations
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           prenom:
 *                             type: string
 *                           nom:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                       lastMessage:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           contenu:
 *                             type: string
 *                           horodatage:
 *                             type: string
 *                             format: date-time
 *                           lu:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 utilisateur:
 *                                   type: string
 *                                 dateLecture:
 *                                   type: string
 *                                   format: date-time
 *                           envoye:
 *                             type: boolean
 *                           isFromMe:
 *                             type: boolean
 *                       unreadCount:
 *                         type: integer
 *                         description: Nombre de messages non lus
 */

/**
 * @swagger
 * /api/v1/messages/private/{userId}:
 *   get:
 *     tags: [Messages Privés]
 *     summary: Récupérer les messages privés entre l'utilisateur connecté et un autre utilisateur
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur avec qui récupérer les messages
 *     responses:
 *       200:
 *         description: Messages privés récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MessagePrivate'
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     dateCreation:
 *                       type: string
 *                       format: date-time
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           utilisateur:
 *                             type: string
 *                           dateAjout:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Utilisateur non trouvé
 */

/**
 * @swagger
 * /api/v1/messages/private/{userId}:
 *   post:
 *     tags: [Messages Privés]
 *     summary: Envoyer un message privé à un autre utilisateur
 *     description: Envoie un message privé à un utilisateur en créant ou utilisant une conversation existante
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur destinataire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenu
 *             properties:
 *               contenu:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Contenu du message
 *               reponseA:
 *                 type: string
 *                 description: ID du message auquel celui-ci répond (optionnel)
 *     responses:
 *       201:
 *         description: Message privé envoyé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MessagePrivate'
 *       404:
 *         description: Destinataire non trouvé
 *       403:
 *         description: Non autorisé à répondre à ce message
 */

/**
 * @swagger
 * /api/v1/messages/private/{messageId}/read:
 *   patch:
 *     tags: [Messages Privés]
 *     summary: Marquer un message privé comme lu
 *     description: Ajoute l'utilisateur connecté à la liste des lecteurs du message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message à marquer comme lu
 *     responses:
 *       200:
 *         description: Message marqué comme lu avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Message de confirmation (optionnel)
 *                   example: Le message est déjà marqué comme lu par l'expéditeur
 *                 data:
 *                   $ref: '#/components/schemas/MessagePrivate'
 *       404:
 *         description: Message non trouvé ou conversation non trouvée
 *       403:
 *         description: Non autorisé à accéder à cette conversation
 */

/**
 * @swagger
 * /api/v1/messages/private/{messageId}:
 *   patch:
 *     tags: [Messages Privés]
 *     summary: Modifier un message privé
 *     description: Permet à l'expéditeur de modifier le contenu d'un message privé s'il est participant à la conversation
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenu
 *             properties:
 *               contenu:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Nouveau contenu du message
 *     responses:
 *       200:
 *         description: Message modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message modifié avec succès
 *                 data:
 *                   $ref: '#/components/schemas/MessagePrivate'
 *       404:
 *         description: Message non trouvé ou conversation non trouvée
 *       403:
 *         description: Non autorisé à modifier ce message ou à accéder à cette conversation
 */

/**
 * @swagger
 * /api/v1/messages/private/{messageId}:
 *   delete:
 *     tags: [Messages Privés]
 *     summary: Supprimer un message privé
 *     description: Supprime un message privé et met à jour le dernier message de la conversation si nécessaire
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message à supprimer
 *     responses:
 *       200:
 *         description: Message supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message supprimé avec succès
 *       404:
 *         description: Message non trouvé ou conversation non trouvée
 *       403:
 *         description: Non autorisé à supprimer ce message ou à accéder à cette conversation
 */

/**
 * @swagger
 * /api/v1/messages/private/files/{conversationId}:
 *   get:
 *     tags: [Messages Privés]
 *     summary: Récupérer les messages avec fichiers d'une conversation
 *     description: Récupère tous les messages contenant des fichiers pour une conversation spécifique
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Messages avec fichiers récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Nombre de messages avec fichiers
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MessagePrivate'
 *       404:
 *         description: Conversation non trouvée
 *       403:
 *         description: Non autorisé à accéder à cette conversation
 */
