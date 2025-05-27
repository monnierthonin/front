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
          // Message d'un canal standard
          const workspaceId = this.$route.params.id;
          const canalId = this.message.canal;
          
          if (!messageId || !canalId) {
            console.error('Message invalide pour la réponse:', { messageId, canalId, message: this.message });
            return;
          }
          
          console.log('Réponse à un message de canal:', { workspaceId, canalId, messageId });
          
          response = await messageService.replyToMessage(
            workspaceId,
            canalId,
            messageId,
            content.trim()
          );
        } else {
          // Message privé
          // Utiliser la propriété conversationId au lieu de dépendre des paramètres de route
          if (!messageId) {
            console.error('Message invalide pour la réponse privée:', this.message);
            return;
          }
          
          // Vérifier que conversationId est défini
          if (!this.conversationId) {
            console.error('Impossible de répondre au message privé: ID de conversation manquant');
            throw new Error('ID de conversation manquant. Impossible de répondre au message.');
          }
          
          console.log('Réponse à un message privé:', { 
            conversationId: this.conversationId, 
            messageId: messageId 
          });
          
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
