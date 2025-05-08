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
 *         - destinataire
 *       properties:
 *         contenu:
 *           type: string
 *           maxLength: 2000
 *           description: Contenu du message privé
 *         expediteur:
 *           type: string
 *           description: ID de l'utilisateur qui a envoyé le message
 *         destinataire:
 *           type: string
 *           description: ID de l'utilisateur destinataire du message
 *         lu:
 *           type: boolean
 *           description: Indique si le message a été lu par le destinataire
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
 *                             type: boolean
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
 *       404:
 *         description: Utilisateur non trouvé
 */

/**
 * @swagger
 * /api/v1/messages/private/{userId}:
 *   post:
 *     tags: [Messages Privés]
 *     summary: Envoyer un message privé à un autre utilisateur
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
 *                 data:
 *                   $ref: '#/components/schemas/MessagePrivate'
 *       404:
 *         description: Message non trouvé
 *       403:
 *         description: Non autorisé à marquer ce message comme lu
 */

/**
 * @swagger
 * /api/v1/messages/private/{messageId}:
 *   patch:
 *     tags: [Messages Privés]
 *     summary: Modifier un message privé
 *     description: Permet à l'expéditeur de modifier le contenu d'un message privé
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
 *                 data:
 *                   $ref: '#/components/schemas/MessagePrivate'
 *       404:
 *         description: Message non trouvé
 *       403:
 *         description: Non autorisé à modifier ce message
 */

/**
 * @swagger
 * /api/v1/messages/private/{messageId}:
 *   delete:
 *     tags: [Messages Privés]
 *     summary: Supprimer un message privé
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
 *         description: Message non trouvé
 *       403:
 *         description: Non autorisé à supprimer ce message
 */

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Rechercher des utilisateurs par username, prénom ou nom
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Utilisateurs trouvés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       prenom:
 *                         type: string
 *                       nom:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *                       status:
 *                         type: string
 *       400:
 *         description: Un terme de recherche est requis
 */
