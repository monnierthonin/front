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
    this.reconnectDelay = 1000;
  }

  /**
   * Initialiser la connexion WebSocket
   * @param {String} token - Token JWT pour l'authentification
   * @returns {Promise} Promesse résolue quand la connexion est établie
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      try {

        
        const wsUrl = `${SOCKET_URL}?token=${encodeURIComponent(token)}`;
        
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {

          this.connected = true;
          this.reconnectAttempts = 0;
          
          this.channelSubscriptions.forEach(channel => {
            this.joinChannel(channel.workspaceId, channel.channelId);
          });
          
          resolve(true);
        };

        this.socket.onclose = (event) => {

          this.connected = false;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectInterval = setTimeout(() => {
              this.reconnectAttempts++;

              this.connect(token);
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
          }
        };

        this.socket.onerror = (error) => {

          if (!this.connected) {
            reject(error);
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            
            if (data.type === 'message' || data.type === 'new_message') {
              this.handleIncomingMessage(data.payload || data);
            }
          } catch (error) {

          }
        };
        
      } catch (error) {

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
      
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }
      

    }
  }

  /**
   * Envoyer un message au serveur WebSocket
   * @param {String} type - Type de message
   * @param {Object} data - Données du message
   */
  sendMessage(type, data) {
    if (!this.connected || !this.socket) {

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

      return;
    }

    const channelKey = `${workspaceId}:${channelId}`;

    
    this.sendMessage('join_channel', { workspaceId, channelId });
    this.channelSubscriptions.add({ workspaceId, channelId, key: channelKey });
    

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

    
    this.sendMessage('leave_channel', { workspaceId, channelId });
    
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
    
    this.joinChannel(workspaceId, channelId);
    
    return () => {
      if (this.messageHandlers.has(channelKey)) {
        this.messageHandlers.get(channelKey).delete(callback);
        
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
    if (!message || !message.workspaceId || !message.canalId) {

      return;
    }

    const channelKey = `${message.workspaceId}:${message.canalId}`;
    
    if (this.messageHandlers.has(channelKey)) {
      this.messageHandlers.get(channelKey).forEach(callback => {
        try {
          callback(message);
        } catch (error) {

        }
      });
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
