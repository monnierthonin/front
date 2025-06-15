<template>
  <div class="param-container">
    <div v-if="isLoading" class="loading">Chargement des informations du workspace...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <WorkspaceInfo 
        :workspace="workspace" 
        @update:workspace="updateWorkspace" 
      />
      <template v-if="isOwner || isAdmin">
        <UserManager :workspace="workspace" />
        <ChannelManager :workspaceId="workspaceId" />
      </template>
      <div v-if="!isOwner" class="leave-workspace-container">
        <button class="leave-button" @click="leaveWorkspace">
          Quitter le workspace
        </button>
      </div>
      <div v-if="isOwner" class="delete-workspace-container">
        <button class="delete-workspace-button" @click="confirmDeleteWorkspace">
          Supprimer le workspace
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import WorkspaceInfo from '../components/workspaceParamFile/WorkspaceInfo.vue'
import UserManager from '../components/workspaceParamFile/UserManager.vue'
import ChannelManager from '../components/workspaceParamFile/ChannelManager.vue'
import workspaceService from '../services/workspaceService'
import { getCurrentUserIdAsync } from '../utils/userUtils'

export default {
  name: 'ParamWorkspace',
  components: {
    WorkspaceInfo,
    UserManager,
    ChannelManager
  },
  data() {
    return {
      workspaceId: '',
      workspace: null,
      isLoading: true,
      error: null,
      userId: null
    }
  },
  computed: {
    /**
     * Vérifie si l'utilisateur connecté est le propriétaire du workspace
     * @returns {Boolean}
     */
    isOwner() {
      if (!this.workspace || !this.workspace.proprietaire) return false;
      
      if (!this.userId) return false;
      
      if (typeof this.workspace.proprietaire === 'object') {
        const ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
        return this.userId === ownerId;
      }
      
      return this.userId === this.workspace.proprietaire;
    },
    /**
     * Vérifie si l'utilisateur connecté a le rôle admin dans ce workspace
     * @returns {Boolean}
     */
    isAdmin() {
      if (!this.workspace) return false;
      if (!this.userId) return false;
      
      if (this.isOwner) return true;
      
      const membres = this.workspace.membres || this.workspace.users || [];
      const currentUser = membres.find(membre => {
        const membreId = membre._id || membre.id || membre.userId;
        return membreId === this.userId;
      });
  
      if (currentUser) {
        return currentUser.role === 'admin';
      }
  
      if (this.workspace.membres) {
        for (const membre of this.workspace.membres) {
          if (membre && typeof membre === 'object') {
            if (membre.utilisateur && membre.utilisateur._id === this.userId) {
              return membre.role === 'admin';
            }
          }
        }
      }
  
      return false;
    },
    /**
     * Vérifie si l'utilisateur est un simple membre du workspace (ni propriétaire, ni admin)
     * @returns {Boolean}
     */
    isMember() {
      if (!this.workspace) return false;
      if (!this.userId) return false;
      
      if (this.isOwner || this.isAdmin) return false;
      
      const membres = this.workspace.membres || this.workspace.users || [];
      return membres.some(membre => {
        const membreId = membre._id || membre.id || membre.userId;
        return membreId === this.userId;
      });
    }
  },
  async created() {
    try {
      this.workspaceId = localStorage.getItem('currentWorkspaceId');
      
      if (!this.workspaceId) {
        throw new Error('ID du workspace manquant');
      }
      
      this.userId = await getCurrentUserIdAsync();
      
      if (!this.userId) {
        throw new Error('Impossible de récupérer l\'ID utilisateur');
      }
      
      await this.loadWorkspaceData();
    } catch (error) {
      console.error('ParamWorkspace.vue - Erreur lors de l\'initialisation:', error);
      this.error = `Impossible de charger les paramètres: ${error.message}`;
    }
  },
  methods: {
    async loadWorkspaceData() {
      try {
        this.isLoading = true;
        this.error = null;

        const response = await workspaceService.getWorkspaceById(this.workspaceId);
        
        if (response && response.workspace) {
          this.workspace = response.workspace;
        } else {
          console.warn('ParamWorkspace.vue: Structure de réponse invalide ou workspace manquant');
          this.error = 'Impossible de charger les informations du workspace';
        }
      } catch (error) {
        console.error('ParamWorkspace.vue: Erreur lors du chargement du workspace:', error);
        this.error = `Erreur: ${error.message || 'Impossible de charger les données du workspace'}`;
        
        if (error.message && error.message.includes('session')) {
          this.$router.push('/login');
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Met à jour les données du workspace dans le composant
     * @param {Object} updatedWorkspace - Workspace mis à jour
     */
    async updateWorkspace(updatedWorkspace) {
      this.workspace = updatedWorkspace;
    },
    
    /**
     * Demande à l'utilisateur de quitter le workspace
     */
    async leaveWorkspace() {
      try {
        const response = await workspaceService.leaveWorkspace(this.workspaceId);
        
        if (response && response.success) {
          this.$router.push('/main');
        } else {
          this.error = 'Erreur lors de la sortie du workspace';
        }
      } catch (error) {
        this.error = `Erreur: ${error.message || 'Impossible de quitter le workspace'}`;
      }
    },
    
    /**
     * Demande confirmation avant de supprimer le workspace
     */
    confirmDeleteWorkspace() {
      if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le workspace "${this.workspace.nom}" ? Cette action est irréversible et supprimera tous les canaux et messages associés.`)) {
        this.deleteWorkspace();
      }
    },
    
    /**
     * Supprime le workspace et tous ses contenus en utilisant le cookie HTTP-only
     */
    async deleteWorkspace() {
      try {
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          } else if (response.status === 403) {
            throw new Error('Vous n\'avez pas les droits pour supprimer ce workspace');
          } else {
            throw new Error(`Erreur lors de la suppression: ${response.status}`);
          }
        }
        
        this.$root.$emit('workspace-deleted', this.workspaceId);
        
        this.$router.push('/main');
        alert('Le workspace a été supprimé avec succès.');
      } catch (err) {
        alert(`Erreur: ${err.message}`);
      }
    }
  }
}
</script>

<style scoped>
.param-container {
  margin-left: var(--whidth-header);
  padding: 2rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 85px;
}

.leave-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
}

.leave-button:hover {
  background-color: #d32f2f;
}

.leave-button:active {
  transform: translateY(0);
  background-color: #a93226;
}

.delete-workspace-container {
  margin-top: 40px;
  border-top: 1px solid #555;
  padding-top: 20px;
}

.delete-workspace-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}

.delete-workspace-button:hover {
  background-color: #b71c1c;
}

.delete-workspace-button:active {
  transform: translateY(0);
  background-color: #a93226;
}
</style>
