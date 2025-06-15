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
      const response = await fetch(`${API_URL}/workspaces`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Non autorisé: la session peut être invalide ou expirée');
          return [];
        }
        throw new Error(`Erreur lors de la récupération des workspaces: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.status === 'success') {
        const workspaces = data.data && data.data.workspaces ? data.data.workspaces : [];
        
        return workspaces.map(workspace => ({
          _id: workspace._id || workspace.id,
          nom: workspace.nom || workspace.name || 'Sans nom',
        }));
      }
      
      return [];
    } catch (error) {
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
      const response = await fetch(`${API_URL}/workspaces/${id}`, {
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
        throw new Error(`Erreur lors de la récupération du workspace: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Rechercher des workspaces publics
   * @param {String} query - Terme de recherche
   * @returns {Promise} Promesse avec la liste des workspaces correspondants
   */
  async searchPublicWorkspaces(query = '') {
    try {
      const response = await fetch(`${API_URL}/workspaces/recherche/public?query=${encodeURIComponent(query)}`, {
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
        throw new Error(`Erreur lors de la recherche de workspaces: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.status === 'success') {
        return data.data.workspaces || [];
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche de workspaces:', error);
      return [];
    }
  },

  /**
   * Créer un nouveau workspace
   * @param {Object} workspaceData - Données du workspace à créer
   * @returns {Promise} Promesse avec les données du workspace créé
   */
  async createWorkspace(workspaceData) {
    try {
      const response = await fetch(`${API_URL}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(workspaceData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de la création du workspace: ${response.status}`);
      }

      const data = await response.json();
      return data.data.workspace;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Mettre à jour le statut (public/privé) d'un workspace
   * @param {String} id - ID du workspace
   * @param {Boolean} isPublic - True pour rendre le workspace public, false pour le rendre privé
   * @returns {Promise} Promesse avec les données du workspace mis à jour
   */
  async updateWorkspaceStatus(id, isPublic) {
    try {
      const response = await fetch(`${API_URL}/workspaces/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          visibilite: isPublic ? 'public' : 'prive'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de la mise à jour du workspace: ${response.status}`);
      }

      const data = await response.json();
      return data.data.workspace;
    } catch (error) {
      throw error;
    }
  },
  
  async getUserId() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.data?.user?.id || data.data?.user?._id || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      return null;
    }
  },
  
  /**
   * Vérifier une invitation à un workspace
   * @param {String} workspaceId - ID du workspace
   * @param {String} token - Token d'invitation
   * @returns {Promise} Promesse avec les informations de l'invitation
   */
  async verifyInvitation(workspaceId, token) {
    try {
      const response = await fetch(`${API_URL}/workspaces/invitation/${workspaceId}/${token}/verifier`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de la vérification de l'invitation: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Accepter une invitation à un workspace
   * @param {String} workspaceId - ID du workspace
   * @param {String} token - Token d'invitation
   * @returns {Promise} Promesse avec les informations du workspace rejoint
   */
  async acceptInvitation(workspaceId, token) {
    try {
      const response = await fetch(`${API_URL}/workspaces/invitation/${workspaceId}/${token}/accepter`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de l'acceptation de l'invitation: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }
};

export default workspaceService;
