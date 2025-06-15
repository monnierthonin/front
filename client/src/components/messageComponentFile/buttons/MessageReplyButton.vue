<template>
  <button class="action-btn" @click="handleReply">
    <img src="../../../assets/styles/image/repondre.png" alt="Reply" />
  </button>
</template>

<script>
import messageService from '../../../services/messageService.js';
import messagePrivateService from '../../../services/messagePrivateService.js';

export default {
  name: 'MessageReplyButton',
  props: {
    message: {
      type: Object,
      required: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    conversationId: {
      type: String,
      default: ''
    }
  },
  methods: {
    handleReply() {
      const messageId = this.message._id || this.message.id;
      if (!messageId) {
        console.error('Impossible de répondre : le message n\'a pas d\'ID valide', this.message);
        return;
      }
      
      const normalizedMessage = {
        ...this.message,
        _id: messageId,
        id: messageId
      };
      
      this.$emit('reply-started', normalizedMessage);
    },
    
    async sendReply(content) {
      if (!content || !content.trim()) {
        console.error('Contenu de la réponse vide');
        return;
      }

      try {
        let response;
        
        const messageId = this.message._id || this.message.id;
        
        if (!this.isPrivate) {
          const workspaceId = this.$route.params.id;
          const canalId = this.message.canal;
          
          if (!messageId || !canalId) {
            console.error('Message invalide pour la réponse:', { messageId, canalId, message: this.message });
            return;
          }
          
          response = await messageService.replyToMessage(
            workspaceId,
            canalId,
            messageId,
            content.trim()
          );
        } else {
          if (!messageId) {
            console.error('Message invalide pour la réponse privée:', this.message);
            return;
          }
          
          if (!this.conversationId) {
            console.error('Impossible de répondre au message privé: ID de conversation manquant');
            throw new Error('ID de conversation manquant. Impossible de répondre au message.');
          }
          
          response = await messagePrivateService.replyToPrivateMessage(
            this.conversationId,
            messageId,
            content.trim()
          );
        }

        if (response) {
          this.$emit('reply-sent', response);
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        alert(`Erreur: ${error.message}`);
      }
    }
  }
};
</script>

<style scoped>
.action-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.action-btn img {
  width: 16px;
  height: 16px;
}
</style>
