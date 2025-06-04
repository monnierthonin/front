const { app, request } = require('./setup');
const User = require('../../src/models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Authentication API Integration Tests', () => {
  beforeEach(async () => {
    // S'assurer que la collection d'utilisateurs est vide avant chaque test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
        nom: 'New',
        prenom: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password'); // Le mot de passe ne doit pas être renvoyé

      // Vérifier que l'utilisateur est bien enregistré dans la base de données
      const savedUser = await User.findOne({ email: userData.email }).select('+password');
      expect(savedUser).toBeTruthy();
      expect(savedUser.username).toBe(userData.username);
      
      // Vérifier que le mot de passe est bien hashé et différent du mot de passe en clair
      expect(savedUser.password).toBeTruthy();
      expect(savedUser.password).not.toBe(userData.password); // Le mot de passe doit être hashé
    });

    it('should not register a user with an existing email', async () => {
      // Créer un utilisateur
      const existingUser = new User({
        username: 'existinguser',
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123!', 10),
        nom: 'Existing',
        prenom: 'User'
      });
      await existingUser.save();

      // Tenter de créer un utilisateur avec le même email
      const userData = {
        username: 'newuser',
        email: 'existing@example.com', // Email déjà utilisé
        password: 'Password123!',
        nom: 'New',
        prenom: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email');
    });

    it('should not register a user with an existing username', async () => {
      // Créer un utilisateur
      const existingUser = new User({
        username: 'existinguser',
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123!', 10),
        nom: 'Existing',
        prenom: 'User'
      });
      await existingUser.save();

      // Tenter de créer un utilisateur avec le même username
      const userData = {
        username: 'existinguser', // Username déjà utilisé
        email: 'new@example.com',
        password: 'Password123!',
        nom: 'New',
        prenom: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('username');
    });

    it('should not register a user with invalid data', async () => {
      const userData = {
        username: 'nu', // Trop court
        email: 'notanemail', // Format invalide
        password: '123', // Trop court
        nom: 'New',
        prenom: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // Créer un utilisateur
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        nom: 'Test',
        prenom: 'User'
      });
      await user.save();

      // Tenter de se connecter
      const loginData = {
        email: 'test@example.com',
        password: password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.username).toBe(user.username);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Vérifier que le token est valide
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'votre_clé_secrète_par_défaut');
      expect(decoded).toHaveProperty('id');
      expect(decoded.id).toBe(user._id.toString());
    });

    it('should not login with incorrect password', async () => {
      // Créer un utilisateur
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        nom: 'Test',
        prenom: 'User'
      });
      await user.save();

      // Tenter de se connecter avec un mauvais mot de passe
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('mot de passe');
    });

    it('should not login with non-existent email', async () => {
      // Tenter de se connecter avec un email qui n'existe pas
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('utilisateur');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get the current user profile', async () => {
      // Créer un utilisateur
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        nom: 'Test',
        prenom: 'User'
      });
      await user.save();

      // Générer un token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'votre_clé_secrète_par_défaut',
        { expiresIn: '1h' }
      );

      // Récupérer le profil de l'utilisateur
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body._id).toBe(user._id.toString());
      expect(response.body.username).toBe(user.username);
      expect(response.body.email).toBe(user.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not get profile without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });
  });
});
