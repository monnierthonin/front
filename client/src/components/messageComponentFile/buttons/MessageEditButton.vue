<template>
  <button class="action-btn" @click="handleEdit">
    <img src="../../../assets/styles/image/modifier.png" alt="Edit" />
  </button>
</template>

<script>
import messageService from '../../../services/messageService';
import messagePrivateService from '../../../services/messagePrivateService';

export default {
  name: 'MessageEditButton',
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
    async handleEdit() {
      this.$emit('edit-started', this.message);
    },
    
    async saveEdit(newContent) {
      try {
        if (!this.isPrivate) {
          const workspaceId = this.$route.params.id;
          const canalId = this.message.canal;
          const messageId = this.message._id || this.message.id;
          
          await messageService.updateMessage(
            workspaceId,
            canalId,
            messageId,
            newContent.trim()
          );
        } else {
          const messageId = this.message._id || this.message.id;
          
          if (!this.conversationId) {
            throw new Error('ID de conversation manquant. Impossible de modifier le message.');
          }
          
          await messagePrivateService.updatePrivateMessage(
            this.conversationId,
            messageId,
            newContent.trim()
          );
        }
        
        this.$emit('message-updated', {
          messageId: this.message._id,
          newContent: newContent.trim()
        });
      } catch (error) {
        console.error('Erreur lors de la modification du message:', error);
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
