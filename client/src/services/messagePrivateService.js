const API_URL = 'http://localhost:3000/api/v1';
import authService from './authService';

/**
 * Service de gestion des messages privés
 */
const messagePrivateService = {
  /**
   * Récupérer toutes les conversations privées de l'utilisateur connecté
   * @returns {Promise} Promesse avec la liste des conversations
   */
  async getAllPrivateConversations() {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux conversations');
      }
      
      const url = `${API_URL}/conversations/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        console.error('Contenu de l\'erreur:', responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      if (data && data.status === 'success' && data.data && data.data.conversations) {
        return data.data.conversations;
      } else if (data && data.success && data.data) {
        return data.data;
      } else if (data && Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        return [data];
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return [];
    }
  },

  /**
   * Récupérer les messages privés avec un utilisateur spécifique
   * @param {String} userId - ID de l'utilisateur avec qui la conversation est partagée
   * @returns {Promise} Promesse avec la liste des messages
   */
  async getPrivateMessages(userId) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      const url = `${API_URL}/conversations/user/${userId}/messages`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
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
      
      if (data && data.success && data.data) {
        return data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages privés:', error);
      throw error;
    }
  },

  /**
   * Envoyer un message privé à un utilisateur ou dans une conversation
   * @param {String} targetId - ID de l'utilisateur destinataire ou de la conversation
   * @param {String} contenu - Contenu du message
   * @param {String} targetType - Type de cible ("user" ou "conversation")
   * @returns {Promise} Promesse avec le message envoyé
   */
  async sendPrivateMessage(targetId, contenu, targetType = 'user') {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      let url;
      if (targetType === 'conversation') {
        url = `${API_URL}/conversations/${targetId}/messages`;
      } else {
        url = `${API_URL}/conversations/user/${targetId}/messages`;
      }
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
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      let message;
      if (data && data.data && data.data.message) {
        message = data.data.message;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && data.data) {
        message = data.data;
      } else {
        message = data;
      }
      
      if (message) {
        const messageId = message._id || message.id;
        if (messageId) {
          message._id = messageId.toString();
          message.id = messageId.toString();
        }
        
        if (message.expediteur) {
          const expediteurId = message.expediteur._id || message.expediteur.id;
          if (expediteurId) {
            message.expediteur._id = expediteurId.toString();
            message.expediteur.id = expediteurId.toString();
          }
        }
        
        if (message.conversation && typeof message.conversation !== 'string') {
          message.conversation = message.conversation.toString();
        } else if (message.conversationId && typeof message.conversationId !== 'string') {
          message.conversationId = message.conversationId.toString();
          message.conversation = message.conversationId;
        }
      }
      
      return message;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message privé:', error);
      throw error;
    }
  },

  /**
   * Marquer un message comme lu
   * @param {String} messageId - ID du message à marquer comme lu
   * @returns {Promise} Promesse avec le résultat
   */
  async markMessageAsRead(messageId) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour marquer un message comme lu');
      }
      
      const url = `${API_URL}/conversations/messages/${messageId}/read`;
      
      const response = await fetch(url, {
        method: 'PATCH',
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
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
      throw error;
    }
  }
  ,

  /**
   * Récupérer les messages d'une conversation privée spécifique
   * @param {String} conversationId - ID de la conversation
   * @param {Number} page - Numéro de page (pagination)
   * @param {Number} limit - Nombre de messages par page
   * @returns {Promise} Promesse avec la liste des messages
   */
  async getConversationMessages(conversationId, page = 1, limit = 50) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      const url = `${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`;
      
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
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      if (data && data.status === 'success' && data.data && data.data.messages) {
        return data.data.messages;
      } else if (data && data.status === 'success' && Array.isArray(data.data)) {
        return data.data;
      } else if (data && data.messages) {
        return data.messages;
      } else if (data && Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages de conversation:', error);
      return [];
    }
  },

  /**
   * Modifier un message privé
   * @param {String} conversationId - ID de la conversation
   * @param {String} messageId - ID du message à modifier
   * @param {String} contenu - Nouveau contenu du message
   * @returns {Promise} Promesse avec les données du message modifié
   */
  async updatePrivateMessage(conversationId, messageId, contenu) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour modifier un message');
      }
      
      if (!messageId) {
        throw new Error('ID du message manquant');
      }
      
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}`;
      
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'PUT',
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
        console.error('Erreur de réponse lors de la modification:', response.status, responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        return {
          _id: messageId,
          id: messageId,
          contenu: contenu,
          modifie: true,
          success: true
        };
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        return {
          _id: messageId,
          id: messageId,
          contenu: contenu,
          modifie: true,
          success: true
        };
      } 
      
      if (data && data.data && data.data.message) {
        return data.data.message;
      } else if (data && data.message) {
        return data.message;
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la modification du message privé:', error);
      throw error;
    }
  },

  /**
   * Supprimer un message privé
   * @param {String} conversationId - ID de la conversation
   * @param {String} messageId - ID du message à supprimer
   * @returns {Promise} Promesse avec le résultat de la suppression
   */
  async deletePrivateMessage(conversationId, messageId) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour supprimer un message');
      }
      
      if (!messageId) {
        throw new Error('ID du message manquant');
      }
      
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const errorText = await response.text();
        console.error('Erreur de réponse lors de la suppression:', response.status, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        return { success: true, message: 'Message supprimé avec succès' };
      }
      
      try {
        const data = JSON.parse(responseText);
        
        if (data && data.data) {
          return data.data;
        }
        
        return data;
      } catch (parseError) {
        return { success: true, message: 'Message supprimé avec succès' };
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du message privé:', error);
      throw error;
    }
  },

  /**
   * Répondre à un message privé
   * @param {String} conversationId - ID de la conversation
   * @param {String} messageId - ID du message auquel répondre
   * @param {String} contenu - Contenu de la réponse
   * @returns {Promise} Promesse avec les données du message créé
   */
  async sendPrivateReply(conversationId, messageId, contenu) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour répondre à un message');
      }
      
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}/reply`;
      
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
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error('Erreur de réponse lors de la réponse à un message:', response.status, responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      let message;
      if (data && data.data && data.data.message) {
        message = data.data.message;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && data.data) {
        message = data.data;
      } else {
        message = data;
      }
      
      if (message) {
        const messageId = message._id || message.id;
        if (messageId) {
          message._id = messageId.toString();
          message.id = messageId.toString();
        }
        
        if (message.expediteur) {
          const expediteurId = message.expediteur._id || message.expediteur.id;
          if (expediteurId) {
            message.expediteur._id = expediteurId.toString();
            message.expediteur.id = expediteurId.toString();
          }
        }
        
        if (message.reponseA) {
          if (typeof message.reponseA === 'string') {
            // Déjà au bon format
          } else {
            const reponseId = message.reponseA._id || message.reponseA.id;
            if (reponseId) {
              message.reponseA = reponseId.toString();
            }
          }
        }
        
        if (message.conversation && typeof message.conversation !== 'string') {
          message.conversation = message.conversation.toString();
        } else if (message.conversationId && typeof message.conversationId !== 'string') {
          message.conversationId = message.conversationId.toString();
          message.conversation = message.conversationId;
        }
      }
      
      return message;
    } catch (error) {
      console.error('Erreur lors de la réponse au message privé:', error);
      throw error;
    }
  },

  /**
   * Réagir à un message privé
   * @param {String} conversationId - ID de la conversation
   * @param {String} messageId - ID du message auquel réagir
   * @param {String} emoji - L'emoji à ajouter
   * @returns {Promise} Promesse avec le message mis à jour
   */
  async reactToPrivateMessage(conversationId, messageId, emoji) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour réagir à un message');
      }
      
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}/reactions`;
      
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
          console.warn('Erreur 401: Session expirée ou cookie non valide');
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
      console.error('Erreur lors de la réaction au message privé:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle conversation privée avec un utilisateur ou la récupérer si elle existe déjà.
   * @param {String} participantId - L'ID de l'autre utilisateur participant à la conversation.
   * @returns {Promise} Promesse avec les données de la conversation.
   */
  /**
   * Récupérer un message privé spécifique dans une conversation
   * @param {String} conversationId - ID de la conversation
   * @param {String} messageId - ID du message à récupérer
   * @returns {Promise} Promesse avec le message
   */
  async getPrivateMessage(conversationId, messageId) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        console.error('Contenu de l\'erreur (getPrivateMessage):', responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON (getPrivateMessage):', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }

      if (data && data.status === 'success' && data.data && data.data.message) {
        return data.data.message;
      } else if (data && data.message) {
        return data.message;
      } else if (data && data.data) {
        return data.data;
      }
      
      const reactionUrl = `${API_URL}/conversations/${conversationId}/messages/${messageId}/reactions`;
      const reactionResponse = await fetch(reactionUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (reactionResponse.ok) {
        const reactionData = await reactionResponse.json();
        
        if (reactionData && reactionData.data && reactionData.data.message) {
          return reactionData.data.message;
        } else if (reactionData && reactionData.message) {
          return reactionData.message;
        } else if (reactionData && reactionData.data) {
          return reactionData.data;
        }
      }

      throw new Error('Message non trouvé');
    } catch (error) {
      console.error('Erreur lors de la récupération du message privé:', error);
      throw error;
    }
  },

  async createOrGetConversation(participantId) {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour créer une conversation');
      }

      const url = `${API_URL}/conversations/`;
      const body = JSON.stringify({ participants: [participantId] });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: body
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        console.error('Contenu de l\'erreur (createOrGetConversation):', responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }

      if (data && data.status === 'success' && data.data && data.data.conversation) {
        return data.data.conversation;
      }
      if (data && data.status === 'success' && data.data) { 
        return data.data;
      }

      throw new Error('Réponse invalide du serveur lors de la création/récupération de la conversation');
    } catch (error) {
      console.error('Erreur dans createOrGetConversation:', error);
      throw error;
    }
  }
};

export default messagePrivateService;
