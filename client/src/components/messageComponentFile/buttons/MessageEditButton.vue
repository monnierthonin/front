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
    }
  },
  methods: {
    async handleEdit() {
      this.$emit('edit-started', this.message);
    },
    
    async saveEdit(newContent) {
      try {
        if (!this.isPrivate) {
          await messageService.updateMessage(
            this.$route.params.id,
            this.message.canal,
            this.message._id,
            newContent.trim()
          );
        } else {
          await messagePrivateService.updatePrivateMessage(
            this.$route.params.conversationId,
            this.message._id,
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
