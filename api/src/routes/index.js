const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Route de test de l'API
 *     description: Retourne un message de bienvenue pour vérifier que l'API fonctionne
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Message de bienvenue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenue sur l'API SUPCHAT
 */
router.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API SUPCHAT' });
});

module.exports = router;
