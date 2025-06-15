<template>
  <FriendsList :workspaceId="workspaceId" />
  <div class="home">
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
      currentChannel: null,
      currentChannelId: null
    }
  },
  watch: {
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
    document.addEventListener('open-private-conversation', this.handlePrivateConversation);
    document.addEventListener('change-active-channel', this.handleChannelChange);
  },
  
  beforeUnmount() {
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
      
      this.currentChannel = channel;
      this.currentChannelId = channel?._id || null;
      
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
        const messageService = await import('../services/messageService.js');
        
        await messageService.default.sendMessage(this.workspaceId, this.currentChannelId, messageText);
        
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
      this.selectedConversationId = newConversationId;
    },
    
    async loadWorkspaceData() {
      if (!this.workspaceId) return;
      
      this.isLoading = true;
      try {
        this.messages = [];
        const workspaceService = await import('../services/workspaceService.js');
        const response = await workspaceService.default.getWorkspaceById(this.workspaceId);
        
        if (response && response.data) {
          
          if (response.data.canaux && response.data.canaux.length > 0) {
            const messageService = await import('../services/messageService.js');
            const defaultChannel = response.data.canaux[0];
            const messagesResponse = await messageService.default.getCanalMessages(this.workspaceId, defaultChannel._id);
            this.messages = messagesResponse || [];
          }
        }
      } catch (error) {
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
}
</style>
