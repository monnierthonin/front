/**
 * Service pour la gestion de l'authentification avec l'API
 */

// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

// Import du système d'événements
import { eventBus, APP_EVENTS } from '../utils/eventBus.js';
// Import du service utilisateur pour charger le profil
import userService from './userService.js';

/**
 * Service d'authentification
 */
const authService = {
  // Méthodes pour OAuth
  /**
   * Initialise l'authentification OAuth en redirigeant vers le service approprié
   * @param {string} provider - Le fournisseur OAuth (google, microsoft, facebook)
   */
  initiateOAuthLogin(provider) {
    if (!['google', 'microsoft', 'facebook'].includes(provider)) {
      throw new Error('Fournisseur OAuth non supporté');
    }
    
    // Redirection vers l'endpoint d'authentification OAuth
    // Nous utilisons directement l'URL du backend pour éviter tout problème de proxy
    const baseUrl = 'http://localhost:3000';
    window.location.href = `${baseUrl}/api/v1/auth/${provider}`;
  },
  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur (username, email, password, confirmPassword)
   * @returns {Promise} Promesse avec les données utilisateur et le token
   */
  async register(userData) {
    try {
      
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
      }
      
      return data;
    } catch (error) {
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
      
      if (!response.ok) {
        const errorMessage = data.message || 
          (data.erreurs && data.erreurs.length > 0 ? data.erreurs[0].message : 'Erreur lors de la connexion');
        throw new Error(errorMessage);
      }
      
      // Si la connexion réussit, stocker le token dans le localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Charger directement le profil utilisateur
        try {
          const profileResponse = await userService.getProfile();
          
          if (profileResponse && profileResponse.data) {
            // Enregistrer le thème
            if (profileResponse.data.theme) {
              const theme = profileResponse.data.theme === 'sombre' ? 'dark' : 'light';
              localStorage.setItem('theme', theme);
            }
            
            // Enregistrer le statut
            if (profileResponse.data.status) {
              let status;
              switch(profileResponse.data.status) {
                case 'en ligne': status = 'online'; break;
                case 'absent': status = 'away'; break;
                case 'ne pas déranger': status = 'offline'; break;
                default: status = 'online';
              }
              localStorage.setItem('userStatus', status);
            }
            
            // Enregistrer la photo de profil (qu'elle soit définie ou non)
            // L'API gère déjà l'image par défaut si nécessaire
            localStorage.setItem('profilePicture', profileResponse.data.profilePicture || 'default.jpg');
            
            // Notifier les composants immédiatement
            eventBus.emit(APP_EVENTS.PROFILE_PICTURE_UPDATED, profileResponse.data.profilePicture || 'default.jpg');
          }
          
          // Émettre l'événement de connexion réussie
          eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
        } catch (profileError) {
          // En cas d'erreur, émettre quand même l'événement de connexion
          eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
        }
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Déconnexion de l'utilisateur et application du thème sombre par défaut
   */
  logout() {
    // Avant de supprimer les données, appliquer le thème sombre par défaut
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.remove('light-theme');
    document.documentElement.classList.add('dark-theme');
    
    // Supprimer toutes les données utilisateur du localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('profilePicture');
    localStorage.removeItem('status');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    // Émettre l'événement de déconnexion
    eventBus.emit(APP_EVENTS.USER_LOGGED_OUT);
    
    // Appeler l'API pour invalider le token côté serveur
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
  },
  
  /**
   * Définir le token d'authentification
   * @param {String} token - Le token JWT à stocker
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
      return true;
    }
    return false;
  },
  
  /**
   * Vérifie le statut de l'authentification depuis le serveur
   * Utile après une redirection OAuth pour obtenir les informations utilisateur
   * @returns {Promise} Promesse avec les données utilisateur
   */
  async checkAuthStatus() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Non authentifié');
      }
      
      const data = await response.json();
      
      // Si on a un token dans la réponse, on le stocke
      if (data.token) {
        this.setToken(data.token);
      }
      
      // Émettre l'événement de connexion réussie
      eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'authentification:', error);
      throw error;
    }
  }
};

export default authService;
