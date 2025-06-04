/**
 * @swagger
 * tags:
 *   - name: Réactions aux Messages
 *     description: Gestion des réactions et réponses aux messages dans les conversations privées
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/messages/{messageId}/reply:
 *   post:
 *     summary: Répondre à un message spécifique
 *     tags: [Réactions aux Messages]
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
 *         description: ID du message auquel répondre
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
 *                 description: Contenu du message de réponse
 *               fichiers:
 *                 type: array
 *                 description: Fichiers attachés au message (optionnel)
 *                 items:
 *                   type: object
 *                   properties:
 *                     nom:
 *                       type: string
 *                     type:
 *                       type: string
 *                     url:
 *                       type: string
 *                     urlPreview:
 *                       type: string
 *                     taille:
 *                       type: number
 *     responses:
 *       201:
 *         description: Réponse envoyée
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
 *         description: Conversation ou message non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/conversations/{id}/messages/{messageId}/reactions:
 *   post:
 *     summary: Ajouter une réaction à un message
 *     tags: [Réactions aux Messages]
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
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji à ajouter comme réaction
 *     responses:
 *       200:
 *         description: Réaction ajoutée
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
 *                     reaction:
 *                       type: object
 *                       properties:
 *                         utilisateur:
 *                           type: string
 *                         emoji:
 *                           type: string
 *                         date:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Requête invalide ou réaction déjà existante
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
 *     summary: Supprimer une réaction d'un message
 *     tags: [Réactions aux Messages]
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
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji de la réaction à supprimer
 *     responses:
 *       200:
 *         description: Réaction supprimée
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
 *                   example: Réaction supprimée avec succès
 *       400:
 *         description: Requête invalide ou réaction inexistante
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Conversation ou message non trouvé
 *       500:
 *         description: Erreur serveur
 */
