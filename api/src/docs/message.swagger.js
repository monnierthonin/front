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
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages:
 *   post:
 *     summary: Créer un nouveau message
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
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
 *               fichiers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nom:
 *                       type: string
 *                     type:
 *                       type: string
 *                     url:
 *                       type: string
 *                     taille:
 *                       type: number
 *     responses:
 *       201:
 *         description: Message créé avec succès
 *   get:
 *     summary: Obtenir les messages d'un canal
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Liste des messages récupérée avec succès
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{id}:
 *   patch:
 *     summary: Modifier un message
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Message modifié avec succès
 *   delete:
 *     summary: Supprimer un message
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Message supprimé avec succès
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{id}/reactions:
 *   post:
 *     summary: Réagir à un message
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Réaction ajoutée avec succès
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{canalId}/messages/{id}/reponses:
 *   post:
 *     summary: Répondre à un message
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               fichiers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nom:
 *                       type: string
 *                     type:
 *                       type: string
 *                     url:
 *                       type: string
 *                     taille:
 *                       type: number
 *     responses:
 *       201:
 *         description: Réponse créée avec succès
 */
