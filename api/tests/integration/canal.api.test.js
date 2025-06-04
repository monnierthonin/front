const { app, request, createUserAndGetToken } = require('./setup');
const Canal = require('../../src/models/canal');
const Message = require('../../src/models/message');
const Workspace = require('../../src/models/workspace');
const mongoose = require('mongoose');

describe('Canal API Integration Tests', () => {
  let testUser, adminToken, testWorkspace;

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
  });

  describe('POST /api/canaux', () => {
    it('should create a new canal', async () => {
      const canalData = {
        nom: 'Canal de test',
        description: 'Description du canal de test',
        workspace: testWorkspace._id.toString()
      };

      const response = await request(app)
        .post('/api/canaux')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(canalData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.nom).toBe(canalData.nom);
      expect(response.body.description).toBe(canalData.description);
      expect(response.body.createur).toBe(testUser._id.toString());
      
      // Vérifier que l'utilisateur est ajouté comme admin
      expect(response.body.membres).toBeInstanceOf(Array);
      expect(response.body.membres.length).toBe(1);
      expect(response.body.membres[0].utilisateur).toBe(testUser._id.toString());
      expect(response.body.membres[0].role).toBe('admin');

      // Vérifier que le canal est bien enregistré dans la base de données
      const savedCanal = await Canal.findById(response.body._id);
      expect(savedCanal).toBeTruthy();
      expect(savedCanal.nom).toBe(canalData.nom);
    });

    it('should not create a canal without a name', async () => {
      const canalData = {
        description: 'Description du canal de test',
        workspace: testWorkspace._id.toString()
        // Pas de nom
      };

      const response = await request(app)
        .post('/api/canaux')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(canalData);

      expect(response.status).toBe(400);
    });

    it('should not create a canal without authentication', async () => {
      const canalData = {
        nom: 'Canal de test',
        description: 'Description du canal de test',
        workspace: testWorkspace._id.toString()
      };

      const response = await request(app)
        .post('/api/canaux')
        .send(canalData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/canaux/:id', () => {
    it('should retrieve a canal by id', async () => {
      // Créer un canal
      const canal = new Canal({
        nom: 'Canal à récupérer',
        description: 'Description du canal à récupérer',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          }
        ]
      });
      await canal.save();

      const response = await request(app)
        .get(`/api/canaux/${canal._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(canal._id.toString());
      expect(response.body.nom).toBe('Canal à récupérer');
    });

    it('should return 404 for non-existent canal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/canaux/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/canaux/:id', () => {
    it('should update a canal', async () => {
      // Créer un canal
      const canal = new Canal({
        nom: 'Canal original',
        description: 'Description originale',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          }
        ]
      });
      await canal.save();

      const updateData = {
        nom: 'Canal modifié',
        description: 'Description modifiée'
      };

      const response = await request(app)
        .put(`/api/canaux/${canal._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.nom).toBe('Canal modifié');
      expect(response.body.description).toBe('Description modifiée');

      // Vérifier que le canal est bien mis à jour dans la base de données
      const updatedCanal = await Canal.findById(canal._id);
      expect(updatedCanal.nom).toBe('Canal modifié');
      expect(updatedCanal.description).toBe('Description modifiée');
    });

    it('should not allow updating a canal by a non-admin', async () => {
      // Créer un autre utilisateur
      const otherUserData = await createUserAndGetToken({
        username: 'otheruser',
        email: 'other@example.com'
      });
      const otherUser = otherUserData.user;
      const otherToken = otherUserData.token;

      // Créer un canal
      const canal = new Canal({
        nom: 'Canal original',
        description: 'Description originale',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          },
          {
            utilisateur: otherUser._id,
            role: 'membre'
          }
        ]
      });
      await canal.save();

      const updateData = {
        nom: 'Tentative de modification par un non-admin',
        description: 'Description modifiée'
      };

      const response = await request(app)
        .put(`/api/canaux/${canal._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData);

      expect(response.status).toBe(403);

      // Vérifier que le canal n'a pas été modifié
      const unchangedCanal = await Canal.findById(canal._id);
      expect(unchangedCanal.nom).toBe('Canal original');
    });
  });

  describe('DELETE /api/canaux/:id', () => {
    it('should delete a canal', async () => {
      // Créer un canal
      const canal = new Canal({
        nom: 'Canal à supprimer',
        description: 'Description du canal à supprimer',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          }
        ]
      });
      await canal.save();

      const response = await request(app)
        .delete(`/api/canaux/${canal._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Vérifier que le canal a été supprimé
      const deletedCanal = await Canal.findById(canal._id);
      expect(deletedCanal).toBeNull();
    });

    it('should not allow deleting a canal by a non-admin', async () => {
      // Créer un autre utilisateur
      const otherUserData = await createUserAndGetToken({
        username: 'otheruser',
        email: 'other@example.com'
      });
      const otherUser = otherUserData.user;
      const otherToken = otherUserData.token;

      // Créer un canal
      const canal = new Canal({
        nom: 'Canal à ne pas supprimer',
        description: 'Description du canal à ne pas supprimer',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          },
          {
            utilisateur: otherUser._id,
            role: 'membre'
          }
        ]
      });
      await canal.save();

      const response = await request(app)
        .delete(`/api/canaux/${canal._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      // Vérifier que le canal n'a pas été supprimé
      const unchangedCanal = await Canal.findById(canal._id);
      expect(unchangedCanal).toBeTruthy();
    });
  });

  describe('POST /api/canaux/:id/membres', () => {
    it('should add a member to a canal', async () => {
      // Créer un autre utilisateur
      const otherUserData = await createUserAndGetToken({
        username: 'otheruser',
        email: 'other@example.com'
      });
      const otherUser = otherUserData.user;

      // Créer un canal
      const canal = new Canal({
        nom: 'Canal pour ajout de membre',
        description: 'Description du canal pour ajout de membre',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          }
        ]
      });
      await canal.save();

      const memberData = {
        utilisateur: otherUser._id.toString(),
        role: 'membre'
      };

      const response = await request(app)
        .post(`/api/canaux/${canal._id}/membres`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(memberData);

      expect(response.status).toBe(200);
      
      // Vérifier que le membre a été ajouté
      const updatedCanal = await Canal.findById(canal._id);
      expect(updatedCanal.membres.length).toBe(2);
      
      const newMember = updatedCanal.membres.find(
        m => m.utilisateur.toString() === otherUser._id.toString()
      );
      expect(newMember).toBeTruthy();
      expect(newMember.role).toBe('membre');
    });

    it('should not allow adding a member by a non-admin', async () => {
      // Créer deux autres utilisateurs
      const otherUserData1 = await createUserAndGetToken({
        username: 'otheruser1',
        email: 'other1@example.com'
      });
      const otherUser1 = otherUserData1.user;
      const otherToken1 = otherUserData1.token;

      const otherUserData2 = await createUserAndGetToken({
        username: 'otheruser2',
        email: 'other2@example.com'
      });
      const otherUser2 = otherUserData2.user;

      // Créer un canal avec otherUser1 comme membre
      const canal = new Canal({
        nom: 'Canal pour test d\'ajout de membre',
        description: 'Description du canal pour test d\'ajout de membre',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          },
          {
            utilisateur: otherUser1._id,
            role: 'membre'
          }
        ]
      });
      await canal.save();

      const memberData = {
        utilisateur: otherUser2._id.toString(),
        role: 'membre'
      };

      const response = await request(app)
        .post(`/api/canaux/${canal._id}/membres`)
        .set('Authorization', `Bearer ${otherToken1}`)
        .send(memberData);

      expect(response.status).toBe(403);

      // Vérifier que le membre n'a pas été ajouté
      const unchangedCanal = await Canal.findById(canal._id);
      expect(unchangedCanal.membres.length).toBe(2);
    });
  });

  describe('DELETE /api/canaux/:id/membres/:userId', () => {
    it('should remove a member from a canal', async () => {
      // Créer un autre utilisateur
      const otherUserData = await createUserAndGetToken({
        username: 'otheruser',
        email: 'other@example.com'
      });
      const otherUser = otherUserData.user;

      // Créer un canal avec l'autre utilisateur comme membre
      const canal = new Canal({
        nom: 'Canal pour suppression de membre',
        description: 'Description du canal pour suppression de membre',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          },
          {
            utilisateur: otherUser._id,
            role: 'membre'
          }
        ]
      });
      await canal.save();

      const response = await request(app)
        .delete(`/api/canaux/${canal._id}/membres/${otherUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Vérifier que le membre a été supprimé
      const updatedCanal = await Canal.findById(canal._id);
      expect(updatedCanal.membres.length).toBe(1);
      expect(updatedCanal.membres[0].utilisateur.toString()).toBe(testUser._id.toString());
    });

    it('should not allow removing a member by a non-admin', async () => {
      // Créer deux autres utilisateurs
      const otherUserData1 = await createUserAndGetToken({
        username: 'otheruser1',
        email: 'other1@example.com'
      });
      const otherUser1 = otherUserData1.user;
      const otherToken1 = otherUserData1.token;

      const otherUserData2 = await createUserAndGetToken({
        username: 'otheruser2',
        email: 'other2@example.com'
      });
      const otherUser2 = otherUserData2.user;

      // Créer un canal avec les deux autres utilisateurs comme membres
      const canal = new Canal({
        nom: 'Canal pour test de suppression de membre',
        description: 'Description du canal pour test de suppression de membre',
        createur: testUser._id,
        workspace: testWorkspace._id,
        membres: [
          {
            utilisateur: testUser._id,
            role: 'admin'
          },
          {
            utilisateur: otherUser1._id,
            role: 'membre'
          },
          {
            utilisateur: otherUser2._id,
            role: 'membre'
          }
        ]
      });
      await canal.save();

      const response = await request(app)
        .delete(`/api/canaux/${canal._id}/membres/${otherUser2._id}`)
        .set('Authorization', `Bearer ${otherToken1}`);

      expect(response.status).toBe(403);

      // Vérifier que le membre n'a pas été supprimé
      const unchangedCanal = await Canal.findById(canal._id);
      expect(unchangedCanal.membres.length).toBe(3);
    });
  });
});
