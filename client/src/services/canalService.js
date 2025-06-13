// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

// Import du service d'authentification
import authService from './authService';

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
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux canaux');
      }
      
      // Appeler l'API pour récupérer les canaux du workspace
      const response = await fetch(`${API_URL}/workspaces/${workspaceId}/canaux`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
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
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux canaux');
      }
      
      const response = await fetch(`${API_URL}/workspaces/${workspaceId}/canaux/${canalId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur lors de la récupération du canal: ${response.status}`);
      }

      const data = await response.json();
      return data.data.canal;
    } catch (error) {

      throw error;
    }
  },
  /**
   * Mettre à jour le nom d'un canal
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {Object} data - Données à mettre à jour (nom)
   * @returns {Promise} Promesse avec le canal mis à jour
   */
  async updateCanalName(workspaceId, canalId, data) {
    try {
      // Vérifier l'authentification
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour modifier un canal');
      }
      
      // Structurer les données selon les attentes probables de l'API
      // Essayons différentes structures possibles
      const requestData = {
        canal: {
          nom: data.nom
        }
      };
      
      console.log(`Mise à jour du canal ${canalId} dans le workspace ${workspaceId} avec:`, requestData);
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}`;
      console.log(`URL de mise à jour: ${url}`);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur lors de la mise à jour du canal: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Réponse mise à jour canal:', responseData);
      
      if (responseData && responseData.status === 'success') {
        return responseData.data.canal;
      }
      
      throw new Error('Format de réponse inattendu');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du canal:', error);
      throw error;
    }
  }
};

export default canalService;
