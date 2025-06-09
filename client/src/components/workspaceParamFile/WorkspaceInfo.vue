<template>
  <div class="workspace-info">
    <div class="containerSetting">
      <div class="settings">
        <h2 class="owner" v-if="workspace && workspace.proprietaire">{{ getOwnerName }}</h2>
        
        <!-- Nom éditable pour le propriétaire, sinon affichage simple -->
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
      <!-- Bouton de statut placé à gauche de la page -->
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
      
      <!-- Description éditable pour le propriétaire, sinon affichage simple -->
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
      
      <!-- Note: Utiliser le bouton status-button existant pour changer le statut -->
    </div>
    
    <!-- Bouton d'édition et d'enregistrement pour le propriétaire et les admins -->
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
      // Si en mode édition, utiliser l'état temporaire
      if (this.isEditing && this.editedWorkspace.hasOwnProperty('isPublic')) {
        return this.editedWorkspace.isPublic ? 'public' : 'prive';
      }
      
      // Sinon utiliser le champ visibilite pour déterminer le statut
      if (this.workspace && this.workspace.visibilite) {
        return this.workspace.visibilite; // Utiliser directement la valeur de l'API
      } else if (this.workspace && this.workspace.estPublic !== undefined) {
        // Fallback sur estPublic si visibilite n'est pas disponible
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
      // Vérifier si l'utilisateur connecté est le propriétaire du workspace
      if (!this.workspace || !this.workspace.proprietaire) return false;
      
      const userId = this.getUserId();
      if (!userId) return false;
      
      // Si proprietaire est un objet avec un _id ou id
      if (typeof this.workspace.proprietaire === 'object') {
        const ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
        return userId === ownerId;
      }
      
      // Si proprietaire est directement l'ID
      return userId === this.workspace.proprietaire;
    },
    isAdmin() {
      // Vérifier si l'utilisateur a le rôle admin dans ce workspace
      if (!this.workspace) return false;
      
      const userId = this.getUserId();
      if (!userId) return false;
      
      // Si l'utilisateur est déjà identifié comme propriétaire, il a aussi les droits admin
      if (this.isOwner) return true;
      
      // Vérifier si l'utilisateur a le rôle admin dans ce workspace
  // Via l'API, cela peut être retourné dans workspace.membres ou workspace.users
  const membres = this.workspace.membres || this.workspace.users || [];
  const currentUser = membres.find(membre => {
    const membreId = membre._id || membre.id || membre.userId;
    return membreId === userId;
  });
  
  if (!currentUser) return false;
  
  // Vérifier les différentes possibilités de nommage du champ rôle
  const userRole = currentUser.role || currentUser.rôle || currentUser.Role || currentUser.Rôle;
  return userRole === 'admin';
    }
  },
  methods: {
    toggleStatusMenu() {
      // Uniquement le propriétaire en mode édition peut changer le statut
      if (!this.isOwner || !this.isEditing) return;
      
      // Inverser l'état du menu
      this.showStatusMenu = !this.showStatusMenu;
      
      // Si le menu est ouvert, ajouter un écouteur pour le fermer si on clique ailleurs
      if (this.showStatusMenu) {
        setTimeout(() => {
          document.addEventListener('click', this.closeStatusMenu);
        }, 0);
      }
    },
    
    async setStatus(newStatus) {
      // Uniquement le propriétaire en mode édition peut changer le statut
      if (!this.isOwner || !this.isEditing) return;
      
      // Fermer le menu déroulant
      this.showStatusMenu = false;
      // Supprimer l'écouteur de clic
      document.removeEventListener('click', this.closeStatusMenu);
      
      // Ne rien faire si le statut est déjà le même
      if (this.status === newStatus) return;
      
      const isPublic = newStatus === 'public';
      
      // Mettre à jour l'état local pour feedback immédiat
      this.editedWorkspace.isPublic = isPublic;
      
      // Note: La mise à jour réelle du statut sera faite lors de l'enregistrement du formulaire
      console.log(`Statut changé localement à: ${newStatus}`);
    },

    
    getUserId() {
      // Récupérer l'ID de l'utilisateur connecté depuis le token
      const token = localStorage.getItem('token');
      return token ? workspaceService.getUserIdFromToken(token) : null;
    },
    
    startEditing() {
      // Initialiser les valeurs éditées avec les valeurs actuelles du workspace
      this.editedWorkspace = {
        nom: this.workspace.nom || this.workspace.name || '',
        description: this.workspace.description || '',
        isPublic: this.status === 'public'
      };
      this.isEditing = true;
    },
    
    // Fermer le menu de statut si on clique ailleurs
    closeStatusMenu(event) {
      // Vérifier si le clic est en dehors du menu et du bouton de statut
      const statusComponent = document.querySelector('.statusComponent');
      if (statusComponent && !statusComponent.contains(event.target)) {
        this.showStatusMenu = false;
        document.removeEventListener('click', this.closeStatusMenu);
      }
    },
    
    // S'assurer de nettoyer les écouteurs lors de la fermeture
    cancelEditing() {
      // Annuler l'édition
      this.isEditing = false;
      this.showStatusMenu = false;
      document.removeEventListener('click', this.closeStatusMenu);
    },
    
    async saveChanges() {
      // Enregistrer les modifications
      if (!this.isOwner) return;
      
      this.isSaving = true;
      
      try {
        // Appel à l'API pour mettre à jour les informations du workspace
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
        
        // Mettre à jour le workspace dans le parent
        this.$emit('update:workspace', {
          ...this.workspace,
          nom: this.editedWorkspace.nom,
          name: this.editedWorkspace.nom, // Pour compatibilité
          description: this.editedWorkspace.description
        });
        
        // Quitter le mode édition
        this.isEditing = false;
        console.log('Workspace mis à jour avec succès');
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
