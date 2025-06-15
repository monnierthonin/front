/**
 * Service pour la gestion des fonctionnalités d'administration
 * Gère les appels API pour les fonctionnalités réservées aux administrateurs
 */

const API_URL = 'http://localhost:3000/api/v1';

const ADMIN_PATHS = [
  '/admin/',
];

let currentAdminPath = ADMIN_PATHS[0];
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
  
  if (currentAdminPath) {
    try {
      const url = `${API_URL}${currentAdminPath}${endpoint}`;
      const response = await fetch(url, {
        ...defaultOptions,
        ...options
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Échec avec le chemin connu: ${currentAdminPath}`, error);
    }
  }
  
  for (const path of ADMIN_PATHS) {
    if (path === currentAdminPath) continue;
    
    try {
      const url = `${API_URL}${path}${endpoint}`;
      const response = await fetch(url, {
        ...defaultOptions,
        ...options
      });
      
      if (response.ok) {
        currentAdminPath = path;
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
      
      if (response && response.status === 'success') {
        const usersData = response.data;
        
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
      const response = await tryMultiplePaths(`utilisateurs/${userId}/promouvoir`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
      
      return response;
    } catch (error) {
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
      const url = `${API_URL}${currentAdminPath}utilisateurs/${userId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) {
        return { status: 'success', message: 'Utilisateur supprimé avec succès' };
      }
      
      try {
        return await response.json();
      } catch (e) {
        return { status: 'success', message: 'Utilisateur supprimé' };
      }
    } catch (error) {
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
      
      if (response && response.status === 'success') {
        const workspacesData = response.data;
        
        if (workspacesData && typeof workspacesData === 'object') {
          const workspaces = Array.isArray(workspacesData) ? workspacesData : 
                           (workspacesData.workspaces || Object.values(workspacesData));
          
          return workspaces.map(workspace => ({
            ...workspace,
            id: workspace._id || workspace.id,
            name: workspace.nom || workspace.name
          }));
        }
      }
      
      throw new Error('Format de réponse inattendu');
    } catch (error) {
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
      const url = `${API_URL}/workspaces/${workspaceId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du workspace: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.data) {
        console.warn('Pas de données de workspace disponibles');
        return [];
      }
      
      const workspace = data.data.workspace || data.data;
      
      const members = workspace.membres || workspace.members || workspace.users || [];
      
      if (!members || !Array.isArray(members) || members.length === 0) {
        return [];
      }
      
      return members.map(member => {
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
      const url = `${API_URL}${currentAdminPath}workspaces/${workspaceId}/canaux`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des canaux: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.status === 'success' || !data.data) {
        return [];
      }
      
      const channels = Array.isArray(data.data) ? data.data : 
                      (data.data.canaux || data.data.channels || Object.values(data.data));
      
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
      const url = `${API_URL}${currentAdminPath}workspaces/${workspaceId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) {
        return { status: 'success', message: 'Workspace supprimé avec succès' };
      }
      
      try {
        return await response.json();
      } catch (e) {
        return { status: 'success', message: 'Workspace supprimé' };
      }
    } catch (error) {
      console.error(`Échec de la suppression du workspace ${workspaceId}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un canal
   * @param {string} workspaceId - ID du workspace
   * @param {string} channelId - ID du canal
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async deleteChannel(workspaceId, channelId) {
    try {
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${channelId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression du canal: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) {
        return { status: 'success', message: 'Canal supprimé avec succès' };
      }
      
      try {
        return await response.json();
      } catch (e) {
        return { status: 'success', message: 'Canal supprimé' };
      }
    } catch (error) {
      console.error(`Échec de la suppression du canal ${channelId}:`, error);
      throw error;
    }
  },
  
  /**
   * Met à jour un canal
   * @param {string} channelId - ID du canal
   * @param {Object} channelData - Données du canal à mettre à jour
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async updateChannel(channelId, channelData) {
    try {
      const url = `${API_URL}${currentAdminPath}canaux/${channelId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'PATCH',
        headers: {
          ...defaultOptions.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(channelData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour du canal: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) {
        return { 
          status: 'success', 
          message: 'Canal mis à jour avec succès', 
          id: channelId,
          nom: channelData.nom,
          name: channelData.nom
        };
      }
      
      try {
        const responseData = await response.json();
        return {
          ...responseData,
          status: 'success',
          id: responseData._id || responseData.id || channelId,
          name: responseData.nom || responseData.name || channelData.nom || 'Canal sans nom',
          nom: responseData.nom || responseData.name || channelData.nom || 'Canal sans nom',
          type: responseData.type || responseData.visibility || 'public'
        };
      } catch (e) {
        return { 
          status: 'success', 
          message: 'Canal mis à jour avec succès',
          id: channelId,
          nom: channelData.nom,
          name: channelData.nom
        };
      }
    } catch (error) {
      console.error(`Échec de la mise à jour du canal ${channelId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les messages d'un canal
   * @param {string} workspaceId - ID du workspace
   * @param {string} channelId - ID du canal
   * @returns {Promise<Array>} - Liste des messages
   */
  async getChannelMessages(workspaceId, channelId) {
    try {
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${channelId}/messages`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des messages: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.status === 'success' || !data.data) {
        console.warn('Pas de données de messages disponibles');
        return [];
      }
      
      const messages = Array.isArray(data.data) ? data.data : 
                      (data.data.messages || Object.values(data.data));
      
      return messages.map(message => ({
        ...message,
        id: message._id || message.id,
        content: message.content || message.contenu || '',
        sender: message.sender || message.user || {},
        createdAt: message.createdAt || message.date || new Date().toISOString()
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des messages du canal ${channelId}:`, error);
      return [];
    }
  },
  
  /**
   * Supprime un message
   * @param {string} messageId - ID du message
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async deleteMessage(messageId) {
    try {
      const url = `${API_URL}${currentAdminPath}messages/${messageId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression du message: ${response.status} ${response.statusText}`);
      }
      
      if (response.status === 204) {
        return { status: 'success', message: 'Message supprimé avec succès' };
      }
      
      try {
        return await response.json();
      } catch (e) {
        return { status: 'success', message: 'Message supprimé' };
      }
    } catch (error) {
      console.error(`Échec de la suppression du message ${messageId}:`, error);
      throw error;
    }
  },

  /**
   * Met à jour les informations d'un workspace
   * @param {string} workspaceId - ID du workspace
   * @param {Object} workspaceData - Données du workspace à mettre à jour
   * @returns {Promise<Object>} - Réponse de l'API
   */
  async updateWorkspace(workspaceId, workspaceData) {
    try {
      const url = `${API_URL}${currentAdminPath}workspaces/${workspaceId}`;
      
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'PATCH',
        body: JSON.stringify(workspaceData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la mise à jour du workspace: ${response.status} ${response.statusText}`);
      }
      
      try {
        const responseData = await response.json();
        
        return {
          status: 'success',
          id: responseData._id || responseData.id || workspaceId,
          name: responseData.name || workspaceData.name || 'Workspace sans nom',
          description: responseData.description || workspaceData.description || '',
          visibility: responseData.visibility || workspaceData.visibility || 'public'
        };
      } catch (e) {
        return { 
          status: 'success', 
          message: 'Workspace mis à jour avec succès',
          id: workspaceId,
          name: workspaceData.name,
          description: workspaceData.description,
          visibility: workspaceData.visibility
        };
      }
    } catch (error) {
      console.error(`Échec de la mise à jour du workspace ${workspaceId}:`, error);
      throw error;
    }
  }
};

export default adminService;
