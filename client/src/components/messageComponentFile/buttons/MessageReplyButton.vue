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
      // Vérification que le message a un ID valide avant d'envoyer l'événement
      const messageId = this.message._id || this.message.id;
      if (!messageId) {
        console.error('Impossible de répondre : le message n\'a pas d\'ID valide', this.message);
        return;
      }
      
      // S'assurer que le message a un format d'ID cohérent avant de l'envoyer
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
        
        // Récupérer l'ID du message en tenant compte des deux formats possibles
        const messageId = this.message._id || this.message.id;
        
        if (!this.isPrivate) {
          if (!messageId || !this.message.canal) {
            console.error('Message invalide pour la réponse:', this.message);
            return;
          }
          response = await messageService.replyToMessage(
            this.$route.params.id,
            this.message.canal,
            messageId,
            content.trim()
          );
        } else {
          if (!messageId) {
            console.error('Message invalide pour la réponse privée:', this.message);
            return;
          }
          response = await messagePrivateService.replyToPrivateMessage(
            this.$route.params.conversationId,
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
