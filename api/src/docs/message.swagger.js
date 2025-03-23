/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - contenu
 *         - auteur
 *         - canal
 *       properties:
 *         contenu:
 *           type: string
 *           maxLength: 2000
 *           description: Contenu du message
 *         auteur:
 *           type: string
 *           description: ID de l'utilisateur qui a créé le message
 *         canal:
 *           type: string
 *           description: ID du canal où le message a été envoyé
 *         mentions:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des IDs des utilisateurs mentionnés
 *         canalsReferenced:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des IDs des canaux référencés
 *         reponseA:
 *           type: string
 *           description: ID du message auquel celui-ci répond
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
 *               taille:
 *                 type: number
 *         reactions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               emoji:
 *                 type: string
 *               utilisateurs:
 *                 type: array
 *                 items:
 *                   type: string
 *         modifie:
 *           type: boolean
 *           description: Indique si le message a été modifié
 *
 * @swagger
 * /api/v1/messages/groupe:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un message dans un canal
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenu
 *               - canal
 *             properties:
 *               contenu:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Contenu du message
 *               canal:
 *                 type: string
 *                 description: ID du canal
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: ID utilisateur mentionné
 *                 description: Liste des utilisateurs mentionnés
 *     responses:
 *       201:
 *         description: Message envoyé avec succès
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
 *                       $ref: '#/components/schemas/Message'
 *
 * /api/v1/messages/groupe/{canalId}:
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir les messages d'un canal
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre de messages par page
 *     responses:
 *       200:
 *         description: Liste des messages du canal
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *
 * /api/v1/messages/groupe/{id}:
 *   patch:
 *     tags: [Messages]
 *     summary: Modifier un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       $ref: '#/components/schemas/Message'
 *   delete:
 *     tags: [Messages]
 *     summary: Supprimer un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *     responses:
 *       204:
 *         description: Message supprimé avec succès
 *
 * /api/v1/messages/groupe/{id}/reactions:
 *   post:
 *     tags: [Messages]
 *     summary: Réagir à un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji de réaction
 *     responses:
 *       200:
 *         description: Réaction ajoutée/retirée avec succès
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
 *                       $ref: '#/components/schemas/Message'
 *
 * /api/v1/messages/groupe/{id}/reponses:
 *   post:
 *     tags: [Messages]
 *     summary: Répondre à un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 maxLength: 2000
 *                 description: Contenu de la réponse
 *     responses:
 *       201:
 *         description: Réponse envoyée avec succès
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
 *                       $ref: '#/components/schemas/Message'
 *
 * /api/v1/messages/prive:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un message privé
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenu
 *               - destinataire
 *             properties:
 *               contenu:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Contenu du message
 *               destinataire:
 *                 type: string
 *                 description: ID du destinataire
 *     responses:
 *       201:
 *         description: Message privé envoyé avec succès
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
 *                       $ref: '#/components/schemas/MessagePrive'
 *
 * /api/v1/messages/prive/{utilisateur}:
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir l'historique des messages privés avec un utilisateur
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: utilisateur
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre de messages par page
 *     responses:
 *       200:
 *         description: Liste des messages privés
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MessagePrive'
 *
 * /api/v1/messages/prive/{messageId}/lu:
 *   patch:
 *     tags: [Messages]
 *     summary: Marquer un message privé comme lu
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *     responses:
 *       200:
 *         description: Message marqué comme lu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagePriveResponse'
 *
 * /api/v1/messages/prive/{id}:
 *   patch:
 *     tags: [Messages]
 *     summary: Modifier un message privé
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 maxLength: 2000
 *                 description: Nouveau contenu du message
 *     responses:
 *       200:
 *         description: Message privé modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessagePriveResponse'
 *   delete:
 *     tags: [Messages]
 *     summary: Supprimer un message privé
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *     responses:
 *       204:
 *         description: Message privé supprimé avec succès
 *
 * @swagger
 * components:
 *   schemas:
 *     MessagePrive:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         contenu:
 *           type: string
 *         expediteur:
 *           $ref: '#/components/schemas/User'
 *         destinataire:
 *           $ref: '#/components/schemas/User'
 *         lu:
 *           type: boolean
 *         horodatage:
 *           type: string
 *           format: date-time
 *     MessageResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               $ref: '#/components/schemas/Message'
 *     MessagesListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         resultats:
 *           type: integer
 *         data:
 *           type: object
 *           properties:
 *             messages:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *     MessagePriveResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               $ref: '#/components/schemas/MessagePrive'
 *     MessagesPrivesListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         resultats:
 *           type: integer
 *         data:
 *           type: object
 *           properties:
 *             messages:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MessagePrive'
 */
