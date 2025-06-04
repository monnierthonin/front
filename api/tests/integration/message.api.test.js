const { app, request, createUserAndGetToken } = require('./setup');
const Canal = require('../../src/models/canal');
const Message = require('../../src/models/message');
const Workspace = require('../../src/models/workspace');
const mongoose = require('mongoose');

describe('Message API Integration Tests', () => {
  let testUser, adminToken, testCanal, testWorkspace;

  beforeEach(async () => {
    // Créer un utilisateur et obtenir son token
    const userData = await createUserAndGetToken();
    testUser = userData.user;
    adminToken = userData.token;

    // Créer un workspace de test
    testWorkspace = new Workspace({
      nom: 'Workspace de test',
      description: 'Description du workspace de test',
      proprietaire: testUser._id,
      membres: [
        {
          utilisateur: testUser._id,
          role: 'admin'
        }
      ]
    });
    await testWorkspace.save();

    // Créer un canal de test
    testCanal = new Canal({
      nom: 'Canal de test',
      description: 'Description du canal de test',
      workspace: testWorkspace._id, // Ajouter la référence au workspace
      createur: testUser._id,
      membres: [
        {
          utilisateur: testUser._id,
          role: 'admin'
        }
      ]
    });
    await testCanal.save();
  });

  describe('POST /api/messages', () => {
    it('should create a new message', async () => {
      const messageData = {
        contenu: 'Ceci est un message de test',
        canal: testCanal._id.toString()
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(messageData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.contenu).toBe(messageData.contenu);
      expect(response.body.auteur).toBe(testUser._id.toString());
      expect(response.body.canal).toBe(testCanal._id.toString());

      // Vérifier que le message est bien enregistré dans la base de données
      const savedMessage = await Message.findById(response.body._id);
      expect(savedMessage).toBeTruthy();
      expect(savedMessage.contenu).toBe(messageData.contenu);
    });

    it('should not create a message without content', async () => {
      const messageData = {
        canal: testCanal._id.toString()
        // Pas de contenu
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(messageData);

      expect(response.status).toBe(400);
    });

    it('should not create a message without authentication', async () => {
      const messageData = {
        contenu: 'Ceci est un message de test',
        canal: testCanal._id.toString()
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/messages/:id', () => {
    it('should retrieve a message by id', async () => {
      // Créer un message
      const message = new Message({
        contenu: 'Message à récupérer',
        auteur: testUser._id,
        canal: testCanal._id
      });
      await message.save();

      const response = await request(app)
        .get(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(message._id.toString());
      expect(response.body.contenu).toBe('Message à récupérer');
    });

    it('should return 404 for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/messages/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/messages/:id', () => {
    it('should update a message', async () => {
      // Créer un message
      const message = new Message({
        contenu: 'Message original',
        auteur: testUser._id,
        canal: testCanal._id
      });
      await message.save();

      const updateData = {
        contenu: 'Message modifié'
      };

      const response = await request(app)
        .put(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.contenu).toBe('Message modifié');
      expect(response.body.modifie).toBe(true);

      // Vérifier que le message est bien mis à jour dans la base de données
      const updatedMessage = await Message.findById(message._id);
      expect(updatedMessage.contenu).toBe('Message modifié');
      expect(updatedMessage.modifie).toBe(true);
    });

    it('should not allow updating a message by another user', async () => {
      // Créer un autre utilisateur
      const otherUserData = await createUserAndGetToken({
        username: 'otheruser',
        email: 'other@example.com'
      });
      const otherToken = otherUserData.token;

      // Créer un message du premier utilisateur
      const message = new Message({
        contenu: 'Message original',
        auteur: testUser._id,
        canal: testCanal._id
      });
      await message.save();

      const updateData = {
        contenu: 'Tentative de modification par un autre utilisateur'
      };

      const response = await request(app)
        .put(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData);

      expect(response.status).toBe(403);

      // Vérifier que le message n'a pas été modifié
      const unchangedMessage = await Message.findById(message._id);
      expect(unchangedMessage.contenu).toBe('Message original');
      expect(unchangedMessage.modifie).toBe(false);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    it('should delete a message', async () => {
      // Créer un message
      const message = new Message({
        contenu: 'Message à supprimer',
        auteur: testUser._id,
        canal: testCanal._id
      });
      await message.save();

      const response = await request(app)
        .delete(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Vérifier que le message a été supprimé
      const deletedMessage = await Message.findById(message._id);
      expect(deletedMessage).toBeNull();
    });

    it('should not allow deleting a message by another user', async () => {
      // Créer un autre utilisateur
      const otherUserData = await createUserAndGetToken({
        username: 'otheruser',
        email: 'other@example.com'
      });
      const otherToken = otherUserData.token;

      // Créer un message du premier utilisateur
      const message = new Message({
        contenu: 'Message à ne pas supprimer',
        auteur: testUser._id,
        canal: testCanal._id
      });
      await message.save();

      const response = await request(app)
        .delete(`/api/messages/${message._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      // Vérifier que le message n'a pas été supprimé
      const unchangedMessage = await Message.findById(message._id);
      expect(unchangedMessage).toBeTruthy();
    });
  });

  describe('GET /api/canaux/:canalId/messages', () => {
    it('should retrieve all messages from a canal', async () => {
      // Créer plusieurs messages dans le canal
      await Message.create([
        {
          contenu: 'Premier message',
          auteur: testUser._id,
          canal: testCanal._id
        },
        {
          contenu: 'Deuxième message',
          auteur: testUser._id,
          canal: testCanal._id
        },
        {
          contenu: 'Troisième message',
          auteur: testUser._id,
          canal: testCanal._id
        }
      ]);

      const response = await request(app)
        .get(`/api/canaux/${testCanal._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(3);
      
      // Vérifier que les messages sont triés par date (du plus récent au plus ancien)
      const dates = response.body.map(msg => new Date(msg.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
    });

    it('should mark messages as read when retrieving them', async () => {
      // Créer un message
      const message = new Message({
        contenu: 'Message à marquer comme lu',
        auteur: testUser._id,
        canal: testCanal._id
      });
      await message.save();

      // Vérifier que le message n'est pas lu initialement
      expect(message.estLuPar(testUser._id)).toBe(false);

      await request(app)
        .get(`/api/canaux/${testCanal._id}/messages`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Vérifier que le message est maintenant marqué comme lu
      const updatedMessage = await Message.findById(message._id);
      expect(updatedMessage.estLuPar(testUser._id)).toBe(true);
    });
  });
});
