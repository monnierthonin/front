<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Membres du workspace "{{ workspaceName }}"</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="modal-loading">
          Chargement des membres...
        </div>
        
        <div v-else-if="members.length === 0" class="modal-loading">
          Aucun membre trouvé dans ce workspace
        </div>
        
        <div v-else class="user-list">
          <div 
            v-for="member in members" 
            :key="member.id" 
            class="user-item"
          >
            <div class="user-info">
              <img 
                :src="member.profileImage || '../../assets/styles/image/profilDelault.png'" 
                :alt="member.username" 
                class="small-avatar"
              />
              <span class="member-name">{{ member.username }}</span>
              <span class="member-role">{{ member.role || 'user' }}</span>
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
  name: 'WorkspaceMembersModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    workspaceName: {
      type: String,
      default: ''
    },
    members: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close']
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

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  background: var(--background-list-message);
}

.user-item:hover {
  background-color: #32353a;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.small-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.member-name {
  color: #fff;
  flex: 1;
}

.member-role {
  color: #ccc;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
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
