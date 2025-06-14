<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Canaux du workspace "{{ workspaceName }}"</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="modal-loading">
          Chargement des canaux...
        </div>
        
        <div v-else-if="channels.length === 0" class="modal-loading">
          Aucun canal trouvé dans ce workspace
        </div>
        
        <div v-else class="channels-list">
          <div 
            v-for="channel in channels" 
            :key="channel.id" 
            class="channel-item"
          >
            <div class="channel-info">
              <span class="channel-icon">#</span>
              <span class="channel-name" @click="startEditing(channel)" :class="{ 'editable': true }">
                <template v-if="editingChannel && editingChannel.id === channel.id">
                  <input 
                    type="text" 
                    v-model="editingName" 
                    @keyup.enter="saveChannelName(channel)" 
                    @blur="saveChannelName(channel)" 
                    @click.stop 
                    class="channel-name-input" 
                    ref="channelNameInput"
                  />
                </template>
                <template v-else>
                  {{ channel.nom || channel.name }}
                </template>
              </span>
              <span class="channel-type" :class="{ 'private': channel.type === 'private' }">
                {{ channel.type || 'public' }}
              </span>
              <div class="channel-actions">
                <button class="cancel-button view-button" title="Voir les messages" @click.stop="$emit('view-messages', channel)">
                  Messages
                </button>
                <button class="delete-button" title="Supprimer le canal" @click.stop="$emit('delete-channel', channel)">
                  <img src="../../assets/styles/image/ban.png" alt="delete" class="action-icon">
                </button>
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
  name: 'WorkspaceChannelsModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    workspaceName: {
      type: String,
      default: ''
    },
    channels: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editingChannel: null,
      editingName: ''
    };
  },
  methods: {
    startEditing(channel) {
      this.editingChannel = channel;
      this.editingName = channel.nom || channel.name || '';
      // Attendre que l'input soit rendu
      this.$nextTick(() => {
        if (this.$refs.channelNameInput) {
          this.$refs.channelNameInput.focus();
        }
      });
    },
    saveChannelName(channel) {
      if (this.editingName && this.editingName !== (channel.nom || channel.name)) {
        this.$emit('update-channel', { ...channel, nom: this.editingName });
      }
      this.editingChannel = null;
    }
  },
  watch: {
    show(newValue) {
      if (!newValue) {
        // Réinitialiser l'édition lors de la fermeture de la modal
        this.editingChannel = null;
        this.editingName = '';
      }
    }
  },
  emits: ['close', 'delete-channel', 'view-messages', 'update-channel']
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
  max-width: 500px;
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

.channels-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.channel-item {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  background: #39393f;
}

.channel-item:hover {
  background-color: #32353a;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.channel-icon {
  color: #72767d;
  font-weight: bold;
  font-size: 18px;
}

.channel-name {
  color: #fff;
  flex: 1;
  position: relative;
  cursor: pointer;
}

.channel-name.editable:hover::after {
  content: '✏️';
  font-size: 12px;
  margin-left: 5px;
  opacity: 0.7;
}

.channel-name-input {
  background-color: #40444b;
  border: 1px solid #72767d;
  border-radius: 3px;
  padding: 4px 8px;
  color: #fff;
  width: 100%;
  font-size: 14px;
  outline: none;
}

.channel-name-input:focus {
  border-color: #7289da;
}

.channel-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.view-button.cancel-button {
  padding: 4px 12px;
  font-size: 0.9rem;
  margin: 0;
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

.view-button:hover,
.delete-button:hover {
  opacity: 0.8;
}

.action-icon {
  width: 24px;
  height: 24px;
}

.channel-type {
  color: #43b581;
  background: rgba(67, 181, 129, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.channel-type.private {
  color: #ff7675;
  background: rgba(255, 118, 117, 0.1);
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
