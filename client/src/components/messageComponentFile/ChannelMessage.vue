<template>
  <div class="channel-message-container">
    <MessageBase
      :messages="messages"
      :isLoading="isLoading"
      :currentUserId="currentUserId" 
      messageType="channel"
      :workspaceId="workspaceId"
      @reply-to-message="handleReplyToMessage"
      @delete-message="handleDeleteMessage"
      @add-reaction="handleAddReaction"
      @update-message="handleUpdateMessage"
    />
    
    <InputBase
      :target="channel"
      :targetActive="!!channel"
      messageType="channel"
      :workspaceId="workspaceId"
      :replyingToMessage="replyingToMessage"
      @send-channel-message="sendChannelMessage"
      @reply-to-message="sendReplyToMessage"
      @cancel-reply="cancelReply"
      @refresh-messages="refreshMessages"
    />
  </div>
</template>

<script>
import MessageBase from '../common/MessageBase.vue';
import InputBase from '../common/InputBase.vue';
import messageService from '../../services/messageService';

export default {
  name: 'ChannelMessage',
  components: {
    MessageBase,
    InputBase
  },
  props: {
    channel: {
      type: Object,
      default: () => null
    },
    workspaceId: {
      type: String,
      default: ''
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
        // Format data for the API
        const payload = {
          contenu: data.contenu,
          parentMessageId: data.parentMessageId,
          canalId: data.targetId,
          workspaceId: data.workspaceId
        };
        
        // Emit event to parent to handle
        this.$emit('reply-to-message', payload);
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
        await messageService.deleteMessage(this.workspaceId, message.canal._id, message._id);
        
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
        // Call the API to add the reaction
        await messageService.reactToMessage(this.workspaceId, message.canal._id, message._id, emoji);
        
        // Emit event to parent to refresh messages
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
        if (!this.channel || !this.workspaceId) {
          throw new Error('Informations de canal et workspace manquantes');
        }
        
        // Call the API to update the message
        await messageService.updateMessage(this.workspaceId, this.channel._id, messageId, content);
        
        // Emit event to parent to refresh messages
        this.$emit('message-updated', { messageId, content });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error);
        alert('Erreur lors de la mise à jour du message');
      }
    },
    
    /**
     * Send a message to a channel
     */
    async sendChannelMessage(data) {
      // Emit event to parent to handle
      this.$emit('send-message', data);
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
.channel-message-container {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>
