<template>
  <div class="messages-container">
    <!-- Liste des messages -->
    <div class="messages-list" ref="messagesList">
      <div v-if="loading" class="loading-messages">
        <div class="loader"></div>
        <span>Chargement des messages...</span>
      </div>
      
      <div v-else-if="messages.length === 0" class="no-messages">
        <span>Aucun message dans ce canal. Soyez le premier à écrire !</span>
      </div>
      
      <div v-else>
        <Message
          v-for="message in messages"
          :key="message._id"
          :message-id="message._id"
          :username="getUserName(message.auteur)"
          :message-text="message.contenu"
          :timestamp="message.createdAt || message.horodatage"
          :profile-picture="message.auteur.profilePicture"
          :is-current-user="isCurrentUser(message.auteur._id)"
          :reactions="message.reactions || []"
          :reply-to-message="message.reponseA ? mapReplyMessage(message.reponseA) : null"
          :context-type="'canal'"
          @reply="handleReply"
          @emoji-picker="handleEmojiPicker"
          @edit="handleEditMessage"
          @delete="handleDeleteMessage"
          @toggle-reaction="handleToggleReaction"
        />
      </div>
    </div>
    
    <!-- Barre de texte pour envoyer un message -->
    <textBox
      :context-type="'canal'"
      :context-id="canalId"
      :reply-to-message="replyToMessage"
      :placeholder="`Écrire un message dans #${canalName || 'le canal'}...`"
      @send-message="sendMessage"
      @import-file="handleImportFile"
      @reply-canceled="cancelReply"
    />
  </div>
</template>

<script>
import Message from './Message.vue';
import textBox from './textBox.vue';
import axios from 'axios';
import socketService from '../../services/socketService';

export default {
  name: 'MessagesCanal',
  components: {
    Message,
    textBox
  },
  props: {
    workspaceId: {
      type: String,
      required: true
    },
    canalId: {
      type: String,
      required: true
    },
    canalName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      messages: [],
      loading: true,
      replyToMessage: null,
      currentUser: null,
      socketConnected: false
    };
  },
  async created() {
    try {
      // Récupérer l'utilisateur actuel (peut être stocké dans le store Vuex ou localStorage)
      this.currentUser = JSON.parse(localStorage.getItem('user')) || {};
      
      // Charger les messages du canal
      await this.fetchMessages();
      
      // Connexion au socket pour les messages en temps réel
      this.connectToSocket();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des messages:', error);
    }
  },
  beforeDestroy() {
    // Se déconnecter du socket pour éviter les fuites mémoire
    this.disconnectFromSocket();
  },
  methods: {
    // Récupération des messages du canal depuis l'API
    async fetchMessages() {
      this.loading = true;
      try {
        const response = await axios.get(
          `/api/v1/workspaces/${this.workspaceId}/canaux/${this.canalId}/messages`,
          { withCredentials: true }
        );
        
        if (response.data && response.data.data && response.data.data.messages) {
          this.messages = response.data.data.messages;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
      } finally {
        this.loading = false;
      }
      
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    // Envoi d'un nouveau message
    async sendMessage(messageData) {
      try {
        const payload = {
          contenu: messageData.content
        };
        
        // Si c'est une réponse à un message
        if (messageData.replyToMessageId) {
          // Dans le cas d'une réponse, on doit utiliser l'endpoint spécifique pour les réponses
          await axios.post(
            `/api/v1/workspaces/${this.workspaceId}/canaux/${this.canalId}/messages/${messageData.replyToMessageId}/reponses`,
            payload,
            { withCredentials: true }
          );
          
          // Réinitialiser le message de réponse
          this.replyToMessage = null;
        } else {
          // Message normal
          await axios.post(
            `/api/v1/workspaces/${this.workspaceId}/canaux/${this.canalId}/messages`,
            payload,
            { withCredentials: true }
          );
        }
        
        // Les nouveaux messages seront reçus via Socket.IO, donc pas besoin de refetch
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    },
    
    // Supprimer un message
    async handleDeleteMessage(messageData) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        try {
          await axios.delete(
            `/api/v1/workspaces/${this.workspaceId}/canaux/${this.canalId}/messages/${messageData.messageId}`,
            { withCredentials: true }
          );
          
          // Supprimer le message localement pour un feedback immédiat
          this.messages = this.messages.filter(msg => msg._id !== messageData.messageId);
        } catch (error) {
          console.error('Erreur lors de la suppression du message:', error);
        }
      }
    },
    
    // Éditer un message
    async handleEditMessage(messageData) {
      try {
        const message = this.messages.find(msg => msg._id === messageData.messageId);
        if (!message) return;
        
        // Utiliser une méthode simple pour l'édition (pourrait être amélioré avec un modal)
        const newContent = prompt('Modifier le message:', message.contenu);
        if (newContent && newContent !== message.contenu) {
          await axios.patch(
            `/api/v1/workspaces/${this.workspaceId}/canaux/${this.canalId}/messages/${messageData.messageId}`,
            { contenu: newContent },
            { withCredentials: true }
          );
          
          // Mettre à jour le message localement pour un feedback immédiat
          message.contenu = newContent;
        }
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
      }
    },
    
    // Répondre à un message
    handleReply(messageData) {
      this.replyToMessage = {
        messageId: messageData.messageId,
        username: messageData.username,
        content: messageData.content
      };
      
      // Donner le focus à la zone de texte
      this.$nextTick(() => {
        const textboxElement = this.$el.querySelector('.inputText');
        if (textboxElement) textboxElement.focus();
      });
    },
    
    // Annuler la réponse
    cancelReply() {
      this.replyToMessage = null;
    },
    
    // Gérer l'ajout/suppression de réaction
    async handleToggleReaction(reactionData) {
      try {
        await axios.post(
          `/api/v1/workspaces/${this.workspaceId}/canaux/${this.canalId}/messages/${reactionData.messageId}/reactions`,
          { emoji: reactionData.emoji },
          { withCredentials: true }
        );
        
        // La mise à jour sera reçue via Socket.IO
      } catch (error) {
        console.error('Erreur lors de la modification des réactions:', error);
      }
    },
    
    // Afficher le sélecteur d'emoji
    handleEmojiPicker(messageId) {
      // Cette fonctionnalité peut être implémentée avec une bibliothèque d'emoji
      console.log('Ouverture du sélecteur d\'emoji pour le message:', messageId);
    },
    
    // Gestion de l'importation de fichiers
    handleImportFile(data) {
      // Fonctionnalité d'importation de fichier à implémenter
      console.log('Importation de fichier pour le canal:', data.contextId);
    },
    
    // Utilisation du polling au lieu de Socket.IO pour les messages
    async connectToSocket() {
      let token = null;
      const userInfo = localStorage.getItem('userInfo');
      
      if (userInfo) {
        token = JSON.parse(userInfo).token;
      } else {
        const user = localStorage.getItem('user');
        if (user) {
          token = JSON.parse(user).token;
        }
      }
      
      if (!socketService.isConnected()) {
        if (token) {
          socketService.init(token);
        } else {
          return;
        }
      }
      
      this.socketConnected = true;
      
      // Au lieu d'écouter des événements Socket.IO, on utilise le polling
      // pour récupérer régulièrement les messages
      socketService.startPollingForChannel(this.canalId, this.workspaceId, (data) => {
        if (data && data.data && data.data.messages) {
          // Remplacer complètement les messages par ceux du serveur
          this.messages = data.data.messages || [];
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } else if (data && data.data && Array.isArray(data.data)) {
          // Format alternatif - si data.data est un tableau
          this.messages = data.data;
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } else if (data && Array.isArray(data)) {
          // Format alternatif - si data est directement un tableau
          this.messages = data;
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } else {
          console.warn('Format de données inattendu:', data);
          this.messages = [];
        }
      });
      
      // On écoute quand même les événements simulés pour les nouveaux messages
      // envoyés par l'utilisateur (pour une expérience plus fluide)
      socketService.on('nouveau-message', (data) => {
        if (data.message && data.message.canal === this.canalId) {
          // Vérifier si le message existe déjà
          const exists = this.messages.some(msg => msg._id === data.message._id);
          if (!exists) {
            this.messages.push(data.message);
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        }
      });
    },
    
    // Arrêter le polling et les écouteurs d'événements
    disconnectFromSocket() {
      if (socketService.isConnected() && this.socketConnected) {
        // Supprimer l'écouteur restant
        socketService.off('nouveau-message');
        
        // Le service de polling s'arrêtera automatiquement lors du nettoyage
        // ou lors de la connexion à un autre canal
        this.socketConnected = false;
      }
    },
    
    // Utilité : obtenir le nom d'utilisateur
    getUserName(user) {
      if (!user) return 'Utilisateur inconnu';
      return user.username || user.firstName || user.lastName || 'Utilisateur';
    },
    
    // Utilité : vérifier si l'utilisateur est l'utilisateur actuel
    isCurrentUser(userId) {
      return this.currentUser && this.currentUser._id === userId;
    },
    
    // Utilité : formater un message de réponse
    mapReplyMessage(replyMessage) {
      if (!replyMessage) return null;
      
      return {
        messageId: replyMessage._id,
        username: this.getUserName(replyMessage.auteur),
        content: replyMessage.contenu
      };
    },
    
    // Utilité : scroll jusqu'au dernier message
    scrollToBottom() {
      if (this.$refs.messagesList) {
        this.$refs.messagesList.scrollTop = this.$refs.messagesList.scrollHeight;
      }
    }
  }
};
</script>

<style scoped>
.messages-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  margin-bottom: 100px; /* Espace pour la zone de texte */
}

.loading-messages, .no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--text-secondary);
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Support des thèmes clair/sombre */
[data-theme="dark"] .loading-messages,
[data-theme="dark"] .no-messages {
  color: #aaa;
}

[data-theme="dark"] .loader {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color);
}
</style>
