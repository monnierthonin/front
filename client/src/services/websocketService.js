// Service de gestion des connexions WebSocket utilisant l'API WebSocket native

// URL du serveur WebSocket (même URL que l'API, mais avec le protocole ws:// ou wss://)
const SOCKET_URL = 'ws://localhost:3000/ws';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.messageHandlers = new Map();
    this.channelSubscriptions = new Set();
    this.reconnectInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 seconde par défaut
  }

  /**
   * Initialiser la connexion WebSocket
   * @param {String} token - Token JWT pour l'authentification
   * @returns {Promise} Promesse résolue quand la connexion est établie
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Tentative de connexion WebSocket...');
        
        // Construire l'URL avec le token d'authentification
        const wsUrl = `${SOCKET_URL}?token=${encodeURIComponent(token)}`;
        
        // Créer une nouvelle connexion WebSocket
        this.socket = new WebSocket(wsUrl);

        // Événement de connexion réussie
        this.socket.onopen = () => {
          console.log('WebSocket connecté avec succès');
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Réabonner aux canaux précédemment suivis en cas de reconnexion
          this.channelSubscriptions.forEach(channel => {
            this.joinChannel(channel.workspaceId, channel.channelId);
          });
          
          resolve(true);
        };

        // Événement de déconnexion
        this.socket.onclose = (event) => {
          console.log(`WebSocket déconnecté, code: ${event.code}, raison: ${event.reason}`);
          this.connected = false;
          
          // Tentative de reconnexion automatique
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectInterval = setTimeout(() => {
              this.reconnectAttempts++;
              console.log(`Tentative de reconnexion (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.connect(token);
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts)); // Backoff exponentiel
          }
        };

        // Événement d'erreur
        this.socket.onerror = (error) => {
          console.error('Erreur de connexion WebSocket:', error);
          if (!this.connected) {
            reject(error);
          }
        };

        // Écouter les messages entrants
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Message WebSocket reçu:', data);
            
            // Traiter les différents types de messages
            if (data.type === 'message' || data.type === 'new_message') {
              this.handleIncomingMessage(data.payload || data);
            }
          } catch (error) {
            console.error('Erreur lors du traitement du message WebSocket:', error);
          }
        };
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Fermer la connexion WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Déconnexion manuelle');
      this.socket = null;
      this.connected = false;
      this.channelSubscriptions.clear();
      
      // Arrêter les tentatives de reconnexion
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }
      
      console.log('WebSocket déconnecté manuellement');
    }
  }

  /**
   * Envoyer un message au serveur WebSocket
   * @param {String} type - Type de message
   * @param {Object} data - Données du message
   */
  sendMessage(type, data) {
    if (!this.connected || !this.socket) {
      console.error('WebSocket non connecté, impossible d\'envoyer le message');
      return;
    }
    
    const message = JSON.stringify({
      type,
      payload: data
    });
    
    this.socket.send(message);
  }

  /**
   * Rejoindre un canal pour recevoir ses messages
   * @param {String} workspaceId - ID du workspace
   * @param {String} channelId - ID du canal
   */
  joinChannel(workspaceId, channelId) {
    if (!this.connected || !this.socket) {
      console.error('WebSocket non connecté, impossible de rejoindre le canal');
      return;
    }

    const channelKey = `${workspaceId}:${channelId}`;
    console.log(`Demande d'abonnement au canal ${channelKey}`);
    
    this.sendMessage('join_channel', { workspaceId, channelId });
    this.channelSubscriptions.add({ workspaceId, channelId, key: channelKey });
    
    console.log(`Abonné au canal ${channelKey}`);
  }

  /**
   * Quitter un canal pour ne plus recevoir ses messages
   * @param {String} workspaceId - ID du workspace
   * @param {String} channelId - ID du canal
   */
  leaveChannel(workspaceId, channelId) {
    if (!this.connected || !this.socket) {
      return;
    }

    const channelKey = `${workspaceId}:${channelId}`;
    console.log(`Quitter le canal ${channelKey}`);
    
    this.sendMessage('leave_channel', { workspaceId, channelId });
    
    // Supprimer l'abonnement de la liste
    this.channelSubscriptions.forEach(sub => {
      if (sub.workspaceId === workspaceId && sub.channelId === channelId) {
        this.channelSubscriptions.delete(sub);
      }
    });
  }

  /**
   * S'abonner aux messages d'un canal spécifique
   * @param {String} workspaceId - ID du workspace
   * @param {String} channelId - ID du canal
   * @param {Function} callback - Fonction à appeler quand un message est reçu
   * @returns {Function} Fonction pour se désabonner
   */
  subscribeToChannelMessages(workspaceId, channelId, callback) {
    const channelKey = `${workspaceId}:${channelId}`;
    
    if (!this.messageHandlers.has(channelKey)) {
      this.messageHandlers.set(channelKey, new Set());
    }
    
    this.messageHandlers.get(channelKey).add(callback);
    
    // Rejoindre le canal si pas déjà fait
    this.joinChannel(workspaceId, channelId);
    
    console.log(`Abonné aux messages du canal ${channelKey}`);
    
    // Retourner une fonction pour se désabonner
    return () => {
      if (this.messageHandlers.has(channelKey)) {
        this.messageHandlers.get(channelKey).delete(callback);
        
        // Si plus aucun abonnement pour ce canal, le quitter
        if (this.messageHandlers.get(channelKey).size === 0) {
          this.leaveChannel(workspaceId, channelId);
        }
      }
    };
  }

  /**
   * Gérer un message entrant et le distribuer aux abonnés
   * @param {Object} message - Message reçu
   */
  handleIncomingMessage(message) {
    // Vérifier si le message a les propriétés nécessaires
    if (!message || !message.workspaceId || !message.canalId) {
      console.warn('Message WebSocket invalide:', message);
      return;
    }

    const channelKey = `${message.workspaceId}:${message.canalId}`;
    
    // Distribuer le message à tous les abonnés de ce canal
    if (this.messageHandlers.has(channelKey)) {
      this.messageHandlers.get(channelKey).forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Erreur dans un gestionnaire de message:', error);
        }
      });
    }
  }
}

// Exporter une instance unique du service
const websocketService = new WebSocketService();
export default websocketService;
