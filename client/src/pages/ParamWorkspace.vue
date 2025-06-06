<template>
  <div class="param-container">
    <div v-if="isLoading" class="loading">Chargement des informations du workspace...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <WorkspaceInfo 
        :workspace="workspace" 
        @update:workspace="updateWorkspace" 
      />
      <!-- Composants visibles uniquement pour le propriétaire -->
      <template v-if="isOwner">
        <UserManager :workspace="workspace" />
        <ChannelManager :workspaceId="workspaceId" />
      </template>
      
      <!-- Bouton pour quitter le workspace (pour les non propriétaires) -->
      <div v-else class="leave-workspace-container">
        <button class="leave-button" @click="leaveWorkspace">
          Quitter le workspace
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
     * Fonction pour quitter le workspace (à implémenter plus tard)
     */
    leaveWorkspace() {
      // Cette fonction sera implémentée plus tard
      console.log('Fonctionnalité "Quitter le workspace" à implémenter');
      alert('Cette fonctionnalité sera disponible prochainement');
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
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.leave-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.leave-button:active {
  transform: translateY(0);
  background-color: #a93226;
}
</style>
