/**
 * Service pour la gestion des fonctionnalités d'administration
 * Gère les appels API pour les fonctionnalités réservées aux administrateurs
 */

// URL de base de l'API
const API_URL = 'http://localhost:3000/api/v1';

// Chemins possibles pour les endpoints d'administration
const ADMIN_PATHS = [
  '/admin/',     // Route confirmée
];

// Chemin actuellement utilisé (sera déterminé dynamiquement)
let currentAdminPath = ADMIN_PATHS[0];

// Options communes pour les requêtes fetch
const defaultOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Tente un appel API avec différents chemins possibles jusqu'à trouver celui qui fonctionne
 * @param {string} endpoint - Endpoint sans le chemin d'admin (ex: 'users')
 * @param {Object} options - Options de la requête fetch
 * @returns {Promise<Object>} - Données de la réponse
 */
const tryMultiplePaths = async (endpoint, options = {}) => {
  console.log(`Tentative d'accès à l'endpoint: ${endpoint}`);
  
  // Si nous avons déjà trouvé un chemin qui fonctionne, utilisons-le d'abord
  if (currentAdminPath) {
    try {
      const url = `${API_URL}${currentAdminPath}${endpoint}`;
      console.log(`Essai avec le chemin connu: ${url}`);
      const response = await fetch(url, {
        ...defaultOptions,
        ...options
      });
      
      if (response.ok) {
        console.log(`Succès avec: ${url}`);
        return await response.json();
      }
    } catch (error) {
      console.warn(`Échec avec le chemin connu: ${currentAdminPath}`, error);
    }
  }
  
  // Essayer tous les chemins possibles
  for (const path of ADMIN_PATHS) {
    if (path === currentAdminPath) continue; // Déjà essayé
    
    try {
      const url = `${API_URL}${path}${endpoint}`;
      console.log(`Essai avec: ${url}`);
      const response = await fetch(url, {
        ...defaultOptions,
        ...options
      });
      
      if (response.ok) {
        console.log(`Succès avec: ${url}`);
        currentAdminPath = path; // Mémoriser le chemin qui fonctionne
        return await response.json();
      }
    } catch (error) {
      console.warn(`Échec avec: ${path}`, error);
    }
  }
  
  throw new Error(`Aucun endpoint trouvé pour: ${endpoint}`);
};

/**
 * Effectue un appel API et vérifie la réponse
 * @param {string} url - URL complète de l'endpoint
 * @param {Object} options - Options de la requête fetch
 * @returns {Promise<Object>} - Données de la réponse
 */
const apiCall = async (url, options = {}) => {
  const response = await fetch(url, {
    ...defaultOptions,
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

const adminService = {
  /**
   * Récupère la liste des utilisateurs
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async getUsers() {
    try {
      const response = await tryMultiplePaths('utilisateurs', { method: 'GET' });
      console.log('Réponse API utilisateurs:', response);
      
      // Format de réponse: {status: 'success', resultats: 20, data: {...}}
      if (response && response.status === 'success') {
        // Vérifier si data est un objet ou un tableau
        const usersData = response.data;
        
        // Si c'est un objet avec une propriété utilisateurs
        if (usersData && typeof usersData === 'object') {
          const users = Array.isArray(usersData) ? usersData : 
                       (usersData.utilisateurs || Object.values(usersData));
          
          return users.map(user => ({
            ...user,
            id: user._id || user.id,
            profileImage: user.profilePicture || '../../assets/styles/image/profilDelault.png'
          }));
        }
      }
      
      throw new Error('Format de réponse inattendu');
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour le rôle d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} role - Nouveau rôle
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async updateUserRole(userId, role) {
    return await tryMultiplePaths(`utilisateurs/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },
  
  /**
   * Récupère les workspaces d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des workspaces
   */
  async getUserWorkspaces(userId) {
    const response = await tryMultiplePaths(`utilisateurs/${userId}/workspaces`, { method: 'GET' });
    
    if (response && response.status === 'success') {
      return Array.isArray(response.data) ? response.data : 
             (response.data && typeof response.data === 'object' ? Object.values(response.data) : []);
    }
    
    return [];
  },
  
  /**
   * Récupère les messages d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des messages
   */
  async getUserMessages(userId) {
    const response = await tryMultiplePaths(`utilisateurs/${userId}/messages`, { method: 'GET' });
    
    if (response && response.status === 'success') {
      return Array.isArray(response.data) ? response.data : 
             (response.data && typeof response.data === 'object' ? Object.values(response.data) : []);
    }
    
    return [];
  },
  
  /**
   * Supprime un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async deleteUser(userId) {
    return await tryMultiplePaths(`utilisateurs/${userId}`, { method: 'DELETE' });
  },
  
  /**
   * Récupère la liste des workspaces
   * @returns {Promise<Array>} Liste des workspaces
   */
  async getWorkspaces() {
    try {
      const response = await tryMultiplePaths('workspaces', { method: 'GET' });
      console.log('Réponse API workspaces:', response);
      
      // Format de réponse: {status: 'success', resultats: 8, data: {...}}
      if (response && response.status === 'success') {
        // Vérifier si data est un objet ou un tableau
        const workspacesData = response.data;
        
        // Si c'est un objet avec des workspaces
        if (workspacesData && typeof workspacesData === 'object') {
          const workspaces = Array.isArray(workspacesData) ? workspacesData : 
                           (workspacesData.workspaces || Object.values(workspacesData));
          
          return workspaces.map(workspace => ({
            ...workspace,
            id: workspace._id || workspace.id,
            name: workspace.nom || workspace.name // Gérer les différences de nommage
          }));
        }
      }
      
      throw new Error('Format de réponse inattendu');
    } catch (error) {
      console.error('Erreur lors de la récupération des workspaces:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les utilisateurs d'un workspace
   * @param {string} workspaceId - ID du workspace
   * @returns {Promise<Array>} - Liste des utilisateurs
   */
  async getWorkspaceUsers(workspaceId) {
    const response = await tryMultiplePaths(`workspaces/${workspaceId}/utilisateurs`, { method: 'GET' });
    
    if (response && response.status === 'success') {
      return Array.isArray(response.data) ? response.data : 
             (response.data && typeof response.data === 'object' ? Object.values(response.data) : []);
    }
    
    return [];
  },
  
  /**
   * Récupère les canaux d'un workspace
   * @param {string} workspaceId - ID du workspace
   * @returns {Promise<Array>} - Liste des canaux
   */
  async getWorkspaceChannels(workspaceId) {
    const response = await tryMultiplePaths(`workspaces/${workspaceId}/canaux`, { method: 'GET' });
    
    if (response && response.status === 'success') {
      return Array.isArray(response.data) ? response.data : 
             (response.data && typeof response.data === 'object' ? Object.values(response.data) : []);
    }
    
    return [];
  },
  
  /**
   * Supprime un workspace
   * @param {string} workspaceId - ID du workspace
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async deleteWorkspace(workspaceId) {
    return await tryMultiplePaths(`workspaces/${workspaceId}`, { method: 'DELETE' });
  }
};

export default adminService;
