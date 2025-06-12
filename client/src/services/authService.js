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
      
      // Le token est désormais géré par un cookie HTTP-only
      // Pas besoin de stocker le token dans localStorage
      
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
      
      // Le token est désormais géré par un cookie HTTP-only
      // Pas besoin de stocker le token dans localStorage
        
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
    // Le token est géré par cookie HTTP-only, pas besoin de le supprimer du localStorage
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
  async isAuthenticated() {
    try {
      console.log('Vérification de l\'authentification via cookie HTTP-only...');
      // Vérifie l'authentification en interrogeant l'API (qui vérifie le cookie)
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Pour éviter les problèmes de cache
      });
      
      const isAuthenticated = response.ok;
      console.log('Résultat authentification:', isAuthenticated, 'Status:', response.status);
      
      if (!isAuthenticated && response.status === 401) {
        console.warn('Session expirée ou cookie non valide. Déconnexion automatique.');
        // Optionnel: émettre un évènement de déconnexion si nécessaire
        // eventBus.emit(APP_EVENTS.USER_LOGGED_OUT);
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
    // Avec un cookie HTTP-only, on ne peut pas accéder directement au token
    // Renvoie null pour indiquer que le token est géré par le cookie
    return null;
  },
  
  /**
   * Définir le token d'authentification
   * @param {String} token - Méthode maintenue pour compatibilité, mais ne fait rien car token géré par cookie
   */
  setToken(token) {
    // Le token est géré par les cookies HTTP-only, cette fonction est maintenue pour compatibilité
    return !!token; // Renvoie true si token existe, sinon false
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
      
      // Le token est géré par cookie HTTP-only
      // Pas besoin de le stocker manuellement
      
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
