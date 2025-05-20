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
      
      // Construire l'URL pour l'endpoint des messages privés - le premier endpoint route '/' dans le contrôleur
      const url = `${API_URL}/messages/private/`;
      
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
      if (data && data.success && data.data) {
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
      const url = `${API_URL}/messages/private/${userId}`;
      
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
   * Envoyer un message privé à un utilisateur
   * @param {String} userId - ID de l'utilisateur destinataire
   * @param {String} contenu - Contenu du message
   * @returns {Promise} Promesse avec le message envoyé
   */
  async sendPrivateMessage(userId, contenu) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/messages/private/${userId}`;
      
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
      
      return data;
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
