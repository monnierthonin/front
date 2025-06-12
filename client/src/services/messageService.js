// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

// Import du service d'authentification
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
    console.log(`==== Début getCanalMessages ====`);
    console.log(`Paramètres: workspaceId=${workspaceId}, canalId=${canalId}, page=${page}, limit=${limit}`);
    
    try {
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.warn('getCanalMessages: Utilisateur non authentifié');
        throw new Error('Vous devez être connecté pour récupérer les messages');
      }
      
      // Construire l'URL avec les paramètres
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages?page=${page}&limit=${limit}`;
      console.log(`URL de l'API (getCanalMessages): ${url}`);
      
      // Appeler l'API pour récupérer les messages du canal
      console.log('Appel API pour récupérer les messages du canal...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Assurer l'envoi du cookie HTTP-only
      });

      console.log(`Statut de la réponse API (getCanalMessages): ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        console.error(`Contenu de l'erreur (getCanalMessages): ${responseText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log(`Réponse brute API (getCanalMessages): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON (getCanalMessages):', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Vérifier que les données reçues ont la structure attendue
      let messages = [];
      if (data && data.status === 'success' && data.data && data.data.messages) {
        messages = data.data.messages;
      } else if (data && Array.isArray(data)) {
        // Si la réponse est directement un tableau de messages
        messages = data;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        // Un autre format possible
        messages = data.messages;
      }
      
      console.log(`Nombre de messages reçus: ${messages.length}`);
      console.log('==== Fin getCanalMessages ====');
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
    console.log(`==== Début sendMessage ====`);
    console.log(`Paramètres: workspaceId=${workspaceId}, canalId=${canalId}, contenu=${contenu.substring(0, 50)}${contenu.length > 50 ? '...' : ''}`);
    
    try {
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.warn('sendMessage: Utilisateur non authentifié');
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages`;
      console.log(`URL de l'API (sendMessage): ${url}`);
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      console.log(`Envoi de message au canal: ${contenu.substring(0, 50)}${contenu.length > 50 ? '...' : ''}`);
      
      console.log('Appel API pour envoyer un message au canal...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Assurer l'envoi du cookie HTTP-only
        body: requestBody
      });

      console.log(`Statut de la réponse API (sendMessage): ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error(`Contenu de l'erreur (sendMessage): ${responseText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log(`Réponse brute API (sendMessage): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON (sendMessage):', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Vérifier la structure de la réponse et extraire le message créé
      let message;
      if (data && data.data && data.data.message) {
        message = data.data.message;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && typeof data === 'object') {
        // S'il n'y a pas de structure spécifique, mais que la réponse est un objet qui pourrait être un message
        message = {
          _id: data._id || data.id || Date.now().toString(),
          contenu: contenu,
          utilisateur: { _id: await this.getUserIdFromToken() },
          dateCreation: data.dateCreation || data.date || new Date().toISOString(),
          ...data
        };
      }
      
      console.log('Message envoyé avec succès.');
      console.log('==== Fin sendMessage ====');
      return message;
      
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
   * Obtenir l'ID utilisateur à partir d'une API puisque nous ne pouvons plus accéder au token JWT
   * @returns {Promise<String|null>} ID de l'utilisateur connecté ou null
   */
  async getUserIdFromToken() {
    try {
      // Appel à l'API pour récupérer l'ID de l'utilisateur actuel
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
    console.log(`==== Début updateMessage ====`);
    console.log(`Paramètres: workspaceId=${workspaceId}, canalId=${canalId}, messageId=${messageId}, contenu=${contenu.substring(0, 50)}${contenu.length > 50 ? '...' : ''}`);
    
    try {
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.warn('updateMessage: Utilisateur non authentifié');
        throw new Error('Vous devez être connecté pour modifier un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`;
      console.log(`URL de l'API (updateMessage): ${url}`);
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      console.log(`Mise à jour du message: ${contenu.substring(0, 50)}${contenu.length > 50 ? '...' : ''}`);
      
      console.log('Appel API pour modifier un message...');
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      console.log(`Statut de la réponse API (updateMessage): ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error(`Contenu de l'erreur (updateMessage): ${responseText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      const responseText = await response.text();
      console.log(`Réponse brute API (updateMessage): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON (updateMessage):', parseError);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      // Vérifier la structure de la réponse et extraire le message modifié
      let message;
      if (data && data.data && data.data.message) {
        message = data.data.message;
      } else if (data && data.message) {
        message = data.message;
      } else {
        message = data;
      }
      
      console.log('Message modifié avec succès.');
      console.log('==== Fin updateMessage ====');
      return message;
    } catch (error) {
      console.error('Erreur dans updateMessage:', error);
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
    console.log(`==== Début deleteMessage ====`);
    console.log(`Paramètres: workspaceId=${workspaceId}, canalId=${canalId}, messageId=${messageId}`);
    
    try {
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.warn('deleteMessage: Utilisateur non authentifié');
        throw new Error('Vous devez être connecté pour supprimer un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}`;
      console.log(`URL de l'API (deleteMessage): ${url}`);
      
      console.log('Appel API pour supprimer le message...');
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Assurer l'envoi du cookie HTTP-only
      });

      console.log(`Statut de la réponse API (deleteMessage): ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Erreur 401: Session expirée ou cookie non valide');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error(`Contenu de l'erreur (deleteMessage): ${responseText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Essayer de récupérer un corps de réponse éventuel
      let result = { success: true };
      try {
        const responseText = await response.text();
        if (responseText && responseText.length > 0) {
          console.log(`Réponse brute API (deleteMessage): ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
          try {
            const data = JSON.parse(responseText);
            result = data || { success: true };
          } catch (parseError) {
            // Si le corps n'est pas du JSON, on ignore silencieusement
            console.log('Pas de corps JSON dans la réponse de suppression');
          }
        }
      } catch (readError) {
        // Ignorer les erreurs de lecture du corps, la suppression est considérée réussie
        console.log('Pas de corps dans la réponse de suppression');
      }
      
      console.log('Message supprimé avec succès.');
      console.log('==== Fin deleteMessage ====');
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
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour répondre à un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}/reponses`;
      
      // Construire le corps de la requête
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
          // Le token n'est plus dans localStorage, mais la session expirée sera gérée via le cookie
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
      // Vérifier l'authentification via le service auth
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour réagir à un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages/${messageId}/reactions`;
      
      // Construire le corps de la requête
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
          // Le token n'est plus dans localStorage, mais la session expirée sera gérée via le cookie
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
      throw error;
    }
  }
};

export default messageService;
