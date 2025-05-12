/**
 * @swagger
 * tags:
 *   name: Fichiers
 *   description: Gestion des fichiers pour canaux et conversations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Fichier:
 *       type: object
 *       required:
 *         - nom
 *         - type
 *         - url
 *         - taille
 *       properties:
 *         nom:
 *           type: string
 *           description: Nom original du fichier
 *         type:
 *           type: string
 *           description: Type MIME du fichier
 *         url:
 *           type: string
 *           description: URL relative du fichier
 *         urlPreview:
 *           type: string
 *           description: URL de la prévisualisation du fichier
 *         taille:
 *           type: number
 *           description: Taille du fichier en octets
 */

/**
 * @swagger
 * /api/v1/fichiers/canal/{canalId}:
 *   post:
 *     summary: Télécharge un fichier dans un canal
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du canal
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichier:
 *                 type: string
 *                 format: binary
 *                 description: Fichier à télécharger (max 20MB)
 *               contenu:
 *                 type: string
 *                 description: Contenu du message associé (optionnel)
 *               messageId:
 *                 type: string
 *                 description: ID du message existant (optionnel)
 *     responses:
 *       201:
 *         description: Fichier téléchargé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     fichier:
 *                       $ref: '#/components/schemas/Fichier'
 *                     message:
 *                       type: object
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /api/v1/fichiers/conversation/{conversationId}:
 *   post:
 *     summary: Télécharge un fichier dans une conversation privée
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la conversation
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichier:
 *                 type: string
 *                 format: binary
 *                 description: Fichier à télécharger (max 20MB)
 *               contenu:
 *                 type: string
 *                 description: Contenu du message associé (optionnel)
 *               messageId:
 *                 type: string
 *                 description: ID du message existant (optionnel)
 *     responses:
 *       201:
 *         description: Fichier téléchargé avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /api/v1/fichiers/profile:
 *   post:
 *     summary: Télécharge une photo de profil
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichier:
 *                 type: string
 *                 format: binary
 *                 description: Image de profil (jpg, png, gif)
 *     responses:
 *       200:
 *         description: Photo de profil téléchargée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non authentifié
 */

/**
 * @swagger
 * /api/v1/fichiers/{messageType}/{messageId}/{fichierUrl}:
 *   delete:
 *     summary: Supprime un fichier
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageType
 *         schema:
 *           type: string
 *           enum: [canal, conversation]
 *         required: true
 *         description: Type de message (canal ou conversation)
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du message
 *       - in: path
 *         name: fichierUrl
 *         schema:
 *           type: string
 *         required: true
 *         description: URL du fichier à supprimer
 *     responses:
 *       200:
 *         description: Fichier supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Fichier non trouvé
 */

/**
 * @swagger
 * /api/v1/fichiers/canal/{canalId}:
 *   get:
 *     summary: Liste tous les fichiers d'un canal
 *     tags: [Fichiers]
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
 *         description: Liste des fichiers du canal
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */

/**
 * @swagger
 * /api/v1/fichiers/conversation/{conversationId}:
 *   get:
 *     summary: Liste tous les fichiers d'une conversation
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Liste des fichiers de la conversation
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
