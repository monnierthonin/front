/**
 * Service pour la gestion de l'authentification avec l'API
 */

const API_URL = 'http://localhost:3000/api/v1';

import { eventBus, APP_EVENTS } from '../utils/eventBus.js';
import userService from './userService.js';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Initialise l'authentification OAuth en redirigeant vers le service approprié
   * @param {string} provider - Le fournisseur OAuth (google, microsoft, facebook)
   */
  initiateOAuthLogin(provider) {
    if (!['google', 'microsoft', 'facebook'].includes(provider)) {
      throw new Error('Fournisseur OAuth non supporté');
    }
    
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
      
      try {
          const profileResponse = await userService.getProfile();
          
          if (profileResponse && profileResponse.data) {
            if (profileResponse.data.theme) {
              const theme = profileResponse.data.theme === 'sombre' ? 'dark' : 'light';
              localStorage.setItem('theme', theme);
            }
            
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
            localStorage.setItem('profilePicture', profileResponse.data.profilePicture || 'default.jpg');
            eventBus.emit(APP_EVENTS.PROFILE_PICTURE_UPDATED, profileResponse.data.profilePicture || 'default.jpg');
          }
          
          eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
        } catch (profileError) {
          eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
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
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.remove('light-theme');
    document.documentElement.classList.add('dark-theme');
    
    localStorage.removeItem('profilePicture');
    localStorage.removeItem('status');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    eventBus.emit(APP_EVENTS.USER_LOGGED_OUT);
    
    return fetch(`${API_URL}/auth/deconnexion`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {Boolean} Vrai si l'utilisateur est connecté
   */
  async isAuthenticated() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      const isAuthenticated = response.ok;
      
      if (!isAuthenticated && response.status === 401) {
        console.warn('Session expirée ou cookie non valide. Déconnexion automatique.');
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      return false;
    }
  },
  
  /**
   * Récupérer le token d'authentification
   * @returns {null} Pas de token direct car utilisation de cookie HTTP-only
   */
  getToken() {
    return null;
  },
  
  /**
   * Définir le token d'authentification
   * @param {String} token - Méthode maintenue pour compatibilité, mais ne fait rien car token géré par cookie
   */
  setToken(token) {
    return !!token;
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
      
      eventBus.emit(APP_EVENTS.USER_LOGGED_IN);
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'authentification:', error);
      throw error;
    }
  }
};

export default authService;
