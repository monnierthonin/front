/**
 * @swagger
 * /api/v1/users/profile/{identifier}:
 *   get:
 *     tags: [Profil]
 *     summary: Obtenir le profil d'un utilisateur spécifique
 *     description: Récupère les informations de profil d'un utilisateur spécifique par son ID ou son nom d'utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: ID MongoDB ou nom d'utilisateur
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
 *                         username:
 *                           type: string
 *                         profilePicture:
 *                           type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         messageCount:
 *                           type: integer
 *                         workspaceCount:
 *                           type: integer
 *                     workspaces:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
