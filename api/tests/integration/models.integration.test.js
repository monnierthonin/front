// Utiliser une connexion Mongoose séparée pour éviter les conflits
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Créer une connexion Mongoose séparée pour les tests
const testMongoose = new mongoose.Mongoose();

// Importer les modèles avec la connexion de test
const UserSchema = require('../../src/models/user').schema;
const CanalSchema = require('../../src/models/canal').schema;
const MessageSchema = require('../../src/models/message').schema;
const WorkspaceSchema = require('../../src/models/workspace').schema;

// Créer les modèles avec la connexion de test
const User = testMongoose.model('User', UserSchema);
const Canal = testMongoose.model('Canal', CanalSchema);
const Message = testMongoose.model('Message', MessageSchema);
const Workspace = testMongoose.model('Workspace', WorkspaceSchema);

// Configuration pour la base de données en mémoire
let mongoServer;

// Configuration avant tous les tests
beforeAll(async () => {
  // Créer une instance MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connecter à la base de données en mémoire avec la connexion de test
  await testMongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Nettoyage après tous les tests
afterAll(async () => {
  if (testMongoose.connection.readyState !== 0) {
    await testMongoose.disconnect();
  }
  await mongoServer.stop();
});

// Nettoyage avant chaque test
beforeEach(async () => {
  // Vider les collections
  const collections = testMongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Tests d'intégration pour les modèles
describe('Tests d\'intégration des modèles', () => {
  
  // Test d'intégration pour la création d'un utilisateur
  test('Création d\'un utilisateur', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User'
    };
    
    const user = new User(userData);
    await user.save();
    
    const savedUser = await User.findOne({ email: userData.email });
    expect(savedUser).toBeTruthy();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
  });
  
  // Test d'intégration pour la création d'un canal
  test('Création d\'un canal', async () => {
    // Créer un utilisateur pour être le créateur du canal
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User'
    });
    await user.save();
    
    // Créer un workspace
    const workspace = new Workspace({
      nom: 'Workspace de test',
      description: 'Description du workspace de test',
      createur: user._id,
      proprietaire: user._id, // Ajouter le champ proprietaire
      membres: [
        {
          utilisateur: user._id,
          role: 'admin'
        }
      ]
    });
    await workspace.save();
    
    // Créer un canal
    const canalData = {
      nom: 'Canal de test',
      description: 'Description du canal de test',
      createur: user._id,
      workspace: workspace._id,  // Ajouter le workspace
      membres: [
        {
          utilisateur: user._id,
          role: 'admin'
        }
      ]
    };
    
    const canal = new Canal(canalData);
    await canal.save();
    
    const savedCanal = await Canal.findOne({ nom: canalData.nom });
    expect(savedCanal).toBeTruthy();
    expect(savedCanal.nom).toBe(canalData.nom);
    expect(savedCanal.description).toBe(canalData.description);
    expect(savedCanal.createur.toString()).toBe(user._id.toString());
    expect(savedCanal.workspace.toString()).toBe(workspace._id.toString());
    expect(savedCanal.membres.length).toBe(1);
    expect(savedCanal.membres[0].utilisateur.toString()).toBe(user._id.toString());
    expect(savedCanal.membres[0].role).toBe('admin');
  });
  
  // Test d'intégration pour la création d'un message
  test('Création d\'un message', async () => {
    // Créer un utilisateur
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User'
    });
    await user.save();
    
    // Créer un workspace
    const workspace = new Workspace({
      nom: 'Workspace de test',
      description: 'Description du workspace de test',
      createur: user._id,
      proprietaire: user._id, // Ajouter le champ proprietaire
      membres: [
        {
          utilisateur: user._id,
          role: 'admin'
        }
      ]
    });
    await workspace.save();
    
    // Créer un canal
    const canal = new Canal({
      nom: 'Canal de test',
      description: 'Description du canal de test',
      createur: user._id,
      workspace: workspace._id,  // Ajouter le workspace
      membres: [
        {
          utilisateur: user._id,
          role: 'admin'
        }
      ]
    });
    await canal.save();
    
    // Créer un message
    const messageData = {
      contenu: 'Ceci est un message de test',
      auteur: user._id,
      canal: canal._id
    };
    
    const message = new Message(messageData);
    await message.save();
    
    const savedMessage = await Message.findOne({ contenu: messageData.contenu });
    expect(savedMessage).toBeTruthy();
    expect(savedMessage.contenu).toBe(messageData.contenu);
    expect(savedMessage.auteur.toString()).toBe(user._id.toString());
    expect(savedMessage.canal.toString()).toBe(canal._id.toString());
  });
  
  // Test d'intégration pour marquer un message comme lu
  test('Marquer un message comme lu', async () => {
    // Créer un utilisateur
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      nom: 'Test',
      prenom: 'User'
    });
    await user.save();
    
    // Créer un workspace
    const workspace = new Workspace({
      nom: 'Workspace de test',
      description: 'Description du workspace de test',
      createur: user._id,
      proprietaire: user._id, // Ajouter le champ proprietaire
      membres: [
        {
          utilisateur: user._id,
          role: 'admin'
        }
      ]
    });
    await workspace.save();
    
    // Créer un canal
    const canal = new Canal({
      nom: 'Canal de test',
      description: 'Description du canal de test',
      createur: user._id,
      workspace: workspace._id,  // Ajouter le workspace
      membres: [
        {
          utilisateur: user._id,
          role: 'admin'
        }
      ]
    });
    await canal.save();
    
    // Créer un message
    const message = new Message({
      contenu: 'Message à marquer comme lu',
      auteur: user._id,
      canal: canal._id
    });
    await message.save();
    
    // Vérifier que le message n'est pas lu initialement
    expect(message.estLuPar(user._id)).toBe(false);
    
    // Marquer le message comme lu
    await message.marquerCommeLu(user._id);
    
    // Vérifier que le message est maintenant marqué comme lu
    const updatedMessage = await Message.findById(message._id);
    expect(updatedMessage.estLuPar(user._id)).toBe(true);
  });
});
