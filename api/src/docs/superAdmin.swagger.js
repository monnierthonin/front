/**
 * @swagger
 * components:
 *   schemas:
 *     SuperAdmin:
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
 *           enum: [user, admin, super_admin]
 *           description: Rôle de l'utilisateur
 *
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Fonctionnalités réservées aux super administrateurs
 *
 * @swagger
 * /api/v1/super-admin/workspaces:
 *   get:
 *     summary: Obtenir tous les workspaces
 *     description: Récupère tous les workspaces, peu importe leur visibilité
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les workspaces
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux super administrateurs
 *
 * @swagger
 * /api/v1/super-admin/workspaces/{id}:
 *   get:
 *     summary: Obtenir un workspace spécifique
 *     description: Récupère les détails d'un workspace par son ID, peu importe sa visibilité
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Workspace non trouvé
 *   patch:
 *     summary: Modifier un workspace
 *     description: Modifie les informations d'un workspace existant
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Workspace non trouvé
 *   delete:
 *     summary: Supprimer un workspace
 *     description: Supprime un workspace existant et tous ses canaux
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/super-admin/workspaces/{workspaceId}/canaux:
 *   get:
 *     summary: Obtenir tous les canaux d'un workspace
 *     description: Récupère tous les canaux d'un workspace, peu importe leur visibilité
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Workspace non trouvé
 *
 * @swagger
 * /api/v1/super-admin/canaux/{canalId}:
 *   patch:
 *     summary: Modifier un canal
 *     description: Modifie les informations d'un canal existant
 *     tags: [SuperAdmin]
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
 *                 enum: [texte, vocal]
 *     responses:
 *       200:
 *         description: Canal mis à jour avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Canal non trouvé
 *   delete:
 *     summary: Supprimer un canal
 *     description: Supprime un canal existant et tous ses messages
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Canal non trouvé
 *
 * @swagger
 * /api/v1/super-admin/utilisateurs:
 *   get:
 *     summary: Obtenir tous les utilisateurs
 *     description: Récupère la liste de tous les utilisateurs de l'application
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de tous les utilisateurs
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux super administrateurs
 *
 * @swagger
 * /api/v1/super-admin/utilisateurs/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Supprime un utilisateur et toutes ses données associées
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Utilisateur non trouvé
 *
 * @swagger
 * /api/v1/super-admin/utilisateurs/{id}/promouvoir:
 *   patch:
 *     summary: Promouvoir un utilisateur au rang de super admin
 *     description: Change le rôle d'un utilisateur en super_admin
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Utilisateur non trouvé
 *
 * @swagger
 * /api/v1/super-admin/utilisateurs/{id}/retrograder:
 *   patch:
 *     summary: Rétrograder un super admin au rang d'admin
 *     description: Change le rôle d'un super_admin en admin (uniquement pour son propre compte)
 *     tags: [SuperAdmin]
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
 *         description: Utilisateur rétrogradé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Utilisateur non trouvé
 *
 * @swagger
 * /api/v1/super-admin/messages/{messageId}:
 *   delete:
 *     summary: Supprimer un message
 *     description: Supprime un message dans un canal
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Message non trouvé
 *
 * @swagger
 * /api/v1/super-admin/messages-prives/{messageId}:
 *   delete:
 *     summary: Supprimer un message privé
 *     description: Supprime un message dans une conversation privée
 *     tags: [SuperAdmin]
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
 *         description: Non autorisé - Réservé aux super administrateurs
 *       404:
 *         description: Message privé non trouvé
 */
