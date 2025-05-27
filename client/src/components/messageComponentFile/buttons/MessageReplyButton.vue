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
    }
  },
  methods: {
    handleReply() {
      this.$emit('reply-started', this.message);
    },
    
    async sendReply(content) {
      if (!content || !content.trim()) {
        console.error('Contenu de la réponse vide');
        return;
      }

      try {
        let response;
        
        if (!this.isPrivate) {
          if (!this.message._id || !this.message.canal) {
            console.error('Message invalide pour la réponse:', this.message);
            return;
          }
          response = await messageService.replyToMessage(
            this.$route.params.id,
            this.message.canal,
            this.message._id,
            content.trim()
          );
        } else {
          if (!this.message._id) {
            console.error('Message invalide pour la réponse privée:', this.message);
            return;
          }
          response = await messagePrivateService.replyToPrivateMessage(
            this.$route.params.conversationId,
            this.message._id,
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
