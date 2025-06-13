<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire workspace</h3>
      <div class="search-controls">
        <input type="text" v-model="workspaceSearchQuery" placeholder="Rechercher un workspace..." class="search-input"/>
      </div>
      <div class="workspaces-list">
        <div v-for="workspace in filteredWorkspaces" :key="workspace.id" class="workspace-item">
          <span class="workspace-name">{{ workspace.name }}</span>
          <div class="action-buttons">
            <button class="action-button" title="Voir les membres" @click="findWorkspaceUsers(workspace)">
              membres
            </button>
            <button class="action-button" title="Voir les canaux" @click="findWorkspaceChannels(workspace)">
              canaux
            </button>
            <button class="action-button delete-button" title="Supprimer le workspace" @click="deleteWorkspace(workspace)">
              <img src="../../assets/styles/image/ban.png" alt="delete" class="action-icon">
            </button>
          </div>
        </div>
        <div v-if="loading" class="loading">Chargement...</div>
        <div v-if="!loading && !workspaces.length" class="no-results">Aucun workspace trouvé</div>
      </div>
    </div>
  </div>
</template>

<script>
import adminService from '../../services/adminService';

export default {
  name: 'AdminWorkspaceManager',
  data() {
    return {
      workspaceSearchQuery: '',
      loading: false,
      error: null,
      workspaces: []
    };
  },
  computed: {
    filteredWorkspaces() {
      if (!this.workspaceSearchQuery) return this.workspaces;
      
      const query = this.workspaceSearchQuery.toLowerCase();
      return this.workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(query)
      );
    }
  },
  methods: {
    // Récupère tous les workspaces depuis le service
    async fetchWorkspaces() {
      this.loading = true;
      this.error = null;
      
      try {
        this.workspaces = await adminService.getWorkspaces();
      } catch (error) {
        console.error('Erreur lors du chargement des workspaces:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async findWorkspaceUsers(workspace) {
      try {
        const workspaceId = workspace._id || workspace.id;
        const users = await adminService.getWorkspaceUsers(workspaceId);
        console.log(`Utilisateurs du workspace ${workspace.name}:`, users);
        // Ici vous pourriez afficher les utilisateurs dans un modal
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs du workspace:', error);
      }
    },
    
    async findWorkspaceChannels(workspace) {
      try {
        const workspaceId = workspace._id || workspace.id;
        const channels = await adminService.getWorkspaceChannels(workspaceId);
        console.log(`Canaux du workspace ${workspace.name}:`, channels);
        // Ici vous pourriez afficher les canaux dans un modal
      } catch (error) {
        console.error('Erreur lors de la récupération des canaux du workspace:', error);
      }
    },
    
    async deleteWorkspace(workspace) {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer le workspace ${workspace.name}?`)) {
        return;
      }
      
      try {
        const workspaceId = workspace._id || workspace.id;
        await adminService.deleteWorkspace(workspaceId);
        
        // Supprimer le workspace de la liste locale
        this.workspaces = this.workspaces.filter(w => w.id !== workspace.id);
        console.log(`Workspace ${workspace.name} supprimé avec succès`);
      } catch (error) {
        console.error('Erreur lors de la suppression du workspace:', error);
      }
    },
    

  },
  mounted() {
    this.fetchWorkspaces();
  }
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
}
.action-button {
  padding: 0.3rem 1rem;
  background: var(--background-recherche-filtre);
  color: var(--text-color);
  border: 1px solid #555;
  border-radius: 4px;
  margin: 0 3px;
  cursor: pointer;
  justify-content: center;
}

.containerSettingUserChanel {
  border: 5px solid var(--background-list-message);
  border-radius: 10px;
  width: 70%;
  scrollbar-width: thin;
  scrollbar-color: #7D7D7D #D9D9D9;
}

.containerSettingUserChanel::-webkit-scrollbar {
  width: 8px;
}

.containerSettingUserChanel::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.containerSettingUserChanel::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.search-header {
  padding: 1rem;
}

.search-header h3 {
  margin-bottom: 1rem;
  color: #fff;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: var(--background-recherche-filtre);
  color: #fff;
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: var(--background-recherche-filtre);
  color: #fff;
  cursor: pointer;
}

.filter-select option {
  background-color: var(--background-recherche-filtre);
  color: #fff;
}

.workspaces-list {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 1rem;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: #7D7D7D #D9D9D9;
}

.workspaces-list::-webkit-scrollbar {
  width: 8px;
}

.workspaces-list::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.workspaces-list::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.workspace-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: var(--background-list-message);
  gap: 1rem;
  border-radius: 10px;
}

.workspace-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.workspace-name {
  color: #fff;
  flex: 1;
}



.role-button {
  padding: 0.3rem 1rem;
  background: #444;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.role-button:hover {
  background: #555;
}

.delete-button {
  background: none;
  border: none;
}

.action-icon {
  width: 30px;
  height: 30px;
}

.delete-button {
  color: #ff5252;
}

.loading, .no-results {
  color: #fff;
  text-align: center;
  padding: 1rem;
  font-style: italic;
}
</style>
