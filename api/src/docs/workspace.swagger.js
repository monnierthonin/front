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
 *                 enum: [admin, moderateur, membre]
 *                 description: Rôle de l'utilisateur dans le workspace
 *         canaux:
 *           type: array
 *           items:
 *             type: string
 *             description: IDs des canaux du workspace
 *         invitationsEnAttente:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email de l'utilisateur invité
 *               token:
 *                 type: string
 *                 description: Token unique d'invitation
 *               dateInvitation:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'envoi de l'invitation
 *
 * @swagger
 * /api/v1/workspaces:
 *   get:
 *     summary: Obtenir tous les workspaces dont l'utilisateur est membre
 *     description: Récupère uniquement les workspaces dont l'utilisateur connecté est membre (utilisé pour la page d'accueil)
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des workspaces de l'utilisateur
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
 *
 * @swagger
 * /api/v1/workspaces/recherche/public:
 *   get:
 *     summary: Rechercher des workspaces publics
 *     description: Permet de rechercher des workspaces publics par nom ou description (utilisé pour la barre de recherche)
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Terme de recherche pour filtrer les workspaces publics
 *     responses:
 *       200:
 *         description: Liste des workspaces publics correspondant à la recherche
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
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspaces:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non autorisé - Authentification requise
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
 *       500:
 *         description: Erreur serveur
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
 *                   example: Erreur lors de la récupération des workspaces
 *
 * @swagger
 * /api/v1/workspaces:
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
 *                 enum: [membre, moderateur, admin]
 *                 default: membre
 *     responses:
 *       200:
 *         description: Membre ajouté avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace ou utilisateur non trouvé
 *
 * @swagger
 * /api/v1/workspaces/{id}/membres/{membreId}:
 *   delete:
 *     summary: Supprimer un membre du workspace
 *     description: Supprime un utilisateur du workspace
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
 *         name: membreId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Membre supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace ou membre non trouvé
 *       400:
 *         description: Impossible de supprimer le dernier admin ou le propriétaire
 *
 * @swagger
 * /api/v1/workspaces/{id}/quitter:
 *   delete:
 *     summary: Quitter un workspace
 *     description: Permet à l'utilisateur connecté de quitter un workspace dont il est membre
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace à quitter
 *     responses:
 *       200:
 *         description: Workspace quitté avec succès
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
 *                   example: Vous avez quitté le workspace avec succès
 *       400:
 *         description: Impossible de quitter le workspace (propriétaire ou dernier admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: En tant que propriétaire, vous ne pouvez pas quitter le workspace. Transférez la propriété à un autre membre ou supprimez le workspace.
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Workspace non trouvé ou vous n'êtes pas membre
 *
 * @swagger
 * /api/v1/workspaces/{id}/membres/{membreId}/role:
 *   patch:
 *     summary: Modifier le rôle d'un membre
 *     description: Modifie le rôle d'un membre du workspace
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
 *         name: membreId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [membre, moderateur, admin]
 *     responses:
 *       200:
 *         description: Rôle modifié avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace ou membre non trouvé
 *       400:
 *         description: Rôle invalide ou impossible de rétrograder le dernier admin
 *
 * @swagger
 * /api/v1/workspaces/{id}/invitations/{token}:
 *   delete:
 *     summary: Révoquer une invitation
 *     description: Révoque une invitation en attente pour le workspace
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
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Invitation révoquée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Workspace ou invitation non trouvée
 *
 * @swagger
 * /api/v1/workspaces/{id}/inviter:
 *   post:
 *     summary: Envoyer une invitation par email
 *     description: Envoie une invitation par email à un utilisateur pour rejoindre un workspace
 *     tags: [Workspaces]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur à inviter
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
 * /api/v1/workspaces/invitation/{workspaceId}/{token}/verifier:
 *   get:
 *     summary: Vérifier une invitation
 *     description: Vérifie la validité d'une invitation et retourne les informations nécessaires
 *     tags: [Workspaces]
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
 *         description: Informations sur l'invitation
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
 *                     workspaceId:
 *                       type: string
 *                     workspaceNom:
 *                       type: string
 *                     email:
 *                       type: string
 *                     token:
 *                       type: string
 *                     estInscrit:
 *                       type: boolean
 *       400:
 *         description: Token invalide ou expiré
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/workspaces/invitation/{workspaceId}/{token}/accepter:
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
 */
