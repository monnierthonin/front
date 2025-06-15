const API_URL = 'http://localhost:3000/api/v1';

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
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux canaux');
      }
      
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
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour modifier un canal');
      }
      
      const requestData = {
        canal: {
          nom: data.nom
        }
      };
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}`;
      
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
