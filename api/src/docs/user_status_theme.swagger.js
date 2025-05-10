/**
 * @swagger
 * /api/v1/users/status:
 *   put:
 *     tags: [Profil]
 *     summary: Mettre à jour le statut de l'utilisateur
 *     description: Permet à l'utilisateur de définir manuellement son statut de disponibilité
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [en ligne, absent, ne pas déranger]
 *                 example: "en ligne"
 *                 description: Le statut de disponibilité de l'utilisateur
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
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
 *                   example: "Statut mis à jour avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "en ligne"
 *       400:
 *         description: Statut invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/users/theme:
 *   put:
 *     tags: [Profil]
 *     summary: Mettre à jour le thème de l'utilisateur
 *     description: Permet à l'utilisateur de définir sa préférence de thème (clair ou sombre)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [clair, sombre]
 *                 example: "sombre"
 *                 description: Le thème préféré de l'utilisateur
 *     responses:
 *       200:
 *         description: Thème mis à jour avec succès
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
 *                   example: "Thème mis à jour avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     theme:
 *                       type: string
 *                       example: "sombre"
 *       400:
 *         description: Thème invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
