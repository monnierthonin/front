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
   * @param {string} role - Nouveau rôle (admin ou user)
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async updateUserRole(userId, role) {
    try {
      // Utilisation de l'endpoint spécifique pour la promotion
      const response = await tryMultiplePaths(`utilisateurs/${userId}/promouvoir`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
      
      console.log(`Rôle mis à jour avec succès pour l'utilisateur ${userId}:`, response);
      return response;
    } catch (error) {
      console.error(`Échec de la mise à jour du rôle pour l'utilisateur ${userId}:`, error);
      throw error;
    }
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
    try {
      console.log(`Tentative de suppression de l'utilisateur avec ID: ${userId}`);
      const url = `${API_URL}${currentAdminPath}utilisateurs/${userId}`;
      console.log(`URL de suppression: ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.status} ${response.statusText}`);
      }
      
      // Si la réponse est vide (204 No Content), on retourne un objet avec statut success
      if (response.status === 204) {
        return { status: 'success', message: 'Utilisateur supprimé avec succès' };
      }
      
      // Sinon on tente de parser le JSON
      try {
        return await response.json();
      } catch (e) {
        // Si pas de JSON, on retourne un succès par défaut
        return { status: 'success', message: 'Utilisateur supprimé' };
      }
    } catch (error) {
      console.error(`Échec de la suppression de l'utilisateur ${userId}:`, error);
      throw error;
    }
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
    try {
      console.log(`Récupération du workspace ${workspaceId} pour obtenir ses membres`);
      // Utiliser directement l'endpoint utilisateur standard /api/v1/workspaces/{id}
      const url = `${API_URL}/workspaces/${workspaceId}`;
      console.log(`URL utilisée: ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du workspace: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Réponse du workspace:', data);
      
      if (!data || !data.data) {
        console.warn('Pas de données de workspace disponibles');
        return [];
      }
      
      // Extraire les informations du workspace
      // La structure est data.data.workspace selon les logs
      const workspace = data.data.workspace || data.data;
      
      // Chercher les membres dans différentes propriétés possibles
      const members = workspace.membres || workspace.members || workspace.users || [];
      console.log(`Membres bruts trouvés:`, members);
      
      if (!members || !Array.isArray(members) || members.length === 0) {
        return [];
      }
      
      console.log('Structure d\'un membre:', members[0]);
      
      // Format spécifique de l'API: {utilisateur: {...}, role: '...'}
      return members.map(member => {
        // Récupérer les infos de l'utilisateur, qui peut être soit un objet complet, soit juste un ID
        const userInfo = member.utilisateur || {};
        
        return {
          id: userInfo._id || userInfo.id || member._id || member.id,
          username: userInfo.username || userInfo.nom || userInfo.email || 'Utilisateur sans nom',
          profileImage: userInfo.profilePicture || userInfo.avatar || userInfo.profileImage || '../../assets/styles/image/profilDelault.png',
          role: member.role || 'membre'
        };
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des membres du workspace ${workspaceId}:`, error);
      return [];
    }
  },
  
  /**
   * Récupère les canaux d'un workspace
   * @param {string} workspaceId - ID du workspace
   * @returns {Promise<Array>} - Liste des canaux
   */
  async getWorkspaceChannels(workspaceId) {
    try {
      console.log(`Récupération des canaux du workspace ${workspaceId}`);
      // Utiliser l'endpoint admin pour les canaux
      const url = `${API_URL}${currentAdminPath}workspaces/${workspaceId}/canaux`;
      console.log(`URL utilisée: ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des canaux: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Réponse des canaux:', data);
      
      if (!data || !data.status === 'success' || !data.data) {
        console.warn('Pas de données de canaux disponibles');
        return [];
      }
      
      // Extraire les informations des canaux
      const channels = Array.isArray(data.data) ? data.data : 
                      (data.data.canaux || data.data.channels || Object.values(data.data));
      
      console.log(`Canaux bruts trouvés:`, channels);
      
      // Normaliser les canaux
      return channels.map(channel => ({
        ...channel,
        id: channel._id || channel.id,
        name: channel.nom || channel.name || 'Canal sans nom',
        type: channel.type || channel.visibility || 'public'
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des canaux du workspace ${workspaceId}:`, error);
      return [];
    }
  },
  
  /**
   * Supprime un workspace
   * @param {string} workspaceId - ID du workspace
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async deleteWorkspace(workspaceId) {
    try {
      console.log(`Tentative de suppression du workspace avec ID: ${workspaceId}`);
      const url = `${API_URL}${currentAdminPath}workspaces/${workspaceId}`;
      console.log(`URL de suppression: ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.status} ${response.statusText}`);
      }
      
      // Si la réponse est vide (204 No Content), on retourne un objet avec statut success
      if (response.status === 204) {
        return { status: 'success', message: 'Workspace supprimé avec succès' };
      }
      
      // Sinon on tente de parser le JSON
      try {
        return await response.json();
      } catch (e) {
        // Si pas de JSON, on retourne un succès par défaut
        return { status: 'success', message: 'Workspace supprimé' };
      }
    } catch (error) {
      console.error(`Échec de la suppression du workspace ${workspaceId}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un canal
   * @param {string} channelId - ID du canal
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async deleteChannel(channelId) {
    try {
      console.log(`Tentative de suppression du canal avec ID: ${channelId}`);
      const url = `${API_URL}${currentAdminPath}canaux/${channelId}`;
      console.log(`URL de suppression: ${url}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression du canal: ${response.status} ${response.statusText}`);
      }
      
      // Si la réponse est vide (204 No Content), on retourne un objet avec statut success
      if (response.status === 204) {
        return { status: 'success', message: 'Canal supprimé avec succès' };
      }
      
      // Sinon on tente de parser le JSON
      try {
        return await response.json();
      } catch (e) {
        // Si pas de JSON, on retourne un succès par défaut
        return { status: 'success', message: 'Canal supprimé' };
      }
    } catch (error) {
      console.error(`Échec de la suppression du canal ${channelId}:`, error);
      throw error;
    }
  }
};

export default adminService;
