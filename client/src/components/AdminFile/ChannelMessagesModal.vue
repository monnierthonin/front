<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Messages du canal "{{ channelName }}"</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="modal-loading">
          Chargement des messages...
        </div>
        
        <div v-else-if="messages.length === 0" class="modal-loading">
          Aucun message trouvé dans ce canal
        </div>
        
        <div v-else class="messages-list">
          <div 
            v-for="message in messages" 
            :key="message.id" 
            class="message-item"
          >
            <div class="message-info">
              <div class="message-header">
                <span class="message-sender">{{ message.sender?.username || message.sender?.nom || 'Utilisateur' }}</span>
                <div class="message-actions">
                  <button class="delete-button" title="Supprimer le message" @click.stop="confirmDeleteMessage(message)">
                    <img src="../../assets/styles/image/ban.png" alt="delete" class="action-icon">
                  </button>
                  <span class="message-date">{{ formatDate(message.createdAt) }}</span>
                </div>
              </div>
              <div class="message-content">
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChannelMessagesModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    channelName: {
      type: String,
      default: ''
    },
    messages: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date)) return '';
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    confirmDeleteMessage(message) {
      if (confirm(`Êtes-vous sûr de vouloir supprimer ce message de ${message.sender?.username || message.sender?.nom || 'Utilisateur'} ?`)) {
        this.$emit('delete-message', message);
      }
    }
  },
  emits: ['close', 'delete-message']
}
</script>

<style scoped>
/* Styles pour le modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 90%;
  max-width: 600px;
  background-color: #36393f;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 15px 20px;
  background-color: #2f3136;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #222;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
}

.close-button:hover {
  color: #fff;
}

.modal-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-loading {
  padding: 10px 0;
  text-align: center;
  color: #aaa;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
  background: var(--background-list-message);
}

.message-item:hover {
  background-color: #32353a;
}

.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}

.action-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.delete-button:hover .action-icon {
  opacity: 1;
}

.message-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #fff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-sender {
  font-weight: bold;
  color: #fff;
}

.message-date {
  color: #72767d;
  font-size: 0.8rem;
}

.message-content {
  color: #dcddde;
  word-break: break-word;
}

.modal-footer {
  padding: 15px 20px;
  background-color: #2f3136;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #222;
}

.cancel-button {
  padding: 8px 16px;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  background-color: transparent;
  color: #fff;
  border: 1px solid #4f545c;
}

.cancel-button:hover {
  background-color: rgba(79, 84, 92, 0.3);
}
</style>
