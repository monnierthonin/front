const mongoose = require('mongoose');
const User = require('../../../src/models/user');
const bcrypt = require('bcryptjs');

describe('User Model Tests', () => {
  // Test de création d'un utilisateur valide
  it('should create a valid user', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    // Vérifier que l'utilisateur a été créé avec les bonnes données
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.firstName).toBe(userData.firstName);
    expect(savedUser.lastName).toBe(userData.lastName);
    expect(savedUser.role).toBe('user'); // Valeur par défaut
    expect(savedUser.isVerified).toBe(false); // Valeur par défaut
    expect(savedUser.profilePicture).toBe('default.jpg'); // Valeur par défaut
  });

  // Test de validation d'email
  it('should not create a user with invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    
    // Attendre une erreur de validation
    await expect(user.save()).rejects.toThrow();
  });

  // Test de validation de nom d'utilisateur
  it('should not create a user with invalid username', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'te', // Trop court
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    
    // Attendre une erreur de validation
    await expect(user.save()).rejects.toThrow();
  });

  // Test de validation de mot de passe
  it('should not create a user with short password', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'short', // Trop court
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    
    // Attendre une erreur de validation
    await expect(user.save()).rejects.toThrow();
  });

  // Test de hachage du mot de passe
  it('should hash the password before saving', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    await user.save();

    // Récupérer l'utilisateur avec le mot de passe
    const savedUser = await User.findById(user._id).select('+password');
    
    // Vérifier que le mot de passe a été haché
    expect(savedUser.password).not.toBe(userData.password);
    
    // Vérifier que le mot de passe haché peut être comparé avec succès
    const isMatch = await bcrypt.compare(userData.password, savedUser.password);
    expect(isMatch).toBe(true);
  });

  // Test de la méthode comparePassword
  it('should correctly compare passwords', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    await user.save();

    // Récupérer l'utilisateur avec le mot de passe
    const savedUser = await User.findById(user._id).select('+password');
    
    // Vérifier que comparePassword fonctionne correctement
    const correctPassword = await savedUser.comparePassword('Password123!');
    expect(correctPassword).toBe(true);
    
    const incorrectPassword = await savedUser.comparePassword('WrongPassword');
    expect(incorrectPassword).toBe(false);
  });

  // Test de la méthode createPasswordResetToken
  it('should create a password reset token', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    await user.save();

    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Vérifier que le token a été créé
    expect(resetToken).toBeDefined();
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpires).toBeDefined();
    
    // Vérifier que la date d'expiration est dans le futur (10 minutes)
    const now = Date.now();
    
    // Vérifier que la date est dans le futur
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(now);
    
    // Vérifier que la date est d'environ 10 minutes dans le futur (avec une marge de 5 secondes)
    const expectedTime = now + 10 * 60 * 1000;
    const timeDifference = Math.abs(user.resetPasswordExpires.getTime() - expectedTime);
    expect(timeDifference).toBeLessThan(5000); // Tolérance de 5 secondes
  });

  // Test de la génération d'un nom d'utilisateur unique
  it('should generate a unique username if duplicate exists', async () => {
    // Créer un premier utilisateur
    const user1 = new User({
      email: 'user1@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test1',
      lastName: 'User1'
    });
    await user1.save();

    // Créer un deuxième utilisateur avec le même nom d'utilisateur
    const user2 = new User({
      email: 'user2@example.com',
      username: 'testuser', // Même username que user1
      password: 'Password123!',
      firstName: 'Test2',
      lastName: 'User2'
    });
    await user2.save();

    // Vérifier que le deuxième utilisateur a un nom d'utilisateur différent
    expect(user2.username).not.toBe(user1.username);
    expect(user2.username).toMatch(/^testuser\d+$/); // testuser suivi d'un ou plusieurs chiffres
  });

  // Test des champs OAuth
  it('should create a user with OAuth profile', async () => {
    const userData = {
      email: 'oauth@example.com',
      username: 'oauthuser',
      firstName: 'OAuth',
      lastName: 'User',
      oauthProfiles: [{
        provider: 'google',
        id: '123456789',
        email: 'oauth@example.com',
        name: 'OAuth User',
        picture: 'https://example.com/picture.jpg'
      }]
    };

    const user = new User(userData);
    const savedUser = await user.save();

    // Vérifier que l'utilisateur OAuth a été créé correctement
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.oauthProfiles).toHaveLength(1);
    expect(savedUser.oauthProfiles[0].provider).toBe('google');
    expect(savedUser.oauthProfiles[0].id).toBe('123456789');
  });

  // Test de la transformation JSON pour les photos de profil
  it('should transform profilePicture URL in JSON output', async () => {
    // Sauvegarder la valeur originale
    const originalApiUrl = process.env.API_URL;
    // Définir une URL d'API pour le test
    process.env.API_URL = 'http://test-api.com';

    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      profilePicture: 'custom.jpg'
    };

    const user = new User(userData);
    await user.save();

    // Convertir en JSON
    const userJson = user.toJSON();

    // Vérifier que l'URL de la photo de profil a été transformée
    expect(userJson.profilePicture).toBe('http://test-api.com/uploads/profiles/custom.jpg');

    // Restaurer la valeur originale
    process.env.API_URL = originalApiUrl;
  });

  // Test des préférences de notification par défaut
  it('should have default notification preferences', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = new User(userData);
    await user.save();

    // Vérifier les préférences de notification par défaut
    expect(user.preferences.notifications.mentionsOnly).toBe(false);
    expect(user.preferences.notifications.soundEnabled).toBe(true);
    expect(user.preferences.notifications.desktopEnabled).toBe(true);
  });
});
