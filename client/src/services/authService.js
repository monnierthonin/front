/**
 * Service pour la gestion de l'authentification avec l'API
 */

// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur (username, email, password, confirmPassword)
   * @returns {Promise} Promesse avec les données utilisateur et le token
   */
  async register(userData) {
    try {
      console.log('Données d\'inscription envoyées:', userData);
      
      // S'assurer que la confirmation du mot de passe est envoyée à l'API
      // si elle n'est pas déjà présente dans userData
      const dataToSend = { ...userData };
      if (userData.confirmPassword === undefined && userData.password) {
        dataToSend.confirmPassword = userData.password;
      }
      
      const response = await fetch(`${API_URL}/auth/inscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || 
          (data.erreurs && data.erreurs.length > 0 ? data.erreurs[0].message : 'Erreur lors de l\'inscription');
        throw new Error(errorMsg);
      }
      
      // Si l'inscription réussit, stocker le token dans le localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Token stocké après inscription:', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  },

  /**
   * Connexion d'un utilisateur
   * @param {Object} credentials - Identifiants (email, password)
   * @returns {Promise} Promesse avec les données utilisateur et le token
   */
  async login(credentials) {
    try {
      console.log('Tentative de connexion avec:', credentials);

      // Vérification des champs requis
      if (!credentials.email || !credentials.password) {
        throw new Error('Email et mot de passe requis');
      }

      const response = await fetch(`${API_URL}/auth/connexion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          // Ajouter rememberMe optionnellement s'il est présent
          ...(credentials.rememberMe !== undefined && { rememberMe: credentials.rememberMe })
        }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Réponse de connexion:', response.status, data);
      
      if (!response.ok) {
        const errorMessage = data.message || 
          (data.erreurs && data.erreurs.length > 0 ? data.erreurs[0].message : 'Erreur lors de la connexion');
        throw new Error(errorMessage);
      }
      
      // Si la connexion réussit, stocker le token dans le localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Token stocké après connexion:', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  /**
   * Déconnexion de l'utilisateur
   */
  logout() {
    localStorage.removeItem('token');
    // Optionnel: Appeler l'API pour invalider le token côté serveur
    return fetch(`${API_URL}/auth/deconnexion`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {Boolean} Vrai si l'utilisateur est connecté
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Récupérer le token d'authentification
   * @returns {String} Token d'authentification
   */
  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService;
