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
    }
  },
  methods: {
    async handleDelete() {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        return;
      }

      try {
        if (!this.isPrivate) {
          await messageService.deleteMessage(
            this.$route.params.id,
            this.message.canal,
            this.message._id
          );
        } else {
          await messagePrivateService.deletePrivateMessage(
            this.$route.params.conversationId,
            this.message._id
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
