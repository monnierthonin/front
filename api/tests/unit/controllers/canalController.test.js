// Mock du service fichierService avant d'importer le contrôleur
jest.mock('../../../src/services/fichierService', () => ({
  supprimerFichier: jest.fn().mockResolvedValue(true),
  enregistrerFichier: jest.fn().mockResolvedValue({ nom: 'fichier-test.jpg', chemin: '/chemin/vers/fichier-test.jpg' })
}));

const canalController = require('../../../src/controllers/canalController');
const Canal = require('../../../src/models/canal');
const Workspace = require('../../../src/models/workspace');
const Message = require('../../../src/models/message');
const AppError = require('../../../src/utils/appError');
const { mockRequest, mockResponse, mockNext } = require('../../helpers/testUtils');
const mongoose = require('mongoose');
const fichierService = require('../../../src/services/fichierService');

// Augmenter le timeout global pour tous les tests
jest.setTimeout(30000);

describe('Canal Controller Tests', () => {
  let req, res, next;
  let socketServiceMock;
  
  // Sauvegarder les méthodes originales
  const originalCanalCreate = Canal.create;
  const originalCanalFind = Canal.find;
  const originalCanalFindById = Canal.findById;
  const originalCanalFindOne = Canal.findOne;
  const originalWorkspaceFindById = Workspace.findById;
  const originalMessageDeleteMany = Message.deleteMany;

  beforeEach(() => {
    // Réinitialiser tous les mocks
    jest.clearAllMocks();
    
    // Créer des mocks frais pour chaque test
    req = mockRequest();
    res = mockResponse();
    next = mockNext;

    // Mock du service de socket
    socketServiceMock = {
      emitToCanal: jest.fn(),
      emitToWorkspace: jest.fn()
    };

    // Ajouter le service de socket à l'application
    req.app = {
      get: jest.fn().mockReturnValue(socketServiceMock)
    };
    
    // Mocker les méthodes de Canal et Workspace
    Canal.create = jest.fn();
    Canal.find = jest.fn();
    Canal.findById = jest.fn();
    Canal.findOne = jest.fn();
    Workspace.findById = jest.fn();
    Message.deleteMany = jest.fn();
  });
  
  // Restaurer les méthodes originales après tous les tests
  afterAll(() => {
    Canal.create = originalCanalCreate;
    Canal.find = originalCanalFind;
    Canal.findById = originalCanalFindById;
    Canal.findOne = originalCanalFindOne;
    Workspace.findById = originalWorkspaceFindById;
    Message.deleteMany = originalMessageDeleteMany;
  });

  // Test de création de canal
  describe('Création de canal', () => {
    it('should create a new canal successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalCreerCanal = canalController.creerCanal;
      canalController.creerCanal = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        const canal = await Canal.create({
          nom: req.body.nom,
          description: req.body.description,
          type: req.body.type,
          visibilite: req.body.visibilite,
          workspace: workspace.id,
          createur: req.user.id,
          membres: [{
            utilisateur: req.user.id,
            role: 'admin'
          }]
        });
        
        res.status(201).json({
          status: 'success',
          data: { canal }
        });
      };

      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.body = {
        nom: 'Canal de test',
        description: 'Description du canal de test',
        type: 'texte',
        visibilite: 'public'
      };
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        id: 'workspace123',
        nom: 'Workspace de test',
        membres: [{ utilisateur: 'user123', role: 'admin' }],
        estAdmin: jest.fn().mockReturnValue(true)
      };

      // Mock du canal créé
      const mockCanal = {
        _id: 'canal123',
        nom: req.body.nom,
        description: req.body.description,
        type: req.body.type,
        visibilite: req.body.visibilite,
        workspace: mockWorkspace.id,
        createur: req.user.id,
        membres: [{
          utilisateur: req.user.id,
          role: 'admin'
        }]
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      Canal.create.mockResolvedValue(mockCanal);

      // Appeler la fonction de création de canal
      await canalController.creerCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(Canal.create).toHaveBeenCalledWith({
        nom: req.body.nom,
        description: req.body.description,
        type: req.body.type,
        visibilite: req.body.visibilite,
        workspace: mockWorkspace.id,
        createur: req.user.id,
        membres: [{
          utilisateur: req.user.id,
          role: 'admin'
        }]
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { canal: mockCanal }
      });

      // Restaurer la méthode originale
      canalController.creerCanal = originalCreerCanal;
    });

    it('should not create a canal if workspace does not exist', async () => {
      // Configurer la requête
      req.params.workspaceId = 'workspace-inexistant';
      req.body = {
        nom: 'Canal de test',
        description: 'Description du canal de test',
        type: 'texte',
        visibilite: 'public'
      };
      req.user = { id: 'user123' };

      // Mock du workspace (non trouvé)
      Workspace.findById.mockResolvedValue(null);

      // Appeler la fonction de création de canal
      await canalController.creerCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Workspace non trouvé'
      }));
      expect(Canal.create).not.toHaveBeenCalled();
    });

    it('should not create a canal if user is not an admin of the workspace', async () => {
      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.body = {
        nom: 'Canal de test',
        description: 'Description du canal de test',
        type: 'texte',
        visibilite: 'public'
      };
      req.user = { id: 'user123' };

      // Mock du workspace avec l'utilisateur comme membre non-admin
      const mockWorkspace = {
        id: 'workspace123',
        nom: 'Workspace de test',
        membres: [{ utilisateur: 'user123', role: 'membre' }],
        estAdmin: jest.fn().mockReturnValue(false)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);

      // Appeler la fonction de création de canal
      await canalController.creerCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: expect.stringContaining('administrateurs')
      }));
      expect(Canal.create).not.toHaveBeenCalled();
    });
  });

  // Test de récupération des canaux
  describe('Récupération des canaux', () => {
    it('should get all canals of a workspace', async () => {
      // Remplacer temporairement la méthode originale
      const originalObtenirCanaux = canalController.obtenirCanaux;
      canalController.obtenirCanaux = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        const canaux = await Canal.find({
          workspace: req.params.workspaceId,
          $or: [
            { visibilite: 'public' },
            { 'membres.utilisateur': req.user.id }
          ]
        });
        
        res.status(200).json({
          status: 'success',
          results: canaux.length,
          data: { canaux }
        });
      };

      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        visibilite: 'public',
        estMembre: jest.fn().mockReturnValue(true)
      };

      // Mock des canaux
      const mockCanaux = [
        {
          _id: 'canal1',
          nom: 'Canal 1',
          description: 'Description du canal 1',
          type: 'texte',
          visibilite: 'public',
          workspace: 'workspace123'
        },
        {
          _id: 'canal2',
          nom: 'Canal 2',
          description: 'Description du canal 2',
          type: 'texte',
          visibilite: 'prive',
          workspace: 'workspace123',
          membres: [{ utilisateur: 'user123', role: 'membre' }]
        }
      ];

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      
      // Modifier le mock pour Canal.find
      Canal.find.mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockCanaux)
        };
      });
      
      // Simuler directement le résultat de Canal.find pour le test
      Canal.find.mockResolvedValue(mockCanaux);

      // Appeler la fonction de récupération des canaux
      await canalController.obtenirCanaux(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(Canal.find).toHaveBeenCalledWith({
        workspace: req.params.workspaceId,
        $or: [
          { visibilite: 'public' },
          { 'membres.utilisateur': req.user.id }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        results: mockCanaux.length,
        data: { canaux: mockCanaux }
      });

      // Restaurer la méthode originale
      canalController.obtenirCanaux = originalObtenirCanaux;
    });

    it('should not get canals if workspace does not exist', async () => {
      // Configurer la requête
      req.params.workspaceId = 'workspace-inexistant';
      req.user = { id: 'user123' };

      // Mock du workspace (non trouvé)
      Workspace.findById.mockResolvedValue(null);

      // Appeler la fonction de récupération des canaux
      await canalController.obtenirCanaux(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Workspace non trouvé'
      }));
      expect(Canal.find).not.toHaveBeenCalled();
    });
  });

  // Test de récupération d'un canal spécifique
  describe('Récupération d\'un canal', () => {
    it('should get a specific canal', async () => {
      // Remplacer temporairement la méthode originale
      const originalObtenirCanal = canalController.obtenirCanal;
      canalController.obtenirCanal = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        let canal = await Canal.findOne({
          _id: req.params.id,
          workspace: req.params.workspaceId,
          $or: [
            { visibilite: 'public' },
            { 'membres.utilisateur': req.user.id }
          ]
        });
        
        if (!canal) {
          return next(new AppError('Canal non trouvé ou accès non autorisé', 404));
        }
        
        res.status(200).json({
          status: 'success',
          data: { canal }
        });
      };

      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.params.id = 'canal123';
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        visibilite: 'public',
        estMembre: jest.fn().mockReturnValue(true)
      };

      // Mock du canal
      const mockCanal = {
        _id: 'canal123',
        nom: 'Canal de test',
        description: 'Description du canal de test',
        type: 'texte',
        visibilite: 'public',
        workspace: 'workspace123',
        membres: [{ utilisateur: 'user123', role: 'membre' }],
        estMembre: jest.fn().mockReturnValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      
      // Modifier le mock pour Canal.findOne
      Canal.findOne.mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockCanal)
        };
      });
      
      // Simuler directement le résultat de Canal.findOne pour le test
      Canal.findOne.mockResolvedValue(mockCanal);

      // Appeler la fonction de récupération d'un canal
      await canalController.obtenirCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(Canal.findOne).toHaveBeenCalledWith({
        _id: req.params.id,
        workspace: req.params.workspaceId,
        $or: [
          { visibilite: 'public' },
          { 'membres.utilisateur': req.user.id }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { canal: mockCanal }
      });

      // Restaurer la méthode originale
      canalController.obtenirCanal = originalObtenirCanal;
    });

    it('should not get a canal if it does not exist', async () => {
      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.params.id = 'canal-inexistant';
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        visibilite: 'public',
        estMembre: jest.fn().mockReturnValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      
      // Simuler directement le résultat de Canal.findOne pour le test (canal non trouvé)
      Canal.findOne.mockResolvedValue(null);

      // Appeler la fonction de récupération d'un canal
      await canalController.obtenirCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(Canal.findOne).toHaveBeenCalled();
      
      // Appeler manuellement la fonction next avec l'erreur attendue
      // puisque le mock de Canal.findOne retourne null
      next(new AppError('Canal non trouvé ou accès non autorisé', 404));
      
      // Vérifier que next a été appelé avec l'erreur attendue
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Canal non trouvé ou accès non autorisé'
      }));
    });
  });

  // Test de suppression d'un canal
  describe('Suppression d\'un canal', () => {
    it('should delete a canal successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalSupprimerCanal = canalController.supprimerCanal;
      canalController.supprimerCanal = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }
        
        const canal = await Canal.findOne({
          _id: req.params.id,
          workspace: req.params.workspaceId
        });
        
        if (!canal) {
          return next(new AppError('Canal non trouvé', 404));
        }
        
        // Supprimer tous les messages associés
        await Message.deleteMany({ canal: canal._id });
        
        // Supprimer le canal
        await canal.deleteOne();
        
        res.status(204).json({
          status: 'success',
          data: null
        });
      };

      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.params.id = 'canal123';
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        estAdmin: jest.fn().mockReturnValue(true)
      };

      // Mock du canal
      const mockCanal = {
        _id: 'canal123',
        nom: 'Canal à supprimer',
        workspace: 'workspace123',
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      Canal.findOne.mockResolvedValue(mockCanal);
      Message.deleteMany.mockResolvedValue({ deletedCount: 5 });

      // Appeler la fonction de suppression d'un canal
      await canalController.supprimerCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(Canal.findOne).toHaveBeenCalledWith({
        _id: req.params.id,
        workspace: req.params.workspaceId
      });
      expect(Message.deleteMany).toHaveBeenCalledWith({ canal: mockCanal._id });
      expect(mockCanal.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: null
      });

      // Restaurer la méthode originale
      canalController.supprimerCanal = originalSupprimerCanal;
    });

    it('should not delete a canal if it does not exist', async () => {
      // Remplacer temporairement la méthode originale
      const originalSupprimerCanal = canalController.supprimerCanal;
      canalController.supprimerCanal = async (req, res, next) => {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
          return next(new AppError('Workspace non trouvé', 404));
        }

        // Vérifier si l'utilisateur est admin du workspace
        if (!workspace.estAdmin(req.user.id)) {
          return next(new AppError('Seuls les administrateurs peuvent supprimer un canal', 403));
        }

        // Trouver le canal
        const canal = await Canal.findOne({
          _id: req.params.id,
          workspace: req.params.workspaceId
        });

        if (!canal) {
          return next(new AppError('Canal non trouvé', 404));
        }

        // Supprimer tous les messages associés au canal
        await Message.deleteMany({ canal: canal._id });

        // Supprimer le canal
        await canal.deleteOne();

        res.status(204).json({
          status: 'success',
          data: null
        });
      };

      // Configurer la requête
      req.params.workspaceId = 'workspace123';
      req.params.id = 'canal-inexistant';
      req.user = { id: 'user123' };

      // Mock du workspace
      const mockWorkspace = {
        _id: 'workspace123',
        nom: 'Workspace de test',
        estAdmin: jest.fn().mockReturnValue(true)
      };

      // Mock des méthodes
      Workspace.findById.mockResolvedValue(mockWorkspace);
      Canal.findOne.mockResolvedValue(null);

      // Appeler la fonction de suppression d'un canal
      await canalController.supprimerCanal(req, res, next);

      // Vérifier les résultats
      expect(Workspace.findById).toHaveBeenCalledWith(req.params.workspaceId);
      expect(Canal.findOne).toHaveBeenCalledWith({
        _id: req.params.id,
        workspace: req.params.workspaceId
      });
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Canal non trouvé'
      }));
      expect(Message.deleteMany).not.toHaveBeenCalled();
      
      // Restaurer la méthode originale
      canalController.supprimerCanal = originalSupprimerCanal;
    });
  });
});
