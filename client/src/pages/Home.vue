<template>
  <FriendsList @select-contact="handleContactSelect" />
  <div class="home">
    <!-- En-tête affichant soit le nom du canal, soit le nom du contact -->
    <div v-if="selectedContact" class="private-header">
      <div class="contact-info">
        <div class="contact-avatar">
          <img 
            :src="selectedContact.profilePicture ? `http://localhost:3000/uploads/profiles/${selectedContact.profilePicture}` : require('../assets/styles/image/profilDelault.png')" 
            :alt="getContactName(selectedContact)"
          >
          <div class="status-indicator" :class="selectedContact.status || 'offline'"></div>
        </div>
        <div class="contact-name">{{ getContactName(selectedContact) }}</div>
      </div>
    </div>
    
    <!-- Chat messages - conditionally show channel or private messages -->
    <div class="messages-container">
      <template v-if="currentMode === 'private' && selectedContactId">
        <!-- Messages privés -->
        <PrivateMessage 
          :contactId="selectedContactId"
          :contact="selectedContact"
          :messages="messages" 
          :isLoading="isLoading" 
          :currentUserId="currentUser._id"
          @message-sent="handleMessageSent"
          @message-deleted="handleMessageDeleted"
          @message-updated="handleMessageUpdated"
          @reaction-added="handleReactionAdded"
          @reply-to-message="sendReplyToMessage"
          @refresh-messages="fetchMessages"
          @cancel-reply="cancelReply"
        />
      </template>
      
      <template v-else-if="currentMode === 'channel' && activeChannel">
        <!-- Messages de canal -->
        <ChannelMessage 
          :channel="activeChannel"
          :workspaceId="workspaceId"
          :messages="messages" 
          :isLoading="isLoading" 
          :currentUserId="currentUser._id"
          @send-message="sendMessage"
          @message-deleted="handleMessageDeleted"
          @message-updated="handleMessageUpdated"
          @reaction-added="handleReactionAdded"
          @reply-to-message="sendReplyToMessage"
          @refresh-messages="fetchMessages"
          @cancel-reply="cancelReply"
        />
      </template>
      <template v-else>
        <!-- Si nous avons des contacts mais aucun n'est sélectionné, utiliser le premier -->
        <div v-if="!currentMode && firstContactLoaded" class="loading-message">
          Chargement de la conversation...
        </div>
        <div v-else class="welcome-message">
          <img src="../assets/styles/image/logoSupchat.png" alt="Logo" class="welcome-logo">
          <h2>Bienvenue sur SupChat</h2>
          <p>Sélectionnez un canal ou un contact pour commencer à discuter</p>
        </div>
      </template>
    </div>
    
    <!-- Zone de saisie de texte (canal ou privé) -->
    <textBox 
      :workspaceId="workspaceId" 
      :canalActif="getActiveChannel()" 
      :replyingToMessage="replyingToMessage"
      @message-sent="handleMessageSent"
      @cancel-reply="replyingToMessage = null"
    />
  </div>
</template>

<script>
import FriendsList from '../components/headerFile/FriendsList.vue'
import PrivateMessage from '../components/messageComponentFile/PrivateMessage.vue'
import ChannelMessage from '../components/messageComponentFile/ChannelMessage.vue'
import textBox from '../components/messageComponentFile/textBox.vue'
import messagePrivateService from '../services/messagePrivateService'

export default {
  name: 'Home',
  components: {
    FriendsList,
    PrivateMessage,
    ChannelMessage,
    textBox
  },
  props: {
    id: {
      type: String,
      required: false
    }
  },
  data() {
    return {
      workspaceId: this.id || null,
      messages: [],
      isLoading: false,
      currentMode: null, // 'channel', 'private' ou null
      selectedContactId: null,
      selectedContact: null,
      replyingToMessage: null,
      activeChannel: null,
      firstContactLoaded: false,
      currentUser: this.getCurrentUser()
    }
  },
  watch: {
    // Surveiller les changements d'ID de workspace dans l'URL
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && newId !== this.workspaceId) {
          this.workspaceId = newId;
          this.loadWorkspaceData();
        }
      }
    }
  },
  methods: {
    // Charger les données d'un workspace et ses messages
    async loadWorkspaceData() {
      if (!this.workspaceId) return;
      
      this.isLoading = true;
      try {
        // Réinitialiser les données
        this.messages = [];
        this.currentMode = 'channel';
        this.selectedContactId = null;
        this.selectedContact = null;
        
        // Charger les données du workspace
        const workspaceService = await import('../services/workspaceService.js');
        const response = await workspaceService.default.getWorkspaceById(this.workspaceId);
        
        if (response && response.data) {
          // Si le workspace a des canaux par défaut, charger leurs messages
          if (response.data.canaux && response.data.canaux.length > 0) {
            const messageService = await import('../services/messageService.js');
            const defaultChannel = response.data.canaux[0];
            this.activeChannel = defaultChannel;
            const messagesResponse = await messageService.default.getCanalMessages(this.workspaceId, defaultChannel._id);
            this.messages = messagesResponse || [];
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du workspace:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Gérer la sélection d'un contact dans la liste d'amis
    async handleContactSelect(data) {
      console.log('Contact sélectionné:', data);
      
      // Mettre à jour le mode et les informations du contact
      this.currentMode = 'private';
      this.selectedContactId = data.contactId;
      this.selectedContact = data.contact;
      this.workspaceId = null;
      
      // Charger les messages privés avec ce contact
      await this.loadPrivateMessages(data.contactId);
    },
    
    // Charger les messages privés pour un contact
    async loadPrivateMessages(contactId) {
      if (!contactId) return;
      
      this.isLoading = true;
      this.messages = [];
      
      try {
        // Appeler l'API pour obtenir les messages privés
        const messagesResponse = await messagePrivateService.getPrivateMessages(contactId);
        console.log('Messages privés reçus:', messagesResponse);
        
        // Vérifier le format de la réponse et traiter les messages
        if (messagesResponse) {
          // Si nous avons reçu un tableau directement
          if (Array.isArray(messagesResponse)) {
            this.messages = this.formatPrivateMessages(messagesResponse);
          } 
          // Si nous avons reçu un objet avec une propriété data ou messages
          else if (messagesResponse.data && Array.isArray(messagesResponse.data)) {
            this.messages = this.formatPrivateMessages(messagesResponse.data);
          }
          else if (messagesResponse.messages && Array.isArray(messagesResponse.messages)) {
            this.messages = this.formatPrivateMessages(messagesResponse.messages);
          }
          
          console.log('Messages formatés pour affichage:', this.messages);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des messages privés:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Formatter les messages privés pour les rendre compatibles avec le composant Message
    formatPrivateMessages(messages) {
      return messages.map(msg => {
        // Vérifier si les propriétés nécessaires existent
        const expediteur = msg.expediteur || {};
        const destinataire = msg.destinataire || {};
        
        return {
          _id: msg._id,
          contenu: msg.contenu,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          modifie: msg.updatedAt !== msg.createdAt,
          lu: msg.lu,
          auteur: {
            _id: expediteur._id || msg.expediteur,
            username: expediteur.username || '',
            firstName: expediteur.prenom || expediteur.firstName || '',
            lastName: expediteur.nom || expediteur.lastName || '',
            profilePicture: expediteur.profilePicture
          },
          // Pour maintenir la compatibilité avec le composant Message
          canal: { _id: 'private_' + (destinataire._id || msg.destinataire) }
        };
      });
    },
    
    // Gérer l'envoi d'un message privé
    handleMessageSent(message) {
      console.log('Message privé envoyé:', message);
      
      // Rafraîchir les messages privés
      if (this.currentMode === 'private' && this.selectedContactId) {
        this.loadPrivateMessages(this.selectedContactId);
      }
    },
    
    // Gérer la suppression d'un message
    handleMessageDeleted(messageId) {
      console.log('Message supprimé:', messageId);
      
      // Supprimer le message de la liste locale
      this.messages = this.messages.filter(message => message._id !== messageId);
      
      // Rafraîchir les messages depuis le serveur
      this.fetchMessages();
    },
    
    // Gérer la mise à jour d'un message
    handleMessageUpdated({ messageId, content }) {
      console.log('Message mis à jour:', messageId, content);
      
      // Mettre à jour le message dans la liste locale
      const messageIndex = this.messages.findIndex(message => message._id === messageId);
      if (messageIndex !== -1) {
        this.messages[messageIndex].contenu = content;
        this.messages[messageIndex].modifie = true;
      }
      
      // Rafraîchir les messages depuis le serveur
      this.fetchMessages();
    },
    
    // Gérer l'ajout d'une réaction
    handleReactionAdded({ messageId, emoji }) {
      console.log('Réaction ajoutée:', messageId, emoji);
      
      // Rafraîchir les messages depuis le serveur
      this.fetchMessages();
    },
    
    // Obtenir le canal actif en fonction du mode (privé ou canal)
    getActiveChannel() {
      if (this.currentMode === 'private' && this.selectedContactId) {
        return {
          _id: this.selectedContactId,
          type: 'private'
        };
      } else if (this.activeChannel) {
        return {
          _id: this.activeChannel._id,
          type: 'channel'
        };
      }
      return null;
    },
    
    // Définir le message auquel on répond
    setReplyingToMessage(message) {
      this.replyingToMessage = message;
    },
    
    // Obtenir le nom d'affichage d'un contact
    getContactName(contact) {
      if (!contact) return 'Contact';
      
      if (contact.firstName && contact.lastName) {
        return `${contact.firstName} ${contact.lastName}`;
      } else if (contact.prenom && contact.nom) {
        return `${contact.prenom} ${contact.nom}`;
      } else if (contact.username) {
        return contact.username;
      }
      
      return 'Contact';
    },
    
    /**
     * Rafraîchir les messages selon le mode actuel (canal ou privé)
     */
    fetchMessages() {
      if (this.currentMode === 'private' && this.selectedContactId) {
        this.loadPrivateMessages(this.selectedContactId);
      } else if (this.currentMode === 'channel' && this.activeChannel) {
        this.loadChannelMessages(this.activeChannel._id);
      }
    },
    
    /**
     * Récupérer les informations de l'utilisateur connecté depuis le token JWT
     */
    getCurrentUser() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return { _id: null };
        
        // Décoder le token JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
      } catch (err) {
        console.error('Erreur lors du décodage du token:', err);
        return { _id: null };
      }
    }
  }
};
</script>

<style scoped>
.home {
  margin-left: calc(var(--whidth-header) + var(--whidth-friendsList));
  height: 100vh;
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  padding-bottom: 200px;
  position: relative;
}

/* Styles pour l'en-tête de contact privé */
.private-header {
  background-color: var(--secondary-color);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  right: 0;
  left: calc(var(--whidth-header) + var(--whidth-friendsList));
  z-index: 10;
  margin-bottom: 10px;
}

.contact-info {
  display: flex;
  align-items: center;
}

.contact-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  margin-right: 15px;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--secondary-color);
}

.status-indicator.online {
  background-color: #43b581;
}

.status-indicator.offline {
  background-color: #747f8d;
}

.status-indicator.idle {
  background-color: #faa61a;
}

.status-indicator.dnd {
  background-color: #f04747;
}

.contact-name {
  font-weight: bold;
  font-size: 16px;
  color: var(--text-color);
}
</style>
