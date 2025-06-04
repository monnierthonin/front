// Utilitaires pour les tests

// Mock pour req (requête HTTP)
const mockRequest = (data = {}) => {
  const req = {};
  req.body = data.body || {};
  req.params = data.params || {};
  req.query = data.query || {};
  req.user = data.user || {};
  req.files = data.files || {};
  req.file = data.file || null;
  req.headers = data.headers || {};
  req.io = data.io || { emit: jest.fn() };
  return req;
};

// Mock pour res (réponse HTTP)
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock pour next (middleware)
const mockNext = jest.fn();

// Mock pour Socket.IO
const mockSocketIO = () => ({
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  join: jest.fn(),
  leave: jest.fn(),
  on: jest.fn()
});

// Fonction pour créer un mock JWT
const mockJWT = (payload = {}) => {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

// Fonction pour créer un hash de mot de passe
const hashPassword = async (password) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.hash(password, 10);
};

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
  mockSocketIO,
  mockJWT,
  hashPassword
};
