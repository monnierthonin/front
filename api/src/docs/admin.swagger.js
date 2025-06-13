/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique de l'utilisateur
 *         username:
 *           type: string
 *           description: Nom d'utilisateur
 *         email:
 *           type: string
 *           description: Adresse email
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: Rôle de l'utilisateur
 *
 * @swagger
 * tags:
 *   name: Admin
 *   description: Fonctionnalités réservées aux administrateurs
 *
 * @swagger
 * /api/v1/admin/workspaces:
 *   get:
 *     summary: Obtenir tous les workspaces
 *     description: Récupère tous les workspaces, peu importe leur visibilité
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les workspaces
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *
 * @swagger
 * /api/v1/admin/workspaces/{id}:
 *   get:
 *     summary: Obtenir un workspace spécifique
 *     description: Récupère les détails d'un workspace par son ID, peu importe sa visibilité
 *     tags: [Admin]
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
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Workspace non trouvé
 *   patch:
 *     summary: Modifier un workspace
 *     description: Modifie les informations d'un workspace existant
 *     tags: [Admin]
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
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Workspace non trouvé
 *   delete:
 *     summary: Supprimer un workspace
 *     description: Supprime un workspace existant et tous ses canaux
 *     tags: [Admin]
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
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/admin/workspaces/{workspaceId}/canaux:
 *   get:
 *     summary: Obtenir tous les canaux d'un workspace
 *     description: Récupère tous les canaux d'un workspace, peu importe leur visibilité
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste de tous les canaux du workspace
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/admin/canaux/{canalId}:
 *   patch:
 *     summary: Modifier un canal
 *     description: Modifie les informations d'un canal existant
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
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
 *               type:
 *                 type: string
 *                 enum: [text, vocal]
 *     responses:
 *       200:
 *         description: Canal mis à jour avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Canal non trouvé
 *   delete:
 *     summary: Supprimer un canal
 *     description: Supprime un canal existant et tous ses messages
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Canal supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Canal non trouvé
 *
 * @swagger
 * /api/v1/admin/utilisateurs:
 *   get:
 *     summary: Obtenir tous les utilisateurs
 *     description: Récupère la liste de tous les utilisateurs de l'application
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les utilisateurs
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *
 * @swagger
 * /api/v1/admin/utilisateurs/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Supprime un utilisateur et toutes ses données associées
 *     tags: [Admin]
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
 *         description: Utilisateur supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Utilisateur non trouvé
 *
 * @swagger
 * /api/v1/admin/utilisateurs/{id}/promouvoir:
 *   patch:
 *     summary: Promouvoir un utilisateur au rang d'admin
 *     description: Change le rôle d'un utilisateur en admin
 *     tags: [Admin]
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
 *         description: Utilisateur promu avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Utilisateur non trouvé
 *
 * @swagger
 * /api/v1/admin/messages/{messageId}:
 *   delete:
 *     summary: Supprimer un message
 *     description: Supprime un message dans un canal
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Message supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Message non trouvé
 *
 * @swagger
 * /api/v1/admin/messages-prives/{messageId}:
 *   delete:
 *     summary: Supprimer un message privé
 *     description: Supprime un message dans une conversation privée
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Message privé supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux administrateurs
 *       404:
 *         description: Message privé non trouvé
 */
