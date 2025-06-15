const API_URL = 'http://localhost:3000/api/v1';

/**
 * Service de recherche
 */
const searchService = {
  /**
   * Rechercher des utilisateurs dans l'application
   * @param {String} query - Terme de recherche
   * @param {Boolean} all - Récupérer tous les utilisateurs sans filtre
   * @returns {Promise} Promesse avec les résultats de recherche
   */
  async searchUsers(query = '', all = false) {
    try {
      const url = `${API_URL}/search/users?q=${encodeURIComponent(query)}${all ? '&all=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      if (data && data.status === 'success' && data.data && data.data.users) {
        return data.data.users;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      throw error;
    }
  },

  /**
   * Rechercher des workspaces de l'utilisateur
   * @param {String} query - Terme de recherche
   * @returns {Promise} Promesse avec les résultats de recherche
   */
  async searchMyWorkspaces(query = '') {
    try {
      const url = `${API_URL}/search/workspaces?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      if (data && data.status === 'success' && data.data && data.data.workspaces) {
        return data.data.workspaces;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche de workspaces:', error);
      throw error;
    }
  }
};

export default searchService;
