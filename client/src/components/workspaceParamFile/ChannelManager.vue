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
          <select v-model="channel.visibilite" class="status-select">
            <option value="public">Public</option>
            <option value="prive">Privé</option>
          </select>
          <select v-model="channel.acces" class="access-select">
            <option value="tous">Tous</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <button class="delete-channel-button" title="Supprimer le canal">
            <img src="../../assets/styles/image/ban.png" alt="delete" class="delete">
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChannelManager',
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
      error: null
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
      
      try {
        // Récupérer le token depuis le localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Aucun token d\'authentification trouvé');
        }
        
        // Appeler l'endpoint spécifique pour récupérer les canaux
        const response = await fetch(`http://localhost:3000/api/v1/workspaces/${this.workspaceId}/canaux`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
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
    }
  }
}
</script>

<style scoped>
.containerSettingUserChanel {
  border: 5px solid #443E3E;
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
  background-color: #2f3136;
  color: #fff;
  width: 60%;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #2f3136;
  color: #fff;
  cursor: pointer;
}

.filter-select option {
  background-color: #2f3136;
  color: #fff;
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
  background: #443E3E;
  gap: 1rem;
  border-radius: 10px;
}



.channel-name {
  color: #fff;
  flex: 1;
}

.status-select, .access-select {
  padding: 0.3rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
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
</style>
