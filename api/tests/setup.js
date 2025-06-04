// Configuration globale unifiée pour tous les tests
// Définir l'environnement de test
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Variable globale pour le serveur MongoDB en mémoire
let mongoServer;

/**
 * Configuration avant tous les tests
 * - Déconnecte mongoose s'il est déjà connecté
 * - Crée une nouvelle instance MongoDB en mémoire
 * - Connecte mongoose à cette instance
 */
beforeAll(async () => {
  // Fermer toute connexion existante
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Créer une nouvelle instance MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connecter à la base de données en mémoire
  // Note: useNewUrlParser et useUnifiedTopology sont dépréciés dans les versions récentes de mongoose
  // mais conservés pour compatibilité avec les tests existants
  await mongoose.connect(mongoUri);
  
  console.log('Connected to in-memory MongoDB server');
});

/**
 * Nettoyage après chaque test
 * - Vide toutes les collections pour assurer l'isolation des tests
 */
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log('All collections cleared');
  }
});

/**
 * Nettoyage après tous les tests
 * - Déconnecte mongoose
 * - Arrête le serveur MongoDB en mémoire
 */
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    console.log('Disconnected from in-memory MongoDB server');
  }
});

// Augmenter le timeout pour les tests qui prennent plus de temps
jest.setTimeout(30000);

// Exporter les variables et fonctions utiles pour les autres fichiers de test
module.exports = {
  mongoose,
  mongoServer
};
