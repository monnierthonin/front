<template>
  <div class="workspace-info">
    <div class="containerSetting">
      <div class="settings">
        <h2 class="owner" v-if="workspace && workspace.proprietaire">{{ getOwnerName }}</h2>
        
        <div v-if="workspace" class="editable-field">
          <h2 v-if="!isEditing || !isOwner" class="name">{{ workspace.nom || workspace.name }}</h2>
          <input 
            v-else 
            type="text" 
            v-model="editedWorkspace.nom" 
            class="name-input" 
            placeholder="Nom du workspace"
          />
        </div>
      </div>
    </div>
    
    <div class="containerSettingWorkspace" v-if="workspace">
      <div class="statusComponent">
        <button 
          class="status-button" 
          @click="toggleStatusMenu" 
          :disabled="!(isOwner || isAdmin) || !isEditing"
        >
          <span class="status-indicator" :class="statusColor"></span>
          {{ statusLabel }}
        </button>
      
        <ul v-if="showStatusMenu && (isOwner || isAdmin)" class="status-menu">
          <li @click="setStatus('prive')">
            <span class="status-indicator orange"></span> Privé
          </li>
          <li @click="setStatus('public')">
            <span class="status-indicator green"></span> Publique
          </li>
        </ul>
      </div>
      
      <div class="editable-field">
        <p v-if="!isEditing || !(isOwner || isAdmin)" class="description">
          Description : {{ workspace.description || 'Aucune description disponible' }}
        </p>
        <textarea 
          v-else 
          v-model="editedWorkspace.description" 
          class="description-input" 
          placeholder="Description du workspace"
        ></textarea>
      </div>
    </div>
    
    <div v-if="isOwner || isAdmin" class="edit-controls">
      <button 
        v-if="!isEditing" 
        @click="startEditing" 
        class="edit-button"
      >
        Modifier
      </button>
      <button 
        v-else 
        @click="saveChanges" 
        class="save-button"
        :disabled="isSaving"
      >
        {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
      <button 
        v-if="isEditing" 
        @click="cancelEditing" 
        class="cancel-button"
      >
        Annuler
      </button>
    </div>
  </div>
</template>

<script>
import workspaceService from '../../services/workspaceService';
import { getCurrentUserIdAsync } from '../../utils/userUtils';

export default {
  name: 'WorkspaceInfo',
  props: {
    workspace: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      userId: null,
      isEditing: false,
      showStatusMenu: false,
      editedWorkspace: {
        nom: '',
        description: '',
        isPublic: false
      },
      isLoading: false,
      error: null,
      isSaving: false
    };
  },
  computed: {
    status() {
      if (this.isEditing && this.editedWorkspace.hasOwnProperty('isPublic')) {
        return this.editedWorkspace.isPublic ? 'public' : 'prive';
      }
      
      if (this.workspace && this.workspace.visibilite) {
        return this.workspace.visibilite; 
      } else if (this.workspace && this.workspace.estPublic !== undefined) {
        return this.workspace.estPublic ? 'public' : 'prive';
      }
      return 'prive';
    },

    statusLabel() {
      return {
        prive: "Privé",
        public: "Publique",
      }[this.status] || "Privé";
    },

    statusColor() {
      return {
        prive: "orange",
        public: "green",
      }[this.status] || "orange";
    },

    getOwnerName() {
      if (this.workspace && this.workspace.proprietaire) {
        if (typeof this.workspace.proprietaire === 'object') {
          return this.workspace.proprietaire.nom || this.workspace.proprietaire.username || 'Propriétaire';
        } else {
          return 'Propriétaire';
        }
      }
      return 'Propriétaire';
    },
    isOwner() {
      if (!this.workspace || !this.workspace.proprietaire) return false;
      
      const userId = this.getUserId();
      if (!userId) return false;
      
      if (typeof this.workspace.proprietaire === 'object') {
        const ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
        return userId === ownerId;
      }
      
      return userId === this.workspace.proprietaire;
    },
    isAdmin() {
      if (!this.workspace) return false;
      
      const userId = this.getUserId();
      if (!userId) return false;
      
      if (this.isOwner) return true;
      
      const membres = this.workspace.membres || this.workspace.users || [];
  const currentUser = membres.find(membre => {
    const membreId = membre._id || membre.id || membre.userId;
    return membreId === userId;
  });
  
  if (!currentUser) return false;
  
  const userRole = currentUser.role || currentUser.rôle || currentUser.Role || currentUser.Rôle;
  return userRole === 'admin';
    }
  },
  async created() {
    try {
      this.userId = await this.getUserIdAsync();
    } catch (error) {
      console.error('WorkspaceInfo.vue created(): Erreur lors du chargement de l\'ID utilisateur:', error);
    }
  },
  methods: {
    toggleStatusMenu() {
      if (!this.isOwner || !this.isEditing) return;
      
      this.showStatusMenu = !this.showStatusMenu;
      
      if (this.showStatusMenu) {
        setTimeout(() => {
          document.addEventListener('click', this.closeStatusMenu);
        }, 0);
      }
    },
    
    async setStatus(newStatus) {
      if (!this.isOwner || !this.isEditing) return;
      
      this.showStatusMenu = false;
      
      document.removeEventListener('click', this.closeStatusMenu);
      
      if (this.status === newStatus) return;
      
      const isPublic = newStatus === 'public';
      
      this.editedWorkspace.isPublic = isPublic;
    },
    
    async getUserIdAsync() {
      try {
        const userId = await getCurrentUserIdAsync();
        return userId;
      } catch (error) {
        console.error('WorkspaceInfo.vue: Erreur lors de la récupération de l\'ID utilisateur:', error);
        return null;
      }
    },
    
    getUserId() {
      return this.userId || null;
    },
    
    startEditing() {
      this.editedWorkspace = {
        nom: this.workspace.nom || this.workspace.name || '',
        description: this.workspace.description || '',
        isPublic: this.status === 'public'
      };
      this.isEditing = true;
    },
    
    closeStatusMenu(event) {
      const statusComponent = document.querySelector('.statusComponent');
      if (statusComponent && !statusComponent.contains(event.target)) {
        this.showStatusMenu = false;
        document.removeEventListener('click', this.closeStatusMenu);
      }
    },
    
    cancelEditing() {
      this.isEditing = false;
      this.showStatusMenu = false;
      document.removeEventListener('click', this.closeStatusMenu);
    },
    
    async saveChanges() {
      if (!this.isOwner) return;
      
      this.isSaving = true;
      
      try {
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspace._id || this.workspace.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            nom: this.editedWorkspace.nom,
            description: this.editedWorkspace.description,
            visibilite: this.editedWorkspace.isPublic ? 'public' : 'prive'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
        }
        
        const data = await response.json();
        
        this.$emit('update:workspace', {
          ...this.workspace,
          nom: this.editedWorkspace.nom,
          name: this.editedWorkspace.nom,
          description: this.editedWorkspace.description
        });
        
        this.isEditing = false;
      } catch (error) {
        console.error('Erreur lors de la mise à jour du workspace:', error);
        alert(`Erreur: ${error.message}`);
      } finally {
        this.isSaving = false;
      }
    }
  }
}
</script>

<style scoped>
.workspace-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.containerSetting {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20%;
}

.containerSettingWorkspace {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 30px;
}

.description {
  width: 90%;
}

.editable-field {
  position: relative;
  margin-bottom: 15px;
  width: 100%;
}

.name-input {
  width: 100%;
  padding: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background-color: var(--background-primary);
  border: 1px solid var(--secondary-color-transition);
  border-radius: 5px;
  margin-bottom: 10px;
}

.description-input {
  width: 90%;
  height: 100px;
  padding: 10px;
  color: #fff;
  background-color: var(--background-primary);
  border: 1px solid var(--secondary-color-transition);
  border-radius: 5px;
  resize: vertical;
  font-family: inherit;
}

/* Les styles pour les boutons radios ont été retirés - utiliser le status-button existant */

.edit-controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.edit-button, .save-button, .cancel-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  border: none;
}

.edit-button {
  background-color: #555;
  color: white;
}

.save-button {
  background-color: #4CAF50;
  color: white;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Conteneur compact */
.statusComponent {
  display: inline-block;
  position: relative;
  align-self: flex-start;
  margin-bottom: 15px;
}

/* Bouton compact */
.status-button {
  display: flex;
  align-items: center;
  background: var(--background-primary);
  color: var(--text-primary);
  padding: 8px 12px;
  border: 1px solid var(--secondary-color-transition);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.status-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-button:hover:not(:disabled) {
  background: var(--secondary-color-transition);
}

/* Pastille de statut */
.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.green { background: green; }
.orange { background: orange; }

/* Menu déroulant */
.status-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  background: var(--background-primary);
  border: 1px solid var(--secondary-color-transition);
  border-radius: 4px;
  list-style: none;
  padding: 0;
  margin: 5px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.status-menu li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.status-menu li:hover {
  background: var(--secondary-color-transition);
}
</style>
