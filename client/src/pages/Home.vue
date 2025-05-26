<template>
  <FriendsList :workspaceId="workspaceId" />
  <div class="home">
    <!-- Afficher les messages de canal ou les messages privés selon le mode actif -->
    <Message 
      v-if="!showPrivateMessages" 
      :workspaceId="workspaceId" 
      :messages="messages" 
      :isLoading="isLoading" 
    />
    <PrivateMessage 
      v-else 
      :userId="selectedUserId" 
      :conversationId="selectedConversationId"
      :targetUser="selectedTargetUser" 
      @update:conversationId="updateConversationId"
    />
    
    <!-- N'afficher la zone de texte que pour les messages de canal -->
    <textBox 
      v-if="!showPrivateMessages" 
      :workspaceId="workspaceId"
      :canalActif="currentChannel"
      @send-message="sendChannelMessage"
      @refresh-messages="refreshChannelMessages"
    />
  </div>
</template>

<script>
import FriendsList from '../components/headerFile/FriendsList.vue'
import Message from '../components/messageComponentFile/Message.vue'
import textBox from '../components/messageComponentFile/textBox.vue'
import PrivateMessage from '../components/messageComponentFile/PrivateMessage.vue'

export default {
  name: 'Home',
  components: {
    FriendsList,
    Message,
    textBox,
    PrivateMessage
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
      showPrivateMessages: false,
      selectedUserId: null,
      selectedConversationId: null,
      selectedTargetUser: null,
      currentChannel: null, // Canal actif actuel
      currentChannelId: null // ID du canal actif
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
  mounted() {
    // Écouter l'événement pour ouvrir une conversation privée
    document.addEventListener('open-private-conversation', this.handlePrivateConversation);
    
    // Écouter l'événement pour changer de canal actif
    document.addEventListener('change-active-channel', this.handleChannelChange);
  },
  
  beforeUnmount() {
    // Nettoyer les écouteurs d'événements
    document.removeEventListener('open-private-conversation', this.handlePrivateConversation);
    document.removeEventListener('change-active-channel', this.handleChannelChange);
  },
  
  methods: {
    /**
     * Gérer le changement de canal actif
     * @param {CustomEvent} event - L'événement contenant les détails du canal
     */
    handleChannelChange(event) {
      const { channel } = event.detail;
      
      console.log('Changement de canal actif:', channel);
      
      this.currentChannel = channel;
      this.currentChannelId = channel?._id || null;
      
      // Si nous avons un canal actif, charger ses messages
      if (this.currentChannel && this.workspaceId) {
        this.loadChannelMessages(this.workspaceId, this.currentChannel._id);
      }
    },
    
    /**
     * Envoyer un message dans le canal actif
     * @param {String} messageText - Texte du message à envoyer
     */
    async sendChannelMessage(messageText) {
      if (!this.workspaceId || !this.currentChannelId || !messageText.trim()) {
        console.error('Impossible d\'envoyer le message: informations manquantes');
        return;
      }
      
      try {
        console.log(`Envoi de message au canal ${this.currentChannelId}:`, messageText);
        
        // Importer dynamiquement le service de messages
        const messageService = await import('../services/messageService.js');
        
        // Envoyer le message
        await messageService.default.sendMessage(this.workspaceId, this.currentChannelId, messageText);
        
        // Recharger les messages après l'envoi
        this.refreshChannelMessages();
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      }
    },
    
    /**
     * Rafraîchir les messages du canal actif
     */
    async refreshChannelMessages() {
      if (this.workspaceId && this.currentChannelId) {
        await this.loadChannelMessages(this.workspaceId, this.currentChannelId);
      }
    },
    
    /**
     * Charger les messages d'un canal spécifique
     * @param {String} workspaceId - ID du workspace
     * @param {String} channelId - ID du canal
     */
    async loadChannelMessages(workspaceId, channelId) {
      this.isLoading = true;
      try {
        const messageService = await import('../services/messageService.js');
        const messagesResponse = await messageService.default.getCanalMessages(workspaceId, channelId);
        this.messages = messagesResponse || [];
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        this.messages = [];
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Gérer l'ouverture d'une conversation privée
     * @param {CustomEvent} event - L'événement contenant les détails de la conversation
     */
    handlePrivateConversation(event) {
      const { userId, conversationId, targetUser } = event.detail;
      
      console.log('Conversation privée demandée:', {
        userId,
        conversationId: conversationId || 'Non disponible',
        targetUserName: targetUser ? (targetUser.username || targetUser.nom || 'Inconnu') : 'Inconnu'
      });
      
      // Définir les propriétés pour la conversation privée
      this.selectedUserId = userId;
      this.selectedConversationId = conversationId;
      this.selectedTargetUser = targetUser;
      this.showPrivateMessages = true;
    },
    
    /**
     * Revenir à l'affichage des messages de canal
     */
    returnToChannelMessages() {
      this.showPrivateMessages = false;
      this.selectedUserId = null;
      this.selectedTargetUser = null;
    },
    
    /**
     * Met à jour l'ID de conversation lorsque le composant PrivateMessage le signale
     * @param {String} newConversationId - Nouvel ID de conversation
     */
    updateConversationId(newConversationId) {
      console.log('Mise à jour de l\'ID de conversation:', newConversationId);
      this.selectedConversationId = newConversationId;
    },
    
    async loadWorkspaceData() {
      if (!this.workspaceId) return;
      
      this.isLoading = true;
      try {
        // Réinitialiser les données du workspace précédent
        this.messages = [];
        
        // Charger les données du nouveau workspace
        const workspaceService = await import('../services/workspaceService.js');
        const response = await workspaceService.default.getWorkspaceById(this.workspaceId);
        
        if (response && response.data) {
          // Mettre à jour les données du workspace
          
          // Si le workspace a des canaux par défaut, charger leurs messages
          if (response.data.canaux && response.data.canaux.length > 0) {
            const messageService = await import('../services/messageService.js');
            const defaultChannel = response.data.canaux[0];
            const messagesResponse = await messageService.default.getCanalMessages(this.workspaceId, defaultChannel._id);
            this.messages = messagesResponse || [];
          }
        }
      } catch (error) {
        // Gestion silencieuse des erreurs
      } finally {
        this.isLoading = false;
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
}
</style>
