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
    console.log(`messageService.getCanalMessages - Début avec workspaceId=${workspaceId}, canalId=${canalId}, page=${page}, limit=${limit}`);
    
    try {
      // Récupérer le token dans le localStorage
      const token = localStorage.getItem('token');
      console.log('Token récupéré du localStorage:', token ? 'Présent' : 'Absent');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour accéder aux messages');
      }
      
      // Construire l'URL avec les paramètres
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages?page=${page}&limit=${limit}`;
      console.log('URL de l\'API pour les messages:', url);
      
      // Appeler l'API pour récupérer les messages du canal
      console.log('Envoi de la requête GET pour récupérer les messages...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      console.log(`Statut de la réponse: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        const responseText = await response.text();
        console.error('Contenu de la réponse d\'erreur:', responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      console.log('Conversion de la réponse en JSON...');
      const responseText = await response.text();
      console.log('Réponse brute:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        console.error('Réponse impossible à parser:', responseText);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      console.log('Réponse complète:', data);
      
      // Vérifier que les données reçues ont la structure attendue
      if (data && data.status === 'success' && data.data && data.data.messages) {
        console.log(`${data.data.messages.length} messages récupérés avec succès`);
        return data.data.messages;
      } else if (data && Array.isArray(data)) {
        // Si la réponse est directement un tableau de messages
        console.log(`${data.length} messages récupérés (format tableau)`);
        return data;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        // Un autre format possible
        console.log(`${data.messages.length} messages récupérés (format {messages: []})`);
        return data.messages;
      }
      
      console.warn('Structure de réponse non reconnue, retour d\'un tableau vide');
      return [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des messages du canal ${canalId}:`, error);
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
    console.log(`messageService.sendMessage - Début avec workspaceId=${workspaceId}, canalId=${canalId}`);
    console.log('Contenu du message à envoyer:', contenu);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token récupéré du localStorage:', token ? 'Présent' : 'Absent');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour envoyer un message');
      }
      
      // Construire l'URL
      const url = `${API_URL}/workspaces/${workspaceId}/canaux/${canalId}/messages`;
      console.log('URL de l\'API pour l\'envoi de message:', url);
      
      // Construire le corps de la requête
      const requestBody = JSON.stringify({ contenu });
      console.log('Corps de la requête:', requestBody);
      
      console.log('Envoi de la requête POST pour envoyer le message...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: requestBody
      });

      console.log(`Statut de la réponse: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const responseText = await response.text();
        console.error('Contenu de la réponse d\'erreur:', responseText);
        throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
      }

      // Convertir la réponse en JSON
      console.log('Conversion de la réponse en JSON...');
      const responseText = await response.text();
      console.log('Réponse brute:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        console.error('Réponse impossible à parser:', responseText);
        throw new Error('Impossible de parser la réponse du serveur');
      }
      
      console.log('Réponse complète:', data);
      
      // Vérifier la structure de la réponse et extraire le message créé
      if (data && data.data && data.data.message) {
        console.log('Message créé avec succès:', data.data.message);
        return data.data.message;
      } else if (data && data.message) {
        console.log('Message créé avec succès (format alternatif):', data.message);
        return data.message;
      } else if (data && typeof data === 'object') {
        // S'il n'y a pas de structure spécifique, mais que la réponse est un objet qui pourrait être un message
        console.log('Message créé (format indéterminé):', data);
        return {
          _id: data._id || data.id || Date.now().toString(),
          contenu: contenu,
          utilisateur: { _id: this.getUserIdFromToken() },
          dateCreation: data.dateCreation || data.date || new Date().toISOString(),
          ...data
        };
      }
      
      console.warn('Structure de réponse non reconnue, création d\'un message temporaire');
      // Créer un message temporaire si la structure n'est pas reconnue
      return {
        _id: Date.now().toString(),
        contenu: contenu,
        utilisateur: { _id: this.getUserIdFromToken() },
        dateCreation: new Date().toISOString(),
        temporaire: true
      };
    } catch (error) {
      console.error(`Erreur lors de l'envoi du message au canal ${canalId}:`, error);
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
      console.error('Erreur lors du décodage du token JWT:', error);
      return null;
    }
  }
};

export default messageService;
