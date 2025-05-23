<template>
  <div class="private-message-container">
    <MessageBase
      :messages="messages"
      :isLoading="isLoading"
      :currentUserId="currentUserId" 
      messageType="private"
      @reply-to-message="handleReplyToMessage"
      @delete-message="handleDeleteMessage"
      @add-reaction="handleAddReaction"
      @update-message="handleUpdateMessage"
    />
    
    <InputBase
      :target="target"
      :targetActive="!!target"
      messageType="private"
      :replyingToMessage="replyingToMessage"
      @send-private-message="sendPrivateMessage"
      @reply-to-message="sendReplyToMessage"
      @cancel-reply="cancelReply"
      @refresh-messages="refreshMessages"
    />
  </div>
</template>

<script>
import MessageBase from '../common/MessageBase.vue';
import InputBase from '../common/InputBase.vue';
import messagePrivateService from '../../services/messagePrivateService';

export default {
  name: 'PrivateMessage',
  components: {
    MessageBase,
    InputBase
  },
  props: {
    // Contact/user with whom the conversation is happening
    contactId: {
      type: String,
      default: ''
    },
    // Contact object with additional info
    contact: {
      type: Object,
      default: () => ({})
    },
    messages: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      replyingToMessage: null
    };
  },
  computed: {
    /**
     * Target for the message input
     */
    target() {
      // Format contact as a target for the InputBase component
      if (!this.contactId) return null;
      
      return {
        _id: this.contactId,
        type: 'private',
        name: this.contact.username || this.contact.prenom || 'Contact'
      };
    }
  },
  methods: {
    /**
     * Handle reply to message
     */
    handleReplyToMessage(message) {
      this.replyingToMessage = message;
    },
    
    /**
     * Send a reply to a message
     */
    async sendReplyToMessage(data) {
      try {
        // Not yet implemented in the API
        alert('La fonctionnalité de réponse aux messages privés n\'est pas encore disponible');
        
        // Emit event to parent to handle
        this.$emit('reply-sent', data);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
      }
    },
    
    /**
     * Handle delete message
     */
    async handleDeleteMessage(message) {
      try {
        // Call the API to delete the message
        await messagePrivateService.deletePrivateMessage(message._id);
        
        // Emit event to parent to refresh messages
        this.$emit('message-deleted', message._id);
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        alert('Erreur lors de la suppression du message');
      }
    },
    
    /**
     * Handle add reaction
     */
    async handleAddReaction({ message, emoji }) {
      try {
        // Not yet implemented in the API
        alert('La fonctionnalité d\'ajout de réaction aux messages privés n\'est pas encore disponible');
        
        // Emit event to parent to handle
        this.$emit('reaction-added', { messageId: message._id, emoji });
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
      }
    },
    
    /**
     * Handle update message
     */
    async handleUpdateMessage({ messageId, content }) {
      try {
        // Call the API to update the message
        await messagePrivateService.updatePrivateMessage(messageId, content);
        
        // Emit event to parent to refresh messages
        this.$emit('message-updated', { messageId, content });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error);
        alert('Erreur lors de la mise à jour du message');
      }
    },
    
    /**
     * Send a private message
     */
    async sendPrivateMessage(data) {
      try {
        const { targetId, content } = data;
        
        // Call the API to send the message
        await messagePrivateService.sendPrivateMessage(targetId, content);
        
        // Emit event to parent to handle
        this.$emit('message-sent', content);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message privé:', error);
        alert('Erreur lors de l\'envoi du message privé');
      }
    },
    
    /**
     * Cancel reply mode
     */
    cancelReply() {
      this.replyingToMessage = null;
    },
    
    /**
     * Refresh messages
     */
    refreshMessages() {
      this.$emit('refresh-messages');
    }
  }
};
</script>

<style scoped>
.private-message-container {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
