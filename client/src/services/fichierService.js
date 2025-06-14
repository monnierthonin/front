import axios from 'axios';

// URL de base de l'API avec le préfixe correct v1
const API_URL = 'http://localhost:3000/api/v1';

/**
 * Service pour gérer les fichiers
 */
const fichierService = {
  /**
   * Télécharge un fichier pour un canal
   * @param {File} fichier - Le fichier à télécharger
   * @param {String} canalId - L'ID du canal
   * @param {String} messageId - L'ID du message (optionnel)
   * @param {String} contenu - Le contenu du message (optionnel)
   * @returns {Promise} - Promesse avec les données du fichier téléchargé
   */
  uploadFichierCanal: async (fichier, canalId, messageId = null, contenu = '') => {
    try {
      const formData = new FormData();
      formData.append('fichier', fichier);
      
      if (messageId) {
        formData.append('messageId', messageId);
      }
      
      if (contenu) {
        formData.append('contenu', contenu);
      }
      
      // Utiliser credentials: 'include' pour l'authentification par cookie HTTP-only
      const response = await axios.post(
        `${API_URL}/fichiers/canal/${canalId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  },
  
  /**
   * Télécharge un fichier pour une conversation privée
   * @param {File} fichier - Le fichier à télécharger
   * @param {String} conversationId - L'ID de la conversation
   * @param {String} messageId - L'ID du message (optionnel)
   * @param {String} contenu - Le contenu du message (optionnel)
   * @returns {Promise} - Promesse avec les données du fichier téléchargé
   */
  uploadFichierConversation: async (fichier, conversationId, messageId = null, contenu = '') => {
    try {
      const formData = new FormData();
      formData.append('fichier', fichier);
      
      if (messageId) {
        formData.append('messageId', messageId);
      }
      
      if (contenu) {
        formData.append('contenu', contenu);
      }
      
      // Utiliser credentials: 'include' pour l'authentification par cookie HTTP-only
      const response = await axios.post(
        `${API_URL}/fichiers/conversation/${conversationId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  },
  
  /**
   * Supprime un fichier
   * @param {String} messageType - Type de message ('canal' ou 'conversation')
   * @param {String} messageId - ID du message
   * @param {String} fichierUrl - URL du fichier à supprimer
   * @returns {Promise} - Promesse avec le résultat de la suppression
   */
  supprimerFichier: async (messageType, messageId, fichierUrl) => {
    try {
      // Utiliser credentials: 'include' pour l'authentification par cookie HTTP-only
      const response = await axios.delete(
        `${API_URL}/fichiers/${messageType}/${messageId}/${encodeURIComponent(fichierUrl)}`,
        {
          withCredentials: true
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  },
  
  /**
   * Liste les fichiers d'un canal
   * @param {String} canalId - ID du canal
   * @returns {Promise} - Promesse avec la liste des fichiers
   */
  listerFichiersCanal: async (canalId) => {
    try {
      // Utiliser credentials: 'include' pour l'authentification par cookie HTTP-only
      const response = await axios.get(
        `${API_URL}/fichiers/canal/${canalId}`,
        {
          withCredentials: true
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Liste les fichiers d'une conversation
   * @param {String} conversationId - ID de la conversation
   * @returns {Promise} - Promesse avec la liste des fichiers
   */
  listerFichiersConversation: async (conversationId) => {
    try {
      // Utiliser credentials: 'include' pour l'authentification par cookie HTTP-only
      const response = await axios.get(
        `${API_URL}/fichiers/conversation/${conversationId}`,
        {
          withCredentials: true
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Obtient l'URL complète d'un fichier
   * @param {String} fichierUrl - URL relative du fichier
   * @returns {String} - URL complète du fichier
   */
  getFullFileUrl: (fichierUrl) => {
    if (!fichierUrl) return '';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (fichierUrl.startsWith('http')) {
      return fichierUrl;
    }
    
    // Le serveur Express sert les fichiers directement depuis la racine et non depuis l'API
    // Donc il faut utiliser l'URL de base du serveur sans le préfixe /api/v1
    const BASE_URL = API_URL.replace('/api/v1', '');
    
    // Si l'URL est une URL d'icône par défaut (assets/icons/...)
    if (fichierUrl.startsWith('assets/')) {
      return `${BASE_URL}/${fichierUrl}`;
    }
    
    // Pour les fichiers téléchargés dans uploads/
    return `${BASE_URL}/${fichierUrl}`;
  }
};

export default fichierService;
