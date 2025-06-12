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
    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'

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

      // Le token est géré par cookie HTTP-only
      // La déconnexion sera gérée par le serveur qui invalidera le cookie
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

    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'

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
    console.log('userService.updateProfile - Données envoyées:', profileData);

    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'

    try {
      // Vérification des données requises
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

      console.log('userService.updateProfile - Statut de la réponse:', response.status);
      
      // Récupérer les données de la réponse même en cas d'erreur
      const responseData = await response.json().catch(e => {
        console.error('Erreur lors du parsing JSON:', e);
        return { error: 'Format de réponse invalide' };
      });
      
      console.log('userService.updateProfile - Réponse du serveur:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Erreur lors de la mise à jour du profil';
        console.error('userService.updateProfile - Erreur:', errorMessage);
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
    console.log('userService.updatePassword - Tentative de mise à jour du mot de passe');

    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'

    try {
      // Vérification des données requises
      if (!passwordData || !passwordData.oldPassword || !passwordData.newPassword) {
        console.error('userService.updatePassword - Données manquantes');
        throw new Error('Les données du mot de passe sont incomplètes');
      }

      console.log('userService.updatePassword - Envoi de la requête avec les données convert format');
      
      const response = await fetch(`${API_URL}/users/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        // Format correct selon la documentation de l'API
        body: JSON.stringify({
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: 'include'
      });

      console.log('userService.updatePassword - Statut de la réponse:', response.status);
      
      // Récupérer les données de la réponse même en cas d'erreur
      const responseData = await response.json().catch(e => {
        console.error('Erreur lors du parsing JSON:', e);
        return { error: 'Format de réponse invalide' };
      });
      
      console.log('userService.updatePassword - Réponse du serveur:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Erreur lors du changement de mot de passe';
        console.error('userService.updatePassword - Erreur:', errorMessage);
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

    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'
    
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

    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'
    
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

    // Avec les cookies HTTP-only, pas besoin de vérifier le token manuellement
    // Le cookie sera automatiquement envoyé avec credentials: 'include'

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
