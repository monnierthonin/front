const API_URL = 'http://localhost:3000/api/v1';

import authService from './authService';

/**
 * Service de gestion des messages
 */
const messageService = {
  /**
   * Récupérer tous les messages d'un canal
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {Number} page - Numéro de page (pagination)
   * @param {Number} limit - Nombre de messages par page
   * @returns {Promise} Promesse avec la liste des messages
   */
  async getCanalMessages(workspaceId, canalId, page = 1, limit = 50) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour récupérer les messages');
      }
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
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
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      let messages = [];
      if (data && data.status === 'success' && data.data && data.data.messages) {
        messages = data.data.messages;
      } else if (data && Array.isArray(data)) {
        messages = data;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        messages = data.messages;
      }
      
      return messages;
    } catch (error) {
      console.error('Erreur dans getCanalMessages:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message dans un canal
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {String} contenu - Contenu du message
   * @returns {Promise} Promesse avec les données du message créé
   */
  async sendMessage(workspaceId, canalId, contenu) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages`;
      
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      let message;
      if (data && data.data && data.data.message) {
        message = data.data.message;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && typeof data === 'object') {
        message = {
          _id: data._id || data.id || Date.now().toString(),
          contenu: contenu,
          utilisateur: { _id: await this.getUserIdFromToken() },
          dateCreation: data.dateCreation || data.date || new Date().toISOString(),
          ...data
        };
      }
      
      return message;
      
      return {
        _id: Date.now().toString(),
        contenu: contenu,
        utilisateur: { _id: this.getUserIdFromToken() },
        dateCreation: new Date().toISOString(),
        temporaire: true
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtenir l'ID utilisateur à partir d'une API puisque nous ne pouvons plus accéder au token JWT
   * @returns {Promise<String|null>} ID de l'utilisateur connecté ou null
   */
  async getUserIdFromToken() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.userId || data.id || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      return null;
    }
  },

  /**
   * Modifier un message existant
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {String} messageId - ID du message à modifier
   * @param {String} contenu - Nouveau contenu du message
   * @returns {Promise} Promesse avec les données du message modifié
   */
  async updateMessage(workspaceId, canalId, messageId, contenu) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour modifier un message');
      }
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`;
      
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      let message;
      if (data && data.data && data.data.message) {
        message = data.data.message;
      } else if (data && data.message) {
        message = data.message;
      } else {
        message = data;
      }
      return message;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Supprimer un message
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {String} messageId - ID du message à supprimer
   * @returns {Promise} Promesse avec le résultat de la suppression
   */
  async deleteMessage(workspaceId, canalId, messageId) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour supprimer un message');
      }
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      let result = { success: true };
      try {
        const responseText = await response.text();
        if (responseText && responseText.length > 0) {
          try {
            const data = JSON.parse(responseText);
            result = data || { success: true };
          } catch (parseError) {
            console.log('Pas de corps JSON dans la réponse de suppression');
          }
        }
      } catch (readError) {
        console.log('Pas de corps dans la réponse de suppression');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Répondre à un message existant
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {String} messageId - ID du message auquel répondre
   * @param {String} contenu - Contenu de la réponse
   * @returns {Promise} Promesse avec les données du message créé
   */
  async sendReply(workspaceId, canalId, messageId, contenu) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour répondre à un message');
      }
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}/reponses`;
      
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      if (data && data.data && data.data.message) {
        return data.data.message;
      } else if (data && data.message) {
        return data.message;
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  /**
   * Réagir à un message
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {String} messageId - ID du message auquel réagir
   * @param {String} emoji - L'emoji à ajouter
   * @returns {Promise} Promesse avec le message mis à jour
   */
  async reactToMessage(workspaceId, canalId, messageId, emoji) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour réagir à un message');
      }
      
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}/reactions`;
      
      const requestBody = JSON.stringify({ emoji });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      if (data && data.data && data.data.message) {
        return data.data.message;
      } else if (data && data.message) {
        return data.message;
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }
};

export default messageService;
