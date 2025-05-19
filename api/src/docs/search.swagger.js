/**
 * @swagger
 * tags:
 *   - name: Recherche
 *     description: Fonctionnalités de recherche globale (utilisateurs, canaux, workspaces, messages)
 */

/**
 * @swagger
 * /api/v1/search/users:
 *   get:
 *     tags: [Recherche]
 *     summary: Rechercher des utilisateurs
 *     description: Recherche des utilisateurs par nom d'utilisateur ou nom complet. Utilisé notamment pour les mentions avec @.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Terme de recherche (optionnel si all=true)
 *         example: "john"
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Si true, retourne tous les utilisateurs (limité à 50)
 *         example: false
 *     responses:
 *       200:
 *         description: Liste des utilisateurs correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "5f8d0f3e1c9d440000a1b2c3"
 *                           username:
 *                             type: string
 *                             example: "johndoe"
 *                           firstName:
 *                             type: string
 *                             example: "John"
 *                           lastName:
 *                             type: string
 *                             example: "Doe"
 *                           profilePicture:
 *                             type: string
 *                             example: "https://example.com/profile.jpg"
 *                           status:
 *                             type: string
 *                             example: "en ligne"
 *       400:
 *         description: Requête invalide (terme de recherche manquant)
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/search/canaux:
 *   get:
 *     tags: [Recherche]
 *     summary: Rechercher des canaux publics
 *     description: Recherche des canaux publics par nom ou description. Utilisé notamment pour les mentions avec #.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Terme de recherche (optionnel si all=true)
 *         example: "général"
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Si true, retourne tous les canaux publics (limité à 50)
 *         example: false
 *     responses:
 *       200:
 *         description: Liste des canaux publics correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     canaux:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "5f8d0f3e1c9d440000a1b2c3"
 *                           nom:
 *                             type: string
 *                             example: "général"
 *                           description:
 *                             type: string
 *                             example: "Canal de discussion général"
 *                           visibilite:
 *                             type: string
 *                             example: "public"
 *                           workspace:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "5f8d0f3e1c9d440000a1b2c4"
 *                               nom:
 *                                 type: string
 *                                 example: "Mon Workspace"
 *       400:
 *         description: Requête invalide (terme de recherche manquant)
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/search/workspaces:
 *   get:
 *     tags: [Recherche]
 *     summary: Rechercher des workspaces dont l'utilisateur est membre
 *     description: Recherche des workspaces par nom ou description parmi ceux dont l'utilisateur est membre.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Terme de recherche (optionnel)
 *         example: "projet"
 *     responses:
 *       200:
 *         description: Liste des workspaces correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspaces:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "5f8d0f3e1c9d440000a1b2c4"
 *                           nom:
 *                             type: string
 *                             example: "Projet A"
 *                           description:
 *                             type: string
 *                             example: "Workspace pour le projet A"
 *                           visibilite:
 *                             type: string
 *                             example: "public"
 *                           proprietaire:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "5f8d0f3e1c9d440000a1b2c3"
 *                               username:
 *                                 type: string
 *                                 example: "johndoe"
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/search/workspaces/{workspaceId}/canaux:
 *   get:
 *     tags: [Recherche]
 *     summary: Rechercher des canaux dans un workspace spécifique
 *     description: Recherche des canaux par nom ou description dans un workspace spécifique, limité aux canaux auxquels l'utilisateur a accès.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du workspace
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Terme de recherche (optionnel)
 *         example: "général"
 *     responses:
 *       200:
 *         description: Liste des canaux correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     canaux:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "5f8d0f3e1c9d440000a1b2c3"
 *                           nom:
 *                             type: string
 *                             example: "général"
 *                           description:
 *                             type: string
 *                             example: "Canal de discussion général"
 *                           visibilite:
 *                             type: string
 *                             example: "public"
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé au workspace
 *       404:
 *         description: Workspace non trouvé
 *       500:
 *         description: Erreur serveur
 */

/**
 * @swagger
 * /api/v1/search/workspaces/{workspaceId}/messages:
 *   get:
 *     tags: [Recherche]
 *     summary: Rechercher des messages dans un workspace spécifique
 *     description: Recherche des messages par contenu dans un workspace spécifique, limité aux messages des canaux auxquels l'utilisateur a accès.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du workspace
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche
 *         example: "bonjour"
 *     responses:
 *       200:
 *         description: Liste des messages correspondant à la recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "5f8d0f3e1c9d440000a1b2c3"
 *                           contenu:
 *                             type: string
 *                             example: "Bonjour à tous, comment allez-vous aujourd'hui?"
 *                           auteur:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "5f8d0f3e1c9d440000a1b2c3"
 *                               username:
 *                                 type: string
 *                                 example: "johndoe"
 *                               firstName:
 *                                 type: string
 *                                 example: "John"
 *                               lastName:
 *                                 type: string
 *                                 example: "Doe"
 *                           canal:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "5f8d0f3e1c9d440000a1b2c3"
 *                               nom:
 *                                 type: string
 *                                 example: "général"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-01-01T12:00:00Z"
 *       400:
 *         description: Requête invalide (terme de recherche manquant)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès non autorisé au workspace
 *       404:
 *         description: Workspace non trouvé
 *       500:
 *         description: Erreur serveur
 */
