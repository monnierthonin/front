// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

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
      // Récupérer le token dans le localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux conversations');
      }
      
      // Construire l'URL pour l'endpoint des conversations privées
      const url = `${API_URL}/conversations/`;
      
      console.log('Appel API:', url);
      
      // Appeler l'API pour récupérer les conversations
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      // Pour débogage - afficher le statut de la réponse
      console.log('Statut de la réponse API:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        console.error('Contenu de l\'erreur:', responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log('Réponse brute API:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      console.log('Données reçues de l\'API:', data);
      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.status === 'success' && data.data && data.data.conversations) {
        return data.data.conversations;
      } else if (data && data.success && data.data) {
        return data.data;
      } else if (data && Array.isArray(data)) {
        // Si la réponse est directement un tableau
        return data;
      } else if (data && typeof data === 'object') {
        // Fallback: retourner l'objet de réponse complet
        return [data];
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      // Pour les tests, retourner un tableau vide au lieu de propager l'erreur
      return [];
      // throw error; // Décommenter cette ligne en production
    }
  },

  /**
   * Récupérer les messages privés avec un utilisateur spécifique
   * @param {String} userId - ID de l'utilisateur avec qui la conversation est partagée
   * @returns {Promise} Promesse avec la liste des messages
   */
  async getPrivateMessages(userId) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      // Construire l'URL
      const url = `${API_URL}/conversations/user/${userId}/messages`;
      
      const response = await fetch(url, {
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
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Vérifier la structure de la réponse et extraire les messages
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      // Construire l'URL en fonction du type de cible
      let url;
      if (targetType === 'conversation') {
        // Si c'est une conversation existante
        url = `${API_URL}/conversations/${targetId}/messages`;
      } else {
        // Si c'est un nouvel utilisateur
        url = `${API_URL}/conversations/user/${targetId}/messages`;
      }
      
      console.log(`Envoi de message privé à ${targetType} (ID: ${targetId}) via URL: ${url}`);
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log('Réponse du serveur pour l\'envoi de message privé:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Extraire le message de la réponse selon différentes structures possibles
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
      
      // Normaliser la structure du message avant de le retourner
      if (message) {
        // S'assurer que les IDs sont présents en format string
        const messageId = message._id || message.id;
        if (messageId) {
          message._id = messageId.toString();
          message.id = messageId.toString();
        }
        
        // Normaliser l'expéditeur
        if (message.expediteur) {
          const expediteurId = message.expediteur._id || message.expediteur.id;
          if (expediteurId) {
            message.expediteur._id = expediteurId.toString();
            message.expediteur.id = expediteurId.toString();
          }
        }
        
        // Normaliser la conversation
        if (message.conversation && typeof message.conversation !== 'string') {
          message.conversation = message.conversation.toString();
        } else if (message.conversationId && typeof message.conversationId !== 'string') {
          message.conversationId = message.conversationId.toString();
          // Assurer la compatibilité
          message.conversation = message.conversationId;
        }
      }
      
      console.log('Message normalisé:', message);
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour mettre à jour un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/conversations/messages/${messageId}/read`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      // Construire l'URL pour récupérer les messages d'une conversation spécifique
      // Utilisation du nouvel endpoint correct: /conversations/{id}/messages
      const url = `${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`;
      
      console.log('Appel API conversation messages:', url);
      
      const response = await fetch(url, {
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
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log('Réponse brute API conversation messages:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      console.log('Structure de la réponse:', {
        hasStatus: data && data.status ? true : false,
        hasData: data && data.data ? true : false,
        hasMessages: data && data.data && data.data.messages ? true : false,
        hasResultats: data && data.resultats ? true : false,
        dataType: data ? typeof data : 'undefined',
        isArray: Array.isArray(data)
      });
      
      // Vérifier la structure de la réponse et extraire les messages
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour modifier un message');
      }
      
      if (!messageId) {
        throw new Error('ID du message manquant');
      }
      
      // Construire l'URL selon l'API
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}`;
      
      console.log('Modification du message:', { conversationId, messageId, contenu });
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error('Erreur de réponse lors de la modification:', response.status, responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Récupérer le texte de la réponse
      const responseText = await response.text();
      console.log('Réponse de modification:', responseText);
      
      // Si la réponse est vide ou juste des espaces blancs, construire une réponse par défaut
      if (!responseText || responseText.trim() === '') {
        console.log('Modification réussie avec réponse vide');
        // Créer un objet avec le nouveau contenu pour simuler la réponse attendue
        return {
          _id: messageId,
          id: messageId,
          contenu: contenu,
          modifie: true,
          success: true
        };
      }
      
      // Sinon, essayer de parser la réponse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Réponse non-JSON mais modification réussie:', responseText);
        // Même si ce n'est pas du JSON, la modification a réussi car response.ok est true
        return {
          _id: messageId,
          id: messageId,
          contenu: contenu,
          modifie: true,
          success: true
        };
      } 
      
      // Vérifier la structure de la réponse et extraire le message modifié
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour supprimer un message');
      }
      
      if (!messageId) {
        throw new Error('ID du message manquant');
      }
      
      // Construire l'URL selon l'API
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}`;
      
      console.log('Suppression du message:', { conversationId, messageId });
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const errorText = await response.text();
        console.error('Erreur de réponse lors de la suppression:', response.status, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      // Récupérer le texte de la réponse
      const responseText = await response.text();
      console.log('Réponse de suppression:', responseText);
      
      // Si la réponse est vide ou juste des espaces blancs, c'est normal pour une suppression
      if (!responseText || responseText.trim() === '') {
        console.log('Suppression réussie avec réponse vide');
        return { success: true, message: 'Message supprimé avec succès' };
      }
      
      // Sinon, essayer de parser la réponse JSON
      try {
        const data = JSON.parse(responseText);
        
        // Vérifier la structure de la réponse
        if (data && data.data) {
          return data.data;
        }
        
        return data;
      } catch (parseError) {
        console.log('Réponse non-JSON mais suppression réussie:', responseText);
        // Même si ce n'est pas du JSON, la suppression a réussi car response.ok est true
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour répondre à un message');
      }
      
      // Construire l'URL - URL pour les réponses aux messages privés
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}/replies`;
      
      console.log('Répondre à un message privé, URL:', url);
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error('Erreur de réponse lors de la réponse à un message:', response.status, responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log('Réponse pour la réponse à un message privé:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Extraire le message de la réponse selon différentes structures possibles
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
      
      // Normaliser la structure du message avant de le retourner
      if (message) {
        // S'assurer que les IDs sont présents en format string
        const messageId = message._id || message.id;
        if (messageId) {
          message._id = messageId.toString();
          message.id = messageId.toString();
        }
        
        // Normaliser l'expéditeur
        if (message.expediteur) {
          const expediteurId = message.expediteur._id || message.expediteur.id;
          if (expediteurId) {
            message.expediteur._id = expediteurId.toString();
            message.expediteur.id = expediteurId.toString();
          }
        }
        
        // Normaliser la référence au message parent (reponseA)
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
        
        // Normaliser la conversation
        if (message.conversation && typeof message.conversation !== 'string') {
          message.conversation = message.conversation.toString();
        } else if (message.conversationId && typeof message.conversationId !== 'string') {
          message.conversationId = message.conversationId.toString();
          // Assurer la compatibilité
          message.conversation = message.conversationId;
        }
      }
      
      console.log('Message normalisé:', message);
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour réagir à un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/conversations/${conversationId}/messages/${messageId}/reactions`;
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ emoji });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Vérifier la structure de la réponse et extraire le message mis à jour avec les réactions
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
  }
};

export default messagePrivateService;
