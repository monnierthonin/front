const mongoose = require('mongoose');
const Workspace = require('../../../src/models/workspace');
const User = require('../../../src/models/user');

describe('Workspace Model Tests', () => {
  // Créer des utilisateurs de test avant les tests
  let testUser, adminUser, memberUser;

  beforeAll(async () => {
    // Créer un utilisateur propriétaire
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
      lastName: 'User'
    });
    await adminUser.save();

    // Créer un utilisateur membre
    memberUser = new User({
      email: 'member@example.com',
      username: 'memberuser',
      password: 'Password123!',
      firstName: 'Member',
      lastName: 'User'
    });
    await memberUser.save();
  });

  afterAll(async () => {
    // Nettoyer la base de données après les tests
    await User.deleteMany({});
    await Workspace.deleteMany({});
  });

  // Test de création d'un workspace valide
  it('should create a valid workspace', async () => {
    const workspaceData = {
      nom: 'Test Workspace',
      description: 'Workspace pour tests unitaires',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const workspace = new Workspace(workspaceData);
    const savedWorkspace = await workspace.save();

    // Vérifier que le workspace a été créé avec les bonnes données
    expect(savedWorkspace._id).toBeDefined();
    expect(savedWorkspace.nom).toBe(workspaceData.nom);
    expect(savedWorkspace.description).toBe(workspaceData.description);
    expect(savedWorkspace.proprietaire.toString()).toBe(testUser._id.toString());
    expect(savedWorkspace.visibilite).toBe('prive'); // Valeur par défaut
    expect(savedWorkspace.membres).toHaveLength(1);
    expect(savedWorkspace.membres[0].utilisateur.toString()).toBe(testUser._id.toString());
    expect(savedWorkspace.membres[0].role).toBe('admin');
  });

  // Test de création d'un workspace public
  it('should create a valid public workspace', async () => {
    const workspaceData = {
      nom: 'Public Workspace',
      description: 'Workspace public pour tests',
      proprietaire: testUser._id,
      visibilite: 'public',
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const workspace = new Workspace(workspaceData);
    const savedWorkspace = await workspace.save();

    // Vérifier que le workspace a été créé avec les bonnes données
    expect(savedWorkspace.visibilite).toBe('public');
  });

  // Test de validation - workspace sans nom
  it('should not create a workspace without a name', async () => {
    const workspaceData = {
      description: 'Workspace sans nom',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const workspace = new Workspace(workspaceData);
    
    // Attendre une erreur de validation
    await expect(workspace.save()).rejects.toThrow();
  });

  // Test de validation - workspace sans propriétaire
  it('should not create a workspace without an owner', async () => {
    const workspaceData = {
      nom: 'Workspace sans propriétaire',
      description: 'Workspace sans propriétaire pour tests',
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    };

    const workspace = new Workspace(workspaceData);
    
    // Attendre une erreur de validation
    await expect(workspace.save()).rejects.toThrow();
  });

  // Test de la méthode estMembre
  it('should correctly identify if a user is a member of the workspace', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test estMembre',
      description: 'Test de la méthode estMembre',
      proprietaire: testUser._id,
      membres: [
        {
          utilisateur: testUser._id,
          role: 'admin'
        },
        {
          utilisateur: memberUser._id,
          role: 'membre'
        }
      ]
    });
    await workspace.save();

    // Vérifier que testUser est membre du workspace
    expect(workspace.estMembre(testUser._id)).toBe(true);
    
    // Vérifier que memberUser est membre du workspace
    expect(workspace.estMembre(memberUser._id)).toBe(true);
    
    // Vérifier qu'un utilisateur non membre n'est pas reconnu comme membre
    expect(workspace.estMembre(adminUser._id)).toBe(false);
  });

  // Test de la méthode estAdmin
  it('should correctly identify if a user is an admin of the workspace', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test estAdmin',
      description: 'Test de la méthode estAdmin',
      proprietaire: testUser._id,
      membres: [
        {
          utilisateur: testUser._id,
          role: 'admin'
        },
        {
          utilisateur: memberUser._id,
          role: 'membre'
        }
      ]
    });
    await workspace.save();

    // Vérifier que testUser est admin du workspace
    expect(workspace.estAdmin(testUser._id)).toBe(true);
    
    // Vérifier que memberUser n'est pas admin du workspace
    expect(workspace.estAdmin(memberUser._id)).toBe(false);
    
    // Vérifier qu'un utilisateur non membre n'est pas reconnu comme admin
    expect(workspace.estAdmin(adminUser._id)).toBe(false);
  });

  // Test de la méthode genererTokenInvitation
  it('should generate a valid invitation token', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test invitation',
      description: 'Test des invitations',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    });
    await workspace.save();

    const email = 'invite@example.com';
    const token = workspace.genererTokenInvitation(testUser._id, email);
    await workspace.save();

    // Vérifier que le token a été généré
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    
    // Vérifier que l'invitation a été ajoutée au workspace
    expect(workspace.invitationsEnAttente).toHaveLength(1);
    expect(workspace.invitationsEnAttente[0].email).toBe(email);
    expect(workspace.invitationsEnAttente[0].token).toBe(token);
    expect(workspace.invitationsEnAttente[0].utilisateur.toString()).toBe(testUser._id.toString());
    expect(workspace.invitationsEnAttente[0].dateExpiration).toBeDefined();
    
    // Vérifier que la date d'expiration est dans le futur (24h)
    const now = new Date();
    const expiration = new Date(workspace.invitationsEnAttente[0].dateExpiration);
    expect(expiration.getTime()).toBeGreaterThan(now.getTime());
    
    // Vérifier que la date est d'environ 24 heures dans le futur (avec une marge de 5 secondes)
    const expectedTime = now.getTime() + 24 * 60 * 60 * 1000;
    const timeDifference = Math.abs(expiration.getTime() - expectedTime);
    expect(timeDifference).toBeLessThan(5000); // Tolérance de 5 secondes
  });

  // Test de la méthode verifierTokenInvitation avec un token valide
  it('should verify a valid invitation token', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test vérification token',
      description: 'Test de vérification de token',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    });
    await workspace.save();

    const email = 'invite@example.com';
    const token = workspace.genererTokenInvitation(testUser._id, email);
    await workspace.save();

    // Vérifier le token
    const invitation = workspace.verifierTokenInvitation(token);
    
    // Vérifier que l'invitation est valide
    expect(invitation).toBeDefined();
    expect(invitation.email).toBe(email);
    expect(invitation.token).toBe(token);
    expect(invitation.utilisateur.toString()).toBe(testUser._id.toString());
  });

  // Test de la méthode verifierTokenInvitation avec un token invalide
  it('should not verify an invalid invitation token', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test token invalide',
      description: 'Test de token invalide',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    });
    await workspace.save();

    // Vérifier un token qui n'existe pas
    const invitation = workspace.verifierTokenInvitation('token_invalide');
    
    // Vérifier que l'invitation est nulle
    expect(invitation).toBeNull();
  });

  // Test de la méthode verifierTokenInvitation avec un token expiré
  it('should not verify an expired invitation token', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test token expiré',
      description: 'Test de token expiré',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    });
    
    // Créer une invitation avec une date d'expiration dans le passé
    const token = 'token_expire';
    const dateExpiree = new Date();
    dateExpiree.setHours(dateExpiree.getHours() - 1); // 1 heure dans le passé
    
    workspace.invitationsEnAttente.push({
      utilisateur: testUser._id,
      token,
      dateExpiration: dateExpiree,
      email: 'expire@example.com'
    });
    
    await workspace.save();

    // Vérifier le token expiré
    const invitation = workspace.verifierTokenInvitation(token);
    
    // Vérifier que l'invitation est nulle
    expect(invitation).toBeNull();
    
    // Sauvegarder les modifications du workspace après vérification du token
    await workspace.save();
    
    // Vérifier que l'invitation expirée a été supprimée
    const updatedWorkspace = await Workspace.findById(workspace._id);
    expect(updatedWorkspace.invitationsEnAttente.length).toBe(0);
  });

  // Test de remplacement d'une invitation existante
  it('should replace an existing invitation for the same email', async () => {
    const workspace = new Workspace({
      nom: 'Workspace pour test remplacement invitation',
      description: 'Test de remplacement d\'invitation',
      proprietaire: testUser._id,
      membres: [{
        utilisateur: testUser._id,
        role: 'admin'
      }]
    });
    await workspace.save();

    const email = 'duplicate@example.com';
    
    // Générer une première invitation
    const token1 = workspace.genererTokenInvitation(testUser._id, email);
    await workspace.save();
    
    // Vérifier que l'invitation a été ajoutée
    expect(workspace.invitationsEnAttente).toHaveLength(1);
    expect(workspace.invitationsEnAttente[0].token).toBe(token1);
    
    // Générer une deuxième invitation pour le même email
    const token2 = workspace.genererTokenInvitation(adminUser._id, email);
    await workspace.save();
    
    // Vérifier que la première invitation a été remplacée
    expect(workspace.invitationsEnAttente).toHaveLength(1);
    expect(workspace.invitationsEnAttente[0].token).toBe(token2);
    expect(workspace.invitationsEnAttente[0].token).not.toBe(token1);
    expect(workspace.invitationsEnAttente[0].utilisateur.toString()).toBe(adminUser._id.toString());
  });
});
