// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

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
      // Récupérer le token dans le localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      // Construire l'URL avec les paramètres
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages?page=${page}&limit=${limit}`;
      
      // Appeler l'API pour récupérer les messages du canal
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
      

      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.status === 'success' && data.data && data.data.messages) {
        return data.data.messages;
      } else if (data && Array.isArray(data)) {
        // Si la réponse est directement un tableau de messages
        return data;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        // Un autre format possible
        return data.messages;
      }
      
      return [];
    } catch (error) {
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages`;
      
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

      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {

        throw new Error('Impossible de parser la réponse du serveur');
      }
      

      
      // Vérifier la structure de la réponse et extraire le message créé
      if (data && data.data && data.data.message) {
        return data.data.message;
      } else if (data && data.message) {
        return data.message;
      } else if (data && typeof data === 'object') {
        // S'il n'y a pas de structure spécifique, mais que la réponse est un objet qui pourrait être un message
        return {
          _id: data._id || data.id || Date.now().toString(),
          contenu: contenu,
          utilisateur: { _id: this.getUserIdFromToken() },
          dateCreation: data.dateCreation || data.date || new Date().toISOString(),
          ...data
        };
      }
      
      // Structure de réponse non reconnue, création d'un message temporaire
      // Créer un message temporaire si la structure n'est pas reconnue
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
   * Obtenir l'ID utilisateur à partir du token JWT
   * @returns {String|null} ID de l'utilisateur connecté ou null
   */
  getUserIdFromToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Décoder le payload du JWT (partie du milieu entre les points)
      const payload = token.split('.')[1];
      if (!payload) return null;
      
      // Décoder de base64 et parser le JSON
      const decoded = JSON.parse(atob(payload));
      
      // Retourner l'ID utilisateur
      return decoded.id || decoded._id || decoded.userId || null;
    } catch (error) {

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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour modifier un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`;
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      
      const response = await fetch(url, {
        method: 'PATCH',
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
      
      // Vérifier la structure de la réponse et extraire le message modifié
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
   * Supprimer un message
   * @param {String} workspaceId - ID du workspace
   * @param {String} canalId - ID du canal
   * @param {String} messageId - ID du message à supprimer
   * @returns {Promise} Promesse avec le résultat de la suppression
   */
  async deleteMessage(workspaceId, canalId, messageId) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour supprimer un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`;
      
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
        
        const responseText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      return { success: true };
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour répondre à un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}/reponses`;
      
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
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Vérifier la structure de la réponse et extraire le message créé
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
