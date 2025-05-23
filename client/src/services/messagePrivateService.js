// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';
const MESSAGES_PRIVATE_URL = `${API_URL}/messages/private`;

/**
 * Service de gestion des messages privés
 */
const messagePrivateService = {
  /**
   * Helper pour récupérer le token
   * @returns {String} Le token d'authentification
   * @throws {Error} Si le token n'est pas disponible
   */
  _getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vous devez être connecté pour accéder aux conversations');
    }
    return token;
  },

  /**
   * Helper pour les appels API
   * @param {String} url - URL de l'endpoint
   * @param {String} method - Méthode HTTP (GET, POST, PUT, DELETE)
   * @param {Object} body - Corps de la requête (optionnel)
   * @returns {Promise} Promesse avec la réponse formatée
   */
  async _apiCall(url, method = 'GET', body = null) {
    try {
      const token = this._getToken();
      
      console.log(`Appel API ${method}:`, url);
      
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      };
      
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      console.log('Statut de la réponse API:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const errorText = await response.text();
        console.error('Contenu de l\'erreur:', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      // Convertir la réponse en JSON
      const responseText = await response.text();
      if (!responseText.trim()) {
        return { success: true }; // Pour les requêtes qui ne retournent pas de contenu
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log('Données reçues de l\'API:', data);
        return data;
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError, 'Texte reçu:', responseText);
        throw new Error('Impossible de parser la réponse du serveur');
      }
    } catch (error) {
      console.error(`Erreur lors de l'appel API ${method} ${url}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les conversations privées de l'utilisateur connecté
   * @returns {Promise} Promesse avec la liste des conversations
   */
  async getAllPrivateConversations() {
    try {
      const data = await this._apiCall(`${MESSAGES_PRIVATE_URL}/`);
      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.success && data.data) {
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
      if (!userId) {
        throw new Error('ID d\'utilisateur manquant');
      }
      
      const data = await this._apiCall(`${MESSAGES_PRIVATE_URL}/${userId}`);
      
      console.log('Structure de la réponse reçue:', data);
      
      if (data && data.success) {
        // Pour la compatibilité avec les deux structures possibles de l'API
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.data && Array.isArray(data.data.messages)) {
          return data.data.messages;
        } else if (Array.isArray(data.data)) {
          return data.data;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages privés:', error);
      return []; // Retourner un tableau vide au lieu de propager l'erreur
    }
  },

  /**
   * Envoyer un message privé à un utilisateur
   * @param {String} userId - ID de l'utilisateur destinataire
   * @param {String} contenu - Contenu du message
   * @returns {Promise} Promesse avec le message envoyé
   */
  async sendPrivateMessage(userId, contenu) {
    try {
      if (!userId) {
        throw new Error('ID d\'utilisateur manquant');
      }
      
      if (!contenu || contenu.trim() === '') {
        throw new Error('Le contenu du message ne peut pas être vide');
      }
      
      const data = await this._apiCall(`${MESSAGES_PRIVATE_URL}/${userId}`, 'POST', { contenu });
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message privé:', error);
      throw error;
    }
  },
  
  /**
   * Mettre à jour un message privé
   * @param {String} messageId - ID du message à mettre à jour
   * @param {String} contenu - Nouveau contenu du message
   * @returns {Promise} Promesse avec le message mis à jour
   */
  async updatePrivateMessage(messageId, contenu) {
    try {
      if (!messageId) {
        throw new Error('ID du message manquant');
      }
      
      if (!contenu || contenu.trim() === '') {
        throw new Error('Le contenu du message ne peut pas être vide');
      }
      
      const data = await this._apiCall(`${MESSAGES_PRIVATE_URL}/message/${messageId}`, 'PUT', { contenu });
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message privé:', error);
      throw error;
    }
  },
  
  /**
   * Supprimer un message privé
   * @param {String} messageId - ID du message à supprimer
   * @returns {Promise} Promesse avec le résultat de la suppression
   */
  async deletePrivateMessage(messageId) {
    try {
      if (!messageId) {
        throw new Error('ID du message manquant');
      }
      
      const data = await this._apiCall(`${MESSAGES_PRIVATE_URL}/message/${messageId}`, 'DELETE');
      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression du message privé:', error);
      throw error;
    }
  }
,

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
      const url = `${API_URL}/messages/private/${messageId}/read`;
      
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
};

export default messagePrivateService;
