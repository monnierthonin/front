<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Modifier le Workspace</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="modal-loading">
          Chargement...
        </div>
        
        <form v-else @submit.prevent="saveWorkspace" class="edit-workspace-form">
          <div class="form-group">
            <label for="workspace-name">Nom du workspace</label>
            <input 
              id="workspace-name" 
              v-model="formData.name" 
              type="text" 
              class="form-input" 
              placeholder="Nom du workspace"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="workspace-description">Description</label>
            <textarea 
              id="workspace-description" 
              v-model="formData.description" 
              class="form-textarea" 
              placeholder="Description du workspace"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="workspace-visibility">Visibilité</label>
            <select id="workspace-visibility" v-model="formData.visibility" class="form-select">
              <option value="public">Public</option>
              <option value="private">Privé</option>
            </select>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">
          Annuler
        </button>
        <button class="save-button" @click="saveWorkspace" :disabled="loading">
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkspaceEditModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    workspace: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: {
        name: '',
        description: '',
        visibility: 'public'
      }
    };
  },
  watch: {
    workspace: {
      immediate: true,
      handler(newWorkspace) {
        if (newWorkspace && newWorkspace.id) {
          this.formData = {
            name: newWorkspace.name || '',
            description: newWorkspace.description || '',
            visibility: newWorkspace.visibility || 'public'
          };
        }
      }
    }
  },
  methods: {
    saveWorkspace() {
      if (!this.formData.name.trim()) {
        alert('Le nom du workspace est requis');
        return;
      }
      
      this.$emit('save', {
        id: this.workspace.id,
        ...this.formData
      });
    }
  },
  emits: ['close', 'save']
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

.edit-workspace-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #b9bbbe;
  font-size: 14px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 10px;
  background-color: #40444b;
  border: 1px solid #202225;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #7289da;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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

.save-button {
  padding: 8px 16px;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 500;
  background-color: #5865f2;
  color: #fff;
  border: none;
}

.save-button:hover {
  background-color: #4752c4;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
