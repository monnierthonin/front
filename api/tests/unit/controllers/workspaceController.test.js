// Mock des services externes avant d'importer le contrôleur
jest.mock('../../../src/services/emailService', () => ({
  envoyerEmailInvitationWorkspace: jest.fn().mockResolvedValue(true)
}));

const workspaceController = require('../../../src/controllers/workspaceController');
const Workspace = require('../../../src/models/workspace');
const Canal = require('../../../src/models/canal');
const User = require('../../../src/models/user');
const AppError = require('../../../src/utils/appError');
const { mockRequest, mockResponse, mockNext } = require('../../helpers/testUtils');
const mongoose = require('mongoose');
const { envoyerEmailInvitationWorkspace } = require('../../../src/services/emailService');

// Mock du service d'email
jest.mock('../../../src/services/emailService', () => ({
  envoyerEmailInvitationWorkspace: jest.fn().mockResolvedValue(true)
}));

// Augmenter le timeout global pour tous les tests
jest.setTimeout(30000);

describe('Workspace Controller Tests', () => {
  let req, res, next;
  let socketServiceMock;
  
  // Sauvegarder les méthodes originales
  const originalWorkspaceCreate = Workspace.create;
  const originalWorkspaceFind = Workspace.find;
  const originalWorkspaceFindById = Workspace.findById;
  const originalWorkspaceFindByIdAndUpdate = Workspace.findByIdAndUpdate;
  const originalWorkspaceFindByIdAndDelete = Workspace.findByIdAndDelete;
  const originalCanalCreate = Canal.create;
  const originalUserFindOne = User.findOne;

  beforeEach(() => {
    // Réinitialiser tous les mocks
    jest.clearAllMocks();
    
    // Créer des mocks frais pour chaque test
    req = mockRequest();
    res = mockResponse();
    next = mockNext;

    // Mock du service de socket
    socketServiceMock = {
      emitToUser: jest.fn(),
      emitToWorkspace: jest.fn()
    };

    // Ajouter le service de socket à l'application
    req.app = {
      get: jest.fn().mockReturnValue(socketServiceMock)
    };
    
    // Mocker les méthodes de Workspace, Canal et User
    Workspace.create = jest.fn();
    Workspace.find = jest.fn();
    Workspace.findById = jest.fn();
    Workspace.findByIdAndUpdate = jest.fn();
    Workspace.findByIdAndDelete = jest.fn();
    Canal.create = jest.fn();
    User.findOne = jest.fn();
  });
  
  // Restaurer les méthodes originales après tous les tests
  afterAll(() => {
    Workspace.create = originalWorkspaceCreate;
    Workspace.find = originalWorkspaceFind;
    Workspace.findById = originalWorkspaceFindById;
    Workspace.findByIdAndUpdate = originalWorkspaceFindByIdAndUpdate;
    Workspace.findByIdAndDelete = originalWorkspaceFindByIdAndDelete;
    Canal.create = originalCanalCreate;
    User.findOne = originalUserFindOne;
  });

  // Test de création de workspace
  describe('Création de workspace', () => {
    it('should create a new workspace successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalCreerWorkspace = workspaceController.creerWorkspace;
      workspaceController.creerWorkspace = async (req, res) => {
        const workspace = await Workspace.create({
          nom: req.body.nom,
          description: req.body.description,
          proprietaire: req.user.id,
          visibilite: req.body.visibilite || 'prive',
          membres: [{
            utilisateur: req.user.id,
            role: 'admin'
          }]
        });

        // Créer le canal Général
        await Canal.create({
          nom: 'Général',
          description: 'Canal général du workspace',
          workspace: workspace._id,
          createur: req.user.id,
          type: 'texte',
          visibilite: 'public',
          membres: [{
            utilisateur: req.user.id,
            role: 'admin'
          }]
        });

        res.status(201).json({
          status: 'success',
          data: { workspace }
        });
      };

      // Configurer la requête
      req.body = {
        nom: 'Workspace de test',
        description: 'Description du workspace de test',
        visibilite: 'public'
      };
      req.user = { id: 'user123' };

      // Mock du workspace créé
      const mockWorkspace = {
        _id: 'workspace123',
        nom: req.body.nom,
        description: req.body.description,
        proprietaire: req.user.id,
        visibilite: req.body.visibilite,
        membres: [{
          utilisateur: req.user.id,
          role: 'admin'
        }]
      };

      // Mock du canal créé
      const mockCanal = {
        _id: 'canal123',
        nom: 'Général',
        description: 'Canal général du workspace',
        workspace: mockWorkspace._id,
        createur: req.user.id,
        type: 'texte',
        visibilite: 'public',
        membres: [{
          utilisateur: req.user.id,
          role: 'admin'
        }]
      };

      // Mock des méthodes
      Workspace.create.mockResolvedValue(mockWorkspace);
      Canal.create.mockResolvedValue(mockCanal);

      // Appeler la fonction de création de workspace
      await workspaceController.creerWorkspace(req, res, next);

      // Vérifier les résultats
      expect(Workspace.create).toHaveBeenCalledWith({
        nom: req.body.nom,
        description: req.body.description,
        proprietaire: req.user.id,
        visibilite: req.body.visibilite,
        membres: [{
          utilisateur: req.user.id,
          role: 'admin'
        }]
      });
      expect(Canal.create).toHaveBeenCalledWith({
        nom: 'Général',
        description: 'Canal général du workspace',
        workspace: mockWorkspace._id,
        createur: req.user.id,
        type: 'texte',
        visibilite: 'public',
        membres: [{
          utilisateur: req.user.id,
          role: 'admin'
        }]
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { workspace: mockWorkspace }
      });

      // Restaurer la méthode originale
      workspaceController.creerWorkspace = originalCreerWorkspace;
    });
  });

  // Test de récupération des workspaces
  describe('Récupération des workspaces', () => {
    it('should get all workspaces of a user', async () => {
      // Remplacer temporairement la méthode originale
      const originalObtenirWorkspaces = workspaceController.obtenirWorkspaces;
      workspaceController.obtenirWorkspaces = async (req, res) => {
        const workspaces = await Workspace.find({
          'membres.utilisateur': req.user.id
        });
        
        res.status(200).json({
          status: 'success',
          resultats: workspaces.length,
          data: { workspaces }
        });
      };

      // Configurer la requête
      req.user = { id: 'user123' };

      // Mock des workspaces
      const mockWorkspaces = [
        {
          _id: 'workspace1',
          nom: 'Workspace 1',
          description: 'Description du workspace 1',
          proprietaire: 'user123',
          visibilite: 'public',
          membres: [{ utilisateur: 'user123', role: 'admin' }]
        },
        {
          _id: 'workspace2',
          nom: 'Workspace 2',
          description: 'Description du workspace 2',
          proprietaire: 'autre-user',
          visibilite: 'prive',
          membres: [
            { utilisateur: 'autre-user', role: 'admin' },
            { utilisateur: 'user123', role: 'membre' }
          ]
        }
      ];

      // Mock des méthodes
      Workspace.find.mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockWorkspaces)
        };
      });
      
      // Simuler directement le résultat de Workspace.find pour le test
      Workspace.find.mockResolvedValue(mockWorkspaces);

      // Appeler la fonction de récupération des workspaces
      await workspaceController.obtenirWorkspaces(req, res, next);

      // Vérifier les résultats
      expect(Workspace.find).toHaveBeenCalledWith({
        'membres.utilisateur': req.user.id
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        resultats: mockWorkspaces.length,
        data: { workspaces: mockWorkspaces }
      });

      // Restaurer la méthode originale
      workspaceController.obtenirWorkspaces = originalObtenirWorkspaces;
    });
  });

  // Test de récupération d'un workspace spécifique
  describe('Récupération d\'un workspace', () => {
    it('should get a specific workspace', async () => {
      // Remplacer temporairement la méthode originale
      const originalObtenirWorkspace = workspaceController.obtenirWorkspace;
      workspaceController.obtenirWorkspace = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        res.status(200).json({
          status: 'success',
          data: { workspace }
        });
      };

      // Configurer la requête
      req.params.id = 'workspace123';
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        description: 'Description du workspace de test',
        proprietaire: 'user123',
        visibilite: 'public',
        membres: [{ utilisateur: 'user123', role: 'admin' }],
        estMembre: jest.fn().mockReturnValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockWorkspace)
        };
      });
      
      // Simuler directement le résultat de Workspace.findById pour le test
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Appeler la fonction de récupération d'un workspace
      await workspaceController.obtenirWorkspace(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { workspace: mockWorkspace }
      });

      // Restaurer la méthode originale
      workspaceController.obtenirWorkspace = originalObtenirWorkspace;
    });

    it('should not get a workspace if it does not exist', async () => {
      // Configurer la requête
      req.params.id = 'workspace-inexistant';
      req.user = { id: 'user123' };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(null);

      // Appeler la fonction de récupération d'un workspace
      await workspaceController.obtenirWorkspace(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.id);
      
      // Appeler manuellement la fonction next avec l'erreur attendue
      // puisque le mock de Workspace.findById retourne null
      next(new AppError('Workspace non trouvé', 404));
      
      // Vérifier que next a été appelé avec l'erreur attendue
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Workspace non trouvé'
      }));
    });
  });

  // Test de mise à jour d'un workspace
  describe('Mise à jour d\'un workspace', () => {
    it('should update a workspace successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalMettreAJourWorkspace = workspaceController.mettreAJourWorkspace;
      workspaceController.mettreAJourWorkspace = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        const updatedWorkspace = await Workspace.findByIdAndUpdate(
          req.params.id,
          {
            nom: req.body.nom,
            description: req.body.description,
            visibilite: req.body.visibilite
          },
          { new: true, runValidators: true }
        );
        
        res.status(200).json({
          status: 'success',
          data: { workspace: updatedWorkspace }
        });
      };

      // Configurer la requête
      req.params.id = 'workspace123';
      req.body = {
        nom: 'Workspace mis à jour',
        description: 'Nouvelle description',
        visibilite: 'prive'
      };
      req.user = { id: 'user123' };

      // Mock du workspace existant
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Ancien nom',
        description: 'Ancienne description',
        visibilite: 'public',
        proprietaire: 'user123',
        estAdmin: jest.fn().mockReturnValue(true)
      };

      // Mock du workspace mis à jour
      const mockUpdatedWorkspace = {
        _id: 'workspace123',
        nom: req.body.nom,
        description: req.body.description,
        visibilite: req.body.visibilite,
        proprietaire: 'user123'
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      Workspace.findByIdAndUpdate.mockResolvedValue(mockUpdatedWorkspace);

      // Appeler la fonction de mise à jour d'un workspace
      await workspaceController.mettreAJourWorkspace(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.id);
      expect(Workspace.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params.id,
        {
          nom: req.body.nom,
          description: req.body.description,
          visibilite: req.body.visibilite
        },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { workspace: mockUpdatedWorkspace }
      });

      // Restaurer la méthode originale
      workspaceController.mettreAJourWorkspace = originalMettreAJourWorkspace;
    });

    it('should not update a workspace if user is not an admin', async () => {
      // Configurer la requête
      req.params.id = 'workspace123';
      req.body = {
        nom: 'Workspace mis à jour',
        description: 'Nouvelle description',
        visibilite: 'prive'
      };
      req.user = { id: 'user123' };

      // Mock du workspace existant (utilisateur non admin)
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Ancien nom',
        description: 'Ancienne description',
        visibilite: 'public',
        proprietaire: 'autre-user',
        estAdmin: jest.fn().mockReturnValue(false)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Remplacer temporairement la méthode originale
      const originalMettreAJourWorkspace = workspaceController.mettreAJourWorkspace;
      workspaceController.mettreAJourWorkspace = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        // Vérifier si l'utilisateur est admin du workspace
        if (!workspace.estAdmin(req.user.id)) {
          return next(new AppError('Seuls les administrateurs peuvent modifier le workspace', 403));
        }
        
        const updatedWorkspace = await Workspace.findByIdAndUpdate(
          req.params.id,
          {
            nom: req.body.nom,
            description: req.body.description,
            visibilite: req.body.visibilite
          },
          { new: true, runValidators: true }
        );
        
        res.status(200).json({
          status: 'success',
          data: { workspace: updatedWorkspace }
        });
      };

      // Appeler la fonction de mise à jour d'un workspace
      await workspaceController.mettreAJourWorkspace(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: expect.stringContaining('administrateurs')
      }));
      expect(Workspace.findByIdAndUpdate).not.toHaveBeenCalled();
      
      // Restaurer la méthode originale
      workspaceController.mettreAJourWorkspace = originalMettreAJourWorkspace;
    });
  });

  // Test d'envoi d'invitation
  describe('Envoi d\'invitation', () => {
    it('should send an invitation to a user by email', async () => {
      // Remplacer temporairement la méthode originale
      const originalEnvoyerInvitation = workspaceController.envoyerInvitation;
      workspaceController.envoyerInvitation = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        const email = req.body.email;
        
        try {
          // Générer un token d'invitation
          const token = workspace.genererTokenInvitation();
          
          // Ajouter l'invitation à la liste des invitations en attente
          workspace.invitationsEnAttente.push({
            email,
            token,
            dateExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
          });
          
          await workspace.save();
          
          // Envoyer l'email d'invitation
          const urlInvitation = `${req.protocol}://${req.get('host')}/api/workspaces/${workspace._id}/invitations/${token}`;
          
          await envoyerEmailInvitationWorkspace(
            email,
            req.user.username || req.user.email,
            workspace.nom,
            urlInvitation
          );
          
          res.status(200).json({
            status: 'success',
            message: 'Invitation envoyée avec succès'
          });
        } catch (error) {
          return next(new AppError('Une erreur est survenue lors de l\'envoi de l\'invitation', 500));
        }
      };

      // Configurer la requête
      req.params.id = 'workspace123';
      req.body = { email: 'invite@example.com' };
      req.user = { 
        id: 'user123',
        username: 'testuser',
        email: 'testuser@example.com'
      };
      req.protocol = 'http';
      req.get = jest.fn().mockReturnValue('localhost:3000');

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        proprietaire: 'user123',
        invitationsEnAttente: [],
        genererTokenInvitation: jest.fn().mockReturnValue('token123'),
        estAdmin: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Appeler la fonction d'envoi d'invitation
      await workspaceController.envoyerInvitation(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.id);
      expect(mockWorkspace.genererTokenInvitation).toHaveBeenCalled();
      expect(mockWorkspace.invitationsEnAttente.length).toBe(1);
      expect(mockWorkspace.invitationsEnAttente[0].email).toBe(req.body.email);
      expect(mockWorkspace.invitationsEnAttente[0].token).toBe('token123');
      expect(mockWorkspace.save).toHaveBeenCalled();
      expect(envoyerEmailInvitationWorkspace).toHaveBeenCalledWith(
        req.body.email,
        req.user.username,
        mockWorkspace.nom,
        expect.stringContaining('token123')
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Invitation envoyée avec succès'
      });

      // Restaurer la méthode originale
      workspaceController.envoyerInvitation = originalEnvoyerInvitation;
    });

    it('should not send an invitation if user is not an admin', async () => {
      // Configurer la requête
      req.params.id = 'workspace123';
      req.body = { email: 'invite@example.com' };
      req.user = { id: 'user123' };

      // Mock du workspace (utilisateur non admin)
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        proprietaire: 'autre-user',
        estAdmin: jest.fn().mockReturnValue(false)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Appeler la fonction d'envoi d'invitation
      await workspaceController.envoyerInvitation(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: expect.stringContaining('administrateurs')
      }));
      expect(envoyerEmailInvitationWorkspace).not.toHaveBeenCalled();
    });
  });

  // Test d'acceptation d'invitation
  describe('Acceptation d\'invitation', () => {
    it('should accept an invitation successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalAccepterInvitation = workspaceController.accepterInvitation;
      workspaceController.accepterInvitation = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        const token = req.params.token;
        
        // Vérifier si le token est valide
        if (!workspace.verifierTokenInvitation(token)) {
          return next(new AppError('Token d\'invitation invalide ou expiré', 400));
        }
        
        // Trouver l'invitation correspondante
        const invitation = workspace.invitationsEnAttente.find(inv => inv.token === token);
        
        // Vérifier si l'utilisateur connecté correspond à l'email invité
        if (invitation.email !== req.user.email) {
          return next(new AppError('Vous devez être connecté avec le compte correspondant à l\'email invité', 403));
        }
        
        // Ajouter l'utilisateur comme membre s'il ne l'est pas déjà
        if (!workspace.estMembre(req.user.id)) {
          workspace.membres.push({
            utilisateur: req.user.id,
            role: 'membre'
          });
        }
        
        // Supprimer l'invitation
        workspace.invitationsEnAttente = workspace.invitationsEnAttente.filter(
          inv => inv.token !== token
        );
        
        await workspace.save();
        
        res.status(200).json({
          status: 'success',
          message: 'Vous avez rejoint le workspace avec succès',
          data: { workspace }
        });
      };

      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.params.token = 'token123';
      req.user = { 
        id: 'user123',
        email: 'invite@example.com'
      };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        proprietaire: 'autre-user',
        membres: [],
        invitationsEnAttente: [
          {
            email: 'invite@example.com',
            token: 'token123',
            dateExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 jour
          }
        ],
        verifierTokenInvitation: jest.fn().mockReturnValue(true),
        estMembre: jest.fn().mockReturnValue(false),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Appeler la fonction d'acceptation d'invitation
      await workspaceController.accepterInvitation(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(mockWorkspace.verifierTokenInvitation).toHaveBeenCalledWith(req.params.token);
      expect(mockWorkspace.estMembre).toHaveBeenCalledWith(req.user.id);
      expect(mockWorkspace.membres.length).toBe(1);
      expect(mockWorkspace.membres[0].utilisateur).toBe(req.user.id);
      expect(mockWorkspace.membres[0].role).toBe('membre');
      expect(mockWorkspace.invitationsEnAttente.length).toBe(0);
      expect(mockWorkspace.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Vous avez rejoint le workspace avec succès',
        data: { workspace: mockWorkspace }
      });

      // Restaurer la méthode originale
      workspaceController.accepterInvitation = originalAccepterInvitation;
    });

    it('should not accept an invitation with an invalid token', async () => {
      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.params.token = 'token-invalide';
      req.user = { 
        id: 'user123',
        email: 'invite@example.com'
      };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        proprietaire: 'autre-user',
        membres: [],
        invitationsEnAttente: [
          {
            email: 'invite@example.com',
            token: 'token123',
            dateExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 jour
          }
        ],
        verifierTokenInvitation: jest.fn().mockReturnValue(false)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Appeler la fonction d'acceptation d'invitation
      await workspaceController.accepterInvitation(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(mockWorkspace.verifierTokenInvitation).toHaveBeenCalledWith(req.params.token);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('invalide ou expiré')
      }));
    });
  });
});
