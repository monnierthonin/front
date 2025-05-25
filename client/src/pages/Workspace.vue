<template>
  <chanelWorkspace 
    :canaux="canaux" 
    :canalActifId="canalActif ? canalActif._id : ''" 
    @canal-selectionne="changerCanalActif" 
  />
  <UserList :membres="membres" />
  <div class="workspace-content">
    <div v-if="!canalActif" class="no-canal-selected">
      <p>Sélectionnez un canal pour voir les messages</p>
    </div>
    <MessagesCanal 
      v-else
      :workspace-id="workspaceId" 
      :canal-id="canalActif._id"
      :canal-name="canalActif.nom"
    />
  </div>
</template>

<script>
import UserList from '../components/headerFile/UserChanelList.vue'
import chanelWorkspace from '../components/headerFile/chanelWorkspace.vue'
import MessagesCanal from '../components/messageComponentFile/MessagesCanal.vue'
import workspaceService from '../services/workspaceService'
import canalService from '../services/canalService'

export default {
  name: 'Workspace',
  components: {
    MessagesCanal,
    UserList,
    chanelWorkspace
  },
  data() {
    return {
      workspaceId: '',
      workspace: null,
      canaux: [],
      membres: [],
      canalActif: null,
      messages: [],
      userId: null,
      isLoading: true,
      isLoadingMessages: false,
      error: null
    }
  },
  watch: {
    // Surveiller les changements d'ID de workspace dans l'URL
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId && newId !== this.workspaceId) {
          this.workspaceId = newId;
          // Recharger les données du workspace
          this.chargerDonnees();
          
          // Réinitialiser l'état
          this.canalActif = null;
          this.messages = [];
        }
      }
    }
  },
  
  created() {
    // Récupérer l'ID du workspace depuis l'URL
    this.workspaceId = this.$route.params.id

    // Récupérer l'ID de l'utilisateur connecté depuis le localStorage
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        this.userId = payload._id;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    }
    
    if (this.workspaceId) {
      this.chargerDonnees();
    } else {
      this.error = 'ID de workspace non spécifié';
    }
  },
  
  methods: {
    /**
     * Charger les données initiales du workspace (membres et canaux)
     */
    async chargerDonnees() {
      try {
        this.isLoading = true;
        this.error = null;
        
        // Chargement du workspace (qui contient les membres)
        const workspaceData = await workspaceService.getWorkspaceById(this.workspaceId);
        this.workspace = workspaceData.workspace;
        this.membres = this.workspace.membres || [];
        
        // Chargement des canaux du workspace
        const canauxData = await canalService.getWorkspaceCanaux(this.workspaceId);
        this.canaux = canauxData || [];
        
        // Sélectionner le premier canal par défaut si des canaux existent
        if (this.canaux.length > 0) {
          this.changerCanalActif(this.canaux[0]);
        }
      } catch (error) {
        this.error = `Erreur lors du chargement des données: ${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Changer le canal actif
     * @param {Object} canal - Le canal à activer
     */
    changerCanalActif(canal) {
      if (!canal) return;
      
      console.log('Changement de canal actif:', canal.nom);
      this.canalActif = canal;
      
      // Cette méthode pourra être étendue plus tard pour charger les messages du canal
      console.log('Canal actif sélectionné:', this.canalActif);
    },
    

  }
}
</script>

<style scoped>
.workspace-content {
  margin-left: calc(var(--whidth-header) + var(--whidth-chanelWorkspace));
  margin-right: var(--whidth-userChanel);
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.no-canal-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary, #666);
  font-size: 1.1rem;
  background-color: var(--background-secondary, #f5f5f5);
}
</style>
