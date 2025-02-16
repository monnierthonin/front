/**
 * @swagger
 * tags:
 *   name: Profil
 *   description: Gestion du profil utilisateur
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags:
 *       - Profil
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
 *
 *   put:
 *     tags:
 *       - Profil
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
 *
 *   delete:
 *     tags:
 *       - Profil
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
 *
 * /api/v1/users/profile/picture:
 *   put:
 *     tags:
 *       - Profil
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
 *
 * /api/v1/users/profile/password:
 *   put:
 *     tags:
 *       - Profil
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
