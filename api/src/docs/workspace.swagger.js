/**
 * @swagger
 * components:
 *   schemas:
 *     Workspace:
 *       type: object
 *       required:
 *         - nom
 *         - proprietaire
 *       properties:
 *         nom:
 *           type: string
 *           description: Nom du workspace
 *         description:
 *           type: string
 *           description: Description du workspace
 *         proprietaire:
 *           type: string
 *           description: ID de l'utilisateur propriétaire
 *         visibilite:
 *           type: string
 *           enum: [public, prive]
 *           description: Visibilité du workspace
 *         membres:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               utilisateur:
 *                 type: string
 *                 description: ID de l'utilisateur membre
 *               role:
 *                 type: string
 *                 enum: [admin, membre]
 *                 description: Rôle de l'utilisateur dans le workspace
 *         canaux:
 *           type: array
 *           items:
 *             type: string
 *             description: IDs des canaux du workspace
 *
 * @swagger
 * /api/v1/workspaces:
 *   get:
 *     summary: Obtenir tous les workspaces
 *     description: Récupère tous les workspaces publics et ceux dont l'utilisateur est membre
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 resultats:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspaces:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token d'authentification manquant
 *   post:
 *     summary: Créer un nouveau workspace
 *     description: Crée un nouveau workspace avec l'utilisateur connecté comme propriétaire
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               visibilite:
 *                 type: string
 *                 enum: [public, prive]
 *     responses:
 *       201:
 *         description: Workspace créé avec succès
 *       401:
 *         description: Non authentifié
 *
 * @swagger
 * /api/v1/workspaces/{id}:
 *   get:
 *     summary: Obtenir un workspace spécifique
 *     description: Récupère les détails d'un workspace par son ID
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du workspace
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Workspace non trouvé
 *   patch:
 *     summary: Mettre à jour un workspace
 *     description: Modifie les informations d'un workspace existant
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               visibilite:
 *                 type: string
 *                 enum: [public, prive]
 *     responses:
 *       200:
 *         description: Workspace mis à jour avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *   delete:
 *     summary: Supprimer un workspace
 *     description: Supprime un workspace existant
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Workspace supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/workspaces/{id}/membres:
 *   post:
 *     summary: Ajouter un membre au workspace
 *     description: Ajoute un nouvel utilisateur comme membre du workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *               - utilisateurId
 *             properties:
 *               utilisateurId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, membre]
 *     responses:
 *       200:
 *         description: Membre ajouté avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/workspaces/{id}/inviter/{userId}:
 *   post:
 *     summary: Envoyer une invitation par email
 *     description: Envoie une invitation par email à un utilisateur pour rejoindre le workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à inviter
 *     responses:
 *       200:
 *         description: Invitation envoyée avec succès
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
 *                   example: Invitation envoyée à example@email.com
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/workspaces/invitation/{workspaceId}/{token}:
 *   get:
 *     summary: Accepter une invitation
 *     description: Accepte une invitation à rejoindre un workspace via un token
 *     tags: [Workspaces]
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
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token d'invitation
 *     responses:
 *       200:
 *         description: Invitation acceptée avec succès
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
 *                   example: Vous avez rejoint le workspace avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspace:
 *                       $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Token invalide ou expiré
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Cette invitation ne vous est pas destinée
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/workspaces/rejoindre:
 *   post:
 *     summary: Rejoindre un workspace via un code d'invitation
 *     description: Permet à un utilisateur de rejoindre un workspace en utilisant un code d'invitation
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code d'invitation généré pour le workspace
 *     responses:
 *       200:
 *         description: A rejoint le workspace avec succès
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
 *                   example: Vous avez rejoint le workspace avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspace:
 *                       $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Code invalide ou déjà membre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Code d'invitation invalide ou expiré
 *       401:
 *         description: Non authentifié
 */
