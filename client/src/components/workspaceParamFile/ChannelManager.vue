<template>
  <div class="containerSettingUserChanel">
    <div class="search-header">
      <h3>Gestionnaire canaux</h3>
      <div class="search-controls">
        <input 
          type="text" 
          v-model="channelSearchQuery" 
          placeholder="Rechercher un canal..." 
          class="search-input"
        />
        <select v-model="channelFilter" class="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="public">Public</option>
          <option value="prive">Privé</option>
        </select>
        <button class="add-channel-button" @click="openCreateChannelModal">
          Ajouter un canal
        </button>
      </div>
      
      <div v-if="loading" class="loading-message">
        Chargement des canaux...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else-if="filteredChannels.length === 0" class="empty-message">
        <p v-if="channelSearchQuery || channelFilter !== 'all'">
          Aucun canal ne correspond aux critères de recherche.
        </p>
        <p v-else>Aucun canal dans ce workspace.</p>
      </div>
      
      <div v-else class="channels-list">
        <div v-for="channel in filteredChannels" :key="channel.id" class="channel-item">
          <span class="channel-name clickable" @click="startEditing(channel)">
            <template v-if="editingChannel && editingChannel.id === channel.id">
              <input 
                type="text" 
                v-model="editingName" 
                @keyup.enter="saveChannelName(channel)" 
                @blur="saveChannelName(channel)" 
                @click.stop 
                class="channel-name-input" 
                ref="channelNameInput"
              />
            </template>
            <template v-else>
              # {{ channel.nom }}
            </template>
          </span>
          <select v-model="channel.visibilite" class="status-select" @change="updateChannelVisibility(channel)">
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </select>
          <button v-if="channel.visibilite === 'prive'" class="add-user-button" @click="openUserModal(channel)">ajout user</button>
          <button class="delete-channel-button" title="Supprimer le canal" @click="deleteChannel(channel)">
            <img src="../../assets/styles/image/ban.png" alt="delete" class="delete">
          </button>
        </div>
      </div>
    </div>
  </div>
  <ChannelUsersModal 
    :show="showUserModal" 
    :channel="selectedChannel" 
    :workspaceId="workspaceId"
    @close="closeUserModal"
    @saved="handleUserPermissionsSaved"
  />
  
  <CreateChannelModal
    :show="showCreateChannelModal"
    :workspaceId="workspaceId"
    @close="closeCreateChannelModal"
    @channel-created="handleChannelCreated"
  />
</template>

<script>
import ChannelUsersModal from './ChannelUsersModal.vue';
import CreateChannelModal from './CreateChannelModal.vue';
import canalService from '../../services/canalService';

export default {
  name: 'ChannelManager',
  components: {
    ChannelUsersModal,
    CreateChannelModal
  },
  props: {
    workspaceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      channelSearchQuery: '',
      channelFilter: 'all',
      channels: [],
      loading: true,
      error: null,
      showUserModal: false,
      selectedChannel: null,
      showCreateChannelModal: false,
      editingChannel: null,
      editingName: ''
    }
  },
  computed: {
    /**
     * Filtre et trie les canaux selon les critères de recherche
     */
    filteredChannels() {
      let result = [...this.channels];
      
      if (this.channelSearchQuery) {
        const searchTerm = this.channelSearchQuery.toLowerCase();
        result = result.filter(channel => {
          const channelName = channel.nom.toLowerCase();
          return channelName.includes(searchTerm);
        });
      }
      
      if (this.channelFilter !== 'all') {
        result = result.filter(channel => channel.visibilite === this.channelFilter);
      }
      
      return result.sort((a, b) => {
        if (a.nom.toLowerCase() === 'général' || a.nom.toLowerCase() === 'general') return -1;
        if (b.nom.toLowerCase() === 'général' || b.nom.toLowerCase() === 'general') return 1;
        
        return a.nom.localeCompare(b.nom);
      });
    }
  },
  created() {
    this.loadChannels();
  },
  methods: {
    /**
     * Charge les canaux du workspace depuis l'API
     */
    async loadChannels() {
      this.loading = true;
      this.error = null;
      this.channels = [];
      
      try {
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors de la récupération des canaux: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.status === 'success') {
          const canaux = data.data && data.data.canaux ? data.data.canaux : [];
          
          this.channels = canaux.map(canal => ({
            id: canal._id || canal.id,
            nom: canal.nom || 'Sans nom',
            visibilite: canal.visibilite || 'public',
            acces: canal.acces || 'tous'
          }));
          
          this.restoreChannelVisibilities();
        } else {
          this.channels = [];
          console.warn('Format de réponse inattendu:', data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des canaux:', err);
        this.error = err.message || "Impossible de charger la liste des canaux";
      } finally {
        this.loading = false;
      }
    },

    async updateChannelVisibility(channel) {
      try {
      const storageKey = `channel_visibility_${this.workspaceId}_${channel.id}`;
      localStorage.setItem(storageKey, channel.visibilite);
      
      console.log(`[LOCAL] Visibilité du canal ${channel.id} enregistrée comme ${channel.visibilite} dans le stockage local`);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la visibilité du canal:', err);
      this.error = err.message || "Impossible de modifier la visibilité du canal";
    }
  },

  restoreChannelVisibilities() {
    if (!this.channels || !this.channels.length) return;
    
    this.channels.forEach(channel => {
      const storageKey = `channel_visibility_${this.workspaceId}_${channel.id}`;
      const savedVisibility = localStorage.getItem(storageKey);
      
      if (savedVisibility) {
        if (savedVisibility === 'public' || savedVisibility === 'prive') {
          console.log(`[LOCAL] Restauration de la visibilité du canal ${channel.id} à ${savedVisibility}`);
          channel.visibilite = savedVisibility;
        }
      }
    });
  },
    
    /**
     * Supprimer un canal
     */
    async deleteChannel(channel) {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer le canal #${channel.nom} ?`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux/${channel.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors de la suppression du canal: ${response.status}`);
        }
        
        this.channels = this.channels.filter(c => c.id !== channel.id);
      } catch (err) {
        console.error('Erreur lors de la suppression du canal:', err);
        this.error = err.message || "Impossible de supprimer le canal";
      }
    },
    
    /**
     * Ouvrir le modal pour gérer les utilisateurs du canal
     */
    openUserModal(channel) {
      this.selectedChannel = channel;
      this.showUserModal = true;
    },
    
    /**
     * Fermer le modal
     */
    closeUserModal() {
      this.showUserModal = false;
      this.selectedChannel = null;
    },
    
    /**
     * Gestionnaire d'événement quand les permissions sont sauvegardées
     */
    handleUserPermissionsSaved() {
      console.log('Permissions mises à jour avec succès');
      // Ici on pourrait ajouter un toast ou notification de succès
      this.closeUserModal();
    },
    
    /**
     * Ouvrir le modal pour créer un nouveau canal
     */
    openCreateChannelModal() {
      this.showCreateChannelModal = true;
    },
    
    /**
     * Fermer le modal de création de canal
     */
    closeCreateChannelModal() {
      this.showCreateChannelModal = false;
    },
    
    /**
     * Gestion de la création réussie d'un canal
     * @param {Object} newChannel - Le nouveau canal créé
     */
    handleChannelCreated(newChannel) {
      this.channels.push(newChannel);
    },
    
    /**
     * Démarrer l'édition du nom d'un canal
     * @param {Object} channel - Canal à éditer
     */
    startEditing(channel) {
      this.editingChannel = channel;
      this.editingName = channel.nom || '';
      this.$nextTick(() => {
        if (this.$refs.channelNameInput) {
          this.$refs.channelNameInput.focus();
        }
      });
    },
    
    /**
     * Sauvegarder le nouveau nom du canal
     * @param {Object} channel - Canal à mettre à jour
     */
    async saveChannelName(channel) {
      const newName = this.editingName;
      
      this.editingChannel = null;
      
      if (newName && newName.trim() && newName !== channel.nom) {
        
        const index = this.channels.findIndex(c => c.id === channel.id);
        if (index !== -1) {
          const oldName = this.channels[index].nom;
          this.channels[index].nom = newName;
          
          try {
            await canalService.updateCanalName(
              this.workspaceId,
              channel.id,
              { nom: newName }
            );
          } catch (error) {
            console.error('Erreur lors de la mise à jour du nom du canal sur le serveur:', error);
            console.warn('La modification a été appliquée localement mais non sauvegardée sur le serveur');
          }
        }
      }
      
      this.editingName = '';
    }
  }
}
</script>

<style scoped>
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
  color: var(--text-color);
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
  color: var(--text-color);
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
  cursor: pointer;
}

.filter-select option {
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
}

.channels-list {
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

.loading-message, .error-message, .empty-message {
  padding: 1rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  background-color: #36393f;
  border-radius: 5px;
}

.error-message {
  color: #ff6b6b;
}

.empty-message {
  color: #aaaaaa;
}

.channels-list::-webkit-scrollbar {
  width: 8px;
}

.channels-list::-webkit-scrollbar-track {
  background: #D9D9D9;
  border-radius: 4px;
}

.channels-list::-webkit-scrollbar-thumb {
  background-color: #7D7D7D;
  border-radius: 4px;
}

.channel-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--background-list-message);
  gap: 1rem;
  border-radius: 10px;
}



.channel-name {
  color: var(--text-color);
  flex: 1;
}

.clickable {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  transition: background-color 0.2s ease;
}

.channel-name-input {
  background-color: var(--background-recherche-filtre);
  color: var(--text-color);
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 4px;
  width: 100%;
  box-sizing: border-box;
  font-size: 1em;
  outline: none;
}

.channel-name-input:focus {
  border-color: #7289da;
}

.status-select {
  padding: 0.3rem;
  border-radius: 4px;
  background: var(--background-list-message);
  color: var(--text-color);
  border: 1px solid #555;
}

.add-user-button {
  padding: 0.3rem 1rem;
  background: var(--background-recherche-filtre);
  color: var(--text-color);
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.delete-channel-button {
  height: 40px;
  width: 40px;
  background: none;
  border: none;
  align-items: center;
  justify-content: center;
  display: flex;
}

.delete-channel-button img {
  width: 40px;
}

.add-channel-button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-channel-button:hover {
  background-color:rgb(46, 146, 50);
}

</style>
