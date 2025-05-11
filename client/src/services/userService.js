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
        console.log('Erreur détaillée:', data);
        throw new Error(data.message || (data.error ? `Erreur: ${data.error}` : 'Erreur lors de la suppression du compte'));
      }

      // Supprimer le token après la suppression réussie
      localStorage.removeItem('token');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw error;
    }
  },
  /**
   * Récupérer le profil de l'utilisateur connecté
   * @returns {Promise} Promesse avec les données du profil
   */
  async getProfile() {
    console.log('Tentative de récupération du profil utilisateur');
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
        console.log('Erreur détaillée:', data);
        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }

      const data = await response.json();
      console.log('Profil récupéré avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le profil de l'utilisateur
   * @param {Object} profileData - Les données du profil à mettre à jour (username, email)
   * @returns {Promise} Promesse avec les données du profil mis à jour
   */
  async updateProfile(profileData) {
    console.log('Tentative de mise à jour du profil:', profileData);
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
        console.log('Erreur détaillée:', data);
        throw new Error(data.message || 'Erreur lors de la mise à jour du profil');
      }

      const data = await response.json();
      console.log('Profil mis à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  },

  /**
   * Changer le mot de passe de l'utilisateur
   * @param {Object} passwordData - Les données du mot de passe (oldPassword, newPassword)
   * @returns {Promise} Promesse avec le résultat du changement de mot de passe
   */
  async updatePassword(passwordData) {
    console.log('Tentative de changement du mot de passe', passwordData);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      // Essayons avec une autre structure pour les données
      console.log('Test avec un autre format de données');
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

      console.log('Réponse du serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Erreur détaillée:', errorData);
        throw new Error(errorData.message || errorData.error || 'Erreur lors du changement de mot de passe');
      }

      const data = await response.json();
      console.log('Mot de passe changé avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  },
  /**
   * Mettre à jour le statut de l'utilisateur
   * @param {String} status - Le nouveau statut ('online', 'offline', 'away')
   * @returns {Promise} Promesse avec le résultat de la mise à jour du statut
   */
  async updateStatus(status) {
    console.log('Tentative de mise à jour du statut:', status);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      // Utiliser l'endpoint spécifique pour la mise à jour du statut
      const response = await fetch(`${API_URL}/users/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        console.log('Erreur détaillée:', data);
        throw new Error(data.message || 'Erreur lors de la mise à jour du statut');
      }

      const data = await response.json();
      console.log('Statut mis à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le thème de l'utilisateur
   * @param {String} theme - Le nouveau thème ('light', 'dark')
   * @returns {Promise} Promesse avec le résultat de la mise à jour du thème
   */
  async updateTheme(theme) {
    console.log('Tentative de mise à jour du thème:', theme);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      // Utiliser l'endpoint spécifique pour la mise à jour du thème
      const response = await fetch(`${API_URL}/users/theme`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        console.log('Erreur détaillée:', data);
        throw new Error(data.message || 'Erreur lors de la mise à jour du thème');
      }

      const data = await response.json();
      console.log('Thème mis à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error);
      throw error;
    }
  }
};

export default userService;
