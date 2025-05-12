/**
 * @swagger
 * tags:
 *   - name: Profil
 *     description: Gestion du profil utilisateur (informations, photo, mot de passe)
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags: [Profil]
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     tags: [Profil]
 *     summary: Mettre à jour le profil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "NouveauPseudo"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nouveau@email.com"
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   delete:
 *     tags: [Profil]
 *     summary: Supprimer le compte
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/users/profile/picture:
 *   put:
 *     tags: [Profil]
 *     summary: Mettre à jour la photo de profil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo de profil mise à jour avec succès
 *       400:
 *         description: Fichier invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/users/profile/password:
 *   put:
 *     tags: [Profil]
 *     summary: Changer le mot de passe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "AncienMotDePasse123!"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NouveauMotDePasse123!"
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Mot de passe actuel incorrect
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/users/profile/{identifier}:
 *   get:
 *     tags: [Profil]
 *     summary: Obtenir le profil d'un utilisateur spécifique par ID ou nom d'utilisateur
 *     description: Récupère les informations de profil d'un utilisateur spécifique. L'identifiant peut être soit l'ID MongoDB de l'utilisateur, soit son nom d'utilisateur.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB ou nom d'utilisateur
 *         example: "5f8d0f3e1c9d440000a1b2c3"
 *     responses:
 *       200:
 *         description: Profil utilisateur récupéré avec succès
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "5f8d0f3e1c9d440000a1b2c3"
 *                         username:
 *                           type: string
 *                           example: "username123"
 *                         profilePicture:
 *                           type: string
 *                           example: "https://example.com/profile.jpg"
 *                         bio:
 *                           type: string
 *                           example: "Ma biographie"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-01-01T00:00:00.000Z"
 *                     stats:
 *                       type: object
 *                       properties:
 *                         messageCount:
 *                           type: integer
 *                           example: 42
 *                         workspaceCount:
 *                           type: integer
 *                           example: 3
 *                     workspaces:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "5f8d0f3e1c9d440000a1b2c3"
 *                           nom:
 *                             type: string
 *                             example: "Mon Workspace"
 *                           description:
 *                             type: string
 *                             example: "Description du workspace"
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
