/**
 * @swagger
 * tags:
 *   - name: Conversations Privées
 *     description: Gestion des conversations privées entre utilisateurs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ConversationPrivee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de la conversation
 *         nom:
 *           type: string
 *           description: Nom de la conversation (optionnel pour les conversations 1:1)
 *         participants:
 *           type: array
 *           description: Liste des participants à la conversation
 *           items:
 *             type: object
 *             properties:
 *               utilisateur:
 *                 type: string
 *                 description: ID de l'utilisateur
 *               dateAjout:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'ajout à la conversation
 *         createur:
 *           type: string
 *           description: ID de l'utilisateur qui a créé la conversation
 *         dateCreation:
 *           type: string
 *           format: date-time
 *           description: Date de création de la conversation
 *         dernierMessage:
 *           type: string
 *           description: ID du dernier message envoyé dans la conversation
 *         estGroupe:
 *           type: boolean
 *           description: Indique s'il s'agit d'une conversation de groupe
 */

/**
 * @swagger
 * /api/v1/conversations:
 *   get:
 *     summary: Récupérer toutes les conversations d'un utilisateur
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 resultats:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ConversationPrivee'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 *   
 *   post:
 *     summary: Créer une nouvelle conversation
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 description: Liste des IDs des participants
 *                 items:
 *                   type: string
 *               nom:
 *                 type: string
 *                 description: Nom de la conversation (optionnel)
 *     responses:
 *       201:
 *         description: Conversation créée
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
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationPrivee'
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}:
 *   get:
 *     summary: Récupérer une conversation spécifique
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Conversation récupérée
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
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationPrivee'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 *   
 *   patch:
 *     summary: Mettre à jour une conversation (nom)
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nouveau nom de la conversation
 *     responses:
 *       200:
 *         description: Conversation mise à jour
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
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationPrivee'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/participants:
 *   post:
 *     summary: Ajouter un participant à une conversation
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur à ajouter
 *     responses:
 *       200:
 *         description: Participant ajouté
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
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationPrivee'
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation ou utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/participants/{userId}:
 *   delete:
 *     summary: Supprimer un participant d'une conversation
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Participant supprimé
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
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationPrivee'
 *       204:
 *         description: Conversation supprimée (si moins de 2 participants)
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation ou utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/leave:
 *   delete:
 *     summary: Quitter une conversation
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       204:
 *         description: Conversation quittée ou supprimée
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/messages:
 *   get:
 *     summary: Récupérer les messages d'une conversation
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Liste des messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 resultats:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MessagePrivate'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 *   
 *   post:
 *     summary: Envoyer un message dans une conversation
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
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
 *                 description: Contenu du message
 *               reponseA:
 *                 type: string
 *                 description: ID du message auquel on répond (optionnel)
 *     responses:
 *       201:
 *         description: Message envoyé
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
 *                     message:
 *                       $ref: '#/components/schemas/MessagePrivate'
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/messages/{messageId}:
 *   put:
 *     summary: Modifier un message
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
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
 *                 description: Nouveau contenu du message
 *     responses:
 *       200:
 *         description: Message modifié
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
 *                     message:
 *                       $ref: '#/components/schemas/MessagePrivate'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation ou message non trouvé
 *       500:
 *         description: Erreur serveur
 *   
 *   delete:
 *     summary: Supprimer un message
 *     tags: [Conversations Privées]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *     responses:
 *       204:
 *         description: Message supprimé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation ou message non trouvé
 *       500:
 *         description: Erreur serveur
 */
