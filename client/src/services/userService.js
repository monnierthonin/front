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
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || (data.error ? `Erreur: ${data.error}` : 'Erreur lors de la suppression du compte'));
      }
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

    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
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
    try {
      if (!profileData || (Object.keys(profileData).length === 0)) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });

      const responseData = await response.json().catch(e => {
        console.error('Erreur lors du parsing JSON:', e);
        return { error: 'Format de réponse invalide' };
      });

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Erreur lors de la mise à jour du profil';
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error('userService.updateProfile - Exception:', error.message);
      throw error;
    }
  },

  /**
   * Changer le mot de passe de l'utilisateur
   * @param {Object} passwordData - Les données du mot de passe (oldPassword, newPassword)
   * @returns {Promise} Promesse avec le résultat du changement de mot de passe
   */
  async updatePassword(passwordData) {
    try {
      if (!passwordData || !passwordData.oldPassword || !passwordData.newPassword) {
        throw new Error('Les données du mot de passe sont incomplètes');
      }
      
      const response = await fetch(`${API_URL}/users/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: 'include'
      });

      const responseData = await response.json().catch(e => {
        console.error('Erreur lors du parsing JSON:', e);
        return { error: 'Format de réponse invalide' };
      });
      
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Erreur lors du changement de mot de passe';
        throw new Error(errorMessage);
      }
      
      return responseData;
    } catch (error) {
      console.error('userService.updatePassword - Exception:', error.message);
      throw error;
    }
  },
  
  /**
   * Mettre à jour le statut de l'utilisateur
   * @param {String} status - Le nouveau statut ('online', 'offline', 'away')
   * @returns {Promise} Promesse avec le résultat de la mise à jour du statut
   */
  async updateStatus(status) {
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
      const response = await fetch(`${API_URL}/users/status`, {
        method: 'PUT',
        headers: {
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
    
    let themeFr;
    if (theme === 'sombre' || theme === 'clair') {
      themeFr = theme;
    } else {
      themeFr = theme === 'dark' ? 'sombre' : 'clair';
    }

    try {
      const response = await fetch(`${API_URL}/users/theme`, {
        method: 'PUT',
        headers: {
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
    try {
      const response = await fetch(`${API_URL}/users/profile/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.message || 'Erreur lors de la récupération du profil utilisateur');
      }

      const rawData = await response.json();

      
      let userData;
      if (rawData.data) {
        userData = rawData.data;

      } else {
        userData = rawData;

      }
      
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
