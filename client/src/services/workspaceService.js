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
      // Appeler l'API pour récupérer les workspaces dont l'utilisateur est membre
      // Le cookie HTTP-only sera automatiquement inclus avec credentials: 'include'
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
      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.status === 'success') {
        // Récupérer les workspaces depuis data.workspaces (nouvelle structure)
        const workspaces = data.data && data.data.workspaces ? data.data.workspaces : [];
        
        return workspaces.map(workspace => ({
          _id: workspace._id || workspace.id,
          nom: workspace.nom || workspace.name || 'Sans nom',
          // Ajouter d'autres propriétés si nécessaire pour l'affichage
        }));
      }
      
      // Si les données ne sont pas au format attendu, retourner un tableau vide
      return [];
    } catch (error) {
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
      // Utiliser l'endpoint de recherche des workspaces publics
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
      // Appel à l'API pour mettre à jour le statut du workspace
      // Utiliser le champ 'visibilite' au lieu de 'estPublic'
      const response = await fetch(`${API_URL}/workspaces/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          visibilite: isPublic ? 'public' : 'prive' // Valeur correcte attendue par l'API
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
  
  // Récupérer l'ID utilisateur via l'API au lieu de décoder le token
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
  }
};

export default workspaceService;
