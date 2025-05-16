/**
 * Service pour la gestion des utilisateurs avec l'API
 */

const API_URL = 'http://localhost:3000/api/v1';

const userService = {
  /**
   * Supprimer le compte de l'utilisateur
   * @returns {Promise} Promesse avec le résultat de la suppression
   */
  async deleteAccount(password) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || (data.error ? `Erreur: ${data.error}` : 'Erreur lors de la suppression du compte'));
      }

      // Supprimer le token après la suppression réussie
      localStorage.removeItem('token');
      return true;
    } catch (error) {

      throw error;
    }
  },
  /**
   * Récupérer le profil de l'utilisateur connecté
   * @returns {Promise} Promesse avec les données du profil
   */
  async getProfile() {

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }

      const data = await response.json();

      return data;
    } catch (error) {

      throw error;
    }
  },

  /**
   * Mettre à jour le profil de l'utilisateur
   * @param {Object} profileData - Les données du profil à mettre à jour (username, email)
   * @returns {Promise} Promesse avec les données du profil mis à jour
   */
  async updateProfile(profileData) {

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
      }

      const data = await response.json();

      return data;
    } catch (error) {

      throw error;
    }
  },

  /**
   * Changer le mot de passe de l'utilisateur
   * @param {Object} passwordData - Les données du mot de passe (oldPassword, newPassword)
   * @returns {Promise} Promesse avec le résultat du changement de mot de passe
   */
  async updatePassword(passwordData) {

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      // Essayons avec une autre structure pour les données
      const response = await fetch(`${API_URL}/users/profile/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Format correct selon la documentation de l'API
        body: JSON.stringify({
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: 'include'
      });



      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || errorData.error || 'Erreur lors du changement de mot de passe');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Mettre à jour le statut de l'utilisateur
   * @param {String} status - Le nouveau statut ('online', 'offline', 'away')
   * @returns {Promise} Promesse avec le résultat de la mise à jour du statut
   */
  async updateStatus(status) {

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    // Convertir les valeurs anglaises en françaises pour l'API
    let statusFr;
    switch(status) {
      case 'online':
        statusFr = 'en ligne';
        break;
      case 'away':
        statusFr = 'absent';
        break;
      case 'offline':
        statusFr = 'ne pas déranger';
        break;
      default:
        statusFr = 'en ligne';
    }

    try {
      // Utiliser l'endpoint spécifique pour la mise à jour du statut
      const response = await fetch(`${API_URL}/users/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusFr }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || 'Erreur lors de la mise à jour du statut');
      }

      const data = await response.json();

      return data;
    } catch (error) {

      throw error;
    }
  },

  /**
   * Mettre à jour le thème de l'utilisateur
   * @param {String} theme - Le nouveau thème ('light', 'dark')
   * @returns {Promise} Promesse avec le résultat de la mise à jour du thème
   */
  async updateTheme(theme) {

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    // Vérifier si le thème est déjà en français ou s'il est en anglais
    let themeFr;
    if (theme === 'sombre' || theme === 'clair') {
      // Déjà en français, pas besoin de conversion
      themeFr = theme;

    } else {
      // Convertir les valeurs anglaises en françaises pour l'API
      themeFr = theme === 'dark' ? 'sombre' : 'clair';

    }

    try {
      // Utiliser l'endpoint spécifique pour la mise à jour du thème
      const response = await fetch(`${API_URL}/users/theme`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme: themeFr }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || 'Erreur lors de la mise à jour du thème');
      }

      const data = await response.json();

      return data;
    } catch (error) {

      throw error;
    }
  },

  /**
   * Récupérer le profil d'un utilisateur par son identifiant
   * @param {String} id - L'identifiant de l'utilisateur
   * @returns {Promise} Promesse avec les données du profil
   */
  async getUserProfileById(id) {

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await fetch(`${API_URL}/users/profile/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || 'Erreur lors de la récupération du profil utilisateur');
      }

      const rawData = await response.json();

      
      // Vérifier la structure des données retournées
      let userData;
      if (rawData.data) {
        // Si les données sont encapsulées dans un objet 'data'
        userData = rawData.data;

      } else {
        // Si les données sont directement dans la réponse
        userData = rawData;

      }
      
      // Vérifier si les données sont dans un sous-objet 'user'
      if (userData && userData.user && userData.user.profilePicture) {

        userData.profilePicture = userData.user.profilePicture;
      } else if (userData && (!userData.profilePicture || userData.profilePicture === '' || userData.profilePicture === null || userData.profilePicture === undefined)) {

        userData.profilePicture = 'default.jpg';
      }
      
      return userData;
    } catch (error) {

      throw error;
    }
  }
};

export default userService;
