// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

/**
 * Service de gestion des canaux
 */
const canalService = {
  /**
   * Récupérer tous les canaux d'un workspace
   * @param {String} workspaceId - ID du workspace
   * @returns {Promise} Promesse avec la liste des canaux
   */
  async getWorkspaceCanaux(workspaceId) {
    try {
      // Récupérer le token dans le localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux canaux');
      }
      
      // Appeler l'API pour récupérer les canaux du workspace
      const response = await fetch(`${API_URL}/workspaces/${workspaceId}/canaux`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur lors de la récupération des canaux: ${response.status}`);
      }

      const data = await response.json();
      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.status === 'success') {
        return data.data.canaux;
      }
      
      return [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des canaux du workspace ${workspaceId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer un canal par son ID
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @returns {Promise} Promesse avec les données du canal
   */
  async getCanalById(workspaceId, canalId) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux canaux');
      }
      
      const response = await fetch(`${API_URL}/workspaces/${workspaceId}/canaux/${canalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur lors de la récupération du canal: ${response.status}`);
      }

      const data = await response.json();
      return data.data.canal;
    } catch (error) {
      console.error(`Erreur lors de la récupération du canal ${canalId}:`, error);
      throw error;
    }
  }
};

export default canalService;
