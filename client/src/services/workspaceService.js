// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

/**
 * Service de gestion des workspaces
 */
const workspaceService = {
  /**
   * Récupérer tous les workspaces de l'utilisate ur
   * @returns {Promise} Promesse avec la liste des workspaces
   */
  async getUserWorkspaces() {
    try {
      // Récupérer le token dans le localStorage (s'il existe)
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('Aucun token d\'authentification trouvé, utilisation des workspaces par défaut');
        return [];
      }
      
      // Appeler l'API pour récupérer les workspaces dont l'utilisateur est membre
      // Utiliser l'endpoint /mes-workspaces au lieu de /workspaces
      const response = await fetch(`${API_URL}/workspaces/mes-workspaces`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Non autorisé: le token peut être invalide ou expiré');
          // Supprimer le token invalide
          localStorage.removeItem('token');
          return [];
        }
        throw new Error(`Erreur lors de la récupération des workspaces: ${response.status}`);
      }

      const data = await response.json();
      console.log('Données reçues de l\'API (mes-workspaces):', data);
      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.status === 'success') {
        // Récupérer les workspaces depuis data.workspaces (nouvelle structure)
        const workspaces = data.data && data.data.workspaces ? data.data.workspaces : [];
        console.log('Nombre de workspaces récupérés:', workspaces.length);
        
        return workspaces.map(workspace => ({
          _id: workspace._id || workspace.id,
          nom: workspace.nom || workspace.name || 'Sans nom',
          // Ajouter d'autres propriétés si nécessaire pour l'affichage
        }));
      }
      
      // Si les données ne sont pas au format attendu, retourner un tableau vide
      return [];
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
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux workspaces');
      }
      
      const response = await fetch(`${API_URL}/workspaces/${id}`, {
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
        throw new Error(`Erreur lors de la récupération du workspace: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du workspace ${id}:`, error);
      throw error;
    }
  },
  
  // Extraire l'ID utilisateur à partir du token JWT
  getUserIdFromToken(token) {
    try {
      if (!token) return null;
      
      // Décoder le payload du JWT (partie du milieu entre les points)
      const payload = token.split('.')[1];
      if (!payload) return null;
      
      // Décoder de base64 et parser le JSON
      const decoded = JSON.parse(atob(payload));
      console.log('Token décodé:', decoded);
      
      // Retourner l'ID utilisateur (peut être dans id, _id, ou userId selon votre implémentation)
      return decoded.id || decoded._id || decoded.userId || null;
    } catch (error) {
      console.error('Erreur lors du décodage du token JWT:', error);
      return null;
    }
  }
};

export default workspaceService;
