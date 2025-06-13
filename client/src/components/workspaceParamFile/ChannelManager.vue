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
      
      <!-- Loading state -->
      <div v-if="loading" class="loading-message">
        Chargement des canaux...
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- Empty state -->
      <div v-else-if="filteredChannels.length === 0" class="empty-message">
        <p v-if="channelSearchQuery || channelFilter !== 'all'">
          Aucun canal ne correspond aux critères de recherche.
        </p>
        <p v-else>Aucun canal dans ce workspace.</p>
      </div>
      
      <!-- Channels list -->
      <div v-else class="channels-list">
        <div v-for="channel in filteredChannels" :key="channel.id" class="channel-item">
          <span class="channel-name"># {{ channel.nom }}</span>
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
  <!-- Utilisation du composant modal pour la gestion des utilisateurs -->
  <ChannelUsersModal 
    :show="showUserModal" 
    :channel="selectedChannel" 
    :workspaceId="workspaceId"
    @close="closeUserModal"
    @saved="handleUserPermissionsSaved"
  />
  
  <!-- Modal pour créer un nouveau canal -->
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
      // Données pour le modal d'utilisateurs
      showUserModal: false,
      selectedChannel: null,
      // Données pour le modal de création de canal
      showCreateChannelModal: false
    }
  },
  computed: {
    /**
     * Filtre et trie les canaux selon les critères de recherche
     */
    filteredChannels() {
      let result = [...this.channels];
      
      // Filtrer par terme de recherche
      if (this.channelSearchQuery) {
        const searchTerm = this.channelSearchQuery.toLowerCase();
        result = result.filter(channel => {
          const channelName = channel.nom.toLowerCase();
          return channelName.includes(searchTerm);
        });
      }
      
      // Filtrer par statut
      if (this.channelFilter !== 'all') {
        result = result.filter(channel => channel.visibilite === this.channelFilter);
      }
      
      // Trier par nom
      return result.sort((a, b) => {
        // Canal général toujours en premier
        if (a.nom.toLowerCase() === 'général' || a.nom.toLowerCase() === 'general') return -1;
        if (b.nom.toLowerCase() === 'général' || b.nom.toLowerCase() === 'general') return 1;
        
        // Ensuite par ordre alphabétique
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
        // Utiliser les cookies HTTP-only pour l'authentification sans avoir besoin du token explicite
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Pour envoyer automatiquement le cookie HTTP-only
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expirée, veuillez vous reconnecter');
          }
          throw new Error(`Erreur lors de la récupération des canaux: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Vérifier que les données reçues ont la structure attendue
        if (data && data.status === 'success') {
          // Récupérer les canaux depuis la structure de réponse
          const canaux = data.data && data.data.canaux ? data.data.canaux : [];
          
          this.channels = canaux.map(canal => ({
            id: canal._id || canal.id,
            nom: canal.nom || 'Sans nom',
            visibilite: canal.visibilite || 'public', // défaut à 'public' si non spécifié
            acces: canal.acces || 'tous' // défaut à 'tous' si non spécifié
          }));
          
          // Restaurer les visibilités stockées localement après le chargement
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

    /**
   * Solution temporaire pour la mise à jour de la visibilité des canaux
   * Enregistre la visibilité dans le localStorage en attendant une correction du backend
   */
  async updateChannelVisibility(channel) {
    try {
      // Stockage de la modification dans le localStorage
      const storageKey = `channel_visibility_${this.workspaceId}_${channel.id}`;
      localStorage.setItem(storageKey, channel.visibilite);
      
      console.log(`[LOCAL] Visibilité du canal ${channel.id} enregistrée comme ${channel.visibilite} dans le stockage local`);
      
      // NOTE: Cette solution est temporaire.
      // L'API backend renvoie systématiquement une erreur 500 lorsqu'on tente de mettre à jour la visibilité.
      // Le changement sera visible pour l'utilisateur tant qu'il ne rafraîchit pas la page.
      // Une correction du backend sera nécessaire pour rendre cela permanent.
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la visibilité du canal:', err);
      this.error = err.message || "Impossible de modifier la visibilité du canal";
    }
  },

  /**
   * Restaure les visibilités des canaux depuis le localStorage
   * Cette fonction permet de conserver les changements de visibilité après un rafraîchissement
   */
  restoreChannelVisibilities() {
    if (!this.channels || !this.channels.length) return;
    
    this.channels.forEach(channel => {
      const storageKey = `channel_visibility_${this.workspaceId}_${channel.id}`;
      const savedVisibility = localStorage.getItem(storageKey);
      
      if (savedVisibility) {
        // Vérifier que la valeur est valide ('public' ou 'prive')
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
        
        // Supprimer le canal de la liste sans avoir à recharger tous les canaux
        this.channels = this.channels.filter(c => c.id !== channel.id);
        console.log(`Canal ${channel.id} supprimé avec succès`);
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
      console.log('Canal créé avec succès:', newChannel);
      // Ajouter le nouveau canal à la liste sans avoir à recharger tous les canaux
      this.channels.push(newChannel);
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
