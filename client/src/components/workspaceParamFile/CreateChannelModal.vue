<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h3>Créer un nouveau canal</h3>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <form @submit.prevent="createChannel">
        <div class="form-group">
          <label for="channel-name">Nom du canal :</label>
          <input 
            id="channel-name" 
            type="text" 
            v-model="channelName" 
            placeholder="Nom du canal" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="channel-type">Type de canal :</label>
          <select id="channel-type" v-model="channelType">
            <option value="texte">Texte</option>
            <option value="vocal">Vocal</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="channel-visibility">Visibilité :</label>
          <select id="channel-visibility" v-model="channelVisibility">
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="button" class="cancel-button" @click="closeModal">Annuler</button>
          <button type="submit" class="create-button" :disabled="isLoading">
            <span v-if="isLoading">Création en cours...</span>
            <span v-else>Créer le canal</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateChannelModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    workspaceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      channelName: '',
      channelType: 'texte',
      channelVisibility: 'public',
      isLoading: false,
      error: null
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    
    resetForm() {
      this.channelName = '';
      this.channelType = 'texte';
      this.channelVisibility = 'public';
      this.error = null;
      this.isLoading = false;
    },
    
    async createChannel() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nom: this.channelName,
            type: this.channelType,
            visibilite: this.channelVisibility
          })
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors de la création du canal: ${response.status}`);
        }
        
        const newChannel = await response.json();
        
        // Émettre l'événement pour informer le parent
        this.$emit('channel-created', newChannel);
        
        // Réinitialiser le formulaire
        this.resetForm();
        
        // Fermer le modal
        this.closeModal();
      } catch (err) {
        console.error('Erreur lors de la création du canal:', err);
        this.error = err.message || "Impossible de créer le canal";
      } finally {
        this.isLoading = false;
      }
    }
  },
  watch: {
    show(newValue) {
      if (newValue) {
        // Réinitialiser le formulaire quand le modal s'ouvre
        this.resetForm();
      }
    }
  }
}
</script>

<style scoped>
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

.modal-content {
  background-color: #2b2d31;
  border-radius: 5px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
}

.modal-content h3 {
  color: #fff;
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #b9bbbe;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 4px;
  background-color: #36393f;
  border: 1px solid #202225;
  color: #dcddde;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #7289da;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-button,
.create-button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: none;
  transition: background-color 0.2s;
}

.cancel-button {
  background-color: #4f545c;
  color: #fff;
}

.create-button {
  background-color: #7289da;
  color: #fff;
}

.cancel-button:hover {
  background-color: #5d6269;
}

.create-button:hover {
  background-color: #677bc4;
}

.create-button:disabled {
  background-color: #677bc4;
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  background-color: #f04747;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}
</style>
