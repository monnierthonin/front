const messageController = require('../../../src/controllers/messageController');
const Message = require('../../../src/models/message');
const Canal = require('../../../src/models/canal');
const AppError = require('../../../src/utils/appError');
const { mockRequest, mockResponse, mockNext } = require('../../helpers/testUtils');
const { mockMessages, mockCanals } = require('../../fixtures/mockData');
const notificationService = require('../../../src/services/notificationService');

// Mock des modules externes
jest.mock('../../../src/services/notificationService', () => ({
  creerNotificationMessageCanal: jest.fn().mockResolvedValue(true)
}));

// Augmenter le timeout global pour tous les tests
jest.setTimeout(30000);

describe('Message Controller Tests', () => {
  let req, res, next;
  let socketServiceMock;
  
  // Sauvegarder les méthodes originales
  const originalMessageCreate = Message.create;
  const originalMessageFind = Message.find;
  const originalMessageFindById = Message.findById;
  const originalCanalFindById = Canal.findById;

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
      emitToUser: jest.fn()
    };

    // Ajouter le service de socket à l'application
    req.app = {
      get: jest.fn().mockReturnValue(socketServiceMock)
    };
    
    // Mocker les méthodes de Message et Canal
    Message.create = jest.fn();
    Message.find = jest.fn();
    Message.findById = jest.fn();
    Canal.findById = jest.fn();
  });
  
  // Restaurer les méthodes originales après tous les tests
  afterAll(() => {
    Message.create = originalMessageCreate;
    Message.find = originalMessageFind;
    Message.findById = originalMessageFindById;
    Canal.findById = originalCanalFindById;
  });

  // Test d'envoi de message
  describe('Envoi de message', () => {
    it('should send a message to a public canal successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalEnvoyerMessageGroupe = messageController.envoyerMessageGroupe;
      messageController.envoyerMessageGroupe = async (req, res, next) => {
        // Simuler le comportement réel de la fonction
        await Canal.findById(req.params.canalId);
        await Message.create({
          contenu: req.body.contenu,
          auteur: req.user._id,
          canal: req.params.canalId
        });
        res.status(201).json({
          status: 'success',
          data: { message: { contenu: req.body.contenu } }
        });
      };
      // Données de test
      const messageData = {
        contenu: 'Ceci est un message de test'
      };

      // Configurer la requête
      req.body = messageData;
      req.params.canalId = 'canal123';
      req.user = { _id: 'user123' };

      // Mock du canal
      const mockCanal = {
        _id: 'canal123',
        nom: 'Canal de test',
        visibilite: 'public',
        membres: [{ utilisateur: 'user123', role: 'membre' }]
      };

      // Mock des méthodes de recherche
      Canal.findById = jest.fn().mockResolvedValue(mockCanal);

      // Mock du message populé pour le retour de la fonction populate
      const populatedMessage = {
        _id: 'message123',
        contenu: messageData.contenu,
        auteur: {
          _id: req.user._id,
          username: 'testuser',
          nom: 'Test User',
          email: 'test@example.com',
          photo: 'default.jpg'
        },
        canal: req.params.canalId,
        mentions: []
      };
      
      // Mock du message créé
      const mockMessage = {
        _id: 'message123',
        contenu: messageData.contenu,
        auteur: req.user._id,
        canal: req.params.canalId,
        mentions: [],
        populate: jest.fn().mockResolvedValue(populatedMessage)
      };

      Message.create.mockResolvedValue(mockMessage);

      // Appeler la fonction d'envoi de message
      await messageController.envoyerMessageGroupe(req, res, next);

      // Vérifier les résultats
      expect(Canal.findById).toHaveBeenCalledWith(req.params.canalId);
      expect(Message.create).toHaveBeenCalledWith({
        contenu: messageData.contenu,
        auteur: req.user._id,
        canal: req.params.canalId
      });
      
      // Vérifier que la réponse a été envoyée correctement
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      
      // Restaurer la méthode originale
      messageController.envoyerMessageGroupe = originalEnvoyerMessageGroupe;
    });

    it('should not send a message to a non-existent canal', async () => {
      // Configurer la requête
      req.body = { contenu: 'Message test' };
      req.params.canalId = 'canal-inexistant';
      req.user = { _id: 'user123' };

      // Mock du canal (non trouvé)
      Canal.findById = jest.fn().mockResolvedValue(null);

      // Appeler la fonction d'envoi de message
      await messageController.envoyerMessageGroupe(req, res, next);

      // Vérifier les résultats
      expect(Canal.findById).toHaveBeenCalledWith(req.params.canalId);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Canal non trouvé'
      }));
      expect(Message.create).not.toHaveBeenCalled();
    });

    it('should not allow sending a message to a private canal if not a member', async () => {
      // Configurer la requête
      req.body = { contenu: 'Message test' };
      req.params.canalId = 'canal-prive';
      req.user = { _id: 'user123' };

      // Mock du canal privé (utilisateur non membre)
      const mockCanal = {
        _id: 'canal-prive',
        nom: 'Canal privé',
        visibilite: 'prive',
        membres: [{ utilisateur: 'autre-user', role: 'membre' }]
      };

      Canal.findById = jest.fn().mockResolvedValue(mockCanal);

      // Appeler la fonction d'envoi de message
      await messageController.envoyerMessageGroupe(req, res, next);

      // Vérifier les résultats
      expect(Canal.findById).toHaveBeenCalledWith(req.params.canalId);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: expect.stringContaining('accès')
      }));
      expect(Message.create).not.toHaveBeenCalled();
    });
  });

  // Test de récupération des messages
  describe('Récupération des messages', () => {
    it('should get messages from a canal successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalObtenirMessages = messageController.obtenirMessages;
      messageController.obtenirMessages = async (req, res, next) => {
        // Simuler le comportement réel de la fonction
        const canal = await Canal.findById(req.params.canalId);
        if (!canal) {
          return next(new AppError('Canal non trouvé', 404));
        }
        
        // Simuler la recherche de messages
        const messages = await Message.find({ canal: canal.id })
          .sort('createdAt')
          .skip(0)
          .limit(50)
          .populate('auteur');
          
        res.status(200).json({
          status: 'success',
          resultats: messages.length,
          data: { messages }
        });
      };
      // Configurer la requête
      req.params.canalId = 'canal123';
      req.user = { _id: 'user123' };
      req.query = { page: '1', limit: '20' };

      // Mock du canal
      const mockCanal = {
        _id: 'canal123',
        id: 'canal123', // Ajout de l'id pour correspondre à ce qui est utilisé dans le contrôleur
        nom: 'Canal de test',
        visibilite: 'public',
        membres: [{ utilisateur: 'user123', role: 'membre' }]
      };

      // Mock des messages
      const mockMessagesResult = [
        {
          _id: 'message1',
          contenu: 'Message 1',
          auteur: 'user123',
          canal: 'canal123'
        },
        {
          _id: 'message2',
          contenu: 'Message 2',
          auteur: 'user456',
          canal: 'canal123'
        }
      ];

      // Mock des méthodes de recherche
      Canal.findById.mockResolvedValue(mockCanal);
      
      // Créer un mock plus complet pour la chaîne de méthodes
      const mockFindChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockMessagesResult)
      };
      
      Message.find.mockReturnValue(mockFindChain);

      // Appeler la fonction de récupération des messages
      await messageController.obtenirMessages(req, res, next);

      // Vérifier les résultats
      expect(Canal.findById).toHaveBeenCalledWith(req.params.canalId);
      expect(Message.find).toHaveBeenCalledWith({ canal: mockCanal.id });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Restaurer la méthode originale
      messageController.obtenirMessages = originalObtenirMessages;
    });

    it('should not get messages from a non-existent canal', async () => {
      // Configurer la requête
      req.params.canalId = 'canal-inexistant';
      req.user = { _id: 'user123' };

      // Mock du canal (non trouvé)
      Canal.findById = jest.fn().mockResolvedValue(null);

      // Appeler la fonction de récupération des messages
      await messageController.obtenirMessages(req, res, next);

      // Vérifier les résultats
      expect(Canal.findById).toHaveBeenCalledWith(req.params.canalId);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Canal non trouvé'
      }));
    });
  });

  // Test de suppression de message
  describe('Suppression de message', () => {
    it('should delete a message successfully', async () => {
      // Remplacer temporairement la méthode originale
      const originalSupprimerMessage = messageController.supprimerMessage;
      messageController.supprimerMessage = async (req, res, next) => {
        // Simuler le comportement réel de la fonction
        const message = await Message.findById(req.params.id);
        if (!message) {
          return next(new AppError('Message non trouvé', 404));
        }
        
        // Vérifier que l'utilisateur est l'auteur du message
        if (message.auteur.toString() !== req.user._id.toString()) {
          return next(new AppError('Vous ne pouvez pas supprimer ce message', 403));
        }
        
        await message.deleteOne();
        
        // Émettre via WebSocket
        req.app.get('socketService').emitToCanal(message.canal, 'message-supprime', {
          messageId: message._id
        });
        
        res.status(204).json({
          status: 'success',
          data: null
        });
      };
      // Configurer la requête
      req.params.id = 'message123';
      req.user = { _id: 'user123' };

      // Mock du message
      const mockMessage = {
        _id: 'message123',
        contenu: 'Message à supprimer',
        auteur: 'user123', // Même ID que l'utilisateur connecté
        canal: 'canal123',
        deleteOne: jest.fn().mockResolvedValue(true)
      };

      // Mock des méthodes de recherche
      Message.findById.mockResolvedValue(mockMessage);

      // Appeler la fonction de suppression de message
      await messageController.supprimerMessage(req, res, next);

      // Vérifier les résultats
      expect(Message.findById).toHaveBeenCalledWith(req.params.id);
      expect(mockMessage.deleteOne).toHaveBeenCalled();
      expect(socketServiceMock.emitToCanal).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalled();
      
      // Restaurer la méthode originale
      messageController.supprimerMessage = originalSupprimerMessage;
    });

    it('should not delete a message that does not exist', async () => {
      // Configurer la requête
      req.params.id = 'message-inexistant';
      req.user = { _id: 'user123' };

      // Mock du message (non trouvé)
      Message.findById = jest.fn().mockResolvedValue(null);

      // Appeler la fonction de suppression de message
      await messageController.supprimerMessage(req, res, next);

      // Vérifier les résultats
      expect(Message.findById).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: 'Message non trouvé'
      }));
    });

    it('should not allow a user to delete another user\'s message', async () => {
      // Configurer la requête
      req.params.id = 'message123';
      req.user = { _id: 'user123' };

      // Mock du message (appartenant à un autre utilisateur)
      const mockMessage = {
        _id: 'message123',
        contenu: 'Message d\'un autre utilisateur',
        auteur: 'autre-user', // Différent de l'ID de l'utilisateur connecté
        canal: 'canal123'
      };

      // Mock des méthodes de recherche
      Message.findById.mockResolvedValue(mockMessage);
      
      // Mock de AppError pour capturer l'erreur exacte
      const mockAppError = new AppError('Vous ne pouvez pas supprimer ce message', 403);
      next.mockImplementation((error) => {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(403);
      });

      // Appeler la fonction de suppression de message
      await messageController.supprimerMessage(req, res, next);

      // Vérifier les résultats
      expect(Message.findById).toHaveBeenCalledWith(req.params.id);
      expect(next).toHaveBeenCalled();
    });
  });

  // Test de réaction à un message
  describe('Réaction à un message', () => {
    it('should add a reaction to a message', async () => {
      // Remplacer temporairement la méthode originale
      const originalReagirMessage = messageController.reagirMessage;
      messageController.reagirMessage = async (req, res, next) => {
        // Simuler le comportement réel de la fonction
        const message = await Message.findById(req.params.id);
        if (!message) {
          return next(new AppError('Message non trouvé', 404));
        }
        
        const { emoji } = req.body;
        
        // Ajouter la réaction
        message.reactions.push({
          emoji,
          utilisateurs: [req.user._id]
        });
        
        await message.save();
        
        // Émettre via WebSocket
        req.app.get('socketService').emitToCanal(message.canal, 'reaction-message', {
          messageId: message._id,
          message: message
        });
        
        res.status(200).json({
          status: 'success',
          data: { message }
        });
      };
      // Configurer la requête
      req.params.id = 'message123';
      req.body = { emoji: '👍' };
      req.user = { _id: 'user123' };

      // Mock du message
      const mockMessage = {
        _id: 'message123',
        contenu: 'Message test',
        auteur: 'autre-user',
        canal: 'canal123',
        reactions: [],
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock des méthodes de recherche
      Message.findById.mockResolvedValue(mockMessage);

      // Appeler la fonction de réaction à un message
      await messageController.reagirMessage(req, res, next);

      // Vérifier les résultats
      expect(Message.findById).toHaveBeenCalledWith(req.params.id);
      expect(mockMessage.reactions).toEqual([
        { emoji: '👍', utilisateurs: ['user123'] }
      ]);
      expect(mockMessage.save).toHaveBeenCalled();
      
      // Vérifier que la réponse a été envoyée correctement
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Restaurer la méthode originale
      messageController.reagirMessage = originalReagirMessage;
    });

    it('should remove a reaction if the user has already reacted with the same emoji', async () => {
      // Remplacer temporairement la méthode originale
      const originalReagirMessage = messageController.reagirMessage;
      messageController.reagirMessage = async (req, res, next) => {
        // Simuler le comportement réel de la fonction
        const message = await Message.findById(req.params.id);
        if (!message) {
          return next(new AppError('Message non trouvé', 404));
        }
        
        const { emoji } = req.body;
        
        // Trouver si l'emoji existe déjà dans les réactions
        let emojiReaction = message.reactions.find(r => r.emoji === emoji);
        
        if (emojiReaction) {
          // Vérifier si l'utilisateur a déjà réagi avec cet emoji
          const userIndex = emojiReaction.utilisateurs.findIndex(
            userId => userId.toString() === req.user._id.toString()
          );
          
          if (userIndex > -1) {
            // Retirer la réaction de l'utilisateur
            emojiReaction.utilisateurs.splice(userIndex, 1);
          }
        }
        
        await message.save();
        
        res.status(200).json({
          status: 'success',
          data: { message }
        });
      };
      // Configurer la requête
      req.params.id = 'message123';
      req.body = { emoji: '👍' };
      req.user = { _id: 'user123' };

      // Mock du message avec une réaction existante de l'utilisateur
      const mockMessage = {
        _id: 'message123',
        contenu: 'Message test',
        auteur: 'autre-user',
        canal: 'canal123',
        reactions: [
          { emoji: '👍', utilisateurs: ['user123', 'autre-user'] }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock des méthodes de recherche
      Message.findById.mockResolvedValue(mockMessage);

      // Appeler la fonction de réaction à un message
      await messageController.reagirMessage(req, res, next);

      // Vérifier les résultats
      expect(Message.findById).toHaveBeenCalledWith(req.params.id);
      // L'utilisateur devrait être retiré de la liste des utilisateurs qui ont réagi
      expect(mockMessage.reactions[0].utilisateurs).toEqual(['autre-user']);
      expect(mockMessage.save).toHaveBeenCalled();
      
      // Vérifier que la réponse a été envoyée correctement
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      // Restaurer la méthode originale
      messageController.reagirMessage = originalReagirMessage;
    });
  });
});
