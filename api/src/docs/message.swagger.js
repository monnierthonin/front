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
 *               urlPreview:
 *                 type: string
 *                 description: URL de l'aperçu du fichier (pour les images)
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
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un message dans un canal
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
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
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir les messages d'un canal
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
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
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{messageId}:
 *   patch:
 *     tags: [Messages]
 *     summary: Modifier un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
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
 *                 maxLength: 2000
 *                 description: Nouveau contenu du message
 *     responses:
 *       200:
 *         description: Message modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *   delete:
 *     tags: [Messages]
 *     summary: Supprimer un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *     responses:
 *       204:
 *         description: Message supprimé avec succès
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{messageId}/reactions:
 *   post:
 *     tags: [Messages]
 *     summary: Réagir à un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
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
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji à ajouter comme réaction
 *     responses:
 *       200:
 *         description: Réaction ajoutée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{messageId}/reponses:
 *   post:
 *     tags: [Messages]
 *     summary: Répondre à un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
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
 *                 maxLength: 2000
 *                 description: Contenu de la réponse
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: ID utilisateur mentionné
 *                 description: Liste des utilisateurs mentionnés
 *     responses:
 *       201:
 *         description: Réponse envoyée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *
 * @swagger
 * components:
 *   schemas:
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
 */
