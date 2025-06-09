<template>
  <div class="param-container">
    <div v-if="isLoading" class="loading">Chargement des informations du workspace...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <WorkspaceInfo 
        :workspace="workspace" 
        @update:workspace="updateWorkspace" 
      />
      <!-- Composants visibles pour le propriétaire et les admins -->
      <template v-if="isOwner || isAdmin">
        <UserManager :workspace="workspace" />
        <ChannelManager :workspaceId="workspaceId" />
      </template>
      
      <!-- Bouton pour quitter le workspace (pour tous les membres et admins sauf le propriétaire) -->
      <div v-if="!isOwner" class="leave-workspace-container">
        <button class="leave-button" @click="leaveWorkspace">
          Quitter le workspace
        </button>
      </div>
      
      <!-- Bouton pour supprimer le workspace (uniquement pour le propriétaire) -->
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

export default {
  name: 'ParamWorkspace',
  components: {
    WorkspaceInfo,
    UserManager,
    ChannelManager
  },
  // Nous n'utilisons plus les props car nous récupérons l'ID depuis localStorage
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
      // Vérifier si l'utilisateur connecté est le propriétaire du workspace
      if (!this.workspace || !this.workspace.proprietaire) return false;
      
      if (!this.userId) return false;
      
      // Si proprietaire est un objet avec un _id ou id
      if (typeof this.workspace.proprietaire === 'object') {
        const ownerId = this.workspace.proprietaire._id || this.workspace.proprietaire.id;
        return this.userId === ownerId;
      }
      
      // Si proprietaire est directement l'ID
      return this.userId === this.workspace.proprietaire;
    },
    /**
     * Vérifie si l'utilisateur connecté a le rôle admin dans ce workspace
     * @returns {Boolean}
     */
    isAdmin() {
      // Vérifier si l'utilisateur a le rôle admin dans ce workspace
      if (!this.workspace) return false;
      if (!this.userId) return false;
      
      // Si l'utilisateur est déjà identifié comme propriétaire, il a aussi les droits admin
      if (this.isOwner) return true;
      
      // Vérifier si l'utilisateur a le rôle admin dans ce workspace
      const membres = this.workspace.membres || this.workspace.users || [];
      const currentUser = membres.find(membre => {
        const membreId = membre._id || membre.id || membre.userId;
        return membreId === this.userId;
      });
  
      if (currentUser) {
        console.log('Utilisateur trouvé dans le workspace:', currentUser);
        // Debug pour voir le rôle exact
        console.log('Rôle de l\'utilisateur:', currentUser.role);
        return currentUser.role === 'admin';
      }
  
      // Si on n'a pas trouvé l'utilisateur, vérifier une autre structure possible
      // Dans certains cas, les membres peuvent être dans un format différent
      if (this.workspace.membres) {
        for (const membre of this.workspace.membres) {
          if (membre && typeof membre === 'object') {
            // Vérifier si l'ID de l'utilisateur correspond
            if (membre.utilisateur && membre.utilisateur._id === this.userId) {
              console.log('Membre trouvé avec structure alternative:', membre);
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
      
      // Si l'utilisateur est propriétaire ou admin, il n'est pas un simple membre
      if (this.isOwner || this.isAdmin) return false;
      
      // Vérifier si l'utilisateur est membre du workspace
      const membres = this.workspace.membres || this.workspace.users || [];
      return membres.some(membre => {
        const membreId = membre._id || membre.id || membre.userId;
        return membreId === this.userId;
      });
    }
  },
  created() {
    // Récupérer l'ID du workspace depuis localStorage
    this.workspaceId = localStorage.getItem('currentWorkspaceId')
    
    // Récupérer l'ID de l'utilisateur à partir du token
    const token = localStorage.getItem('token');
    if (token) {
      this.userId = workspaceService.getUserIdFromToken(token);
    }
    
    if (this.workspaceId) {
      // Si un ID est trouvé dans le localStorage, charger les données du workspace
      this.loadWorkspaceData()
    } else {
      // Sans ID, on affiche simplement la page sans données spécifiques
      this.isLoading = false
      this.workspace = { nom: 'Sans titre', description: 'Pas de workspace sélectionné' }
    }
  },
  methods: {
    async loadWorkspaceData() {
      try {
        this.isLoading = true
        this.error = null

        // Appel à l'API pour récupérer les données du workspace
        const response = await workspaceService.getWorkspaceById(this.workspaceId)
        
        if (response && response.workspace) {
          this.workspace = response.workspace
        } else {
          this.error = 'Impossible de charger les informations du workspace'
        }
      } catch (error) {
        console.error('Erreur lors du chargement du workspace:', error)
        this.error = `Erreur: ${error.message || 'Impossible de charger les données du workspace'}`
      } finally {
        this.isLoading = false
      }
    },
    
    /**
     * Met à jour les données du workspace dans le composant
     * @param {Object} updatedWorkspace - Workspace mis à jour
     */
    updateWorkspace(updatedWorkspace) {
      if (updatedWorkspace) {
        this.workspace = updatedWorkspace;
      }
    },
    
    /**
     * Demande à l'utilisateur de quitter le workspace
     */
    leaveWorkspace() {
      // TODO: Implémenter la logique pour quitter le workspace
      console.log('Quitter le workspace');
      // Rediriger vers la page d'accueil
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
     * Supprime le workspace et tous ses contenus
     */
    async deleteWorkspace() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        // Appel API pour supprimer le workspace
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
        
        // Mettre à jour le header en émettant un événement global
        this.$root.$emit('workspace-deleted', this.workspaceId);
        
        // Supprimer le workspace du localStorage si présent
        try {
          const storedWorkspaces = JSON.parse(localStorage.getItem('userWorkspaces') || '[]');
          const updatedWorkspaces = storedWorkspaces.filter(w => w._id !== this.workspaceId);
          localStorage.setItem('userWorkspaces', JSON.stringify(updatedWorkspaces));
        } catch (e) {
          console.error('Erreur lors de la mise à jour du localStorage:', e);
        }
        
        // Redirection vers la page d'accueil
        this.$router.push('/main');
        alert('Le workspace a été supprimé avec succès.');
      } catch (err) {
        console.error('Erreur lors de la suppression du workspace:', err);
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
