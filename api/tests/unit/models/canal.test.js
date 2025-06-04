const mongoose = require('mongoose');
const Canal = require('../../../src/models/canal');
const User = require('../../../src/models/user');
const Workspace = require('../../../src/models/workspace');

describe('Canal Model Tests', () => {
  // Créer des utilisateurs et un workspace de test avant les tests
  let testUser, testWorkspace, adminUser;

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUser = new User({
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    });
    await testUser.save();

    // Créer un utilisateur admin
    adminUser = new User({
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    await adminUser.save();

    // Créer un workspace de test
    testWorkspace = new Workspace({
      nom: 'Test Workspace',
      description: 'Workspace pour tests unitaires',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }, {
        utilisateur: adminUser._id,
        role: 'membre'
      }]
    });
    await testWorkspace.save();
  });

  afterAll(async () => {
    // Nettoyer la base de données après les tests
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Canal.deleteMany({});
  });

  // Test de création d'un canal public valide
  it('should create a valid public canal', async () => {
    const canalData = {
      nom: 'canal-test',
      description: 'Canal de test pour les tests unitaires',
      workspace: testWorkspace._id,
      createur: testUser._id,
      visibilite: 'public',
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    const savedCanal = await canal.save();

    // Vérifier que le canal a été créé avec les bonnes données
    expect(savedCanal._id).toBeDefined();
    expect(savedCanal.nom).toBe(canalData.nom);
    expect(savedCanal.description).toBe(canalData.description);
    expect(savedCanal.workspace.toString()).toBe(testWorkspace._id.toString());
    expect(savedCanal.createur.toString()).toBe(testUser._id.toString());
    expect(savedCanal.visibilite).toBe('public');
    expect(savedCanal.type).toBe('texte'); // Valeur par défaut
    expect(savedCanal.membres).toHaveLength(1);
    expect(savedCanal.membres[0].utilisateur.toString()).toBe(testUser._id.toString());
    expect(savedCanal.membres[0].role).toBe('admin');
  });

  // Test de création d'un canal privé
  it('should create a valid private canal', async () => {
    const canalData = {
      nom: 'canal-prive',
      description: 'Canal privé de test',
      workspace: testWorkspace._id,
      createur: testUser._id,
      visibilite: 'prive',
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    const savedCanal = await canal.save();

    // Vérifier que le canal a été créé avec les bonnes données
    expect(savedCanal.visibilite).toBe('prive');
  });

  // Test de création d'un canal vocal
  it('should create a valid vocal canal', async () => {
    const canalData = {
      nom: 'canal-vocal',
      description: 'Canal vocal de test',
      workspace: testWorkspace._id,
      createur: testUser._id,
      type: 'vocal',
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    const savedCanal = await canal.save();

    // Vérifier que le canal a été créé avec les bonnes données
    expect(savedCanal.type).toBe('vocal');
    expect(savedCanal.parametresVocal).toBeDefined();
    expect(savedCanal.parametresVocal.limiteParticipants).toBe(25); // Valeur par défaut
  });

  // Test de validation - canal sans nom
  it('should not create a canal without a name', async () => {
    const canalData = {
      description: 'Canal sans nom',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    
    // Attendre une erreur de validation
    await expect(canal.save()).rejects.toThrow();
  });

  // Test de validation - canal sans workspace
  it('should not create a canal without a workspace', async () => {
    const canalData = {
      nom: 'canal-sans-workspace',
      description: 'Canal sans workspace',
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    
    // Attendre une erreur de validation
    await expect(canal.save()).rejects.toThrow();
  });

  // Test de validation - canal sans créateur
  it('should not create a canal without a creator', async () => {
    const canalData = {
      nom: 'canal-sans-createur',
      description: 'Canal sans créateur',
      workspace: testWorkspace._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    
    // Attendre une erreur de validation
    await expect(canal.save()).rejects.toThrow();
  });

  // Test de la méthode estMembre
  it('should correctly identify if a user is a member of the canal', async () => {
    const canalData = {
      nom: 'canal-test-membres',
      description: 'Canal pour tester estMembre',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const canal = new Canal(canalData);
    await canal.save();

    // Vérifier que testUser est membre du canal
    expect(canal.estMembre(testUser._id)).toBe(true);
    
    // Vérifier qu'un autre utilisateur n'est pas membre du canal
    expect(canal.estMembre(adminUser._id)).toBe(false);
  });

  // Test des méthodes de permissions
  it('should correctly check permissions based on user role', async () => {
    // Créer un canal avec différents rôles
    const canal = new Canal({
      nom: 'canal-permissions',
      description: 'Canal pour tester les permissions',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [
        {
          utilisateur: testUser._id,
          role: 'admin'
        },
        {
          utilisateur: adminUser._id,
          role: 'moderateur'
        }
      ]
    });
    await canal.save();

    // Vérifier les permissions de l'admin
    expect(canal.peutLire(testUser._id)).toBe(true);
    expect(canal.peutEnvoyerMessage(testUser._id)).toBe(true);
    expect(canal.peutGererMessages(testUser._id)).toBe(true);
    expect(canal.peutGererMembres(testUser._id)).toBe(true);
    expect(canal.peutModifierCanal(testUser._id)).toBe(true);
    expect(canal.peutSupprimerCanal(testUser._id)).toBe(true);
    expect(canal.peutGererRoles(testUser._id)).toBe(true);

    // Vérifier les permissions du modérateur
    expect(canal.peutLire(adminUser._id)).toBe(true);
    expect(canal.peutEnvoyerMessage(adminUser._id)).toBe(true);
    expect(canal.peutGererMessages(adminUser._id)).toBe(true);
    expect(canal.peutGererMembres(adminUser._id)).toBe(true);
    expect(canal.peutModifierCanal(adminUser._id)).toBe(false);
    expect(canal.peutSupprimerCanal(adminUser._id)).toBe(false);
    expect(canal.peutGererRoles(adminUser._id)).toBe(false);
  });

  // Test de la méthode verifierExtensionFichier
  it('should correctly verify file extensions', async () => {
    const canal = new Canal({
      nom: 'canal-fichiers',
      description: 'Canal pour tester les extensions de fichiers',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }],
      parametres: {
        extensionsAutorisees: ['.jpg', '.png', '.pdf']
      }
    });
    await canal.save();

    // Vérifier les extensions autorisées
    expect(canal.verifierExtensionFichier('image.jpg')).toBe(true);
    expect(canal.verifierExtensionFichier('document.pdf')).toBe(true);
    expect(canal.verifierExtensionFichier('image.png')).toBe(true);
    
    // Vérifier les extensions non autorisées
    expect(canal.verifierExtensionFichier('script.js')).toBe(false);
    expect(canal.verifierExtensionFichier('document.docx')).toBe(false);
  });

  // Test des méthodes de gestion des messages non lus
  it('should correctly increment and reset unread messages count', async () => {
    const canal = new Canal({
      nom: 'canal-messages-non-lus',
      description: 'Canal pour tester les messages non lus',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }, {
        utilisateur: adminUser._id,
        role: 'membre'
      }]
    });
    await canal.save();

    // Simuler un ID de message
    const messageId = new mongoose.Types.ObjectId();

    // Incrémenter les messages non lus pour adminUser
    await canal.incrementerMessagesNonLus(adminUser._id, { auteur: testUser._id });
    
    // Vérifier que le compteur a été incrémenté
    let updatedCanal = await Canal.findById(canal._id);
    expect(updatedCanal.getMessagesNonLusCount(adminUser._id)).toBe(1);

    // Incrémenter à nouveau
    await updatedCanal.incrementerMessagesNonLus(adminUser._id, { auteur: testUser._id });
    
    // Vérifier que le compteur a été incrémenté à nouveau
    updatedCanal = await Canal.findById(canal._id);
    expect(updatedCanal.getMessagesNonLusCount(adminUser._id)).toBe(2);

    // Réinitialiser le compteur
    await updatedCanal.resetMessagesNonLus(adminUser._id, messageId);
    
    // Vérifier que le compteur a été réinitialisé
    updatedCanal = await Canal.findById(canal._id);
    expect(updatedCanal.getMessagesNonLusCount(adminUser._id)).toBe(0);
    
    // Vérifier que le dernier message lu a été enregistré
    const userNonLus = updatedCanal.messagesNonLus.find(
      m => m.utilisateur.toString() === adminUser._id.toString()
    );
    expect(userNonLus.dernierMessageLu.toString()).toBe(messageId.toString());
  });

  // Test de la méthode statique getAvecMessagesNonLus
  it('should get all canals with unread messages for a user', async () => {
    // Créer plusieurs canaux avec des messages non lus
    const canal1 = await new Canal({
      nom: 'canal-non-lus-1',
      description: 'Premier canal avec messages non lus',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }, {
        utilisateur: adminUser._id,
        role: 'membre'
      }],
      messagesNonLus: [{
        utilisateur: adminUser._id,
        count: 3
      }]
    }).save();

    const canal2 = await new Canal({
      nom: 'canal-non-lus-2',
      description: 'Deuxième canal avec messages non lus',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }, {
        utilisateur: adminUser._id,
        role: 'membre'
      }],
      messagesNonLus: [{
        utilisateur: adminUser._id,
        count: 5
      }]
    }).save();

    const canal3 = await new Canal({
      nom: 'canal-sans-non-lus',
      description: 'Canal sans messages non lus',
      workspace: testWorkspace._id,
      createur: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }, {
        utilisateur: adminUser._id,
        role: 'membre'
      }],
      messagesNonLus: [{
        utilisateur: adminUser._id,
        count: 0
      }]
    }).save();

    // Récupérer les canaux avec des messages non lus pour adminUser
    const canauxNonLus = await Canal.getAvecMessagesNonLus(adminUser._id, testWorkspace._id);
    
    // Vérifier qu'on récupère bien les deux canaux avec des messages non lus
    expect(canauxNonLus).toHaveLength(2);
    
    // Vérifier que les IDs correspondent aux canaux avec des messages non lus
    const canalIds = canauxNonLus.map(c => c._id.toString());
    expect(canalIds).toContain(canal1._id.toString());
    expect(canalIds).toContain(canal2._id.toString());
    expect(canalIds).not.toContain(canal3._id.toString());
  });
});
