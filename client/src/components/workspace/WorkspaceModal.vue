<template>
  <teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Rejoindre/Créer un workspace</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Partie gauche : Création d'un workspace -->
        <div class="create-workspace">
          <h3>Créer un nouveau workspace</h3>
          <form @submit.prevent="createWorkspace">
            <div class="form-group">
              <label for="nomWorkspace">Nom du workspace</label>
              <input 
                type="text" 
                id="nomWorkspace" 
                v-model="newWorkspace.nom" 
                required
                placeholder="Nom du workspace"
              />
            </div>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="newWorkspace.description"
                placeholder="Description (optionnelle)"
              ></textarea>
            </div>
            
            <div class="form-group visibility-toggle">
              <label>Visibilité</label>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  id="visibilityToggle" 
                  v-model="isPublic"
                />
                <label for="visibilityToggle"></label>
                <span>{{ isPublic ? 'Public' : 'Privé' }}</span>
              </div>
            </div>
            
            <button type="submit" class="submit-button">Enregistrer</button>
          </form>
          <div v-if="createError" class="error-message">{{ createError }}</div>
        </div>
        
        <!-- Partie droite : Recherche de workspaces existants -->
        <div class="search-workspace">
          <h3>Rechercher un workspace</h3>
          <div class="search-bar">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Rechercher des workspaces publics..." 
            />
            <button @click="searchWorkspaces">Rechercher</button>
          </div>
          
          <div v-if="loading" class="loading">Chargement...</div>
          
          <div v-else-if="searchResults.length === 0" class="no-results">
            <p v-if="searchPerformed">Aucun workspace trouvé</p>
            <p v-else>Effectuez une recherche pour trouver des workspaces publics</p>
          </div>
          
          <ul v-else class="workspace-list">
            <li v-for="workspace in searchResults" :key="workspace._id" class="workspace-item">
              <div class="workspace-info">
                <h4>{{ workspace.nom }}</h4>
                <p>{{ workspace.description || 'Pas de description' }}</p>
              </div>
              <button @click="joinWorkspace(workspace._id)" class="join-button">Rejoindre</button>
            </li>
          </ul>
          <div v-if="searchError" class="error-message">{{ searchError }}</div>
        </div>
      </div>
    </div>
  </div>
  </teleport>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import workspaceService from '@/services/workspaceService';

export default {
  name: 'WorkspaceModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close', 'workspace-created', 'workspace-joined'],
  
  setup(props, { emit }) {
    const router = useRouter();
    
    // État pour la création de workspace
    const newWorkspace = ref({ 
      nom: '',
      description: '' 
    });
    const isPublic = ref(false);
    const createError = ref('');
    
    // État pour la recherche de workspaces
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searchPerformed = ref(false);
    const searchError = ref('');
    const loading = ref(false);
    
    // Calculer la visibilité pour l'API
    const workspaceVisibility = computed(() => {
      return isPublic.value ? 'public' : 'prive';
    });
    
    // Créer un nouveau workspace
    const createWorkspace = async () => {
      createError.value = '';
      
      if (!newWorkspace.value.nom.trim()) {
        createError.value = 'Le nom du workspace est requis';
        return;
      }
      
      try {
        const workspaceData = {
          nom: newWorkspace.value.nom,
          description: newWorkspace.value.description,
          visibilite: workspaceVisibility.value
        };
        
        const createdWorkspace = await workspaceService.createWorkspace(workspaceData);
        
        // Réinitialiser le formulaire
        newWorkspace.value = { nom: '', description: '' };
        isPublic.value = false;
        
        // Emettre un événement pour informer le parent
        emit('workspace-created', createdWorkspace);
        
        // Fermer le modal
        emit('close');
        
        // Rediriger vers le workspace créé
        router.push(`/workspace/${createdWorkspace._id}`);
      } catch (error) {
        createError.value = error.message || 'Erreur lors de la création du workspace';
      }
    };
    
    // Rechercher des workspaces publics
    const searchWorkspaces = async () => {
      searchError.value = '';
      loading.value = true;
      
      try {
        const results = await workspaceService.searchPublicWorkspaces(searchQuery.value);
        searchResults.value = results;
        searchPerformed.value = true;
      } catch (error) {
        searchError.value = error.message || 'Erreur lors de la recherche';
      } finally {
        loading.value = false;
      }
    };
    
    // Rejoindre un workspace
    const joinWorkspace = async (workspaceId) => {
      try {
        // Pour rejoindre un workspace public, il suffit de récupérer ses détails
        // L'API gère automatiquement l'ajout de l'utilisateur comme membre
        const workspace = await workspaceService.getWorkspaceById(workspaceId);
        
        // Emettre un événement pour informer le parent
        emit('workspace-joined', workspace);
        
        // Fermer le modal
        emit('close');
        
        // Rediriger vers le workspace rejoint
        router.push(`/workspace/${workspaceId}`);
      } catch (error) {
        searchError.value = error.message || 'Erreur lors de la tentative de rejoindre le workspace';
      }
    };
    
    // Fermer le modal
    const closeModal = () => {
      emit('close');
    };
    
    return {
      newWorkspace,
      isPublic,
      createError,
      searchQuery,
      searchResults,
      searchPerformed,
      searchError,
      loading,
      createWorkspace,
      searchWorkspaces,
      joinWorkspace,
      closeModal
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: all;
}

.modal-content {
  background-color: var(--background-secondary);
  width: 800px;
  max-width: 90%;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  z-index: 10000; /* Ensure it's above the overlay */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--secondary-color);
  border-bottom: 1px solid var(--secondary-color-transition);
}

.modal-header h2 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.4rem;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  padding: 0;
  color: var(--text-primary);
}

.create-workspace, .search-workspace {
  flex: 1;
  padding: 20px;
}

.create-workspace {
  border-right: 1px solid var(--secondary-color-transition);
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--secondary-color-transition);
  background-color: var(--background-primary);
  color: var(--text-primary);
  border-radius: 4px;
  font-size: 0.9rem;
}

textarea {
  height: 80px;
  resize: vertical;
}

.visibility-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-switch {
  display: flex;
  align-items: center;
}

.toggle-switch input {
  display: none;
}

.toggle-switch label {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background-color: var(--secondary-color-transition);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-switch input:checked + label {
  background-color: var(--primary-color);
}

.toggle-switch label:after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: var(--text-primary);
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch input:checked + label:after {
  transform: translateX(26px);
}

.toggle-switch span {
  margin-left: 10px;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.submit-button, .join-button, .search-bar button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: var(--text-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.submit-button:hover, .join-button:hover, .search-bar button:hover {
  background-color: var(--hover-color);
}

.search-bar {
  display: flex;
  margin-bottom: 15px;
}

.search-bar input {
  flex: 1;
  margin-right: 10px;
}

.error-message {
  color: rgb(239, 68, 68);
  margin-top: 10px;
  font-size: 0.9rem;
  background-color: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 5px;
  text-align: center;
}

.loading, .no-results {
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
}

.workspace-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.workspace-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 5px;
  background-color: var(--secondary-color);
}

.workspace-info {
  flex: 1;
}

.workspace-info h4 {
  margin: 0 0 5px;
  color: var(--text-primary);
}

.workspace-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
