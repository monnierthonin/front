// Importer la configuration de base depuis le setup principal
require('../setup');

const request = require('supertest');
const app = require('./testApp'); // Utiliser la version modifiée de l'application pour les tests d'intégration
const User = require('../../src/models/user');
const Canal = require('../../src/models/canal');
const Message = require('../../src/models/message');
const Workspace = require('../../src/models/workspace');

// Note: Nous n'avons plus besoin de définir les hooks beforeAll, afterAll et beforeEach
// car ils sont déjà définis dans le setup principal

// Fonction utilitaire pour créer un utilisateur de test et obtenir un token
const createUserAndGetToken = async (userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
    nom: 'Test',
    prenom: 'User',
    ...userData
  };

  // Créer l'utilisateur
  const user = new User(defaultUser);
  await user.save();

  // Obtenir un token d'authentification
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: defaultUser.email,
      password: defaultUser.password
    });

  return {
    user,
    token: response.body.token
  };
};

module.exports = {
  app,
  request,
  createUserAndGetToken
};
