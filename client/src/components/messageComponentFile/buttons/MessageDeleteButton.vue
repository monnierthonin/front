<template>
  <button class="action-btn" @click="handleDelete">
    <img src="../../../assets/styles/image/delet.png" alt="Delete" />
  </button>
</template>

<script>
import messageService from '../../../services/messageService.js';
import messagePrivateService from '../../../services/messagePrivateService.js';

export default {
  name: 'MessageDeleteButton',
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
    async handleDelete() {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        return;
      }

      try {
        if (!this.isPrivate) {
          // Message d'un canal standard
          const workspaceId = this.$route.params.id;
          const canalId = this.message.canal;
          const messageId = this.message._id || this.message.id;
          
          console.log('Suppression de message de canal:', { workspaceId, canalId, messageId });
          
          await messageService.deleteMessage(
            workspaceId,
            canalId,
            messageId
          );
        } else {
          // Message privé
          // Utiliser la propriété conversationId au lieu de dépendre des paramètres de route
          const messageId = this.message._id || this.message.id;
          
          // Vérifier que conversationId est défini
          if (!this.conversationId) {
            console.error('Impossible de supprimer le message privé: ID de conversation manquant');
            throw new Error('ID de conversation manquant. Impossible de supprimer le message.');
          }
          
          console.log('Suppression de message privé:', { 
            conversationId: this.conversationId, 
            messageId: messageId 
          });
          
          await messagePrivateService.deletePrivateMessage(
            this.conversationId,
            messageId
          );
        }
        
        this.$emit('message-deleted', this.message._id);
      } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
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
