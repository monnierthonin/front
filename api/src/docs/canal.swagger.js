/**
 * @swagger
 * components:
 *   schemas:
 *     Canal:
 *       type: object
 *       required:
 *         - nom
 *         - workspace
 *         - createur
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du canal
 *         nom:
 *           type: string
 *           description: Nom du canal
 *         description:
 *           type: string
 *           description: Description du canal
 *         workspace:
 *           type: string
 *           description: ID du workspace auquel appartient le canal
 *         createur:
 *           type: string
 *           description: ID de l'utilisateur qui a créé le canal
 *         type:
 *           type: string
 *           enum: [texte, vocal]
 *           description: Type du canal
 *         visibilite:
 *           type: string
 *           enum: [public, prive]
 *           description: Visibilité du canal
 *         parametresVocal:
 *           type: object
 *           properties:
 *             participantsActifs:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   utilisateur:
 *                     type: string
 *                     description: ID de l'utilisateur
 *                   camera:
 *                     type: boolean
 *                     description: État de la caméra
 *                   micro:
 *                     type: boolean
 *                     description: État du microphone
 *                   partageEcran:
 *                     type: boolean
 *                     description: État du partage d'écran
 *                   dateJoint:
 *                     type: string
 *                     format: date-time
 *                     description: Date à laquelle l'utilisateur a rejoint l'appel
 *             limiteParticipants:
 *               type: number
 *               description: Nombre maximum de participants dans l'appel vocal
 *         membres:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               utilisateur:
 *                 type: string
 *                 description: ID de l'utilisateur
 *               role:
 *                 type: string
 *                 enum: [admin, moderateur, membre]
 *                 description: Rôle de l'utilisateur dans le canal
 *         parametres:
 *           type: object
 *           properties:
 *             extensionsAutorisees:
 *               type: array
 *               items:
 *                 type: string
 *               description: Liste des extensions de fichiers autorisées
 *             tailleMaxFichier:
 *               type: number
 *               description: Taille maximale des fichiers en bytes
 *
 * @swagger
 * tags:
 *   name: Canaux
 *   description: Gestion des canaux
 */

/**
 * @swagger
 * /api/v1/workspaces/{workspaceId}/canaux:
 *   post:
 *     summary: Créer un nouveau canal
 *     description: Crée un nouveau canal dans le workspace spécifié
 *     tags: [Canaux]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom du canal
 *               description:
 *                 type: string
 *                 description: Description du canal
 *               type:
 *                 type: string
 *                 enum: [texte, vocal]
 *                 default: texte
 *               visibilite:
 *                 type: string
 *                 enum: [public, prive]
 *                 default: public
 *     responses:
 *       201:
 *         description: Canal créé avec succès
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
 *                     canal:
 *                       $ref: '#/components/schemas/Canal'
 *
 *   get:
 *     summary: Obtenir tous les canaux
 *     description: Récupère tous les canaux d'un workspace
 *     tags: [Canaux]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du workspace
 *     responses:
 *       200:
 *         description: Liste des canaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                   description: Nombre de canaux
 *                 data:
 *                   type: object
 *                   properties:
 *                     canaux:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Canal'
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{id}:
 *   get:
 *     summary: Obtenir un canal spécifique
 *     description: Récupère les détails d'un canal spécifique
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *     responses:
 *       200:
 *         description: Canal récupéré avec succès
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
 *                     canal:
 *                       $ref: '#/components/schemas/Canal'
 *
 *   patch:
 *     summary: Mettre à jour un canal
 *     description: Modifie les informations d'un canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
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
 *               type:
 *                 type: string
 *                 enum: [texte, vocal]
 *     responses:
 *       200:
 *         description: Canal mis à jour avec succès
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
 *                     canal:
 *                       $ref: '#/components/schemas/Canal'
 *
 *   delete:
 *     summary: Supprimer un canal
 *     description: Supprime un canal spécifique
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *     responses:
 *       204:
 *         description: Canal supprimé avec succès
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{id}/membres:
 *   post:
 *     summary: Ajouter un membre au canal
 *     description: Ajoute un nouveau membre au canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
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
 *                 description: ID de l'utilisateur à ajouter
 *               role:
 *                 type: string
 *                 enum: [admin, moderateur, membre]
 *                 default: membre
 *     responses:
 *       200:
 *         description: Membre ajouté avec succès
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
 *                     canal:
 *                       $ref: '#/components/schemas/Canal'
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{id}/membres/{membreId}/role:
 *   patch:
 *     summary: Modifier le rôle d'un membre
 *     description: Modifie le rôle d'un membre dans le canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *       - in: path
 *         name: membreId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du membre
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
 *                 enum: [admin, moderateur, membre]
 *     responses:
 *       200:
 *         description: Rôle modifié avec succès
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
 *                     canal:
 *                       $ref: '#/components/schemas/Canal'
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{id}/membres/{membreId}:
 *   delete:
 *     summary: Supprimer un membre du canal
 *     description: Supprime un membre du canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *       - in: path
 *         name: membreId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du membre à supprimer
 *     responses:
 *       204:
 *         description: Membre supprimé avec succès
 *
 * /api/v1/workspaces/{workspaceId}/canaux/{id}/fichiers:
 *   post:
 *     summary: Upload des fichiers dans un canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichiers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Fichiers à uploader (max 10)
 *     responses:
 *       200:
 *         description: Fichiers uploadés avec succès
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
 *                     fichiers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nom:
 *                             type: string
 *                           type:
 *                             type: string
 *                           url:
 *                             type: string
 *                           taille:
 *                             type: number
 *                           uploadePar:
 *                             type: string
 *   get:
 *     summary: Obtenir la liste des fichiers d'un canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *     responses:
 *       200:
 *         description: Liste des fichiers récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                 data:
 *                   type: object
 *                   properties:
 *                     fichiers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nom:
 *                             type: string
 *                           type:
 *                             type: string
 *                           url:
 *                             type: string
 *                           taille:
 *                             type: number
 *                           uploadePar:
 *                             type: string
 * 
 * /api/v1/workspaces/{workspaceId}/canaux/{id}/fichiers/{fichierId}:
 *   delete:
 *     summary: Supprimer un fichier d'un canal
 *     tags: [Canaux]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du canal
 *       - in: path
 *         name: fichierId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du fichier
 *     responses:
 *       204:
 *         description: Fichier supprimé avec succès
 */
