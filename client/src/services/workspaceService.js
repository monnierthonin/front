// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

/**
 * Service de gestion des workspaces
 */
const workspaceService = {
  /**
   * Récupérer tous les workspaces de l'utilisateur
   * @returns {Promise} Promesse avec la liste des workspaces
   */
  async getUserWorkspaces() {
    try {
      // Récupérer le token dans le localStorage (s'il existe)
      const token = localStorage.getItem('token');
      
      // Appeler l'API pour récupérer les workspaces
      // La route est simplement /workspaces qui retourne les workspaces accessibles à l'utilisateur
      const response = await fetch(`${API_URL}/workspaces`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Si non autorisé, on retourne un tableau vide
          return [];
        }
        throw new Error('Erreur lors de la récupération des workspaces');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des workspaces:', error);
      // En cas d'erreur, on retourne un tableau vide
      return [];
    }
  },

  /**
   * Récupérer un workspace par son ID
   * @param {String} id - ID du workspace
   * @returns {Promise} Promesse avec les données du workspace
   */
  async getWorkspaceById(id) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/workspaces/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du workspace');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du workspace ${id}:`, error);
      throw error;
    }
  }
};

export default workspaceService;
