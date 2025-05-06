/**
 * @swagger
 * tags:
 *   - name: Pages de Test
 *     description: Pages HTML pour tester les fonctionnalités en direct
 *
 * /test-messages.html:
 *   get:
 *     tags: [Pages de Test]
 *     summary: Interface de test pour les messages
 *     description: |
 *       Page de test pour les messages de groupe et privés.
 *       - Test WebSocket en temps réel
 *       - Envoi/réception de messages de groupe
 *       - Envoi/réception de messages privés
 *       - Indicateurs de lecture
 *       - Historique des conversations
 *
 * /test-websocket.html:
 *   get:
 *     tags: [Pages de Test]
 *     summary: Test basique de WebSocket
 *     description: |
 *       Page simple pour tester la connexion WebSocket.
 *       - Test de connexion
 *       - Test d'écho
 *       - Vérification du token JWT
 */

module.exports = {
    // Cette exportation est nécessaire pour l'intégration avec Swagger
    // mais le contenu est géré par les commentaires JSDoc ci-dessus
};
